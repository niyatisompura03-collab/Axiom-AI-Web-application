from groq import Groq
from dotenv import load_dotenv
import os

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

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


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
    if active_document_id:
        doc = get_document(active_document_id, user_id=user_id)

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

    # -----------------------
    # Store Memory
    # -----------------------

    if memory_enabled:

        memory = extract_memory(
            user_input
        )

        if memory.get("memory"):
            save_memory(
                user_id,
                memory
            )

    # -----------------------
    # Retrieve Memories
    # -----------------------

    if not memory_enabled:

        memories = []

    else:

        memory_category = classify_memory_query(
            user_input
        )

        if memory_category == "none":

            memories = []

        else:

            memories = search_memories(
                user_id,
                user_input,
                memory_category
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
        user_input
    )

    tool_result = None

    if tool == "calculator":

        tool_result = calculate(
            user_input
        )

    elif tool == "time":

        tool_result = get_current_time(
            timezone
        )

    elif tool == "date":

        message = user_input.lower()

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

        tool_result = search_web(
            user_input
        )

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
                - Do not recalculate.
                - Keep the response conversational.

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
    
    if doc:
        if doc["type"] == "text":
            prompt_messages.append({
                "role": "system",
                "content": f"ACTIVE DOCUMENT CONTEXT:\nFilename: {doc.get('filename')}\nContent:\n{doc.get('content')}\n\nUse this document to answer the user's questions. If the user asks a question not covered by the document, clearly state that."
            })
        elif doc["type"] == "image":
            model_name = "qwen/qwen3.6-27b"
            for i in range(len(prompt_messages)-1, -1, -1):
                if prompt_messages[i]["role"] == "user":
                    original_text = prompt_messages[i]["content"]
                    prompt_messages[i]["content"] = [
                        {"type": "text", "text": original_text},
                        {"type": "image_url", "image_url": {"url": f"data:{doc['mime_type']};base64,{doc['content']}"}}
                    ]
                    break

    # -----------------------
    # Ask Groq
    # -----------------------

    completion_kwargs = {
        "model": model_name,
        "temperature": 0.7,
        "max_tokens": 700,
        "messages": prompt_messages
    }
    
    if model_name == "qwen/qwen3.6-27b":
        completion_kwargs["extra_body"] = {"reasoning_format": "hidden"}

    response = client.chat.completions.create(**completion_kwargs)

    ai_reply = response.choices[0].message.content
    
    # Guard against None content (can happen on token overflow or model error)
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