"use client";

import { Suspense, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  Gavel,
  HandCoins,
  LayoutGrid,
  Menu,
  Moon,
  Plus,
  Search,
  Sun,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toggleTheme } from "@/lib/theme";
import { loginHref } from "@/lib/next-url";
import { Avatar } from "../ui/Avatar";
import { LinkButton } from "../ui/Button";

/** Routes that render as a centered card on the canvas, without sidebar or top bar. */
const BARE_ROUTES = ["/login", "/register", "/password/reset", "/verify-account"];

type NavItem = { href: string; label: string; icon: LucideIcon; match: (p: string) => boolean };

const BROWSE: NavItem = {
  href: "/",
  label: "Browse auctions",
  icon: LayoutGrid,
  match: (p) =>
    p === "/" ||
    (p.startsWith("/auctions/") && !p.startsWith("/auctions/my-auctions") && !p.startsWith("/auctions/create")),
};

const WORKSPACE: NavItem[] = [
  {
    href: "/auctions/my-auctions",
    label: "My Auctions",
    icon: Gavel,
    match: (p) => p.startsWith("/auctions/my-auctions"),
  },
  { href: "/bids", label: "My Bids", icon: HandCoins, match: (p) => p.startsWith("/bids") },
  {
    href: "/notifications",
    label: "Notifications",
    icon: Bell,
    match: (p) => p.startsWith("/notifications"),
  },
  { href: "/account", label: "Account", icon: UserRound, match: (p) => p.startsWith("/account") },
];

function pageTitle(pathname: string): string {
  if (pathname === "/") return "Auctions";
  if (pathname.startsWith("/auctions/my-auctions")) return "My Auctions";
  if (pathname.startsWith("/auctions/create")) return "New auction";
  if (pathname.endsWith("/edit")) return "Edit auction";
  if (pathname.includes("/items/")) return "Item";
  if (pathname.startsWith("/auctions/")) return "Auction";
  if (pathname.startsWith("/bids")) return "My Bids";
  if (pathname.startsWith("/notifications")) return "Notifications";
  if (pathname.startsWith("/account")) return "Account";
  return "Bidder";
}

export function Logo() {
  return (
    <Link href="/" className="text-[22px] font-semibold tracking-[-0.03em] text-fg">
      Bidder
    </Link>
  );
}

const navItemClass = (active: boolean) =>
  `flex min-h-10 items-center gap-3 rounded-[10px] border px-3 text-sm transition-colors ${
    active
      ? "border-line bg-surface text-fg shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
      : "border-transparent text-fg/80 hover:text-fg"
  }`;

function NavLink({ item, pathname, onNavigate }: { item: NavItem; pathname: string; onNavigate?: () => void }) {
  const active = item.match(pathname);
  const Icon = item.icon;
  return (
    <Link href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={navItemClass(active)}>
      <Icon className="h-[18px] w-[18px] text-muted" strokeWidth={1.75} />
      {item.label}
    </Link>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="px-3 pb-2 text-[13px] text-muted">{children}</p>;
}

function Sidebar({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const loginUrl = loginHref(pathname);
  const { user } = useAuth();
  return (
    <div className="flex h-full flex-col gap-7 overflow-y-auto px-4 py-6">
      <div className="px-2">
        <Logo />
      </div>

      <nav className="flex flex-col gap-7">
        <div className="flex flex-col gap-0.5">
          <NavLink item={BROWSE} pathname={pathname} onNavigate={onNavigate} />
        </div>

        {user && (
          <div>
            <SectionLabel>Workspace</SectionLabel>
            <div className="flex flex-col gap-0.5">
              {WORKSPACE.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
              ))}
              <Link
                href="/auctions/create"
                onClick={onNavigate}
                className={navItemClass(pathname.startsWith("/auctions/create"))}
              >
                <Plus className="h-[18px] w-[18px] text-muted" strokeWidth={1.75} />
                New auction
              </Link>
            </div>
          </div>
        )}
      </nav>

      <div className="mt-auto">
        {user ? (
          <Link
            href="/account"
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 hover:border-line-strong"
          >
            <Avatar name={user.fullName} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-fg">{user.fullName}</p>
              <p className="truncate text-xs text-muted">{user.contact?.value ?? "View account"}</p>
            </div>
          </Link>
        ) : (
          <div className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-sm font-medium text-fg">Start bidding</p>
            <p className="mt-1 text-[13px] leading-snug text-muted">Sign in to place bids and list your own auctions.</p>
            <LinkButton href={loginUrl} variant="secondary" size="sm" className="mt-3" onClick={onNavigate}>
              Log in
            </LinkButton>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Searches auction titles. On the browse page it filters live as you type by rewriting the
 * `?q=` param in place; anywhere else it navigates to browse on submit.
 */
function HeaderSearch({ pathname }: { pathname: string }) {
  const router = useRouter();
  const q = useSearchParams().get("q") ?? "";
  const [value, setValue] = useState(q);
  const [prevQ, setPrevQ] = useState(q);
  if (q !== prevQ) {
    setPrevQ(q);
    setValue(q);
  }

  const onBrowse = pathname === "/";
  const target = (v: string) => (v ? `/?q=${encodeURIComponent(v)}` : "/");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!onBrowse) router.push(target(value.trim()));
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="relative w-full">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (onBrowse) window.history.replaceState(null, "", target(e.target.value));
        }}
        placeholder="Search auctions"
        aria-label="Search auctions"
        className="min-h-10 w-full rounded-[10px] border border-transparent bg-subtle pl-9 pr-3 text-sm text-fg outline-none placeholder:text-muted focus:border-line-strong focus:bg-surface"
      />
    </form>
  );
}

