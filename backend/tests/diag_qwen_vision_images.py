"""
TEMPORARY isolated diagnostic. Does not import or modify Document Agent production flow.

Sends tiny PNG / JPEG / WebP to qwen/qwen3.6-27b using the same Groq call shape as
backend/services/chatbot.py for image documents:
  model=qwen/qwen3.6-27b
  temperature=0.7
  max_tokens=700
  extra_body={"reasoning_format": "hidden"}
  no reasoning_effort
  no max_completion_tokens
  user content = [{type:text}, {type:image_url, url: data:{mime};base64,{payload}}]
"""
from __future__ import annotations

import base64
import json
import os
import sys
import traceback

import fitz  # PyMuPDF — already a project dependency
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

PROMPT = "Describe this image in one short sentence."
MODEL = "qwen/qwen3.6-27b"
TEMPERATURE = 0.7
MAX_TOKENS = 700
EXTRA_BODY = {"reasoning_format": "hidden"}


def make_small_image(fmt: str, size: int = 32) -> bytes:
    """Renderable 32x32 sample (Groq rejects images smaller than 2x2)."""
    doc = fitz.open()
    page = doc.new_page(width=size, height=size)
    page.draw_rect(page.rect, color=(0.85, 0.1, 0.1), fill=(0.85, 0.1, 0.1))
    page.draw_circle(fitz.Point(size / 2, size / 2), size / 4, color=(1, 1, 1), fill=(1, 1, 1))
    pix = page.get_pixmap(dpi=72)
    data = pix.tobytes(fmt)
    doc.close()
    return data


def dump_usage(usage) -> dict:
    if usage is None:
        return {"usage": None}
    data = {}
    for name in (
        "prompt_tokens",
        "completion_tokens",
        "total_tokens",
        "prompt_time",
        "completion_time",
        "total_time",
    ):
        if hasattr(usage, name):
            data[name] = getattr(usage, name)
    details = getattr(usage, "completion_tokens_details", None)
    if details is not None:
        if hasattr(details, "model_dump"):
            data["completion_tokens_details"] = details.model_dump()
        elif hasattr(details, "__dict__"):
            data["completion_tokens_details"] = {
                k: v for k, v in vars(details).items() if not k.startswith("_")
            }
        else:
            data["completion_tokens_details"] = str(details)
    prompt_details = getattr(usage, "prompt_tokens_details", None)
    if prompt_details is not None:
        if hasattr(prompt_details, "model_dump"):
            data["prompt_tokens_details"] = prompt_details.model_dump()
        else:
            data["prompt_tokens_details"] = str(prompt_details)
    try:
        data["raw"] = usage.model_dump() if hasattr(usage, "model_dump") else str(usage)
    except Exception:
        data["raw"] = str(usage)
    return data


def dump_message(message) -> dict:
    out = {
        "content": getattr(message, "content", None),
        "role": getattr(message, "role", None),
    }
    for attr in (
        "reasoning",
        "reasoning_content",
        "reasoning_tokens",
        "tool_calls",
        "refusal",
    ):
        if hasattr(message, attr):
            val = getattr(message, attr)
            if val not in (None, [], ""):
                out[attr] = val
    extra = getattr(message, "model_extra", None)
    if extra:
        out["model_extra"] = extra
    try:
        if hasattr(message, "model_dump"):
            dumped = message.model_dump()
            out["full_message_dump"] = dumped
    except Exception:
        pass
    return out


