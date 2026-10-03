"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

const PASSWORD_HINT =
  "8+ characters, with an uppercase letter, lowercase letter, number, and special character.";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email && !phoneNumber) {
      setError("Provide an email or phone number.");
      return;
    }
    setSubmitting(true);
    try {
      await register({
        fullName,
        email: email || undefined,
        phoneNumber: phoneNumber || undefined,
        password,
      });
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.messages[0] : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-display text-3xl font-semibold text-ink-950">Register</h1>
      <p className="mt-1 font-sans text-sm text-slate-500">
        Create an account to bid and list auctions.
      </p>
      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <Input
          id="fullName"
          label="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <Input
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          hint="Email or phone is required — you can provide both."
        />
        <Input
          id="phoneNumber"
          label="Phone number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
        <Input
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint={PASSWORD_HINT}
          required
        />
        {error && <p className="font-sans text-sm text-ledger-red">{error}</p>}
        <Button type="submit" icon={UserPlus} disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="mt-6 font-sans text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
