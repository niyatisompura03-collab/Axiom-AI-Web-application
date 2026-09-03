import os
import re
import secrets
import urllib.parse
import urllib.request
import urllib.error
import json
import logging
from fastapi import APIRouter, HTTPException, status, Request, Cookie
from fastapi.responses import RedirectResponse
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
from backend.core.password_reset import (
    verify_reset_token,
    consume_reset_token,
    generate_reset_token
)
from backend.services.email import send_password_reset_email
from fastapi import Depends
from pydantic import BaseModel
from typing import Optional
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

class AuthRequest(BaseModel):
    username: str
    password: str
    email: Optional[str] = None

class ProfileUpdateRequest(BaseModel):
    username: str
    avatar: Optional[str] = None
    dob: Optional[str] = None

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    email: str

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

    normalized_email = request.email.strip().lower() if request.email else None
    if normalized_email:
        if users_collection.find_one({"email": {"$regex": f"^{re.escape(normalized_email)}$", "$options": "i"}}):
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )

    hashed_password = hash_password(
        password
    )

    user = {
        "username": username,
        "email": normalized_email,
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

@router.get("/google/login")
def google_login():
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
    
    if not client_id or not redirect_uri:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
        
    state = secrets.token_urlsafe(32)
    
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "consent"
    }
    
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"
    
    response = RedirectResponse(url=auth_url)
    response.set_cookie(
        key="oauth_state",
        value=state,
        httponly=True,
        secure=False, # allow local dev
        samesite="lax",
        max_age=600,
        path="/"
    )
    return response

@router.get("/google/callback")
def google_callback(
    request: Request,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
    oauth_state: Optional[str] = Cookie(None)
):
    print("STATE FROM GOOGLE:", state)
    print("STATE FROM COOKIE:", oauth_state)

    print("========== GOOGLE OAUTH DEBUG ==========")
    print("REQUEST URL:", str(request.url))
    print("REQUEST HOST:", request.headers.get("host"))
    print("STATE FROM GOOGLE:", state)
    print("STATE FROM COOKIE:", oauth_state)
    print("ALL REQUEST COOKIES:", request.cookies)
    print("========================================")

    if not oauth_state or state != oauth_state:
        raise HTTPException(status_code=400, detail="Invalid state parameter")
        
    if error:
        raise HTTPException(status_code=400, detail=f"Google OAuth error: {error}")
    
    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing code or state")
        
    if not oauth_state or state != oauth_state:
        raise HTTPException(status_code=400, detail="Invalid state parameter")
        
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
    
    if not client_id or not client_secret or not redirect_uri:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
        
    token_url = "https://oauth2.googleapis.com/token"
    data = urllib.parse.urlencode({
        "client_id": client_id,
        "client_secret": client_secret,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": redirect_uri
    }).encode("utf-8")
    
    req = urllib.request.Request(token_url, data=data, method="POST")
    try:
        with urllib.request.urlopen(req) as response:
            token_response = json.loads(response.read().decode())
    except urllib.error.URLError:
        raise HTTPException(status_code=400, detail="Failed to exchange code with Google")
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Failed to parse Google response")
        
    id_token_jwt = token_response.get("id_token")
    if not id_token_jwt:
        raise HTTPException(status_code=400, detail="No id_token received")
        
    try:
        request_adapter = google_requests.Request()
        id_info = id_token.verify_oauth2_token(
            id_token_jwt, request_adapter, client_id
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid ID token")
        
    google_id = id_info.get("sub")
    email = id_info.get("email")
    if email:
        email = email.strip().lower()
    name = id_info.get("name")
    
    query = {"google_id": google_id} if not email else {
        "$or": [{"google_id": google_id}, {"email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}}]
    }
    user = users_collection.find_one(query)
    
    if user:
        # Link account if email matches but google_id is missing
        updates = {}
        if not user.get("google_id"):
            updates["google_id"] = google_id
            updates["auth_provider"] = "google"
            
        # Save Google avatar if missing
        if not user.get("avatar") and id_info.get("picture"):
            updates["avatar"] = id_info.get("picture")
            
        if updates:
            users_collection.update_one(
                {"_id": user["_id"]},
                {"$set": updates}
            )
        username = user["username"]
    else:
        # Generate unique username
        base_username = email.split("@")[0] if email else f"user_{google_id[:6]}"
        username = base_username
        counter = 1
        while users_collection.find_one({"username": username}):
            username = f"{base_username}{counter}"
            counter += 1
            
        new_user = {
            "username": username,
            "google_id": google_id,
            "email": email,
            "auth_provider": "google",
            "password_hash": None,
            "avatar": id_info.get("picture"),
            "created_at": datetime.now(timezone.utc)
        }
        users_collection.insert_one(new_user)
        
    token = create_access_token({"sub": username})
    
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    response = RedirectResponse(url=f"{frontend_url}/?token={token}")
    response.delete_cookie("oauth_state")
    return response

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
        
    if user.get("password_hash") is None:
        raise HTTPException(
            status_code=401,
            detail="Please sign in with Google"
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

@router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest):
    email = request.email.strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
        
    user = users_collection.find_one({"email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}})
    
    generic_message = "If an account with that email exists and is eligible for password reset, we have sent a reset link."
    
    if not user:
        return {"message": generic_message}
        
    if user.get("password_hash") is None:
        return {"message": generic_message}
        
    token = generate_reset_token(user["username"])
    
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    email_sent = send_password_reset_email(email, token, frontend_url)
    
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to send password reset email. Please try again later."
        )
    
    return {"message": generic_message}

@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest):
    token_doc = verify_reset_token(request.token)
    if not token_doc:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset token"
        )
        
    username = token_doc["username"]
    
    user = users_collection.find_one({"username": username})
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
        
    if user.get("password_hash") is None:
        raise HTTPException(
            status_code=400,
            detail="Cannot reset password for Google-authenticated users"
        )
        
    if not request.new_password:
        raise HTTPException(
            status_code=400,
            detail="Password cannot be empty"
        )
        
    new_hashed_password = hash_password(request.new_password)
    
    users_collection.update_one(
        {"username": username},
        {"$set": {"password_hash": new_hashed_password}}
    )
    
    consume_reset_token(request.token)
    
    return {"message": "Password has been successfully reset"}

@router.get("/me")
def get_me(username: str = Depends(get_current_username)):
    user = users_collection.find_one({"username": username})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "username": user["username"],
        "email": user.get("email"),
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