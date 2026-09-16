import os
import base64
import json
import csv
from io import BytesIO
from fastapi import UploadFile

try:
    from PIL import Image, UnidentifiedImageError
except ImportError:
    Image = None
    UnidentifiedImageError = Exception

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
    ".pdf", ".docx", ".txt", ".md", ".html", ".csv", ".json"
}

SUPPORTED_IMAGE_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".webp"
}

IMAGE_MIME_BY_EXTENSION = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
}

# Browsers normally report image/jpeg for both .jpg and .jpeg.  Accept the
# legacy alias as input, but never persist it or use it in a data URL.
IMAGE_MIME_ALIASES = {
    "image/jpg": "image/jpeg",
}

# Groq documents a 33 megapixel image-resolution limit. This protects the
# image path from decompression-bomb-style inputs while retaining the current
# 10 MiB product upload limit.
MAX_IMAGE_PIXELS = int(os.getenv("MAX_IMAGE_PIXELS", 33_177_600))

# Groq limits requests containing base64 images to 4 MB. Reserve room for the
# data URL prefix and chat JSON/system prompt instead of accepting a file that
# will only fail later at model inference. This is configurable for deployments
# with a different provider limit.
MAX_IMAGE_BASE64_BYTES = int(os.getenv("MAX_IMAGE_BASE64_BYTES", 3 * 1024 * 1024))

SUPPORTED_EXTENSIONS = SUPPORTED_TEXT_EXTENSIONS.union(SUPPORTED_IMAGE_EXTENSIONS)


def get_extension(filename: str) -> str:
    _, ext = os.path.splitext(filename)
    return ext.lower()


def canonical_image_mime(filename: str) -> str:
    """Return Axiom's canonical MIME type for a supported image filename."""
    try:
        return IMAGE_MIME_BY_EXTENSION[get_extension(filename)]
    except KeyError as exc:
        raise ValueError("Unsupported image file extension") from exc


def normalize_image_mime(mime_type: str | None) -> str | None:
    """Normalize an optional client MIME type to an accepted canonical value."""
    if mime_type is None or not mime_type.strip():
        return None
    normalized = mime_type.split(";", 1)[0].strip().lower()
    normalized = IMAGE_MIME_ALIASES.get(normalized, normalized)
    if normalized not in set(IMAGE_MIME_BY_EXTENSION.values()):
        raise ValueError(f"Unsupported image MIME type: {mime_type}")
    return normalized


def _validate_dimensions(width: int, height: int) -> tuple[int, int]:
    if width <= 0 or height <= 0:
        raise ValueError("Image has invalid dimensions")
    if width * height > MAX_IMAGE_PIXELS:
        raise ValueError(
            f"Image exceeds maximum supported resolution of {MAX_IMAGE_PIXELS} pixels"
        )
    return width, height


