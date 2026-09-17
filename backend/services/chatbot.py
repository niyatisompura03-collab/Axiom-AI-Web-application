from groq import Groq
from dotenv import load_dotenv
import os
import base64
import logging
import json

from backend.core.database import (
    get_conversation,
    save_message,
    create_conversation,
    rename_conversation,
    get_user_settings,
    get_document,
    update_conversation_active_document
)

from backend.core.memory import (
    search_memories
)
from backend.core.memory_extractor import extract_memory
from backend.core.memory import save_memory
from backend.core.memory_classifier import classify_memory_query
from backend.core.agent_router import detect_tool
from backend.agents.calculator import calculate
from backend.agents.datetime_tool import (
    get_current_time,
    get_current_date,
    get_relative_date
)
from backend.agents.web_search import search_web
from backend.core.axiom_personality import AXIOM_PERSONALITY
from backend.core.document_processor import validate_image_content

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

logger = logging.getLogger(__name__)

QWEN_IMAGE_MODEL = "qwen/qwen3.6-27b"
QWEN_MAX_COMPLETION_TOKENS = 700
IMAGE_UPSTREAM_ERROR_REPLY = (
    "I'm sorry, I couldn't analyze that image right now. Please try again."
)
IMAGE_EMPTY_RESPONSE_REPLY = (
    "I'm sorry, I couldn't generate an answer from that image. Please try again."
)
IMAGE_LENGTH_RESPONSE_REPLY = (
    "I'm sorry, the image response was cut off before it could be completed. Please try again with a more specific question."
)
IMAGE_INVALID_DOCUMENT_REPLY = (
    "I'm sorry, that image document could not be read. Please upload it again."
)
IMAGE_CONVERSATION_CONTINUITY_INSTRUCTION = (
    "This is the same active image document discussed in the prior conversation. "
    "Use the attached image together with the earlier messages to answer the follow-up. "
    "Carefully read visible text, screenshots, and tables in the image when they are relevant. "
    "Keep facts about the image consistent with prior answers unless the image provides "
    "clear contrary evidence; if correcting an earlier answer, explicitly explain why."
)
TEXT_DOCUMENT_GROUNDING_INSTRUCTION = (
    "The active document below is the source of truth for questions about it. "
    "Ground answers, calculations, filtering, and comparisons in its actual content. "
    "Do not invent values, rows, or facts; if the requested information is absent, say so clearly."
)


def _image_document_data_url(doc: dict) -> str:
    """Revalidate stored image content and build a canonical data URL.

    Revalidation also protects legacy records uploaded before MIME/signature
    validation was introduced.
    """
    try:
        raw_content = base64.b64decode(doc.get("content", ""), validate=True)
    except (ValueError, TypeError) as exc:
        raise ValueError("Stored image content is not valid base64") from exc
    mime_type = validate_image_content(doc.get("filename", ""), raw_content)
    return f"data:{mime_type};base64,{doc['content']}"


def _attach_image_to_latest_user_message(prompt_messages: list[dict], data_url: str) -> None:
    for index in range(len(prompt_messages) - 1, -1, -1):
        if prompt_messages[index]["role"] == "user":
            original_text = prompt_messages[index]["content"]
            prompt_messages[index]["content"] = [
                {
                    "type": "text",
                    "text": f"{original_text}\n\n{IMAGE_CONVERSATION_CONTINUITY_INSTRUCTION}",
                },
                {"type": "image_url", "image_url": {"url": data_url}},
            ]
            return
    raise ValueError("Image request has no user message")


def _usage_summary(usage) -> dict:
    if usage is None:
        return {}
    return {
        name: getattr(usage, name, None)
        for name in ("prompt_tokens", "completion_tokens", "total_tokens")
        if getattr(usage, name, None) is not None
    }


