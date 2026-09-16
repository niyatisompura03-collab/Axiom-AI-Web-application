"""Offline regression tests for Document Agent image handling.

These tests mock Groq and exercise no MongoDB, network, or live model calls.
"""

import asyncio
import base64
from io import BytesIO
from types import SimpleNamespace
import unittest
from unittest.mock import patch

from PIL import Image

from backend.core.document_processor import (
    canonical_image_mime,
    process_document,
    validate_image_content,
)
from backend.services import chatbot


def image_bytes(image_format: str) -> bytes:
    buffer = BytesIO()
    Image.new("RGB", (16, 12), color=(25, 50, 75)).save(buffer, format=image_format)
    return buffer.getvalue()


class FakeUpload:
    def __init__(self, filename: str, content_type: str | None, data: bytes):
        self.filename = filename
        self.content_type = content_type
        self._data = data

    async def read(self):
        return self._data

    async def seek(self, position):
        return None


class DocumentImageValidationTests(unittest.TestCase):
    def test_png_is_validated_and_normalized(self):
        result = asyncio.run(process_document(FakeUpload("image.png", "image/png", image_bytes("PNG"))))
        self.assertEqual(result["type"], "image")
        self.assertEqual(result["mime_type"], "image/png")

    def test_jpg_and_jpeg_are_normalized_to_image_jpeg(self):
        jpeg = image_bytes("JPEG")
        jpg_result = asyncio.run(process_document(FakeUpload("photo.jpg", "image/jpg", jpeg)))
        jpeg_result = asyncio.run(process_document(FakeUpload("photo.jpeg", "image/jpeg", jpeg)))
        self.assertEqual(jpg_result["mime_type"], "image/jpeg")
        self.assertEqual(jpeg_result["mime_type"], "image/jpeg")
        self.assertEqual(canonical_image_mime("photo.jpg"), "image/jpeg")

    def test_webp_is_validated_and_normalized(self):
        result = asyncio.run(process_document(FakeUpload("image.webp", "image/webp", image_bytes("WEBP"))))
        self.assertEqual(result["mime_type"], "image/webp")

    def test_rejects_extension_mime_and_byte_mismatches(self):
        png = image_bytes("PNG")
        jpeg = image_bytes("JPEG")
        with self.assertRaises(ValueError):
            validate_image_content("image.png", jpeg, "image/png")
        with self.assertRaises(ValueError):
            validate_image_content("image.png", png, "image/jpeg")

    def test_rejects_invalid_image_bytes(self):
        with self.assertRaises(ValueError):
            validate_image_content("image.webp", b"not an image", "image/webp")

    def test_rejects_payloads_larger_than_the_base64_transport_limit(self):
        with patch("backend.core.document_processor.MAX_IMAGE_BASE64_BYTES", 8):
            with self.assertRaises(ValueError):
                validate_image_content("image.png", image_bytes("PNG"), "image/png")


