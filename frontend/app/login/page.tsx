"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Lock } from "lucide-react";
import Link from "next/link";
import AuthCard from "@/components/AuthCard";
import AuthInput from "@/components/AuthInput";
import AuthButton from "@/components/AuthButton";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const router = useRouter();
  const { login, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    try {
      await login(username, password);
      router.push("/");
    } catch (err: any) {
      console.error("Login failed:", err);
      setLocalError(err?.message || "Login failed");
    }
  };

  return (
    <AuthCard
      footer={
        <>
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="text-violet-400 hover:text-violet-300 font-semibold underline underline-offset-4 hover:no-underline transition-all ml-1"
          >
            Create account
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
        </div>

        {localError && (
          <p className="text-sm text-red-400 text-center" role="alert">
            {localError}
          </p>
        )}

        <AuthButton type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </AuthButton>
      </form>
    </AuthCard>
  );
}

