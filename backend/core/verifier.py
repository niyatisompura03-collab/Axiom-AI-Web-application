import os
import logging
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
logger = logging.getLogger(__name__)

def verify_tool_result(user_input: str, tool: str, query: str, raw_result: dict, context: list = None, is_retry: bool = False) -> dict:
    """
    Verifies a tool result. 
    Returns: {"status": "valid" | "retry" | "failed", "feedback": "...", "clean_result": ...}
    """
    attempt_num = 2 if is_retry else 1
    if not raw_result:
        return {"status": "retry", "feedback": "Tool returned an empty or null response.", "clean_result": None}

    if tool == "search":
        if raw_result.get("error"):
            return {"status": "retry", "feedback": f"Search returned an error: {raw_result['error']}", "clean_result": None}
            
        results = raw_result.get("results", [])
        if not results:
            return {"status": "retry", "feedback": "Search returned no results.", "clean_result": None}
            
        # Deterministic checks on search results
        valid_results = []
        for r in results:
            # Score check, snippet presence, URL presence
            try:
                score = float(r.get("score", 0))
            except (ValueError, TypeError):
                score = 0.0
                
            snippet = (r.get("content") or "").strip()
            url = (r.get("url") or "").strip()
            
            # Simple threshold (can be adjusted)
            if score >= 0.15 and snippet and url.startswith("http"):
                valid_results.append(r)
                
        if not valid_results:
            return {"status": "retry", "feedback": "Search results were all low quality, had invalid URLs, or were missing snippets.", "clean_result": None}
            
        # Lightweight LLM Semantic Check
        snippets_text = "\n".join([f"- {r.get('content')}" for r in valid_results[:3]])
        
        user_input_lower = user_input.lower()
        is_freshness_sensitive = any(kw in user_input_lower for kw in ["latest", "current", "recent", "today", "newest", "now"])
        logger.info(f"[Verifier] Attempt {attempt_num}: verifying search query='{query}' against original user_input='{user_input}'. freshness_sensitive={is_freshness_sensitive}")
        freshness_rule = ""
        if is_freshness_sensitive:
            from datetime import datetime
            current_year = datetime.now().year
            freshness_rule = f"\nCRITICAL: The user's query is freshness-sensitive. The current year is {current_year}. You MUST return 'no' unless the snippet EXPLICITLY establishes that it describes the absolute latest/current status (e.g. it says 'latest release', 'current version', or explicitly confirms the answer for {current_year}). Merely mentioning an official version is NOT enough; if you cannot confirm it is the LATEST, return 'no'."

        system_prompt = f"""You are a verification critic.
Your job is to determine if the retrieved search snippets actually support and answer the user's request.
{freshness_rule}
Does the provided search snippet contain valid evidence that directly answers the user's request and satisfies any freshness constraints? 
Answer ONLY 'yes' or 'no'."""
        
        try:
            response = client.chat.completions.create(
                model="llama-3.1-8b-instant",
                temperature=0.0,
                max_tokens=10,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"User Request: {user_input}\n\nSearch Snippets:\n{snippets_text}"}
                ]
            )
            decision = response.choices[0].message.content.strip().lower()
            if "yes" in decision:
                logger.info(f"[Verifier] Attempt {attempt_num} verdict=valid for query='{query}'")
                return {"status": "valid", "feedback": "Looks good.", "clean_result": {"tool": "search", "results": valid_results}}
            else:
                logger.info(f"[Verifier] Attempt {attempt_num} verdict=retry for query='{query}'")
                return {"status": "retry", "feedback": "Search results did not contain up-to-date or relevant evidence to support the specific claim. Broaden or change the search terms.", "clean_result": None}
        except Exception as e:
            logger.error(f"[Verifier] Attempt {attempt_num} LLM verification failed: {e}")
            # Graceful degradation: deterministic checks already passed (valid_results exist),
            # so accept the results rather than rejecting them due to LLM unavailability.
            logger.info(f"[Verifier] Attempt {attempt_num} falling back to deterministic-only validation (LLM unavailable). Passing {len(valid_results)} results.")
            return {"status": "valid", "feedback": "LLM unavailable; accepted on deterministic checks.", "clean_result": {"tool": "search", "results": valid_results}}

    elif tool == "calculator":
        if raw_result.get("error"):
            return {"status": "retry", "feedback": raw_result.get("error"), "clean_result": None}
        return {"status": "valid", "feedback": "Valid calculation.", "clean_result": raw_result}

    elif tool in ["date", "time", "datetime"]:
        if raw_result.get("error"):
            return {"status": "retry", "feedback": raw_result.get("error"), "clean_result": None}
        return {"status": "valid", "feedback": "Valid date/time.", "clean_result": raw_result}

    return {"status": "valid", "feedback": "Unknown tool, bypassing verification.", "clean_result": raw_result}

def reformulate_with_feedback(user_input: str, tool: str, context: list, feedback: str) -> str:
    system_prompt = f"""You are a query reformulator.
The previous tool query for '{tool}' failed or returned irrelevant results.
Feedback from verifier: {feedback}

Reformulate the query to try a different approach. Be more generic, remove highly specific constraints, or use different keywords.
Output NOTHING EXCEPT the plain text query string. No explanations."""
    
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            temperature=0.0,
            max_tokens=100,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"User Request: {user_input}"}
            ]
        )
        query = response.choices[0].message.content.strip()
        return query if query else user_input
    except Exception as e:
        logger.error(f"[Verifier] Failed to reformulate with feedback: {e}")
        return user_input
