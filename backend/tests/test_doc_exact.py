from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv('GROQ_API_KEY'))

doc_content = '{"rules": ["rule1", "rule2", "rule3"]}'

# Simulate the exact prompt_messages chatbot.py sends for a text doc
system_prompt = """You are Axiom..."""  # abbreviated

print("=== Simulating chatbot.py text doc flow ===")
try:
    resp = client.chat.completions.create(
        model='openai/gpt-oss-120b',
        temperature=0.7,
        max_tokens=700,
        messages=[
            {"role": "system", "content": "You are Axiom, a helpful assistant."},
            {"role": "user", "content": "how many rules are defined?"},
            {"role": "system", "content": f"ACTIVE DOCUMENT CONTEXT:\nFilename: schema.json\nContent:\n{doc_content}\n\nUse this document to answer the user's questions."},
        ]
    )
    c = resp.choices[0].message.content
    print(f"finish_reason: {resp.choices[0].finish_reason}")
    print(f"content ({len(c) if c else 'NONE'} chars): {repr(c[:300]) if c else 'NONE/EMPTY'}")
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")

# Now test qwen with extra_body
print("\n=== qwen3.6-27b with extra_body reasoning_format hidden ===")
try:
    resp = client.chat.completions.create(
        model='qwen/qwen3.6-27b',
        temperature=0.7,
        max_tokens=700,
        messages=[
            {"role": "user", "content": "Say: I am working."}
        ],
        extra_body={"reasoning_format": "hidden"}
    )
    c = resp.choices[0].message.content
    print(f"finish_reason: {resp.choices[0].finish_reason}")
    print(f"content ({len(c) if c else 'NONE'} chars): {repr(c[:300]) if c else 'NONE/EMPTY'}")
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")

# Test qwen WITHOUT extra_body
print("\n=== qwen3.6-27b WITHOUT extra_body ===")
try:
    resp = client.chat.completions.create(
        model='qwen/qwen3.6-27b',
        temperature=0.7,
        max_tokens=700,
        messages=[
            {"role": "user", "content": "Say: I am working."}
        ]
    )
    c = resp.choices[0].message.content
    print(f"finish_reason: {resp.choices[0].finish_reason}")
    print(f"content ({len(c) if c else 'NONE'} chars): {repr(c[:300]) if c else 'NONE/EMPTY'}")
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")

print("\n=== Done ===")
