import os
from backend.services.chatbot import chat
import time

def run_test(prompt):
    print(f"\nUser: {prompt}")
    res = chat(user_id="test_user", conversation_id="test_conv", message=prompt, timezone="America/Los_Angeles")
    print(f"Axiom: {res['response']}")
    time.sleep(1)

print("Starting checks...")
run_test("What is the current date?")
run_test("What is the current time and timezone?")
run_test("What date was last Monday?")
run_test("What date is next Friday?")
run_test("Wait, actually I am in Tokyo timezone. What time is it for me?")

