"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { appUserApi, authApi, ApiError } from "@/lib/api";
import type { ContactType, PreferredContactMethod } from "@/lib/types";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";

const NOT_APPLICABLE = "N/A";

export default function AccountPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [verified, setVerified] = useState<boolean | null>(null);
  const [contacts, setContacts] = useState<Record<ContactType, string> | null>(null);
  const [preferred, setPreferred] = useState<PreferredContactMethod | null>(null);
  const [preferredChoice, setPreferredChoice] = useState<ContactType>("EMAIL");
  const [newContactValue, setNewContactValue] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    authApi.isVerified().then(setVerified).catch(() => setVerified(null));
    appUserApi.getContacts().then(setContacts).catch(() => setContacts(null));
    appUserApi
      .getPreferredContactMethod()
      .then((p) => {
        setPreferred(p);
        if (p.type) setPreferredChoice(p.type);
      })
      .catch(() => setPreferred(null));
  }, [user]);

  if (!user) return null;

  async function handleSendVerification() {
    setBusy(true);
    try {
      await authApi.sendVerificationLink("EMAIL");
      showToast("Verification link sent to your email.");
    } catch (err) {
      showToast(err instanceof ApiError ? err.messages[0] : "Something went wrong.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleSendReset(contactType: ContactType) {
    if (!contacts || contacts[contactType] === NOT_APPLICABLE) return;
    setBusy(true);
    try {
      await authApi.sendPasswordResetLink(contacts[contactType]);
      showToast("Reset link sent — check your inbox.");
    } catch (err) {
      showToast(err instanceof ApiError ? err.messages[0] : "Something went wrong.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleSetPreferred() {
    setBusy(true);
    try {
      const needsValue =
        preferredChoice === "EMAIL"
          ? !contacts?.EMAIL || contacts.EMAIL === NOT_APPLICABLE
          : !contacts?.PHONE || contacts.PHONE === NOT_APPLICABLE;
      await appUserApi.setPreferredContactMethod(
        preferredChoice,
        needsValue ? newContactValue : undefined,
      );
      const [updatedContacts, updatedPreferred] = await Promise.all([
        appUserApi.getContacts(),
        appUserApi.getPreferredContactMethod(),
      ]);
      setContacts(updatedContacts);
      setPreferred(updatedPreferred);
      setNewContactValue("");
      showToast("Preferred contact method updated.");
    } catch (err) {
      showToast(err instanceof ApiError ? err.messages[0] : "Something went wrong.", "error");
    } finally {
      setBusy(false);
    }
  }

  const preferredNeedsValue =
    preferredChoice === "EMAIL"
      ? !contacts?.EMAIL || contacts.EMAIL === NOT_APPLICABLE
      : !contacts?.PHONE || contacts.PHONE === NOT_APPLICABLE;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center gap-3">
        <span className="font-sans text-xs font-semibold uppercase tracking-wider text-slate-500">
          Account
        </span>
        {verified === true && (
          <span title="Account is verified" className="text-ledger-green">
            ✓
          </span>
        )}
        {verified === false && (
          <span
            title="Account is not verified, please verify"
            className="rounded-full border border-ledger-red px-2 py-0.5 font-sans text-[11px] font-semibold uppercase text-ledger-red"
          >
            Not Verified
          </span>
        )}
      </div>
      <h1 className="mt-1 font-display text-3xl font-semibold text-ink-950">{user.fullName}</h1>

      {verified === false && (
        <section className="mt-8 rounded-xl border border-slate-200 bg-paper-100 p-5">
          <h2 className="font-display text-lg font-semibold text-ink-950">
            Verify your account
          </h2>
          <p className="mt-1 font-sans text-sm text-slate-500">
            We&apos;ll email a verification link to your registered address.
          </p>
          <Button className="mt-4" onClick={handleSendVerification} disabled={busy}>
            Send verification link
          </Button>
        </section>
      )}

      <section className="mt-8 rounded-xl border border-slate-200 bg-paper-100 p-5">
        <h2 className="font-display text-lg font-semibold text-ink-950">Contact methods</h2>
        <dl className="mt-3 flex flex-col gap-2 font-sans text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">Email</dt>
            <dd className="text-ink-950">{contacts?.EMAIL ?? "…"}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-slate-500">Phone</dt>
            <dd className="text-ink-950">{contacts?.PHONE ?? "…"}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-8 rounded-xl border border-slate-200 bg-paper-100 p-5">
        <h2 className="font-display text-lg font-semibold text-ink-950">
          Preferred contact method
        </h2>
        <p className="mt-1 font-sans text-sm text-slate-500">
          Used as your default channel for bid updates and account notifications.
        </p>
        <div className="mt-4 flex flex-col gap-3">
          <Select
            id="preferredChoice"
            label="Channel"
            value={preferredChoice}
            onChange={(e) => setPreferredChoice(e.target.value as ContactType)}
          >
            <option value="EMAIL">Email</option>
            <option value="PHONE">Phone</option>
          </Select>
          {preferredNeedsValue && (
            <Input
              id="newContactValue"
              label={preferredChoice === "EMAIL" ? "Email address" : "Phone number"}
              value={newContactValue}
              onChange={(e) => setNewContactValue(e.target.value)}
            />
          )}
          <Button onClick={handleSetPreferred} disabled={busy}>
            Save preference
          </Button>
          {preferred?.type && (
            <span className="font-sans text-xs text-slate-500">
              Currently: {preferred.type === "EMAIL" ? "Email" : "Phone"} ({preferred.value})
            </span>
          )}
        </div>
      </section>

      <section className="mt-8 rounded-xl border border-slate-200 bg-paper-100 p-5">
        <h2 className="font-display text-lg font-semibold text-ink-950">Password</h2>
        <p className="mt-1 font-sans text-sm text-slate-500">
          We&apos;ll send a reset link to your email or phone.
        </p>
        <div className="mt-4 flex gap-3">
          <Button
            variant="secondary"
            onClick={() => handleSendReset("EMAIL")}
            disabled={busy || !contacts || contacts.EMAIL === NOT_APPLICABLE}
          >
            Email me a link
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleSendReset("PHONE")}
            disabled={busy || !contacts || contacts.PHONE === NOT_APPLICABLE}
          >
            Text me a link
          </Button>
        </div>
      </section>

      <Button variant="tertiary" className="mt-8" onClick={() => logout().then(() => router.push("/"))}>
        Log out
      </Button>
    </div>
  );
}
