from fastapi import APIRouter, HTTPException, status
from backend.core.database import (
    users_collection,
    conversation_collection,
    memory_collection,
    settings_collection
)
from datetime import datetime, timezone
from backend.core.security import (
    get_current_username,
    create_access_token,
    verify_password,
    hash_password,
)
from fastapi import Depends
from pydantic import BaseModel
from typing import Optional

class AuthRequest(BaseModel):
    username: str
    password: str

class ProfileUpdateRequest(BaseModel):
    username: str
    avatar: Optional[str] = None
    dob: Optional[str] = None

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)


@router.post("/register")
def register(request: AuthRequest):
    username = request.username
    password = request.password

    existing_user = users_collection.find_one(
        {
            "username": username
        }
    )


    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username already exists"
        )


    hashed_password = hash_password(
        password
    )


    user = {

        "username": username,

        "password_hash": hashed_password,

        "created_at": datetime.now(
            timezone.utc
        )
    }


    users_collection.insert_one(user)


    return {
        "message":
        f"User {username} registered successfully"
    }



@router.post("/login")
def login(username: str, password: str):

    user = users_collection.find_one(
        {
            "username": username
        }
    )


    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )


    valid = verify_password(
        password,
        user["password_hash"]
    )


    if not valid:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )


    token = create_access_token(
        {
            "sub": username
        }
    )


    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer"
    }

@router.get("/me")
def get_me(username: str = Depends(get_current_username)):
    user = users_collection.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "username": user["username"],
        "avatar": user.get("avatar"),
        "dob": user.get("dob")
    }

@router.put("/me")
def update_me(request: ProfileUpdateRequest, username: str = Depends(get_current_username)):
    user = users_collection.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    new_username = request.username.strip()
    
    if not new_username:
        raise HTTPException(status_code=400, detail="Username cannot be empty")
        
    username_changed = new_username != username
    
    if username_changed:
        existing = users_collection.find_one({"username": new_username})
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
            
    updates = {}
    if "avatar" in request.model_fields_set:
        if request.avatar and request.avatar.strip():
            updates["avatar"] = request.avatar.strip()
        else:
            updates["avatar"] = None

    if "dob" in request.model_fields_set:
        if request.dob and request.dob.strip():
            dob_str = request.dob.strip()
            try:
                parsed_dob = datetime.strptime(dob_str, "%Y-%m-%d").date()
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid date of birth. Must be a valid date in YYYY-MM-DD format."
                )
            
            today = max(datetime.now().date(), datetime.now(timezone.utc).date())
            if parsed_dob > today:
                raise HTTPException(
                    status_code=400,
                    detail="Date of birth cannot be in the future."
                )
            if parsed_dob.year < 1900:
                raise HTTPException(
                    status_code=400,
                    detail="Date of birth year must be 1900 or later."
                )
            
            updates["dob"] = parsed_dob.isoformat()
        else:
            updates["dob"] = None

    if username_changed:
        updates["username"] = new_username
        
    if updates:
        users_collection.update_one({"username": username}, {"$set": updates})
        
    if username_changed:
        # Update foreign keys in other collections
        conversation_collection.update_many({"user_id": username}, {"$set": {"user_id": new_username}})
        memory_collection.update_many({"user_id": username}, {"$set": {"user_id": new_username}})
        settings_collection.update_one({"user_id": username}, {"$set": {"user_id": new_username}})
        
    new_token = None
    if username_changed:
        new_token = create_access_token({"sub": new_username})
        
    updated_user = users_collection.find_one({"username": new_username})
    return {
        "message": "Profile updated successfully",
        "user": {
            "username": updated_user["username"],
            "avatar": updated_user.get("avatar"),
            "dob": updated_user.get("dob")
        },
        "access_token": new_token
    }