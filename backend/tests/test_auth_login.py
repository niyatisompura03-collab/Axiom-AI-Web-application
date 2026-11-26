from datetime import datetime, timedelta, timezone
import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient
from jose import jwt

from backend.main import app
from backend.core.security import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    ALGORITHM,
    SECRET_KEY,
    create_access_token,
    decode_access_token,
    hash_password,
)


class TestAuthBodySecurity(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.test_username = "auth_security_test_user"
        self.test_password = "SuperSecretTestPassword123!"
        self.password_hash = hash_password(self.test_password)

    def test_login_accepts_json_body(self):
        mock_user = {
            "username": self.test_username,
            "password_hash": self.password_hash,
        }
        with patch("backend.routes.auth.users_collection") as mock_users:
            mock_users.find_one.return_value = mock_user
            with self.assertNoLogs(level="INFO") if False else patch("logging.Logger._log") as mock_log:
                resp = self.client.post(
                    "/auth/login",
                    json={"username": self.test_username, "password": self.test_password},
                )
                self.assertEqual(resp.status_code, 200, resp.text)
                data = resp.json()
                self.assertIn("access_token", data)
                self.assertEqual(data["token_type"], "bearer")
                for call in mock_log.call_args_list:
                    self.assertNotIn(self.test_password, str(call))

    def test_login_rejects_invalid_password(self):
        mock_user = {
            "username": self.test_username,
            "password_hash": self.password_hash,
        }
        with patch("backend.routes.auth.users_collection") as mock_users:
            mock_users.find_one.return_value = mock_user
            resp = self.client.post(
                "/auth/login",
                json={"username": self.test_username, "password": "WrongPassword!"},
            )
            self.assertEqual(resp.status_code, 401)
            self.assertEqual(resp.json()["detail"], "Invalid credentials")

    def test_login_rejects_query_params_without_body(self):
        with patch("backend.routes.auth.users_collection") as mock_users:
            resp = self.client.post(
                f"/auth/login?username={self.test_username}&password={self.test_password}"
            )
            self.assertEqual(resp.status_code, 422)
            mock_users.find_one.assert_not_called()

    def test_register_requires_json_body(self):
        with patch("backend.routes.auth.users_collection") as mock_users:
            resp = self.client.post(
                f"/auth/register?username={self.test_username}&password={self.test_password}"
            )
            self.assertEqual(resp.status_code, 422)
            mock_users.find_one.assert_not_called()

    def test_reset_password_requires_json_body(self):
        with patch("backend.routes.auth.verify_reset_token") as mock_verify:
            resp = self.client.post(
                f"/auth/reset-password?token=abc&new_password={self.test_password}"
            )
            self.assertEqual(resp.status_code, 422)
            mock_verify.assert_not_called()


class TestSessionDurationAndExpiry(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.test_username = "session_expiry_test_user"

    def test_access_token_expiry_duration_is_3_hours(self):
        self.assertGreaterEqual(ACCESS_TOKEN_EXPIRE_MINUTES, 120)
        self.assertLessEqual(ACCESS_TOKEN_EXPIRE_MINUTES, 180)
        self.assertEqual(ACCESS_TOKEN_EXPIRE_MINUTES, 180)

        token = create_access_token({"sub": self.test_username})
        payload = decode_access_token(token)
        self.assertEqual(payload["sub"], self.test_username)
        self.assertIn("iat", payload)
        self.assertIn("exp", payload)
        self.assertEqual(payload["exp"] - payload["iat"], ACCESS_TOKEN_EXPIRE_MINUTES * 60)

    def test_expired_token_rejected_with_401(self):
        expired_token = jwt.encode(
            {
                "sub": self.test_username,
                "exp": datetime.now(timezone.utc) - timedelta(minutes=1),
            },
            SECRET_KEY,
            algorithm=ALGORITHM,
        )
        with patch("backend.routes.auth.users_collection") as mock_users:
            resp = self.client.get(
                "/auth/me",
                headers={"Authorization": f"Bearer {expired_token}"},
            )
            self.assertEqual(resp.status_code, 401)
            self.assertEqual(resp.json()["detail"], "Token has expired")
            mock_users.find_one.assert_not_called()

    def test_token_without_exp_rejected_with_401(self):
        token_no_exp = jwt.encode(
            {"sub": self.test_username},
            SECRET_KEY,
            algorithm=ALGORITHM,
        )
        resp = self.client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {token_no_exp}"},
        )
        self.assertEqual(resp.status_code, 401)

    def test_protected_routes_reject_expired_token(self):
        expired_token = jwt.encode(
            {
                "sub": self.test_username,
                "exp": datetime.now(timezone.utc) - timedelta(seconds=10),
            },
            SECRET_KEY,
            algorithm=ALGORITHM,
        )
        headers = {"Authorization": f"Bearer {expired_token}"}
        for path in ["/auth/me", "/conversations", "/settings", "/memories"]:
            resp = self.client.get(path, headers=headers)
            self.assertEqual(resp.status_code, 401, f"Expected 401 for {path}, got {resp.status_code}")


if __name__ == "__main__":
    unittest.main()
