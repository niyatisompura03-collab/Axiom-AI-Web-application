import os
import json
import urllib.request
import urllib.error
from dotenv import load_dotenv
import logging
import resend

load_dotenv()

logger = logging.getLogger(__name__)


def send_password_reset_email(user_email: str, reset_token: str, frontend_url: str) -> bool:
    """
    Sends a password reset email using Resend Python SDK.
    Does NOT log the reset_token, full reset URL, or API key.
    """
    resend_api_key = os.getenv("RESEND_API_KEY")
    resend_sender_email = os.getenv("RESEND_SENDER_EMAIL")
    resend_sender_name = os.getenv("RESEND_SENDER_NAME", "Axiom")

    # Safe masked recipient email for diagnostic logging
    masked_email = (user_email[0] + "***" + user_email[user_email.find("@"):]) if ("@" in user_email and len(user_email) > 1) else "***"

    logger.info("[Password Reset] Resend request starting")
    logger.info(f"[Password Reset] Sender configured: {'yes (' + resend_sender_email + ')' if resend_sender_email else 'no'}")
    logger.info(f"[Password Reset] Recipient configured: yes ({masked_email})")
    logger.info(f"[Password Reset] API Key configured: {'yes' if bool(resend_api_key) else 'no'}")

    if not resend_api_key:
        logger.error("[Password Reset] RESEND_API_KEY is not set in environment. Email delivery is disabled.")
        return False

    if not resend_sender_email:
        logger.error("[Password Reset] RESEND_SENDER_EMAIL is not set in environment. Email delivery is disabled.")
        return False

    resend.api_key = resend_api_key

    reset_link = f"{frontend_url}/reset-password?token={reset_token}"

    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #6366f1; margin-bottom: 20px;">Axiom</h2>
        <p style="font-size: 16px; color: #333;">You recently requested to reset your password for your Axiom account.</p>
        <p style="font-size: 16px; color: #333;">Click the button below to reset it:</p>
        <div style="margin: 30px 0;">
            <a href="{reset_link}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
        <p style="color: #666; font-size: 14px; word-break: break-all;">{reset_link}</p>
        <p style="color: #ef4444; font-size: 14px; margin-top: 30px;"><strong>Note:</strong> This link will expire in 15 minutes.</p>
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">If you did not request a password reset, please ignore this email. Your password will remain unchanged.</p>
    </div>
    """

    try:
        response = resend.Emails.send({
            "from": f"{resend_sender_name} <{resend_sender_email}>",
            "to": [user_email],
            "subject": "Reset your Axiom password",
            "html": html_content
        })

        # the resend SDK response is typically a dict like {"id": "..."}
        message_id = response.get("id", "N/A") if isinstance(response, dict) else str(response)

        logger.info("[Password Reset] Resend email sent successfully")
        logger.info(f"[Password Reset] Resend message ID: {message_id}")
        return True

    except Exception as e:
        logger.error(f"[Password Reset] Resend email failed: {str(e)}")
        return False

