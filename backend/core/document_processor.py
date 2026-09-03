import os
import base64
import json
import csv
from io import BytesIO
from fastapi import UploadFile

# Try importing parsers
try:
    import warnings
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", DeprecationWarning)
        import pymupdf as fitz  # PyMuPDF
except ImportError:
    try:
        import fitz  # fallback for older installations
    except ImportError:
        fitz = None

try:
    import docx
except ImportError:
    docx = None

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None


SUPPORTED_TEXT_EXTENSIONS = {
    ".pdf", ".doc", ".docx", ".txt", ".md", ".html", ".csv", ".json"
}

SUPPORTED_IMAGE_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".webp"
}

SUPPORTED_EXTENSIONS = SUPPORTED_TEXT_EXTENSIONS.union(SUPPORTED_IMAGE_EXTENSIONS)


def get_extension(filename: str) -> str:
    _, ext = os.path.splitext(filename)
    return ext.lower()


async def process_document(file: UploadFile) -> dict:
    """
    Processes an uploaded file.
    Returns a dict with 'type' ('text' or 'image') and 'content' (extracted text or base64 string).
    """
    ext = get_extension(file.filename)
    
    if ext not in SUPPORTED_EXTENSIONS:
        raise ValueError(f"Unsupported file extension: {ext}")
        
    content_bytes = await file.read()
    
    if not content_bytes:
        raise ValueError("File is empty")
        
    if ext in SUPPORTED_IMAGE_EXTENSIONS:
        # Encode image to base64
        base64_img = base64.b64encode(content_bytes).decode('utf-8')
        return {
            "type": "image",
            "content": base64_img,
            "mime_type": file.content_type
        }
        
    else:
        # It's a text document, extract text
        extracted_text = ""
        
        if ext == ".pdf":
            if not fitz:
                raise RuntimeError("PyMuPDF (fitz) is not installed.")
            doc = fitz.open(stream=content_bytes, filetype="pdf")
            for page in doc:
                extracted_text += page.get_text() + "\n\n"
            doc.close()
            
        elif ext in [".doc", ".docx"]:
            if not docx:
                raise RuntimeError("python-docx is not installed.")
            doc_file = BytesIO(content_bytes)
            doc_parsed = docx.Document(doc_file)
            extracted_text = "\n".join([para.text for para in doc_parsed.paragraphs])
            
        elif ext == ".csv":
            # Preserve CSV structure by just decoding it as text
            extracted_text = content_bytes.decode('utf-8', errors='replace')
            
        elif ext == ".json":
            # Parse and re-dump to ensure it's valid JSON and format nicely
            try:
                json_data = json.loads(content_bytes.decode('utf-8'))
                extracted_text = json.dumps(json_data, indent=2)
            except Exception:
                extracted_text = content_bytes.decode('utf-8', errors='replace')
                
        elif ext == ".html":
            if not BeautifulSoup:
                raise RuntimeError("beautifulsoup4 is not installed.")
            soup = BeautifulSoup(content_bytes.decode('utf-8', errors='replace'), 'html.parser')
            extracted_text = soup.get_text(separator='\n\n', strip=True)
            
        elif ext in [".txt", ".md"]:
            extracted_text = content_bytes.decode('utf-8', errors='replace')
            
        if not extracted_text.strip():
            raise ValueError("Could not extract any meaningful text from the document.")
            
        return {
            "type": "text",
            "content": extracted_text.strip(),
            "mime_type": file.content_type
        }
