from dotenv import load_dotenv
from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime, timezone
import os

load_dotenv()

import certifi

mongo_client = MongoClient(
    os.getenv("MONGODB_URI"),
    tlsCAFile=certifi.where()
)

db = mongo_client["ai_chatbot"]

conversation_collection = db["conversations"]
memory_collection = db["memories"]
users_collection = db["users"]
settings_collection = db["settings"]

from backend.core.embeddings import create_embedding

def _parse_object_id(id_str: str):
    try:
        return ObjectId(id_str)
    except Exception:
        return None

def create_conversation(user_id: str, title: str = "New Chat") -> dict:
    now = datetime.now(timezone.utc)
    new_doc = {
        "user_id": user_id,
        "title": title if title else "New Chat",
        "created_at": now,
        "updated_at": now,
        "last_message": "",
        "messages": []
    }
    result = conversation_collection.insert_one(new_doc)
    doc_id = str(result.inserted_id)
    new_doc["_id"] = doc_id
    new_doc["conversation_id"] = doc_id
    return new_doc

def get_conversation(conversation_id: str, user_id: str = None) -> dict:
    obj_id = _parse_object_id(conversation_id)
    if not obj_id:
        return None

    query = {"_id": obj_id}
    if user_id:
        query["user_id"] = user_id

    doc = conversation_collection.find_one(query)
    if doc:
        doc["_id"] = str(doc["_id"])
        doc["conversation_id"] = doc["_id"]
    return doc

def get_user_conversations(user_id: str) -> list:
    cursor = conversation_collection.find({"user_id": user_id}).sort("updated_at", -1)
    conversations = []
    for doc in cursor:
        doc_id = str(doc["_id"])
        conversations.append({
            "conversation_id": doc_id,
            "title": doc.get("title", "New Chat"),
            "updated_at": doc.get("updated_at"),
            "last_message": doc.get("last_message", "")
        })
    return conversations

def rename_conversation(conversation_id: str, new_title: str, user_id: str = None) -> dict:
    obj_id = _parse_object_id(conversation_id)
    if not obj_id:
        return None

    now = datetime.now(timezone.utc)
    query = {"_id": obj_id}
    if user_id:
        query["user_id"] = user_id

    update = {
        "$set": {
            "title": new_title,
            "updated_at": now
        }
    }

    conversation_collection.update_one(query, update)
    return get_conversation(conversation_id, user_id=user_id)

def delete_conversation(conversation_id: str, user_id: str = None) -> bool:
    obj_id = _parse_object_id(conversation_id)
    if not obj_id:
        return False

    query = {"_id": obj_id}
    if user_id:
        query["user_id"] = user_id

    result = conversation_collection.delete_one(query)
    return result.deleted_count > 0

def save_message(conversation_id: str, role: str, content: str, user_id: str = None) -> bool:
    obj_id = _parse_object_id(conversation_id)
    if not obj_id:
        return False

    now = datetime.now(timezone.utc)
    message_item = {
        "role": role,
        "content": content,
        "timestamp": now
    }

    query = {"_id": obj_id}
    if user_id:
        query["user_id"] = user_id

    update = {
        "$push": {"messages": message_item},
        "$set": {
            "updated_at": now,
            "last_message": content
        }
    }

    result = conversation_collection.update_one(query, update)
    return result.modified_count > 0

def edit_message(conversation_id: str, message_index: int, new_content: str, user_id: str = None) -> bool:
    obj_id = _parse_object_id(conversation_id)
    if not obj_id:
        return False

    now = datetime.now(timezone.utc)
    query = {"_id": obj_id}
    if user_id:
        query["user_id"] = user_id

    update = {
        "$set": {
            f"messages.{message_index}.content": new_content,
            "updated_at": now
        }
    }

    result = conversation_collection.update_one(query, update)
    return result.matched_count > 0

def truncate_conversation_messages(conversation_id: str, keep_count: int, user_id: str = None) -> bool:
    obj_id = _parse_object_id(conversation_id)
    if not obj_id:
        return False

    now = datetime.now(timezone.utc)
    query = {"_id": obj_id}
    if user_id:
        query["user_id"] = user_id

    doc = conversation_collection.find_one(query)
    if not doc:
        return False

    messages = doc.get("messages", [])
    truncated_messages = messages[:keep_count]
    last_msg = truncated_messages[-1]["content"] if truncated_messages else ""

    update = {
        "$set": {
            "messages": truncated_messages,
            "last_message": last_msg,
            "updated_at": now
        }
    }
    result = conversation_collection.update_one(query, update)
    return result.matched_count > 0


try:
    settings_collection.create_index("user_id", unique=True)
except Exception:
    pass

def get_default_settings(user_id: str) -> dict:
    now = datetime.now(timezone.utc)
    return {
        "user_id": user_id,
        "appearance": {
            "theme": "dark",
            "accent_color": "#6366f1",
            "compact_mode": False
        },
        "ai": {
            "response_length": "balanced",
            "markdown_enabled": True,
            "personality": "default"
        },
        "memory": {
            "memory_enabled": True,
            "allow_long_term_memory": True
        },
        "system": {
            "created_at": now,
            "updated_at": now
        }
    }

def get_user_settings(user_id: str) -> dict:
    doc = settings_collection.find_one({"user_id": user_id})
    if not doc:
        default_doc = get_default_settings(user_id)
        try:
            settings_collection.insert_one(default_doc)
            doc = default_doc
        except Exception:
            doc = settings_collection.find_one({"user_id": user_id})
    
    if doc:
        if "_id" in doc:
            doc["_id"] = str(doc["_id"])
    return doc

def update_user_settings(user_id: str, updates: dict) -> dict:
    current = get_user_settings(user_id)
    if not current:
        return None
    
    now = datetime.now(timezone.utc)
    set_fields = {"system.updated_at": now}
    
    for section in ["appearance", "ai", "memory"]:
        if section in updates and isinstance(updates[section], dict):
            for key, val in updates[section].items():
                set_fields[f"{section}.{key}"] = val

    if set_fields:
        settings_collection.update_one({"user_id": user_id}, {"$set": set_fields})

    return get_user_settings(user_id)



def get_active_memories(user_id: str, category: str | None = None) -> list:
    """Return active memories for a user, sorted by newest.
    Optionally filter by a specific category.
    Embeddings are excluded for payload size.
    """
    filter_query = {"user_id": user_id, "active": True}
    if category:
        filter_query["category"] = category
    cursor = memory_collection.find(
        filter_query,
        {"embedding": 0}
    ).sort("created_at", -1)
    memories = []
    for doc in cursor:
        doc["memory_id"] = str(doc.pop("_id"))
        memories.append({
            "memory_id": doc["memory_id"],
            "category": doc.get("category"),
            "key": doc.get("key"),
            "memory": doc.get("memory"),
            "created_at": doc.get("created_at"),
            "updated_at": doc.get("updated_at")
        })
    return memories