def _qwen_image_completion(prompt_messages: list[dict]) -> str:
    """Call Qwen for an image turn and safely classify non-answer outcomes."""
    try:
        response = client.chat.completions.create(
            model=QWEN_IMAGE_MODEL,
            temperature=0.7,
            max_completion_tokens=QWEN_MAX_COMPLETION_TOKENS,
            reasoning_effort="none",
            reasoning_format="hidden",
            messages=prompt_messages,
        )
    except Exception as exc:
        logger.error(
            "[Document Agent] Qwen image request failed: exception_type=%s",
            type(exc).__name__,
        )
        return IMAGE_UPSTREAM_ERROR_REPLY

    choices = getattr(response, "choices", None) or []
    usage = _usage_summary(getattr(response, "usage", None))
    if not choices:
        logger.warning(
            "[Document Agent] Qwen image response had no choices: usage=%s",
            usage,
        )
        return IMAGE_EMPTY_RESPONSE_REPLY

    choice = choices[0]
    response_message = getattr(choice, "message", None)
    finish_reason = getattr(choice, "finish_reason", None)
    content = getattr(response_message, "content", None) if response_message else None
    refusal = getattr(response_message, "refusal", None) if response_message else None
    reasoning = getattr(response_message, "reasoning", None) if response_message else None
    logger.info(
        "[Document Agent] Qwen image response: finish_reason=%s content_length=%s refusal=%s reasoning_present=%s usage=%s",
        finish_reason,
        len(content) if isinstance(content, str) else None,
        bool(refusal),
        bool(reasoning),
        usage,
    )

    if isinstance(content, str) and content.strip():
        return content.strip()
    if finish_reason == "length":
        return IMAGE_LENGTH_RESPONSE_REPLY
    if refusal:
        return IMAGE_UPSTREAM_ERROR_REPLY
    return IMAGE_EMPTY_RESPONSE_REPLY


def _memory_enrichment(user_id: str, user_input: str, memory_enabled: bool, is_image_document: bool) -> list:
    """Return optional memories, isolating non-critical failures for image Q&A."""
    if not memory_enabled:
        return []

    def enrich() -> list:
        memory = extract_memory(user_input)
        if memory.get("memory"):
            save_memory(user_id, memory)

        memory_category = classify_memory_query(user_input)
        if memory_category == "none":
            return []
        return search_memories(user_id, user_input, memory_category)

    if not is_image_document:
        return enrich()
    try:
        return enrich()
    except Exception as exc:
        logger.warning(
            "[Document Agent] optional memory enrichment skipped for image chat: exception_type=%s",
            type(exc).__name__,
        )
        return []


def _is_document_relevant(raw_messages: list) -> bool:
    if len(raw_messages) <= 1:
        return True
    
    history = []
    for m in raw_messages[-4:]:
        content = m["content"]
        if isinstance(content, list):
            text_parts = [p["text"] for p in content if p.get("type") == "text"]
            content = " ".join(text_parts)
        history.append({"role": m["role"], "content": str(content)})

    try:
        response = client.chat.completions.create(
            model="groq/compound-mini",
            temperature=0.0,
            max_tokens=10,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an AI assistant analyzing a conversation with an uploaded document/image.\n"
                        "Based on the conversation history, does the user's LATEST message refer to, "
                        "follow up on, or implicitly require the uploaded document/image to be answered?\n"
                        "Answer ONLY 'yes' or 'no'."
                    )
                },
                *history
            ]
        )
        return "yes" in response.choices[0].message.content.strip().lower()
    except Exception:
        return True


def generate_conversation_title(user_input: str) -> str:
    try:
        response = client.chat.completions.create(
            model="groq/compound-mini",
            temperature=0.5,
            max_tokens=25,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Generate a short, relevant title for a conversation starting with the user message below.\n"
                        "Rules:\n"
                        "1. Maximum 5 words.\n"
                        "2. Never use quotation marks or quotes.\n"
                        "3. Do not include labels like 'Title:' or preamble.\n"
                        "4. Output ONLY the title text."
                    )
                },
                {
                    "role": "user",
                    "content": user_input
                }
            ]
        )

        raw_title = response.choices[0].message.content.strip()
        clean_title = raw_title.replace('"', '').replace("'", "").replace('`', '').strip()
        words = clean_title.split()

        if len(words) > 5:
            clean_title = " ".join(words[:5])

        return clean_title if clean_title else "New Chat"

    except Exception:
        words = user_input.strip().split()
        return " ".join(words[:5]) if words else "New Chat"

