from backend.core.agent_router import detect_tool
from backend.services.chatbot import chat
import os

queries = [
    "What is the latest version of Next.js?",
    "What are the latest AI developments this week?",
    "What is Python?"
]

print("--- Testing detect_tool ---")
for q in queries:
    tool = detect_tool(q)
    print(f"Query: '{q}' -> Tool: {tool}")

print("\n--- Testing chatbot responses ---")
for q in queries:
    print(f"\nUser: {q}")
    res = chat(user_id="test", conversation_id="test_conv", message=q)
    print(f"Axiom: {res['response']}")
