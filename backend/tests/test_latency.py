import time
from backend.services.chatbot import chat
from backend.core.database import create_conversation
import os

user_id = "test_user_perf"
conv = create_conversation(user_id, "Perf Test")
cid = conv["_id"]

def ask(msg):
    t0 = time.time()
    print(f"\nUser: {msg}")
    res = chat(user_id=user_id, conversation_id=cid, message=msg)
    t1 = time.time()
    print(f"Response in {t1 - t0:.2f} seconds")

ask("Hello there!")
ask("What is Python?")
