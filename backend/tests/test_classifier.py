import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv("c:/Users/bmvsi-151/Documents/Axiom-V2/.env")
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def _is_document_relevant(raw_messages: list) -> bool:
    if len(raw_messages) <= 1:
        return True
    
    history = []
    for m in raw_messages[-4:]:
        content = m["content"]
        if isinstance(content, list):
            text_parts = [p["text"] for p in content if p.get("type") == "text"]
            content = " ".join(text_parts)
        history.append({"role": m["role"], "content": str(content)})

    response = client.chat.completions.create(
        model="groq/compound-mini",
        temperature=0.0,
        max_tokens=10,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an AI assistant analyzing a conversation with an uploaded document/image.\n"
                    "Based on the conversation history, does the user's LATEST message refer to, "
                    "follow up on, or implicitly require the uploaded document/image to be answered?\n"
                    "Answer ONLY 'yes' or 'no'."
                )
            },
            *history
        ]
    )
    return "yes" in response.choices[0].message.content.strip().lower()

history_unrelated = [
    {"role": "user", "content": "What is in this image?"},
    {"role": "assistant", "content": "It is a picture of a dog."},
    {"role": "user", "content": "What is the latest version of Next.js?"}
]

history_related = [
    {"role": "user", "content": "What is in this image?"},
    {"role": "assistant", "content": "It is a picture of a dog."},
    {"role": "user", "content": "What color is the dog?"}
]

history_implicit = [
    {"role": "user", "content": "What is in this image?"},
    {"role": "assistant", "content": "It is a picture of a dog and a cat."},
    {"role": "user", "content": "Which one is on the left?"}
]

print("Unrelated:", _is_document_relevant(history_unrelated))
print("Related:", _is_document_relevant(history_related))
print("Implicit:", _is_document_relevant(history_implicit))
