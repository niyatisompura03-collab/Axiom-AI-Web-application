import os
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, status
from backend.core.security import get_current_username
from backend.core.document_processor import process_document, SUPPORTED_EXTENSIONS, get_extension
from backend.core.database import save_document

router = APIRouter()

MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", 10))
MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    username: str = Depends(get_current_username)
):
    # Extension validation
    ext = get_extension(file.filename)
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension: {ext}. Supported extensions are: {', '.join(SUPPORTED_EXTENSIONS)}"
        )
    
    # Read content to check size and process
    content_bytes = await file.read()
    if len(content_bytes) > MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum upload size of {MAX_UPLOAD_SIZE_MB}MB"
        )
    if len(content_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is empty"
        )
        
    # Reset file cursor for the processor
    await file.seek(0)
    
    try:
        # Process document
        processed_data = await process_document(file)
        
        # Save to database
        doc = save_document(
            user_id=username,
            filename=file.filename,
            mime_type=processed_data.get("mime_type", "application/octet-stream"),
            doc_type=processed_data["type"],
            content=processed_data["content"]
        )
        
        # Log observability data
        print(f"[Document Agent] upload received: {doc['document_id']}")
        print(f"[Document Agent] file type detected: {ext} ({doc['mime_type']})")
        print(f"[Document Agent] processing strategy selected: {doc['type']}")
        print(f"[Document Agent] processing completed, size: {len(content_bytes)} bytes")
        
        return {
            "document_id": doc["document_id"],
            "filename": doc["filename"],
            "type": doc["type"]
        }
        
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to process document")
