"use client";

import Link from "next/link";
import { Search, Gavel, HandCoins, Bell, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function NavBar() {
  const { user } = useAuth();
  const initial = user?.fullName.trim().charAt(0).toUpperCase() || "?";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-paper-50 text-ink-950">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-display text-xl font-bold tracking-tight text-brass-500">
            Bidder
          </Link>
          <nav className="hidden whitespace-nowrap font-sans text-sm font-medium md:flex">
            <Link href="/" className="flex items-center gap-1.5 hover:text-brass-500">
              <Search className="h-4 w-4" />
              Browse
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-6">
          {user && (
            <nav className="hidden items-center gap-6 whitespace-nowrap font-sans text-sm font-medium md:flex">
              <Link href="/auctions/my-auctions" className="flex items-center gap-1.5 hover:text-brass-500">
                <Gavel className="h-4 w-4" />
                My Auctions
              </Link>
              <Link href="/bids" className="flex items-center gap-1.5 hover:text-brass-500">
                <HandCoins className="h-4 w-4" />
                My Bids
              </Link>
              <Link href="/notifications" className="flex items-center gap-1.5 hover:text-brass-500">
                <Bell className="h-4 w-4" />
                Notifications
              </Link>
            </nav>
          )}

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/account"
                aria-label="Account"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 font-sans text-sm font-semibold text-ink-950"
              >
                {initial}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 font-sans text-sm font-medium hover:text-brass-500"
                >
                  <LogIn className="h-4 w-4" />
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-brass-500 px-4 font-sans text-sm font-semibold text-white hover:bg-brass-600"
                >
                  <UserPlus className="h-4 w-4" />
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
