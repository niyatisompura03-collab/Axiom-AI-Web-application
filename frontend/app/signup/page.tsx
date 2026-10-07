"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { User, Lock, Mail } from "lucide-react";
import Link from "next/link";
import AuthCard from "@/components/AuthCard";
import AuthInput from "@/components/AuthInput";
import AuthButton from "@/components/AuthButton";
import { registerUser } from "@/lib/authApi";

export default function SignupPage() {
  const handleGoogleLogin = () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    window.location.href = `${API_URL}/auth/google/login`;
  };

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await registerUser(username, password, email);
      // Auto-login the newly created user
      await login(username, password);
      router.push('/');
    } catch (err: any) {
      console.error("Signup failed:", err);
      setLocalError(err?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="Get started with your intelligent assistant"
      footer={
        <p className="text-xs text-text-secondary">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-accent hover:underline font-medium ml-1 transition-colors"
          >
            Login
          </Link>
        </p>
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
            placeholder="Enter your email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (localError) setLocalError(null);
            }}
            disabled={loading}
          />

          <AuthInput
            id="username"
            type="text"
            label="Username"
            icon={User}
            required
            placeholder="Enter your username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (localError) setLocalError(null);
            }}
            disabled={loading}
          />

          <AuthInput
            id="password"
            type="password"
            label="Password"
            icon={Lock}
            required
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (localError) setLocalError(null);
            }}
            disabled={loading}
          />

          <AuthInput
            id="confirmPassword"
            type="password"
            label="Confirm Password"
            icon={Lock}
            required
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (localError) setLocalError(null);
            }}
            disabled={loading}
          />
        </div>

        {localError && (
          <div className="p-3 rounded-xl bg-error/10 border border-error/20 flex items-center justify-center text-center text-xs text-error font-medium" role="alert">
            {localError}
          </div>
        )}

        <AuthButton type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create Account"}
        </AuthButton>
        
        <div className="flex items-center gap-3 my-1">
          <div className="h-px bg-border flex-1"></div>
          <span className="text-[11px] text-text-muted uppercase font-medium tracking-wider">Or</span>
          <div className="h-px bg-border flex-1"></div>
        </div>
        
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full h-11 flex items-center justify-center gap-3 bg-surface hover:bg-surface-secondary text-text-primary rounded-xl transition-all duration-200 border border-border hover:border-text-muted/30 text-sm font-medium active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-elevation"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="18px" height="18px">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
          </svg>
          Continue with Google
        </button>
      </form>
    </AuthCard>
  );
}