def reformulate_query(user_input: str, tool: str, raw_messages: list, doc: dict = None) -> str:
    history = []
    for m in raw_messages[-3:]:
        content = m["content"]
        if isinstance(content, list):
            text_parts = [p["text"] for p in content if p.get("type") == "text"]
            content = " ".join(text_parts)
        history.append({"role": m["role"], "content": str(content)})

    doc_context = f"\nActive Document: {doc['filename']}" if doc else ""

    system_prompt = f"""You are a query reformulator for an AI assistant.
Your ONLY job is to reformulate the user's conversational request into a clean query string optimized for the '{tool}' tool.

Rules:
1. For calculator: extract only the math expression.
2. For search: create a concise search query. Resolve pronouns (it, that, this) using the conversation history. Preserve constraints like 'latest', 'official', 'news'.
3. For date/time: preserve the intended relative date/time question.
4. Output NOTHING EXCEPT the plain text query string. No JSON, no explanations, no formatting, no XML tags, no tool calls. Just the raw string to be passed to the tool.
5. If you cannot confidently resolve a pronoun, leave it ambiguous. Do NOT invent missing context."""

    prompt_content = f"Conversation History:\n{history}\n{doc_context}\nUser: {user_input}"
    
    try:
        response = client.chat.completions.create(
            model="groq/compound-mini",
            temperature=0.0,
            max_tokens=100,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt_content}
            ]
        )
        query = response.choices[0].message.content.strip()
        return query if query else user_input
    except Exception as e:
        logger.error(f"[Planner] Failed to reformulate query: {e}")
        return user_input


# -----------------------
# Chat Loop
# -----------------------

