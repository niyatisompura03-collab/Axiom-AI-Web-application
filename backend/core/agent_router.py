import os
import logging
import re
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
logger = logging.getLogger(__name__)

def detect_tools(user_message, context=None) -> list[str]:
    """
    Hybrid tool router:
    Stage 1: High-confidence deterministic rules for fast routing.
    Stage 2: Lightweight LLM classifier for ambiguous requests and context-aware follow-ups.
    Returns up to 2 tools for genuine multi-intent requests.
    """
    message = user_message.lower().strip()

    # -----------------
    # STAGE 1: Deterministic Fast Path
    # -----------------
    
    tools_found = []
    
    # Calculator: explicit keyword or explicit math operations
    if "calculate " in message or re.search(r'\d+\s*[\+\-\*\/%]\s*\d+', message):
        logger.info("[Router] Deterministic route: calculator")
        if "calculator" not in tools_found:
            tools_found.append("calculator")
        
    # Time: separate strong explicit signals from ambiguous ones
    time_explicit = [
        "what time is it", "what's the time", "current time", "time right now"
    ]
    time_ambiguous = ["what time"]
    
    if any(word in message for word in time_explicit):
        logger.info("[Router] Deterministic route: time (explicit)")
        if "time" not in tools_found:
            tools_found.append("time")
    elif any(word in message for word in time_ambiguous) and "latest" not in message and "release" not in message:
        logger.info("[Router] Deterministic route: time (ambiguous)")
        if "time" not in tools_found:
            tools_found.append("time")
        
    # Date
    date_high_conf = [
        "today's date", "what date", "what day is", "current date"
    ]
    if any(word in message for word in date_high_conf):
        logger.info("[Router] Deterministic route: date")
        if "date" not in tools_found:
            tools_found.append("date")

    # Search: explicit retrieval vs conditional freshness
    search_explicit = [
        "search for", "search about", "look up", "find information", "news today"
    ]
    search_conditional = ["latest", "current", "recent"]
    search_conditional_targets = ["release", "version", "update", "news", "model", "device", "codename", "information", "announcement"]
    
    if any(word in message for word in search_explicit):
        logger.info("[Router] Deterministic route: search (explicit)")
        if "search" not in tools_found:
            tools_found.append("search")
    elif any(word in message for word in search_conditional) and any(word in message for word in search_conditional_targets):
        logger.info("[Router] Deterministic route: search (conditional)")
        if "search" not in tools_found:
            tools_found.append("search")

    if tools_found:
        return tools_found[:2]

    # -----------------
    # STAGE 2: LLM Classifier Fallback
    # -----------------
    
    if context is None:
        context = []
        
    # Extract only the last 3 messages for context (preventing context bloat)
    history_str = "\n".join([
        f"{msg.get('role', 'unknown').capitalize()}: {msg.get('content', '')}"
        for msg in context[-3:]
    ])
    
    system_prompt = """
You are a tool routing classifier. 
Your ONLY job is to select the correct tools for the user's latest message.

Tools available:
- calculator: for solving math expressions
- time: for getting the current time or timezones
- date: for getting the current date or relative dates (tomorrow, last week)
- search: for retrieving up-to-date facts, news, latest versions, or external information
- none: if no tool is needed (e.g., conversational chat, general knowledge, or if the answer is already in the conversation history)

If the user is asking a follow-up question (e.g., "Which source did you use?", "Tell me more about that"), 
and the previous context already contains the necessary information, return 'none'.
Do not return a tool if the user is just saying hello, asking general questions, or giving updates.
Return up to 2 tools as a comma-separated list, or 'none'. Examples:
search, calculator
time
date, search
none
"""
    prompt_content = f"Conversation History:\n{history_str}\n\nUser: {user_message}" if history_str else f"User: {user_message}"
    
    try:
        response = client.chat.completions.create(
            model="groq/compound-mini",
            temperature=0.0,
            max_tokens=20,
            messages=[
                {"role": "system", "content": system_prompt.strip()},
                {"role": "user", "content": prompt_content.strip()}
            ]
        )
        decision = response.choices[0].message.content.strip().lower()
        
        valid_tools = ["calculator", "time", "date", "search"]
        
        extracted_tools = []
        for part in decision.split(","):
            part = ''.join(c for c in part if c.isalpha())
            if part in valid_tools and part not in extracted_tools:
                extracted_tools.append(part)
        
        if extracted_tools:
            logger.info(f"[Router] Classifier route: {extracted_tools[:2]}")
            return extracted_tools[:2]
        else:
            return []
    except Exception as e:
        logger.error(f"[Router] Classifier failed: {e}")
        return []

def detect_tool(user_message, context=None):
    """Backward-compatible wrapper for single-tool detection."""
    tools = detect_tools(user_message, context=context)
    return tools[0] if tools else None