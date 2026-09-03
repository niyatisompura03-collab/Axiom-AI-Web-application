import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from backend.core.database import password_reset_collection

def generate_reset_token(username: str) -> str:
    """
    Generates a secure random reset token, hashes it, and stores it in the database.
    Returns the raw token to be sent to the user.
    """
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    # Invalidate any existing reset tokens for this user to ensure only the latest is valid
    password_reset_collection.delete_many({"username": username})
    
    password_reset_collection.insert_one({
        "username": username,
        "token_hash": token_hash,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    })
    
    return raw_token

def verify_reset_token(raw_token: str) -> dict:
    """
    Hashes the raw token, looks it up in the database, and checks expiration.
    Returns the token document if valid, otherwise None.
    """
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    
    token_doc = password_reset_collection.find_one({"token_hash": token_hash})
    if not token_doc:
        return None
        
    # Check if expired
    now = datetime.now(timezone.utc)
    # Ensure expires_at is timezone aware
    expires_at = token_doc["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if now > expires_at:
        # Optionally clean up expired token
        consume_reset_token(raw_token)
        return None
        
    return token_doc

def consume_reset_token(raw_token: str) -> bool:
    """
    Deletes the token from the database after a successful password reset.
    """
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    result = password_reset_collection.delete_one({"token_hash": token_hash})
    return result.deleted_count > 0
