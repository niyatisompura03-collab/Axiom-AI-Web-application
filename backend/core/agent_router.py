import os
import logging
import re
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
logger = logging.getLogger(__name__)

def detect_tool(user_message, context=None):
    """
    Hybrid tool router:
    Stage 1: High-confidence deterministic rules for fast routing.
    Stage 2: Lightweight LLM classifier for ambiguous requests and context-aware follow-ups.
    """
    message = user_message.lower().strip()

    # -----------------
    # STAGE 1: Deterministic Fast Path
    # -----------------
    
    # Calculator: explicit keyword or explicit math operations
    if message.startswith("calculate ") or re.search(r'\d+\s*[\+\-\*\/%]\s*\d+', message):
        logger.info("[Router] Deterministic route: calculator")
        return "calculator"
        
    time_high_conf = [
        "what time is it", "what's the time", "current time", "time right now", "what time"
    ]
    if any(word in message for word in time_high_conf) and "latest" not in message and "release" not in message:
        logger.info("[Router] Deterministic route: time")
        return "time"
        
    date_high_conf = [
        "today's date", "what date", "what day is", "current date"
    ]
    if any(word in message for word in date_high_conf):
        logger.info("[Router] Deterministic route: date")
        return "date"

    search_high_conf = [
        "search for", "latest version", "news today", "look up", "find information"
    ]
    if any(word in message for word in search_high_conf):
        logger.info("[Router] Deterministic route: search")
        return "search"

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
Your ONLY job is to select the correct tool for the user's latest message.

Tools available:
- calculator: for solving math expressions
- time: for getting the current time or timezones
- date: for getting the current date or relative dates (tomorrow, last week)
- search: for retrieving up-to-date facts, news, latest versions, or external information
- none: if no tool is needed (e.g., conversational chat, general knowledge, or if the answer is already in the conversation history)

If the user is asking a follow-up question (e.g., "Which source did you use?", "Tell me more about that"), 
and the previous context already contains the necessary information, return 'none'.
Do not return a tool if the user is just saying hello, asking general questions, or giving updates.
Return ONLY one word: the tool name or 'none'.
"""
    prompt_content = f"Conversation History:\n{history_str}\n\nUser: {user_message}" if history_str else f"User: {user_message}"
    
    try:
        response = client.chat.completions.create(
            model="groq/compound-mini",
            temperature=0.0,
            max_tokens=10,
            messages=[
                {"role": "system", "content": system_prompt.strip()},
                {"role": "user", "content": prompt_content.strip()}
            ]
        )
        decision = response.choices[0].message.content.strip().lower()
        
        # Clean up any punctuation returned by the model
        decision = ''.join(c for c in decision if c.isalpha())
        
        valid_tools = ["calculator", "time", "date", "search", "none"]
        
        if decision in valid_tools:
            logger.info(f"[Router] Classifier route: {decision}")
            return decision if decision != "none" else None
        else:
            logger.warning(f"[Router] Classifier returned invalid tool '{decision}', falling back to None")
            return None
    except Exception as e:
        logger.error(f"[Router] Classifier failed: {e}")
        return None