def run_case(client: Groq, label: str, raw: bytes, mime: str) -> dict:
    b64 = base64.b64encode(raw).decode("ascii")
    data_url_prefix = f"data:{mime};base64,"
    result = {
        "label": label,
        "mime_type": mime,
        "raw_bytes": len(raw),
        "base64_chars": len(b64),
        "data_url_chars": len(data_url_prefix) + len(b64),
        "model": MODEL,
        "temperature": TEMPERATURE,
        "max_tokens": MAX_TOKENS,
        "max_completion_tokens": None,
        "reasoning_format": EXTRA_BODY.get("reasoning_format"),
        "reasoning_effort": None,
        "success": False,
    }
    print("=" * 72)
    print(f"CASE: {label}")
    print(f"  MIME: {mime}")
    print(f"  raw bytes: {len(raw)}  base64 chars: {len(b64)}  data URL chars: {len(data_url_prefix)+len(b64)}")
    print(f"  model={MODEL} temperature={TEMPERATURE} max_tokens={MAX_TOKENS}")
    print(f"  extra_body={EXTRA_BODY}  reasoning_effort=<not sent>")
    print(f"  data URL prefix: {data_url_prefix}...")

    messages = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": PROMPT},
                {
                    "type": "image_url",
                    "image_url": {"url": f"{data_url_prefix}{b64}"},
                },
            ],
        }
    ]

    try:
        response = client.chat.completions.create(
            model=MODEL,
            temperature=TEMPERATURE,
            max_tokens=MAX_TOKENS,
            messages=messages,
            extra_body=EXTRA_BODY,
        )
        choice = response.choices[0]
        finish = getattr(choice, "finish_reason", None)
        msg = dump_message(choice.message)
        usage = dump_usage(getattr(response, "usage", None))
        content = msg.get("content")
        axiom_would_apologize = not content
        result.update(
            {
                "success": True,
                "http_or_sdk": "ok",
                "finish_reason": finish,
                "message": msg,
                "usage": usage,
                "axiom_empty_content_guard_would_fire": axiom_would_apologize,
            }
        )
        print(f"  API: SUCCESS")
        print(f"  finish_reason: {finish}")
        print(f"  content type={type(content).__name__} repr={repr(content)[:400] if content is not None else content}")
        print(f"  axiom empty-content guard would fire: {axiom_would_apologize}")
        print(f"  usage: {json.dumps(usage, default=str)[:2000]}")
        extra_keys = {k: v for k, v in msg.items() if k not in ("content", "role", "full_message_dump")}
        if extra_keys:
            print(f"  other message fields: {json.dumps(extra_keys, default=str)[:1500]}")
        dumped = msg.get("full_message_dump")
        if dumped:
            print(f"  full message dump keys: {list(dumped.keys())}")
    except Exception as e:
        result.update(
            {
                "success": False,
                "http_or_sdk": "failed",
                "exception_type": type(e).__name__,
                "exception": str(e),
                "traceback": traceback.format_exc(),
            }
        )
        print(f"  API: FAILED  {type(e).__name__}: {e}")
        print(result["traceback"])
    return result


def main() -> int:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("GROQ_API_KEY is not set. Cannot run diagnostic.")
        return 2

    client = Groq(api_key=api_key)
    cases = []

    png = make_small_image("png")
    jpeg = make_small_image("jpeg")
    try:
        webp = make_small_image("webp")
    except Exception as e:
        print(f"WebP generation failed ({type(e).__name__}: {e}); skipping WebP case")
        webp = None

    cases.append(run_case(client, "small-png", png, "image/png"))
    cases.append(run_case(client, "small-jpeg", jpeg, "image/jpeg"))
    if webp:
        cases.append(run_case(client, "small-webp", webp, "image/webp"))

    # Extra MIME probe for .jpg-style label (frontend optimistic mime), not used by processor.
    cases.append(run_case(client, "small-jpeg-mime-image/jpg", jpeg, "image/jpg"))

    print("\n" + "=" * 72)
    print("SUMMARY")
    for c in cases:
        content = None
        if c.get("success"):
            content = (c.get("message") or {}).get("content")
        print(
            f"- {c['label']}: success={c.get('success')} mime={c.get('mime_type')} "
            f"bytes={c.get('raw_bytes')} finish={c.get('finish_reason')} "
            f"empty_guard={c.get('axiom_empty_content_guard_would_fire')} "
            f"content={repr(content)[:80] if content is not None else ('EXC: '+c.get('exception','')[:80] if not c.get('success') else None)}"
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
