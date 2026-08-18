from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional

from backend.core.database import (
    get_user_settings,
    update_user_settings
)

from backend.core.security import get_current_username

router = APIRouter(
    prefix="/settings",
    tags=["settings"]
)


class AppearanceSettings(BaseModel):
    theme: Optional[str] = "dark"
    accent_color: Optional[str] = "#6366f1"
    compact_mode: Optional[bool] = False
    animations: Optional[bool] = True

    class Config:
        extra = "forbid"


class AISettings(BaseModel):
    response_length: Optional[str] = "balanced"
    markdown_enabled: Optional[bool] = True
    personality: Optional[str] = "default"

    class Config:
        extra = "forbid"


class MemorySettings(BaseModel):
    memory_enabled: Optional[bool] = True
    allow_long_term_memory: Optional[bool] = True

    class Config:
        extra = "forbid"


class UpdateSettingsRequest(BaseModel):
    appearance: Optional[AppearanceSettings] = None
    ai: Optional[AISettings] = None
    memory: Optional[MemorySettings] = None

    class Config:
        extra = "forbid"


# -----------------------------
# Get Settings
# -----------------------------

@router.get("")
def fetch_settings(
    username: str = Depends(get_current_username)
):
    settings = get_user_settings(username)

    if not settings:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve or create user settings"
        )

    return settings


# -----------------------------
# Update Settings
# -----------------------------

@router.put("")
@router.patch("")
def modify_settings(
    request: UpdateSettingsRequest,
    username: str = Depends(get_current_username)
):
    updates = request.model_dump(exclude_unset=True)

    updated_settings = update_user_settings(
        username,
        updates
    )

    if not updated_settings:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update settings"
        )

    return updated_settings