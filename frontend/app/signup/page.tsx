"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { User, Lock } from "lucide-react";
import Link from "next/link";
import AuthCard from "@/components/AuthCard";
import AuthInput from "@/components/AuthInput";
import AuthButton from "@/components/AuthButton";
import { registerUser } from "@/lib/authApi";

export default function SignupPage() {
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
      await registerUser(username, password);
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
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-violet-400 hover:text-violet-300 font-semibold underline underline-offset-4 hover:no-underline transition-all ml-1"
          >
            Login
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-4">
          <AuthInput
            id="username"
            type="text"
            label="Username"
            icon={User}
            required
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <AuthInput
            id="password"
            type="password"
            label="Password"
            icon={Lock}
            required
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <AuthInput
            id="confirmPassword"
            type="password"
            label="Confirm Password"
            icon={Lock}
            required
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {localError && (
          <p className="text-sm text-red-400 text-center" role="alert">
            {localError}
          </p>
        )}

        <AuthButton type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </AuthButton>
      </form>
    </AuthCard>
  );
}
