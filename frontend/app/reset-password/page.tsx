"use client";

import React, { useState, Suspense } from "react";
import { Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthCard from "@/components/AuthCard";
import AuthInput from "@/components/AuthInput";
import AuthButton from "@/components/AuthButton";
import { resetPassword } from "@/lib/authApi";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-4 py-8">
        <p className="text-red-400 font-medium">Invalid or missing reset token.</p>
        <Link href="/forgot-password" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
          Request a new link
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    
    if (password !== confirmPassword) {
      setStatusMsg({ type: 'error', text: "Passwords do not match." });
      return;
    }

    if (password.length < 6) {
      setStatusMsg({ type: 'error', text: "Password must be at least 6 characters." });
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setStatusMsg({ type: 'success', text: "Password has been successfully reset. Redirecting..." });
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      console.error("Password reset failed:", err);
      setStatusMsg({ type: 'error', text: err?.message || "Invalid or expired token." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Create New Password</h2>
        <p className="text-sm text-white/70">
          Please enter your new password below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-4">
          <AuthInput
            id="password"
            type="password"
            label="New Password"
            icon={Lock}
            required
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading || statusMsg?.type === 'success'}
          />
          <AuthInput
            id="confirmPassword"
            type="password"
            label="Confirm New Password"
            icon={Lock}
            required
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading || statusMsg?.type === 'success'}
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

        <AuthButton type="submit" disabled={loading || statusMsg?.type === 'success'}>
          {loading ? "Resetting..." : "Reset Password"}
        </AuthButton>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
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
      <Suspense fallback={<div className="text-center text-white/50">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
