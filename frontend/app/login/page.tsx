"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";
import { Icon } from "@/components/FigmaIcons";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, loading } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleGoogleLogin = () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    window.location.href = `${API_URL}/auth/google/login`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    try {
      await login(username, password);
      router.push("/");
    } catch (err: any) {
      console.error("Login failed:", err);
      setLocalError(err?.message || "Invalid username or password");
    }
  };

  return (
    <AuthLayout
      title="Good to have you back."
      description="Pick up your thoughts right where you left them."
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        {localError && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              color: "#ef4444",
              fontSize: "13px",
              textAlign: "center",
            }}
          >
            {localError}
          </div>
        )}

        <label>
          Email or username
          <input
            type="text"
            placeholder="Enter your email or username"
            autoComplete="username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (localError) setLocalError(null);
            }}
            required
            disabled={loading}
          />
        </label>

        <label>
          <span className="password-label">
            Password
            <Link
              href="/forgot-password"
              style={{
                background: "none",
                border: "none",
                color: "white",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Forgot password?
            </Link>
          </span>
          <span className="password-input">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (localError) setLocalError(null);
              }}
              required
              disabled={loading}
            />
            <button
              type="button"
              className="icon-button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword(!showPassword)}
            >
              <Icon name="eye" size={17} />
            </button>
          </span>
        </label>

        <button className="auth-submit" type="submit" disabled={loading}>
          <span>{loading ? "Signing in..." : "Log in"}</span>
          <Icon name="arrowLeft" size={17} />
        </button>
      </form>

      <div className="auth-divider">
        <span />
        or continue with
        <span />
      </div>

      <button
        type="button"
        className="google-button"
        onClick={handleGoogleLogin}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M21.8 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.3c1.9-1.8 3-4.3 3-7.6Z"
            fill="#4285F4"
          />
          <path
            d="M12 22c2.7 0 5-.9 6.8-2.4l-3.3-2.6c-.9.6-2.1 1-3.5 1a6 6 0 0 1-5.7-4.2H2.9v2.7A10.2 10.2 0 0 0 12 22Z"
            fill="#34A853"
          />
          <path
            d="M6.3 13.8a6 6 0 0 1 0-3.6V7.5H2.9a10 10 0 0 0 0 9l3.4-2.7Z"
            fill="#FBBC05"
          />
          <path
            d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.7 9.7 0 0 0 12 2a10.2 10.2 0 0 0-9.1 5.5l3.4 2.7A6 6 0 0 1 12 6Z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </button>

      <p className="auth-switch">
        New to Axiom?{" "}
        <Link href="/signup" style={{ color: "white" }} className="hover:underline">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
