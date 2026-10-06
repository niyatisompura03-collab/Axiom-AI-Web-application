import os
import sys

# Add backend to path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
from backend.services.chatbot import chat

def run_tests():
    queries = [
        "What is the latest stable Python release right now, and give me the official Python source?",
        "Search for the latest official Next.js security release and tell me the affected versions.",
        "Calculate 847 * 29 and tell me how you verified the result."
    ]
    
    for i, q in enumerate(queries, 1):
        print(f"\n--- TEST {i} ---")
        print(f"User: {q}")
        try:
            res = chat(
                user_id="testuser",
                conversation_id=f"testconv_{i}",
                message=q
            )
            print("Axiom:", res.get("response", res))
        except Exception as e:
            print(f"Exception: {e}")

if __name__ == "__main__":
    import logging
    logging.basicConfig(level=logging.INFO, format="%(name)s: %(message)s")
    run_tests()
