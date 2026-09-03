import sys
sys.path.insert(0, '.')

import asyncio
import fitz
import base64

from backend.core.document_processor import (
    SUPPORTED_EXTENSIONS, SUPPORTED_IMAGE_EXTENSIONS,
    SUPPORTED_TEXT_EXTENSIONS, get_extension, process_document
)

print("=== Document Processor Tests ===")
print("SUPPORTED_TEXT_EXTENSIONS:", SUPPORTED_TEXT_EXTENSIONS)
print("SUPPORTED_IMAGE_EXTENSIONS:", SUPPORTED_IMAGE_EXTENSIONS)
print("get_extension('report.pdf'):", get_extension('report.pdf'))
print("Total extensions:", len(SUPPORTED_EXTENSIONS))
print()

# --- PDF Extraction Test ---
doc = fitz.open()
page = doc.new_page()
page.insert_text((72, 72), 'Codename: Omega. Budget: 500000. Launch: 2027.')
pdf_bytes = doc.tobytes()
doc.close()

class FakePDFUpload:
    filename = 'test.pdf'
    content_type = 'application/pdf'
    _data = pdf_bytes
    async def read(self): return self._data
    async def seek(self, pos): pass

async def test_pdf():
    result = await process_document(FakePDFUpload())
    assert result['type'] == 'text', "Expected type=text"
    assert 'Omega' in result['content'], "Expected 'Omega' in content"
    print("PDF extraction: PASS")
    print("  Snippet:", result['content'][:80])

asyncio.run(test_pdf())

# --- TXT Extraction Test ---
class FakeTxtUpload:
    filename = 'test.txt'
    content_type = 'text/plain'
    _data = b'Project: Alpha. Revenue: $1M'
    async def read(self): return self._data
    async def seek(self, pos): pass

async def test_txt():
    result = await process_document(FakeTxtUpload())
    assert result['type'] == 'text', "Expected type=text"
    assert 'Alpha' in result['content'], "Expected 'Alpha' in content"
    print("TXT extraction: PASS")

asyncio.run(test_txt())

# --- CSV Extraction Test ---
class FakeCSVUpload:
    filename = 'data.csv'
    content_type = 'text/csv'
    _data = b'name,age\nJohn,30\nJane,25'
    async def read(self): return self._data
    async def seek(self, pos): pass

async def test_csv():
    result = await process_document(FakeCSVUpload())
    assert result['type'] == 'text', "Expected type=text"
    assert 'John' in result['content']
    print("CSV extraction: PASS")

asyncio.run(test_csv())

# --- JSON Extraction Test ---
class FakeJSONUpload:
    filename = 'data.json'
    content_type = 'application/json'
    _data = b'{"name":"Axiom","version":2}'
    async def read(self): return self._data
    async def seek(self, pos): pass

async def test_json():
    result = await process_document(FakeJSONUpload())
    assert result['type'] == 'text', "Expected type=text"
    assert 'Axiom' in result['content']
    print("JSON extraction: PASS")

asyncio.run(test_json())

# --- Image Encoding Test ---
# Create a tiny 1x1 PNG in memory
import struct, zlib

def make_tiny_png():
    def make_chunk(chunk_type, data):
        c = chunk_type + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    
    png_sig = b'\x89PNG\r\n\x1a\n'
    ihdr = make_chunk(b'IHDR', struct.pack('>IIBBBBB', 1, 1, 8, 2, 0, 0, 0))
    idat = make_chunk(b'IDAT', zlib.compress(b'\x00\xff\x00\x00'))
    iend = make_chunk(b'IEND', b'')
    return png_sig + ihdr + idat + iend

png_bytes = make_tiny_png()

class FakePNGUpload:
    filename = 'test.png'
    content_type = 'image/png'
    _data = png_bytes
    async def read(self): return self._data
    async def seek(self, pos): pass

async def test_image():
    result = await process_document(FakePNGUpload())
    assert result['type'] == 'image', "Expected type=image"
    decoded = base64.b64decode(result['content'])
    assert decoded == png_bytes, "Image bytes should round-trip"
    print("PNG image encoding: PASS")

asyncio.run(test_image())

# --- Unsupported extension Test ---
class FakeExeUpload:
    filename = 'bad.exe'
    content_type = 'application/octet-stream'
    _data = b'MZ...'
    async def read(self): return self._data
    async def seek(self, pos): pass

async def test_unsupported():
    try:
        result = await process_document(FakeExeUpload())
        print("Unsupported extension: FAIL (should have raised)")
    except ValueError as e:
        print("Unsupported extension rejection: PASS -", str(e))

asyncio.run(test_unsupported())

print()
print("=== All document processor tests passed ===")
