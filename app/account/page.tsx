"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, MailCheck, Save, Mail, MessageSquare, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast-context";
import { appUserApi, authApi, ApiError } from "@/lib/api";
import type { ContactType, PreferredContactMethod } from "@/lib/types";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Avatar } from "../components/ui/Avatar";
import { Card } from "../components/ui/Card";
import type { ReactNode } from "react";

const NOT_APPLICABLE = "N/A";

/** Settings row: title + description on the left, controls on the right (stacked on mobile). */
function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="grid grid-cols-1 gap-5 p-5 md:grid-cols-[240px_minmax(0,1fr)] md:gap-8 md:p-6">
      <div>
        <h2 className="text-[15px] font-semibold text-fg">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </Card>
  );
}

function ContactRow({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="min-w-0 rounded-xl bg-subtle px-4 py-3">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="mt-0.5 truncate text-[15px] text-fg">{value ?? "…"}</dd>
    </div>
  );
}

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
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Card className="flex flex-wrap items-center justify-between gap-4 p-5 md:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={user.fullName} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-muted">Account</span>
              {verified === true && (
                <span title="Account is verified" className="text-success">
                  <BadgeCheck className="h-4 w-4" aria-label="Account is verified" />
                </span>
              )}
              {verified === false && (
                <span
                  title="Account is not verified, please verify"
                  className="rounded-md bg-danger-soft px-1.5 py-0.5 text-xs text-danger"
                >
                  Not Verified
                </span>
              )}
            </div>
            <h1 className="mt-0.5 truncate text-2xl font-semibold text-fg">{user.fullName}</h1>
          </div>
        </div>
        <Button variant="secondary" icon={LogOut} onClick={() => logout().then(() => router.push("/"))}>
          Log out
        </Button>
      </Card>

      {verified === false && (
        <SettingsSection
          title="Verify your account"
          description="We'll email a verification link to your registered address."
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">Verification confirms you own this email address.</p>
            <Button icon={MailCheck} onClick={handleSendVerification} disabled={busy}>
              Send verification link
            </Button>
          </div>
        </SettingsSection>
      )}

      <SettingsSection title="Contact methods" description="The email and phone number on file for your account.">
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ContactRow label="Email" value={contacts?.EMAIL} />
          <ContactRow label="Phone" value={contacts?.PHONE} />
        </dl>
      </SettingsSection>

      <SettingsSection
        title="Preferred contact method"
        description="Used as your default channel for bid updates and account notifications."
      >
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-muted">
            {preferred?.type && <>Currently: {preferred.type === "EMAIL" ? "Email" : "Phone"} ({preferred.value})</>}
          </span>
          <Button icon={Save} variant="secondary" onClick={handleSetPreferred} disabled={busy}>
            Save preference
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection title="Password" description="We'll send a reset link to your email or phone.">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            icon={Mail}
            onClick={() => handleSendReset("EMAIL")}
            disabled={busy || !contacts || contacts.EMAIL === NOT_APPLICABLE}
          >
            Email me a link
          </Button>
          <Button
            variant="secondary"
            icon={MessageSquare}
            onClick={() => handleSendReset("PHONE")}
            disabled={busy || !contacts || contacts.PHONE === NOT_APPLICABLE}
          >
            Text me a link
          </Button>
        </div>
      </SettingsSection>
    </div>
  );
}
