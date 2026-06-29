"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "../lib/api";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Select } from "@/app/components/ui/Select";

type Method = "EMAIL" | "MOBILE";

export default function PasswordResetPage() {
  const [method, setMethod] = useState<Method>("EMAIL");
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function handleMethodChange(next: Method) {
    setMethod(next);
    setContact("");
    setError("");
    setSuccess("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await api.sendPasswordResetLink(method, contact);
      setSuccess(
        method === "EMAIL"
          ? "Reset link sent — check your email."
          : "Reset link sent via SMS."
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center shadow-sm">
            <span className="text-white text-base font-bold tracking-tight">B</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
            Reset your password
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Choose how you want to receive your reset link.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Select
              label="Reset via"
              id="method"
              value={method}
              onChange={(e) => handleMethodChange(e.target.value as Method)}
            >
              <option value="EMAIL">Email</option>
              <option value="MOBILE">Mobile</option>
            </Select>

            <Input
              key={method}
              label={method === "EMAIL" ? "Email address" : "Phone number"}
              id="contact"
              type={method === "EMAIL" ? "email" : "tel"}
              required
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={
                method === "EMAIL" ? "you@example.com" : "+1 555 000 0000"
              }
            />

            {error && (
              <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            {success && (
              <div className="text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-lg px-3 py-2">
                {success}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full mt-1">
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <Link
            href="/login"
            className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
