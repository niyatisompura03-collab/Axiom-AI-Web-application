"use client";

import React, { useState } from "react";
import { Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import AuthCard from "@/components/AuthCard";
import AuthInput from "@/components/AuthInput";
import AuthButton from "@/components/AuthButton";
import { forgotPassword } from "@/lib/authApi";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setLoading(true);
    
    try {
      const response = await forgotPassword(email);
      // Backend returns a generic success message to prevent enumeration
      setStatusMsg({ type: 'success', text: response.message || "Reset link sent." });
    } catch (err: any) {
      console.error("Forgot password failed:", err);
      // We still show generic success even on some errors to prevent enumeration,
      // but actual network errors might need to be shown.
      setStatusMsg({ type: 'error', text: err?.message || "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      footer={
        <Link
          href="/login"
          className="flex items-center gap-2 text-violet-400 hover:text-violet-300 font-semibold transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Login
        </Link>
      }
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-2">Reset Password</h2>
        <p className="text-sm text-white/70">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-4">
          <AuthInput
            id="email"
            type="email"
            label="Email"
            icon={Mail}
            required
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (statusMsg) setStatusMsg(null);
            }}
            disabled={loading}
          />
        </div>

        {statusMsg && (
          <p 
            className={`text-sm text-center ${statusMsg.type === 'error' ? 'text-red-400' : 'text-green-400'}`} 
            role="alert"
          >
            {statusMsg.text}
          </p>
        )}

        <AuthButton type="submit" disabled={loading}>
          {loading ? "Sending link..." : "Send reset link"}
        </AuthButton>
      </form>
    </AuthCard>
  );
}