const iconButtonClass =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-line text-fg transition-colors hover:bg-subtle";

/** Shows a sun in dark mode (switch to light) and a moon in light mode, driven purely by CSS. */
function ThemeToggle() {
  return (
    <button type="button" onClick={toggleTheme} aria-label="Toggle light and dark theme" title="Toggle theme" className={iconButtonClass}>
      <Sun className="h-[18px] w-[18px] light:hidden" strokeWidth={1.75} />
      <Moon className="hidden h-[18px] w-[18px] light:block" strokeWidth={1.75} />
    </button>
  );
}

function TopBar({ pathname, onOpenMenu }: { pathname: string; onOpenMenu: () => void }) {
  const { user, loading } = useAuth();
  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-3 rounded-t-2xl border-b border-line bg-surface px-5 py-3.5 sm:px-8">
      <button type="button" onClick={onOpenMenu} aria-label="Open menu" className={`${iconButtonClass} lg:hidden`}>
        <Menu className="h-[18px] w-[18px]" strokeWidth={1.75} />
      </button>
      <h2 className="text-[17px] font-medium text-fg">{pageTitle(pathname)}</h2>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden w-72 md:block">
          <Suspense fallback={<div className="min-h-10 w-full rounded-[10px] bg-subtle" />}>
            <HeaderSearch pathname={pathname} />
          </Suspense>
        </div>
        <ThemeToggle />
        {loading ? null : user ? (
          <>
            <Link
              href="/notifications"
              aria-label="Notifications"
              className={`${iconButtonClass} ${pathname.startsWith("/notifications") ? "bg-subtle" : ""}`}
            >
              <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </Link>
            <Link href="/account" aria-label="Account" className="ml-1 rounded-full">
              <Avatar name={user.fullName} />
            </Link>
          </>
        ) : (
          <>
            <LinkButton href={loginHref(pathname)} variant="secondary" size="sm" className="min-h-10">
              Log in
            </LinkButton>
            <span className="hidden sm:block">
              <LinkButton href="/register" size="sm" className="min-h-10">
                Register
              </LinkButton>
            </span>
          </>
        )}
      </div>

      <div className="w-full md:hidden">
        <Suspense fallback={<div className="min-h-10 w-full rounded-[10px] bg-subtle" />}>
          <HeaderSearch pathname={pathname} />
        </Suspense>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  if (BARE_ROUTES.some((r) => pathname.startsWith(r))) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-12">
        <Logo />
        <div className="w-full max-w-[400px] rounded-2xl border border-line bg-surface p-6 sm:p-8">{children}</div>
      </main>
    );
  }

  return (
    <div className="min-h-screen lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        <Sidebar pathname={pathname} />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={() => setMenuOpen(false)}>
          <div
            className="relative h-full w-72 max-w-[85vw] animate-slide-in-left bg-canvas"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar pathname={pathname} onNavigate={() => setMenuOpen(false)} />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
              className="absolute right-4 top-5 flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:text-fg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="p-2 lg:py-2 lg:pl-0 lg:pr-2">
        <div className="min-h-[calc(100vh-1rem)] rounded-2xl border border-line bg-surface">
          <TopBar pathname={pathname} onOpenMenu={() => setMenuOpen(true)} />
          <main className="mx-auto max-w-6xl px-5 pb-12 pt-8 sm:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
