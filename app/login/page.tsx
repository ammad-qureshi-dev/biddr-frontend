"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { safeNextPath } from "@/lib/next-url";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const next = safeNextPath(useSearchParams().get("next")) ?? "/";
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
      router.push(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.messages[0] : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-fg">
        Welcome <span className="font-serif text-[1.15em] font-normal italic">back</span>
      </h1>
      <p className="mt-1 text-sm text-muted">Enter the auction room. Your paddle is waiting.</p>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <Input
          id="identifier"
          label="Email or phone number"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
        />
        <div className="flex flex-col gap-1.5">
          <Input
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Link href="/password/reset" className="self-end text-[13px] text-muted hover:text-fg">
            Forgot password?
          </Link>
        </div>
        {error && <p className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{error}</p>}
        <Button type="submit" icon={LogIn} disabled={submitting} className="mt-1">
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="mt-6 border-t border-line pt-5 text-center text-sm text-muted">
        New to Bidder?{" "}
        <Link href="/register" className="font-medium text-fg hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
