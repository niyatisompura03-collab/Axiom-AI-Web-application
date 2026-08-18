from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional
from backend.core.database import get_active_memories
from backend.core.security import get_current_username

router = APIRouter(prefix="/memories", tags=["memories"])

# Allowed categories for filtering
ALLOWED_CATEGORIES = {
    "preference",
    "goal",
    "profession",
    "education",
    "skill",
    "personal",
    "hobby",
    "past_profession",
    "other"
}

@router.get("")
def list_active_memories(
    category: Optional[str] = None,
    username: str = Depends(get_current_username)
):
    """Return active memories for a user.
    Optional ``category`` filters results; only known categories are accepted.
    Embeddings are omitted for payload size.
    """
    if category and category not in ALLOWED_CATEGORIES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid category '{category}'. Allowed: {sorted(ALLOWED_CATEGORIES)}"
        )
    try:
        memories = get_active_memories(username, category)
        return memories
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve memories: {str(e)}"
        )
