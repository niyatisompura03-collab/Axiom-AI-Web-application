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
      <div className="flex flex-col items-center justify-center text-center gap-3 py-2">
        <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-xs text-error font-medium w-full text-center" role="alert">
          Invalid or missing reset token.
        </div>
        <Link href="/forgot-password" className="text-xs text-accent hover:underline font-medium transition-colors">
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-3.5">
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

      <AuthButton type="submit" disabled={loading || statusMsg?.type === 'success'}>
        {loading ? "Resetting..." : "Reset Password"}
      </AuthButton>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Create New Password"
      subtitle="Please enter your new password below"
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
      <Suspense fallback={<div className="text-center text-text-muted text-xs py-4">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