class QwenImageCompletionTests(unittest.TestCase):
    def setUp(self):
        self.messages = [{"role": "user", "content": "What is shown?"}]

    def test_canonical_data_url_and_multimodal_payload(self):
        encoded = base64.b64encode(image_bytes("PNG")).decode("ascii")
        # Stored MIME deliberately represents a legacy/bad record. The bytes
        # remain authoritative for the final canonical request data URL.
        data_url = chatbot._image_document_data_url(
            {"filename": "diagram.png", "mime_type": "application/octet-stream", "content": encoded}
        )
        self.assertTrue(data_url.startswith("data:image/png;base64,"))
        messages = [{"role": "system", "content": "system"}, {"role": "user", "content": "Describe it"}]
        chatbot._attach_image_to_latest_user_message(messages, data_url)
        self.assertIn("Describe it", messages[-1]["content"][0]["text"])
        self.assertIn("same active image document", messages[-1]["content"][0]["text"])
        self.assertEqual(messages[-1]["content"][1]["image_url"]["url"], data_url)

    def test_success_uses_qwen_vision_configuration(self):
        response = SimpleNamespace(
            choices=[SimpleNamespace(message=SimpleNamespace(content="A blue rectangle.", refusal=None, reasoning=None), finish_reason="stop")],
            usage=SimpleNamespace(prompt_tokens=10, completion_tokens=4, total_tokens=14),
        )
        with patch.object(chatbot.client.chat.completions, "create", return_value=response) as create:
            reply = chatbot._qwen_image_completion(self.messages)
        self.assertEqual(reply, "A blue rectangle.")
        kwargs = create.call_args.kwargs
        self.assertEqual(kwargs["model"], "qwen/qwen3.6-27b")
        self.assertEqual(kwargs["max_completion_tokens"], 700)
        self.assertEqual(kwargs["reasoning_effort"], "none")
        self.assertEqual(kwargs["reasoning_format"], "hidden")
        self.assertNotIn("max_tokens", kwargs)

    def test_empty_model_content_returns_safe_image_error(self):
        response = SimpleNamespace(
            choices=[SimpleNamespace(message=SimpleNamespace(content=None, refusal=None, reasoning="hidden reasoning"), finish_reason="stop")],
            usage=None,
        )
        with patch.object(chatbot.client.chat.completions, "create", return_value=response):
            reply = chatbot._qwen_image_completion(self.messages)
        self.assertEqual(reply, chatbot.IMAGE_EMPTY_RESPONSE_REPLY)

    def test_length_finish_reason_returns_specific_error(self):
        response = SimpleNamespace(
            choices=[SimpleNamespace(message=SimpleNamespace(content="", refusal=None, reasoning=None), finish_reason="length")],
            usage=None,
        )
        with patch.object(chatbot.client.chat.completions, "create", return_value=response):
            reply = chatbot._qwen_image_completion(self.messages)
        self.assertEqual(reply, chatbot.IMAGE_LENGTH_RESPONSE_REPLY)

    def test_groq_exception_returns_safe_image_error(self):
        with patch.object(chatbot.client.chat.completions, "create", side_effect=RuntimeError("provider unavailable")):
            reply = chatbot._qwen_image_completion(self.messages)
        self.assertEqual(reply, chatbot.IMAGE_UPSTREAM_ERROR_REPLY)

    def test_memory_failure_is_isolated_for_image_analysis(self):
        with patch.object(chatbot, "extract_memory", side_effect=RuntimeError("memory provider unavailable")):
            result = chatbot._memory_enrichment("user", "What is in this image?", True, True)
        self.assertEqual(result, [])

    def test_image_chat_reaches_qwen_when_memory_enrichment_fails(self):
        encoded = base64.b64encode(image_bytes("PNG")).decode("ascii")
        initial_conversation = {"_id": "conversation-id", "title": "Existing conversation"}
        updated_conversation = {
            "_id": "conversation-id",
            "title": "Existing conversation",
            "messages": [{"role": "user", "content": "What is in this image?"}],
        }
        document = {
            "document_id": "document-id",
            "filename": "image.png",
            "type": "image",
            "mime_type": "image/png",
            "content": encoded,
        }
        response = SimpleNamespace(
            choices=[SimpleNamespace(message=SimpleNamespace(content="It is a blue rectangle.", refusal=None, reasoning=None), finish_reason="stop")],
            usage=None,
        )

        with (
            patch.object(chatbot, "get_conversation", side_effect=[initial_conversation, updated_conversation]),
            patch.object(chatbot, "get_document", return_value=document),
            patch.object(chatbot, "get_user_settings", return_value={"ai": {}, "memory": {"memory_enabled": True}}),
            patch.object(chatbot, "save_message"),
            patch.object(chatbot, "update_conversation_active_document"),
            patch.object(chatbot, "extract_memory", side_effect=RuntimeError("memory provider unavailable")),
            patch.object(chatbot, "detect_tool", return_value=None),
            patch.object(chatbot.client.chat.completions, "create", return_value=response) as create,
        ):
            result = chatbot.chat("user", "conversation-id", "What is in this image?", document_id="document-id")

        self.assertEqual(result["response"], "It is a blue rectangle.")
        self.assertEqual(create.call_args.kwargs["model"], chatbot.QWEN_IMAGE_MODEL)

    def test_follow_up_reuses_active_image_and_prior_image_conversation(self):
        encoded = base64.b64encode(image_bytes("PNG")).decode("ascii")
        initial_conversation = {
            "_id": "conversation-id",
            "title": "Existing conversation",
            "active_document_id": "document-id",
        }
        updated_conversation = {
            "_id": "conversation-id",
            "title": "Existing conversation",
            "messages": [
                {"role": "user", "content": "Who are these characters?"},
                {"role": "assistant", "content": "They are BTS × LINE FRIENDS characters."},
                {"role": "user", "content": "Are these characters from the same collaboration?"},
            ],
        }
        document = {
            "document_id": "document-id",
            "filename": "image.png",
            "type": "image",
            "mime_type": "image/png",
            "content": encoded,
        }
        response = SimpleNamespace(
            choices=[SimpleNamespace(message=SimpleNamespace(content="Yes.", refusal=None, reasoning=None), finish_reason="stop")],
            usage=None,
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
            result = chatbot.chat(
                "user",
                "conversation-id",
                "Are these characters from the same collaboration?",
            )

        self.assertEqual(result["response"], "Yes.")
        get_document.assert_called_once_with("document-id", user_id="user")
        update_active.assert_not_called()
        messages = create.call_args.kwargs["messages"]
        self.assertIn(
            {"role": "assistant", "content": "They are BTS × LINE FRIENDS characters."},
            messages,
        )
        latest_content = messages[-1]["content"]
        self.assertIn("same active image document", latest_content[0]["text"])
        self.assertTrue(latest_content[1]["image_url"]["url"].startswith("data:image/png;base64,"))


if __name__ == "__main__":
    unittest.main()
