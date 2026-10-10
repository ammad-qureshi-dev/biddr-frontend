/** Builds a `/login?next=...` href that sends the user back to `path` after signing in. */
export function loginHref(path: string): string {
  return `/login?next=${encodeURIComponent(path)}`;
}

/**
 * Validates a `next` redirect target pulled from a query string. Only an in-app relative
 * path is accepted — rejects empty values, absolute URLs, and `//host` (protocol-relative,
 * which browsers treat as a same-scheme redirect to a different host) — so a crafted
 * `?next=` can't be used as an open redirect off of Bidder.
 */
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}
