from backend.core.database import memory_collection
from backend.core.embeddings import create_embedding
from datetime import datetime

def save_memory(user_id, text):

    embedding = create_embedding(text["memory"])

    key = normalize_key(text["key"])

    existing = memory_collection.find_one(
        {
            "user_id": user_id,
            "key": key,
            "active": True
        }
    )

    if existing:

        if existing["memory"].lower() == text["memory"].lower():

            return
    

    if text["memory_type"] == "single_value":

        memory_collection.update_many(
            {
                "user_id": user_id,
                "key": key,
                "active": True
            },
            {
                "$set": {
                    "active": False
                }
            }
        )

    memory = {
        "user_id": user_id,
        "memory": text["memory"],
        "category": text["category"],
        "key": text["key"],
        "memory_type": text["memory_type"],
        "confidence": text["confidence"],
        "active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "embedding": embedding.tolist()
    }

    memory_collection.insert_one(memory)

def search_memories(user_id, query, category=None):
    query_embedding = create_embedding(query)
    filter_query = {
        "user_id": user_id,
        "active": True
    }

    if category:
        filter_query["category"] = category

    pipeline = [
    {
        "$vectorSearch": {
            "index": "memory_vector_index",
            "path": "embedding",
            "queryVector": query_embedding.tolist(),
            "numCandidates": 100,
            "limit": 1,
            "filter": filter_query
        }
    },
    {
        "$project": {
            "_id":0,
            "memory":1,
            "category":1,
            "key":1,
            "memory_type":1,
            "created_at":1,
            "score":{
                "$meta":"vectorSearchScore"
                }
        }
    }
]
    results = memory_collection.aggregate(pipeline)
    return list(results)

def normalize_key(key):

    if key.endswith("s"):
        key = key[:-1]

    return key