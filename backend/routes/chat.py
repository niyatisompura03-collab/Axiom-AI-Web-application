from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from backend.services.chatbot import chat
from backend.core.database import (
    get_conversation,
    get_user_conversations,
    create_conversation,
    rename_conversation,
    delete_conversation,
    edit_message,
    truncate_conversation_messages
)
from backend.core.security import get_current_username
from fastapi import Depends

router = APIRouter()

class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    message: str
    timezone: Optional[str] = None

class EditMessageRequest(BaseModel):
    message_index: int
    new_content: str

class NewConversationRequest(BaseModel):
    title: Optional[str] = "New Chat"

class RenameConversationRequest(BaseModel):
    title: str

# -----------------------
# Chat Endpoint
# -----------------------

@router.post("/chat")
def chat_endpoint(
    request: ChatRequest,
    username: str = Depends(get_current_username)
):
    result = chat(
        user_id=username,
        conversation_id=request.conversation_id,
        message=request.message,
        timezone=request.timezone
    )
    return result

# -----------------------
# Conversation REST Endpoints
# -----------------------

@router.post("/conversation/new", status_code=status.HTTP_201_CREATED)
def create_new_conversation(
    request: NewConversationRequest,
    username: str = Depends(get_current_username)
):
    title = request.title if request.title else "New Chat"
    conversation = create_conversation(user_id=username, title=title)
    return {
        "conversation_id": conversation["conversation_id"],
        "title": conversation["title"],
        "created_at": conversation["created_at"],
        "updated_at": conversation["updated_at"]
    }

@router.get("/conversations")
def list_user_conversations(
    username: str = Depends(get_current_username)
):
    conversations = get_user_conversations(username)
    return conversations

@router.get("/conversation/{conversation_id}")
def get_single_conversation(
    conversation_id: str,
    username: str = Depends(get_current_username)
):
    conversation = get_conversation(conversation_id, user_id=username)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    return conversation

@router.patch("/conversation/{conversation_id}")
def rename_single_conversation(
    conversation_id: str,
    request: RenameConversationRequest,
    username: str = Depends(get_current_username)
):
    conversation = rename_conversation(conversation_id, request.title, user_id=username)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    return conversation

@router.delete("/conversation/{conversation_id}")
def delete_single_conversation(
    conversation_id: str,
    username: str = Depends(get_current_username)
):
    deleted = delete_conversation(conversation_id, user_id=username)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    return {
        "message": "Conversation deleted successfully",
        "conversation_id": conversation_id
    }

@router.patch("/conversation/{conversation_id}/message")
def edit_conversation_message(
    conversation_id: str,
    request: EditMessageRequest,
    username: str = Depends(get_current_username)
):
    clean_content = request.new_content.strip()
    if not clean_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message content cannot be empty"
        )

    # First verify the conversation exists and belongs to the user
    conversation = get_conversation(conversation_id, user_id=username)
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    
    messages = conversation.get("messages", [])
    if request.message_index < 0 or request.message_index >= len(messages):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid message index")
    
    msg = messages[request.message_index]
    if msg["role"] != "user":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only user messages can be edited")

    # Truncate conversation in DB up to message_index so subsequent turns are replaced
    truncated = truncate_conversation_messages(
        conversation_id=conversation_id,
        keep_count=request.message_index,
        user_id=username
    )
    if not truncated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update conversation history"
        )

    # Generate new AI response using existing chatbot service
    chat_result = chat(
        user_id=username,
        conversation_id=conversation_id,
        message=clean_content
    )

    updated_conversation = get_conversation(conversation_id, user_id=username)

    return {
        "response": chat_result.get("response", ""),
        "conversation_id": conversation_id,
        "title": chat_result.get("title", conversation.get("title", "New Chat")),
        "messages": updated_conversation.get("messages", []) if updated_conversation else []
    }
