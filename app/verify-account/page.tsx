"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { authApi, ApiError } from "@/lib/api";
import { Button } from "../components/ui/Button";

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
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-6 py-16 text-center">
      {status === "pending" && (
        <p className="font-sans text-sm text-slate-500">Verifying your account…</p>
      )}
      {status === "success" && (
        <>
          <h1 className="font-display text-3xl font-semibold text-ledger-green">
            Account verified
          </h1>
          <p className="mt-2 font-sans text-sm text-slate-500">
            You&apos;re all set. Head back to your account.
          </p>
          <Link href="/account" className="mt-6">
            <Button>Go to account</Button>
          </Link>
        </>
      )}
      {status === "error" && (
        <>
          <h1 className="font-display text-3xl font-semibold text-ledger-red">
            Verification failed
          </h1>
          <p className="mt-2 font-sans text-sm text-slate-500">{error}</p>
          <Link href="/account" className="mt-6">
            <Button variant="secondary">Request a new link</Button>
          </Link>
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