def _validate_base64_size(content: bytes) -> None:
    encoded_size = 4 * ((len(content) + 2) // 3)
    if encoded_size > MAX_IMAGE_BASE64_BYTES:
        raise ValueError(
            "Image is too large for reliable analysis. Please upload an image under "
            f"{MAX_IMAGE_BASE64_BYTES // (1024 * 1024)} MiB after base64 encoding."
        )


def _png_dimensions(content: bytes) -> tuple[int, int]:
    if len(content) < 24 or content[:8] != b"\x89PNG\r\n\x1a\n" or content[12:16] != b"IHDR":
        raise ValueError("File content is not a valid PNG image")
    width = int.from_bytes(content[16:20], "big")
    height = int.from_bytes(content[20:24], "big")
    return _validate_dimensions(width, height)


def _jpeg_dimensions(content: bytes) -> tuple[int, int]:
    if len(content) < 4 or content[:2] != b"\xff\xd8":
        raise ValueError("File content is not a valid JPEG image")

    # JPEG dimensions are carried by a Start Of Frame segment. Parsing that
    # segment verifies considerably more than an extension or SOI signature.
    sof_markers = {
        0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7,
        0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF,
    }
    index = 2
    while index < len(content):
        while index < len(content) and content[index] == 0xFF:
            index += 1
        if index >= len(content):
            break
        marker = content[index]
        index += 1
        if marker in (0xD8, 0xD9) or 0xD0 <= marker <= 0xD7:
            continue
        if index + 2 > len(content):
            break
        segment_length = int.from_bytes(content[index:index + 2], "big")
        if segment_length < 2 or index + segment_length > len(content):
            break
        if marker in sof_markers:
            if segment_length < 8:
                break
            height = int.from_bytes(content[index + 3:index + 5], "big")
            width = int.from_bytes(content[index + 5:index + 7], "big")
            return _validate_dimensions(width, height)
        index += segment_length
    raise ValueError("File content is not a valid JPEG image")


def _webp_dimensions(content: bytes) -> tuple[int, int]:
    if len(content) < 20 or content[:4] != b"RIFF" or content[8:12] != b"WEBP":
        raise ValueError("File content is not a valid WebP image")

    chunk_type = content[12:16]
    if chunk_type == b"VP8X":
        if len(content) < 30:
            raise ValueError("File content is not a valid WebP image")
        width = int.from_bytes(content[24:27], "little") + 1
        height = int.from_bytes(content[27:30], "little") + 1
    elif chunk_type == b"VP8 ":
        if len(content) < 30 or content[23:26] != b"\x9d\x01\x2a":
            raise ValueError("File content is not a valid WebP image")
        width = int.from_bytes(content[26:28], "little") & 0x3FFF
        height = int.from_bytes(content[28:30], "little") & 0x3FFF
    elif chunk_type == b"VP8L":
        if len(content) < 25 or content[20] != 0x2F:
            raise ValueError("File content is not a valid WebP image")
        bits = int.from_bytes(content[21:25], "little")
        width = (bits & 0x3FFF) + 1
        height = ((bits >> 14) & 0x3FFF) + 1
    else:
        raise ValueError("File content is not a supported WebP image")
    return _validate_dimensions(width, height)


def validate_image_content(
    filename: str,
    content: bytes,
    declared_mime_type: str | None = None,
) -> str:
    """Validate image signature/dimensions and return its canonical MIME type.

    The filename extension establishes the supported format expected by the
    product. The bytes must independently identify as that same format.
    """
    expected_mime = canonical_image_mime(filename)
    declared_mime = normalize_image_mime(declared_mime_type)
    if declared_mime and declared_mime != expected_mime:
        raise ValueError(
            f"Image MIME type {declared_mime} does not match file extension {get_extension(filename)}"
        )

    _validate_base64_size(content)

    if Image is None:
        raise RuntimeError("Pillow is required to validate image uploads")

    # Verify that a real decoder recognizes the complete binary payload, not
    # merely its header. Open it again after verify() because Pillow invalidates
    # the image object as part of verification.
    try:
        with Image.open(BytesIO(content)) as image:
            image.verify()
        with Image.open(BytesIO(content)) as image:
            detected_mime = {
                "PNG": "image/png",
                "JPEG": "image/jpeg",
                "WEBP": "image/webp",
            }.get(image.format)
            width, height = image.size
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError) as exc:
        raise ValueError("File content is not a valid supported image") from exc

    if detected_mime != expected_mime:
        raise ValueError(
            f"Image bytes identify as {detected_mime or 'an unsupported format'}, "
            f"not {expected_mime}"
        )
    _validate_dimensions(width, height)

    # Keep the lightweight format-specific checks as a second line of defense
    # and to retain explicit format/dimension validation without trusting MIME.
    if expected_mime == "image/png":
        _png_dimensions(content)
    elif expected_mime == "image/jpeg":
        _jpeg_dimensions(content)
    elif expected_mime == "image/webp":
        _webp_dimensions(content)
    return expected_mime


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
        # Do not trust the multipart MIME type. Validate bytes and persist a
        # canonical MIME value so the later data URL is deterministic.
        mime_type = validate_image_content(
            file.filename,
            content_bytes,
            file.content_type,
        )
        base64_img = base64.b64encode(content_bytes).decode('utf-8')
        return {
            "type": "image",
            "content": base64_img,
            "mime_type": mime_type
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
            
        elif ext == ".docx":
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
