from datetime import datetime, timezone
from backend.core.database import memory_collection, _parse_object_id
from backend.core.embeddings import create_embedding

ALLOWED_UPDATE_FIELDS = {"memory", "key", "category"}

def update_memory(memory_id: str, updates: dict) -> dict | None:
    """Update allowed fields of a memory document.
    - Allowed fields: memory, key, category.
    - Recalculates embedding if the memory text changes.
    - Updates the `updated_at` timestamp.
    - Keeps the memory `active` flag unchanged.
    Returns the updated document without the embedding field, or `None` if not found.
    """
    obj_id = _parse_object_id(memory_id)
    if not obj_id:
        return None

    # Filter updates to allowed fields only
    set_fields = {"updated_at": datetime.now(timezone.utc)}
    for field in ALLOWED_UPDATE_FIELDS:
        if field in updates:
            set_fields[field] = updates[field]

    # If the memory text changed, recompute embedding
    if "memory" in updates:
        embedding = create_embedding(updates["memory"]).tolist()
        set_fields["embedding"] = embedding

    result = memory_collection.update_one({"_id": obj_id}, {"$set": set_fields})
    if result.matched_count == 0:
        return None

    # Return the updated document without the embedding field
    doc = memory_collection.find_one({"_id": obj_id}, {"embedding": 0})
    if doc:
        doc["memory_id"] = str(doc.pop("_id"))
    return doc