def chat(user_id: str, conversation_id: str, message: str, timezone: str = None, document_id: str = None):

    user_input = message

    # Load conversation document by conversation_id
    conversation = None

    if conversation_id:
        conversation = get_conversation(
            conversation_id,
            user_id=user_id
        )

    if not conversation:
        conversation = create_conversation(
            user_id,
            title="New Chat"
        )
        conversation_id = conversation["_id"]

    # Document Resolution
    active_document_id = document_id or (conversation.get("active_document_id") if conversation else None)
    
    if document_id and conversation:
        update_conversation_active_document(conversation_id, document_id, user_id)
        active_document_id = document_id
        
    doc = None
    if document_id:
        doc = get_document(document_id, user_id=user_id)

    user_document = None
    if document_id and doc:
        user_document = {
            "document_id": str(doc["document_id"]),
            "filename": doc["filename"],
            "type": doc["type"],
            "mime_type": doc.get("mime_type", "")
            # NOTE: do NOT store base64 content here — it's fetched from
            # the documents collection at inference time via active_document_id.
        }

    # Append user message to conversation_id
    save_message(
        conversation_id,
        "user",
        user_input,
        user_id=user_id,
        document=user_document
    )

    # Get updated conversation history
    conversation = get_conversation(
        conversation_id,
        user_id=user_id
    )

    raw_messages = conversation.get(
        "messages",
        []
    ) if conversation else []

    # Generate intelligent title on first user message if title is still default
    current_title = conversation.get(
        "title",
        "New Chat"
    ) if conversation else "New Chat"

    user_msg_count = sum(
        1
        for m in raw_messages
        if m.get("role") == "user"
    )

    if current_title in [
        "New Chat",
        "New Conversation",
        ""
    ] and user_msg_count <= 1:

        new_title = generate_conversation_title(
            user_input
        )

        rename_conversation(
            conversation_id,
            new_title,
            user_id=user_id
        )

        current_title = new_title

    # -----------------------
    # Retrieve AI Settings
    # -----------------------

    settings = get_user_settings(user_id) or {}
    ai_settings = settings.get("ai", {})
    memory_settings = settings.get("memory", {})

    response_length = ai_settings.get(
        "response_length",
        "balanced"
    )

    markdown_enabled = ai_settings.get(
        "markdown_enabled",
        True
    )

    # Memory must only be used when explicitly enabled
    memory_enabled = memory_settings.get(
        "memory_enabled",
        False
    )

    settings_text = (
        f"- Response detail: {response_length}\n"
        f"- Markdown: {'enabled' if markdown_enabled else 'disabled'}"
    )

    # Memory enrichment remains unchanged for ordinary chat. For an image
    # turn it is optional context, so its failures must not prevent Qwen from
    # answering the image question.
    is_image_document = bool(doc and doc.get("type") == "image")
    memories = _memory_enrichment(
        user_id,
        user_input,
        memory_enabled,
        is_image_document,
    )

    memory_text = ""

    for memory in memories:

        memory_text += (
            f"- Category: {memory['category']}, "
            f"Key: {memory['key']}, "
            f"Value: {memory['memory']}\n"
        )

    # -----------------------
    # Build Prompt
    # -----------------------

    MASTER_PROMPT = f"""
        {AXIOM_PERSONALITY}

        ==================================================

        USER AI SETTINGS (RESPONSE STYLE PREFERENCES)

        These settings MUST take priority for response style.

        {settings_text}

        ==================================================

        LONG-TERM MEMORY

        Use stored memories only when they genuinely improve
        the current response.

        Do not force memories into unrelated conversations.

        If the current conversation conflicts with stored
        memory, always trust the current conversation.

        Stored memories:

        {memory_text}

        ==================================================

        PROMPT PRIORITY

        1. Safety/system constraints
        2. Explicit user request for response style
        3. User's saved AI settings (above)
        4. Axiom's personality
        5. General response-quality guidance

        ==================================================

        RESPONSE QUALITY

        Answer the user's question first.
        Then explain if needed.

        Maintain accuracy, relevance, and clarity.
        Provide appropriate detail as dictated by context and settings.
        Avoid unnecessary repetition.
        Avoid giant unreadable paragraphs.
        Make formatting contextual rather than rigid.

        ==================================================

        CAPABILITIES

        You have access to tools including web search, calculator, and date/time.
        When these tools are used, their results appear in the conversation.

        If a previous response in this conversation was based on web search results,
        the sources (titles, URLs, dates) are visible in the conversation history.
        When the user asks about sources, refer to the actual sources cited in your
        previous response. Do NOT claim you cannot browse the web or access the internet.
        Do NOT invent sources that were not in your previous response.
        If the exact source details are no longer visible in the conversation history,
        say so honestly rather than fabricating them.

        """

    prompt_messages = [
        {
            "role": "system",
            "content": MASTER_PROMPT
        }
    ]

    formatted_history = [
        {
            "role": m["role"],
            "content": m["content"]
        }
        for m in raw_messages[-10:]
    ]

    prompt_messages.extend(
        formatted_history
    )

    tool = detect_tool(
        user_input,
        context=raw_messages
    )

    tool_result = None
    tool_query = user_input

    if tool:
        tool_query = reformulate_query(user_input, tool, raw_messages, doc=doc)

    if tool == "calculator":

        tool_result = calculate(
            tool_query
        )

    elif tool == "time":

        tool_result = get_current_time(
            timezone
        )

    elif tool == "date":

        message = tool_query.lower()

        if "tomorrow" in message:

            tool_result = get_relative_date(
                1,
                timezone
            )

        elif "yesterday" in message:

            tool_result = get_relative_date(
                -1,
                timezone
            )

        else:

            tool_result = get_current_date(
                timezone
            )

    elif tool == "search":
        from urllib.parse import urlparse

        raw_search = search_web(tool_query)

        if raw_search.get("error"):
            tool_result = f"Search Error: {raw_search['error']}"
        else:
            results = raw_search.get("results", [])
            # Sort results by date descending (newest first, None last)
            def get_date(r):
                d = r.get("published_date")
                return d if d else ""
            results.sort(key=get_date, reverse=True)

            formatted_results = []
            official_domains = ["python.org", "nextjs.org", "vercel.com", "mongodb.com", "oracle.com", "reactjs.org", "nodejs.org", "docker.com", "github.com", "microsoft.com", "apple.com"]
            community_domains = ["reddit.com", "stackoverflow.com", "news.ycombinator.com", "twitter.com", "x.com", "youtube.com"]

            for idx, r in enumerate(results, 1):
                url = r.get("url", "")
                try:
                    domain = urlparse(url).netloc.lower()
                    if domain.startswith("www."):
                        domain = domain[4:]
                except:
                    domain = "unknown"

                source_type = "Secondary/General"
                if any(domain.endswith(d) or domain == d for d in official_domains):
                    source_type = "Official/Primary"
                elif any(domain.endswith(d) or domain == d for d in community_domains):
                    source_type = "Community/Social"
                elif "wikipedia.org" in domain:
                    source_type = "Secondary/Reference"

                score = r.get("score", "N/A")
                date_val = r.get("published_date") or "Unknown"
                title = r.get("title", "")
                snippet = r.get("content", "")

                res_str = (
                    f"[RESULT {idx}]\n"
                    f"Score: {score}\n"
                    f"Date: {date_val}\n"
                    f"Domain: {domain} ({source_type})\n"
                    f"Title: {title}\n"
                    f"URL: {url}\n"
                    f"Snippet: {snippet}\n"
                )
                formatted_results.append(res_str)

            tool_result = "\n".join(formatted_results)

    if tool_result:

        prompt_messages.append(
            {
                "role": "system",
                "content": f"""

                A tool has provided information.

                Use this information to answer the user naturally.

                Rules:
                - Do not mention tools.
                - Do not say "according to tool".
                - Do not recalculate (unless calculating a relative date/time based on the tool's provided current datetime).
                - Keep the response conversational.
                - For date/time, treat the tool's result as the absolute truth and never guess timezones from context.
                - For web search:
                  1. Cite only URLs that exist in the provided search results.
                  2. Never invent or reconstruct a URL.
                  3. Use the source whose content most directly supports the claim.
                  4. You MUST prioritize sources labeled (Official/Primary) over (Secondary/Reference) or (Community/Social) when they contain the required information. Do not cite Wikipedia or Reddit if an Official source is available for the same claim.
                  5. Do not cite a source merely because it contains the same keyword.
                  6. Do not use one source for unrelated claims when more appropriate sources are available.
                  7. For "latest", "newest", "this week", or "most recent" questions, use the actual available publication/release dates.
                  8. If the search results do not provide enough evidence, say so rather than guessing.
                  9. Preserve the actual title and URL returned by the search tool: [Title](URL).

                Tool result:

                {tool_result}

                """
            }
        )

    # -----------------------
    # -----------------------
    # Document Context
    # -----------------------
    # doc is already resolved above
        
    model_name = "openai/gpt-oss-120b"
    image_data_url = None
    
    if active_document_id:
        is_relevant = True
        if not document_id:
            is_relevant = _is_document_relevant(raw_messages)
            
        if is_relevant:
            if not doc:
                doc = get_document(active_document_id, user_id=user_id)
            if doc:
                if doc["type"] == "text":
                    prompt_messages.append({
                        "role": "system",
                        "content": (
                            f"ACTIVE DOCUMENT CONTEXT:\nFilename: {doc.get('filename')}\n"
                            f"{TEXT_DOCUMENT_GROUNDING_INSTRUCTION}\n\n"
                            f"Content:\n{doc.get('content')}"
                        )
                    })
                elif doc["type"] == "image":
                    model_name = QWEN_IMAGE_MODEL
                    try:
                        image_data_url = _image_document_data_url(doc)
                        _attach_image_to_latest_user_message(prompt_messages, image_data_url)
                    except ValueError as exc:
                        logger.warning(
                            "[Document Agent] stored image validation failed: document_id=%s exception_type=%s",
                            doc.get("document_id"),
                            type(exc).__name__,
                        )
        else:
            doc = None

    # -----------------------
    # Ask Groq
    # -----------------------

    if model_name == QWEN_IMAGE_MODEL:
        ai_reply = (
            _qwen_image_completion(prompt_messages)
            if image_data_url
            else IMAGE_INVALID_DOCUMENT_REPLY
        )
    else:
        completion_kwargs = {
            "model": model_name,
            "temperature": 0.7,
            "max_tokens": 700,
            "messages": prompt_messages
        }
        response = client.chat.completions.create(**completion_kwargs)
        ai_reply = response.choices[0].message.content

        # Preserve existing non-image behavior.
        if not ai_reply:
            ai_reply = "I'm sorry, I wasn't able to generate a response. Please try again."

    # Save assistant reply
    save_message(
        conversation_id,
        "assistant",
        ai_reply,
        user_id=user_id
    )

    return {
        "response": ai_reply,
        "conversation_id": conversation_id,
        "title": current_title
    }
