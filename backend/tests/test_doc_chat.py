from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv('GROQ_API_KEY'))

# Test 1: base model reply is non-empty
print("=== Test 1: Base model ===")
try:
    resp = client.chat.completions.create(
        model='openai/gpt-oss-120b',
        messages=[{'role': 'user', 'content': 'Say: I am working.'}],
        max_tokens=50
    )
    c = resp.choices[0].message.content
    print(f"content type: {type(c)}, len: {len(c) if c else 'NONE'}, val: {repr(c[:80]) if c else 'NONE'}")
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")

# Test 2: with document context system message
print("\n=== Test 2: With document context ===")
doc_content = '{"rules": ["rule1", "rule2", "rule3"]}'
try:
    resp = client.chat.completions.create(
        model='openai/gpt-oss-120b',
        messages=[
            {'role': 'system', 'content': f'ACTIVE DOCUMENT CONTEXT:\nFilename: schema.json\nContent:\n{doc_content}\n\nUse this document to answer the user.'},
            {'role': 'user', 'content': 'how many rules are defined?'}
        ],
        max_tokens=100
    )
    c = resp.choices[0].message.content
    print(f"content type: {type(c)}, len: {len(c) if c else 'NONE'}")
    print(f"REPLY: {repr(c[:200]) if c else 'NONE/EMPTY'}")
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")

# Test 3: qwen model with extra_body
print("\n=== Test 3: qwen model with reasoning_format hidden ===")
try:
    resp = client.chat.completions.create(
        model='qwen/qwen3.6-27b',
        messages=[{'role': 'user', 'content': 'Say: I am working.'}],
        max_tokens=100,
        extra_body={"reasoning_format": "hidden"}
    )
    c = resp.choices[0].message.content
    print(f"content type: {type(c)}, len: {len(c) if c else 'NONE'}")
    print(f"REPLY: {repr(c[:200]) if c else 'NONE/EMPTY'}")
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")

print("\n=== Done ===")
