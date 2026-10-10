"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { User, RefreshCw } from "lucide-react";
import { authApi, ApiError } from "@/lib/api";
import { LinkButton } from "../components/ui/Button";

function VerifyAccountContent() {
  const token = useSearchParams().get("token");
  const [status, setStatus] = useState<"pending" | "success" | "error">(() =>
    token ? "pending" : "error",
  );
  const [error, setError] = useState<string | null>(() =>
    token ? null : "This verification link is missing its token.",
  );

  useEffect(() => {
    if (!token) return;
    authApi
      .verifyAccount(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setError(err instanceof ApiError ? err.messages[0] : "This link may have expired.");
      });
  }, [token]);

  return (
    <div className="flex flex-col items-center text-center">
      {status === "pending" && (
        <p className="text-sm text-muted">Verifying your account…</p>
      )}
      {status === "success" && (
        <>
          <h1 className="text-2xl font-semibold text-fg">Account verified</h1>
          <p className="mt-1 text-sm text-muted">You&apos;re all set. Head back to your account.</p>
          <LinkButton href="/account" icon={User} className="mt-6 w-full">
            Go to account
          </LinkButton>
        </>
      )}
      {status === "error" && (
        <>
          <h1 className="text-2xl font-semibold text-fg">Verification failed</h1>
          <p className="mt-1 text-sm text-muted">{error}</p>
          <LinkButton href="/account" variant="secondary" icon={RefreshCw} className="mt-6 w-full">
            Request a new link
          </LinkButton>
        </>
      )}
    </div>
  );
}

export default function VerifyAccountPage() {
  return (
    <Suspense fallback={null}>
      <VerifyAccountContent />
    </Suspense>
  );
}
