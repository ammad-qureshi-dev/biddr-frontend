"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const isEmail = identifier.includes("@");
      await login(
        isEmail
          ? { email: identifier, password }
          : { phoneNumber: identifier, password },
      );
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.messages[0] : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-display text-3xl font-semibold text-ink-950">Sign in</h1>
      <p className="mt-1 font-sans text-sm text-slate-500">
        Enter the auction room. Your paddle is waiting.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <Input
          id="identifier"
          label="Email or phone number"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
        />
        <Input
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="font-sans text-sm text-ledger-red">{error}</p>}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <div className="mt-6 flex justify-between font-sans text-sm">
        <Link href="/password-reset" className="text-slate-500 hover:underline">
          Forgot password?
        </Link>
        <Link href="/register" className="text-slate-500 hover:underline">
          Create an account
        </Link>
      </div>
    </div>
  );
}
