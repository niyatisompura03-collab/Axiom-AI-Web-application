from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv('GROQ_API_KEY'))

# Test each candidate model
models_to_test = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "groq/compound",
    "groq/compound-mini",
]

for model in models_to_test:
    print(f"\n=== {model} ===")
    try:
        resp = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant. Always respond with a short answer."},
                {"role": "user", "content": "Say: I am working."}
            ],
            max_tokens=60
        )
        c = resp.choices[0].message.content
        print(f"  content: {repr(c[:120]) if c else 'NONE/EMPTY'}")
        # Also check finish_reason
        print(f"  finish_reason: {resp.choices[0].finish_reason}")
    except Exception as e:
        print(f"  ERROR: {type(e).__name__}: {str(e)[:200]}")

print("\n=== Done ===")
