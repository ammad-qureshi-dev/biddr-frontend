"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { authApi, ApiError } from "@/lib/api";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

function RequestLinkForm() {
  const [contact, setContact] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authApi.sendPasswordResetLink(contact);
    } catch {
      // Deliberately shown the same way as success — don't reveal whether the contact matched an account.
    } finally {
      setSent(true);
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <p className="mt-8 font-sans text-sm text-slate-500">
        If that email or phone number matches an account, a reset link is on its way.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
      <Input
        id="contact"
        label="Email or phone number"
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        required
      />
      {error && <p className="font-sans text-sm text-ledger-red">{error}</p>}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}

function SetNewPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authApi.setNewPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.messages[0] : "This link may have expired.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="mt-8 flex flex-col gap-3">
        <p className="font-sans text-sm text-ledger-green">Your password was updated.</p>
        <Link href="/login">
          <Button>Sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
      <Input
        id="password"
        label="New password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        hint="8+ characters, with an uppercase letter, lowercase letter, number, and special character."
        required
      />
      {error && <p className="font-sans text-sm text-ledger-red">{error}</p>}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Updating…" : "Set new password"}
      </Button>
    </form>
  );
}

function PasswordResetContent() {
  const token = useSearchParams().get("token");
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-display text-3xl font-semibold text-ink-950">
        {token ? "Set a new password" : "Reset your password"}
      </h1>
      <p className="mt-1 font-sans text-sm text-slate-500">
        {token
          ? "Choose a new password for your account."
          : "We'll send a reset link to your email or phone."}
      </p>
      {token ? <SetNewPasswordForm token={token} /> : <RequestLinkForm />}
    </div>
  );
}

export default function PasswordResetPage() {
  return (
    <Suspense fallback={null}>
      <PasswordResetContent />
    </Suspense>
  );
}
