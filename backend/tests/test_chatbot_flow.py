from backend.services.chatbot import chat
from backend.core.database import create_conversation
import os

# Create fake image doc for test
from pymongo import MongoClient
client = MongoClient(os.getenv("MONGODB_URI"))
db = client.get_default_database()
user_id = "test_user_123"

# Insert a dummy doc if not exists
doc_id = "test_image_doc"
db.documents.update_one(
    {"document_id": doc_id},
    {"$set": {
        "user_id": user_id,
        "filename": "test.png",
        "type": "image",
        "mime_type": "image/png",
        "content": "fakebase64",
    }},
    upsert=True
)

conv = create_conversation(user_id, "Test Context Chat")
cid = conv["_id"]

def ask(msg, attach=False):
    print(f"\nUser: {msg} [Attach: {attach}]")
    doc_arg = doc_id if attach else None
    res = chat(user_id=user_id, conversation_id=cid, message=msg, document_id=doc_arg)
    print(f"Axiom: {res['response']}")

# 1. Ask a question about an uploaded document/image. (pass document_id)
# Wait, if I pass a fake base64 image, Qwen might fail.
# Instead of a real image, I can create a text document for the test so we can verify if it's used.
db.documents.update_one(
    {"document_id": doc_id},
    {"$set": {
        "user_id": user_id,
        "filename": "test.txt",
        "type": "text",
        "content": "The secret code is 4242.",
    }},
    upsert=True
)

ask("What is the secret code in this document?", attach=True)

# 2. Ask an unrelated question such as "What is Python?"
ask("What is Python?")

# 3. Ask another unrelated question requiring web search.
ask("What is the latest version of Next.js?")

# 4. Explicitly refer back to the uploaded document and verify that it can still be used.
ask("What was the secret code again in the document?")

# 5. Ask a follow-up question that clearly depends on the document.
ask("Is it divisible by 2?")

