"""Offline regression tests for text-document extraction and chat grounding."""

import asyncio
from io import BytesIO
from types import SimpleNamespace
import unittest
from unittest.mock import patch

import docx
import fitz

from backend.core.document_processor import process_document
from backend.services import chatbot


class FakeUpload:
    def __init__(self, filename: str, content_type: str, data: bytes):
        self.filename = filename
        self.content_type = content_type
        self._data = data

    async def read(self):
        return self._data

    async def seek(self, position):
        return None


def pdf_bytes(text: str) -> bytes:
    document = fitz.open()
    page = document.new_page()
    page.insert_text((72, 72), text)
    data = document.tobytes()
    document.close()
    return data


def docx_bytes(text: str) -> bytes:
    document = docx.Document()
    document.add_paragraph(text)
    buffer = BytesIO()
    document.save(buffer)
    return buffer.getvalue()


class TextDocumentProcessingTests(unittest.TestCase):
    def test_pdf_and_docx_extract_text(self):
        pdf_result = asyncio.run(
            process_document(FakeUpload("report.pdf", "application/pdf", pdf_bytes("Revenue is 125.")))
        )
        docx_result = asyncio.run(
            process_document(
                FakeUpload(
                    "report.docx",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    docx_bytes("Revenue is 125."),
                )
            )
        )
        self.assertIn("Revenue is 125", pdf_result["content"])
        self.assertIn("Revenue is 125", docx_result["content"])

    def test_txt_csv_json_markdown_and_html_extract_text(self):
        cases = [
            ("note.txt", "text/plain", b"status: approved", "approved"),
            ("table.csv", "text/csv", b"name,value\nA,12\nB,20", "B,20"),
            ("data.json", "application/json", b'{"status":"approved","total":32}', '"total": 32'),
            ("notes.md", "text/markdown", b"# Report\n\nTotal: 32", "Total: 32"),
            ("page.html", "text/html", b"<h1>Report</h1><p>Total: 32</p>", "Total: 32"),
        ]
        for filename, mime_type, data, expected in cases:
            with self.subTest(filename=filename):
                result = asyncio.run(process_document(FakeUpload(filename, mime_type, data)))
                self.assertEqual(result["type"], "text")
                self.assertIn(expected, result["content"])

    def test_legacy_doc_is_not_advertised_as_supported(self):
        with self.assertRaises(ValueError):
            asyncio.run(process_document(FakeUpload("legacy.doc", "application/msword", b"not docx")))


class TextDocumentFollowUpTests(unittest.TestCase):
    def test_follow_up_reuses_active_text_document_and_injects_source_content(self):
        initial_conversation = {
            "_id": "conversation-id",
            "title": "Existing conversation",
            "active_document_id": "document-id",
        }
        updated_conversation = {
            "_id": "conversation-id",
            "title": "Existing conversation",
            "messages": [
                {"role": "user", "content": "What is the total?"},
                {"role": "assistant", "content": "The total is 32."},
                {"role": "user", "content": "Filter to the approved row."},
            ],
        }
        document = {
            "document_id": "document-id",
            "filename": "report.csv",
            "type": "text",
            "mime_type": "text/csv",
            "content": "status,total\napproved,32\npending,10",
        }
        response = SimpleNamespace(
            choices=[SimpleNamespace(message=SimpleNamespace(content="approved,32"), finish_reason="stop")],
        )

        with (
            patch.object(chatbot, "get_conversation", side_effect=[initial_conversation, updated_conversation]),
            patch.object(chatbot, "get_document", return_value=document) as get_document,
            patch.object(chatbot, "get_user_settings", return_value={"ai": {}, "memory": {"memory_enabled": False}}),
            patch.object(chatbot, "save_message"),
            patch.object(chatbot, "update_conversation_active_document") as update_active,
            patch.object(chatbot, "detect_tool", return_value=None),
            patch.object(chatbot.client.chat.completions, "create", return_value=response) as create,
        ):
            result = chatbot.chat("user", "conversation-id", "Filter to the approved row.")

        self.assertEqual(result["response"], "approved,32")
        get_document.assert_called_once_with("document-id", user_id="user")
        update_active.assert_not_called()
        messages = create.call_args.kwargs["messages"]
        self.assertIn({"role": "assistant", "content": "The total is 32."}, messages)
        document_context = next(
            item["content"]
            for item in messages
            if item["role"] == "system" and item["content"].startswith("ACTIVE DOCUMENT CONTEXT")
        )
        self.assertIn(chatbot.TEXT_DOCUMENT_GROUNDING_INSTRUCTION, document_context)
        self.assertIn("approved,32", document_context)


if __name__ == "__main__":
    unittest.main()
