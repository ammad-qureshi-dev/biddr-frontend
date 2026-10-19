"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Send, KeyRound, LogIn, ArrowLeft } from "lucide-react";
import { authApi, ApiError } from "@/lib/api";
import { Input } from "../../components/ui/Input";
import { PasswordInput } from "../../components/ui/PasswordInput";
import { Button, LinkButton } from "../../components/ui/Button";

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
      <p className="mt-6 rounded-xl bg-subtle p-4 text-sm text-muted">
        If that email or phone number matches an account, a reset link is on its way.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
      <Input
        id="contact"
        label="Email or phone number"
        value={contact}
        onChange={(e) => setContact(e.target.value)}
        required
      />
      {error && <p className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{error}</p>}
      <Button type="submit" icon={Send} disabled={submitting}>
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
      <div className="mt-6 flex flex-col gap-4">
        <p className="rounded-xl bg-success-soft p-4 text-sm text-success">Your password was updated.</p>
        <LinkButton href="/login" icon={LogIn}>
          Sign in
        </LinkButton>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
      <PasswordInput
        id="password"
        label="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        hint="8+ characters, with an uppercase letter, lowercase letter, number, and special character."
        required
      />
      {error && <p className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">{error}</p>}
      <Button type="submit" icon={KeyRound} disabled={submitting}>
        {submitting ? "Updating…" : "Set new password"}
      </Button>
    </form>
  );
}

function PasswordResetContent() {
  const token = useSearchParams().get("token");
  return (
    <div>
      <h1 className="text-2xl font-semibold text-fg">
        {token ? "Set a new password" : "Reset your password"}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {token
          ? "Choose a new password for your account."
          : "We'll send a reset link to your email or phone."}
      </p>
      {token ? <SetNewPasswordForm token={token} /> : <RequestLinkForm />}
      <Link
        href="/login"
        className="mt-6 flex items-center justify-center gap-1.5 border-t border-line pt-5 text-sm text-muted hover:text-fg"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to sign in
      </Link>
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
