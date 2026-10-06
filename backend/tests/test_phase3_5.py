import asyncio
import os
from groq import Groq
from backend.core.agent_router import detect_tools, detect_tool
from backend.services.chatbot import chat

async def test_router():
    print("Testing Router Logic")
    
    # 1. standalone explicit time intent
    t1 = detect_tools("what is the current time")
    print(f"1. standalone explicit time: {t1} -> Expected: ['time']")
    
    # 2. standalone search/freshness intent
    t2 = detect_tools("what is the latest Python release")
    print(f"2. standalone search: {t2} -> Expected: ['search']")
    
    # 3. explicit time + search compound intent
    t3 = detect_tools("What is the current time in Tokyo, and search for the latest Python release?")
    print(f"3. explicit time + search: {t3} -> Expected: ['time', 'search']")
    
    # 4. ambiguous "time" used as part of another subject
    t4 = detect_tools("What time was the latest Python release?")
    print(f"4. ambiguous time with search: {t4} -> Expected: ['search']")
    
    # 5. compound query where one intent contains words that previously suppressed another
    t5 = detect_tools("What is the current time in Tokyo, and search for the latest unreleased secret internal codename of Apple 2099 device?")
    print(f"5. previously suppressed time: {t5} -> Expected: ['time', 'search']")
    
    # 6. normal non-tool conversation
    t6 = detect_tools("hello how are you doing today")
    print(f"6. normal non-tool conversation: {t6} -> Expected: []")
    
    # 7. max-2-tool safety & 8. duplicate tool detection
    t7 = detect_tools("search, calculator, banana, calculator, time")
    print(f"7/8. max-2-tool and duplicates: {t7} -> Expected max length 2, duplicates removed")
    
    # 9. Verify detect_tool()
    t9 = detect_tool("What is the current time in Tokyo?")
    print(f"9. detect_tool() compatibility wrapper: {t9} -> Expected: 'time'")
    
    print("-" * 40)
    
async def run_tests():
    await test_router()
    
    # Need a mock user id and conversation id
    user_id = "test_user"
    conv_id = "test_conv_phase3_5"
    
    # 1. Single tool regression
    print("\n--- Test 1: Single tool regression ---")
    res1 = chat(user_id, conv_id, "Calculate 847 * 29", timezone="UTC")
    print(f"Res1: {res1['response']}")
    
    # 2. Date + Calculator
    print("\n--- Test 2: Date + Calculator ---")
    res2 = chat(user_id, conv_id + "2", "What is today's date and what is 250 * 4?", timezone="UTC")
    print(f"Res2: {res2['response']}")
    
    # 3. Date + Search
    print("\n--- Test 3: Date + Search ---")
    res3 = chat(user_id, conv_id + "3", "What is today's date, and what is the latest stable release of Python?", timezone="UTC")
    print(f"Res3: {res3['response']}")
    
    # 4. Partial Failure
    print("\n--- Test 4: Partial Failure ---")
    res4 = chat(user_id, conv_id + "4", "What is the current time in Tokyo, and search for the latest unreleased secret internal codename of Apple 2099 device?", timezone="Asia/Tokyo")
    print(f"Res4: {res4['response']}")
    
    # 5. Full Failure
    print("\n--- Test 5: Full Failure ---")
    res5 = chat(user_id, conv_id + "5", "Search for the exact coordinates of the fictional lost city of Atlantis from 3000 BC, and search for the unreleased secret internal codename of Apple 2099 device.", timezone="UTC")
    print(f"Res5: {res5['response']}")

if __name__ == "__main__":
    asyncio.run(run_tests())
