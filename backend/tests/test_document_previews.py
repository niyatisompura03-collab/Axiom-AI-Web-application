"""Tests for document preview endpoint used when reopening conversations."""

import base64
from io import BytesIO
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
from PIL import Image

from backend.core.security import create_access_token
from backend.main import app


def _png_base64() -> str:
    buf = BytesIO()
    Image.new("RGB", (8, 8), color=(10, 20, 30)).save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("ascii")


class TestDocumentPreviewEndpoint(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.token = create_access_token({"sub": "preview_test_user"})
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def test_get_image_document_returns_content_for_owner(self):
        encoded = _png_base64()
        stored_doc = {
            "document_id": "doc-img-1",
            "user_id": "preview_test_user",
            "filename": "diagram.png",
            "type": "image",
            "mime_type": "image/png",
            "content": encoded,
        }
        with patch("backend.routes.documents.get_document", return_value=stored_doc) as mock_get:
            res = self.client.get("/documents/doc-img-1", headers=self.headers)

        self.assertEqual(res.status_code, 200)
        mock_get.assert_called_once_with("doc-img-1", user_id="preview_test_user")
        body = res.json()
        self.assertEqual(body["document_id"], "doc-img-1")
        self.assertEqual(body["filename"], "diagram.png")
        self.assertEqual(body["type"], "image")
        self.assertEqual(body["mime_type"], "image/png")
        self.assertEqual(body["content"], encoded)

    def test_get_text_document_omits_text_content(self):
        stored_doc = {
            "document_id": "doc-txt-1",
            "user_id": "preview_test_user",
            "filename": "notes.pdf",
            "type": "text",
            "mime_type": "application/pdf",
            "content": "Extracted large PDF text...",
        }
        with patch("backend.routes.documents.get_document", return_value=stored_doc):
            res = self.client.get("/documents/doc-txt-1", headers=self.headers)

        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertEqual(body["filename"], "notes.pdf")
        self.assertEqual(body["type"], "text")
        self.assertEqual(body["mime_type"], "application/pdf")
        self.assertNotIn("content", body)

    def test_get_document_requires_auth(self):
        res = self.client.get("/documents/doc-img-1")
        self.assertEqual(res.status_code, 401)

    def test_get_missing_document_returns_404(self):
        with patch("backend.routes.documents.get_document", return_value=None):
            res = self.client.get("/documents/missing-id", headers=self.headers)
        self.assertEqual(res.status_code, 404)


if __name__ == "__main__":
    unittest.main()
