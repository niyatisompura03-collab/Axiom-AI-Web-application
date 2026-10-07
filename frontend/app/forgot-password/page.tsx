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
      title="Reset Password"
      subtitle="Enter your email address and we'll send you a link to reset your password"
      footer={
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-accent hover:underline font-medium transition-colors"
        >
          <ArrowLeft size={14} />
          Back to login
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-3.5">
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
          <div 
            className={`p-3 rounded-xl border flex items-center justify-center text-center text-xs font-medium ${
              statusMsg.type === 'error' 
                ? 'bg-error/10 border-error/20 text-error' 
                : 'bg-success/10 border-success/20 text-success'
            }`} 
            role="alert"
          >
            {statusMsg.text}
          </div>
        )}

        <AuthButton type="submit" disabled={loading}>
          {loading ? "Sending link..." : "Send Reset Link"}
        </AuthButton>
      </form>
    </AuthCard>
  );
}
