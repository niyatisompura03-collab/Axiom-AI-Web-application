import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv("c:/Users/bmvsi-151/Documents/Axiom-V2/.env")
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

tool_result = {
    "tool": "datetime",
    "type": "current_date",
    "current_time": "10:00 AM EDT",
    "current_date": "Friday, September 11, 2026",
    "timezone": "America/New_York",
    "instruction": "This datetime and timezone are authoritative. Do not infer timezone from context. Recalculate any relative dates from this current_date."
}

system_prompt = f"""
A tool has provided information.
Use this information to answer the user naturally.

Rules:
- Do not mention tools.
- Do not say "according to tool".
- Do not recalculate (unless calculating a relative date/time based on the tool's provided current datetime).
- Keep the response conversational.
- For date/time, treat the tool's result as the absolute truth and never guess timezones from context.

Tool result:
{tool_result}
"""

def test_query(q):
    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": q}
        ]
    )
    print(f"User: {q}\nAxiom: {response.choices[0].message.content}\n")

test_query("What is the current date?")
test_query("What is the current time and timezone?")
test_query("What date was last Monday?")
test_query("What date is next Friday?")
test_query("Wait, actually I am in Tokyo timezone. What time is it for me?")
