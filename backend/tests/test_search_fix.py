"""Phase 3.5 search fix test: verifies multi-tool requests with search succeed."""
import sys
import os
import logging

# Ensure project root is on path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

logging.basicConfig(level=logging.INFO, format="%(name)s: %(message)s")

from backend.services.chatbot import reformulate_query, chat

print("=" * 70)
print("TEST 1: Date + Search")
print("=" * 70)
q1 = "What's today's date, and find the latest Node.js security update."
search_query = reformulate_query(q1, "search", [])
print(f"Search query passed to tool: {search_query!r}")
print()

result1 = chat("test_search_fix", "test_search_fix_1", q1, timezone="UTC")
print(f"RESPONSE: {result1['response']}")
print()

print("=" * 70)
print("TEST 2: Search + Time")
print("=" * 70)
q2 = "Find recent news about NVIDIA, and tell me the current time in New York."
search_query2 = reformulate_query(q2, "search", [])
print(f"Search query passed to tool: {search_query2!r}")
print()

result2 = chat("test_search_fix", "test_search_fix_2", q2, timezone="America/New_York")
print(f"RESPONSE: {result2['response']}")
