"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useChrome } from "@/lib/chrome-context";

export function NavBar() {
  const { user, logout } = useAuth();
  const { slimNav } = useChrome();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-30 bg-ink-950 text-paper-50">
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between px-6 transition-all ${
          slimNav ? "h-14" : "h-16"
        }`}
      >
        <Link href="/" className="font-display text-xl font-semibold tracking-tight">
          Bidder
        </Link>

        {!slimNav && (
          <nav className="hidden items-center gap-6 font-sans text-sm md:flex">
            <Link href="/" className="hover:text-brass-500">
              Browse
            </Link>
            <Link href="/results" className="hover:text-brass-500">
              Results
            </Link>
            {user && (
              <>
                <Link href="/auctions/my-auctions" className="hover:text-brass-500">
                  My Auctions
                </Link>
                <Link href="/bids" className="hover:text-brass-500">
                  My Bids
                </Link>
                <Link href="/notifications" className="hover:text-brass-500">
                  Notifications
                </Link>
              </>
            )}
          </nav>
        )}

        <div className="flex items-center gap-3">
          {user ? (
            <>
              {!slimNav && (
                <Link href="/account" className="font-sans text-sm hover:text-brass-500">
                  {user.fullName.split(" ")[0]}
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="font-sans text-sm text-slate-200 hover:text-brass-500"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="font-sans text-sm hover:text-brass-500">
                Log in
              </Link>
              <Link
                href="/register"
                className="inline-flex min-h-9 items-center rounded-lg bg-brass-500 px-4 font-sans text-sm font-semibold text-ink-950 hover:bg-brass-600"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
