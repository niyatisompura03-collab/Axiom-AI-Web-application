import os
import sys

# Add backend to path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
from backend.services.chatbot import chat

def test_chat():
    try:
        res = chat(
            user_id="testuser",
            conversation_id="testconv123",
            message="What is the latest stable Python release right now, and give me the official Python source?"
        )
        print("CHAT RESULT:", res)
    except Exception as e:
        print("EXCEPTION:", e)

if __name__ == "__main__":
    test_chat()
