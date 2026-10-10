/**
 * Public runtime config. `NEXT_PUBLIC_*` values are inlined into the browser bundle at
 * `next build`, so they're fixed per build — see `.env.example` for where each one is set.
 */

// Must be referenced as a literal `process.env.NEXT_PUBLIC_…` for Next to inline it.
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error(
    "NEXT_PUBLIC_API_BASE_URL is not set. Local dev reads it from .env.development; " +
      "production builds need it in the build environment (CI variable, Docker build arg, " +
      "or .env.production.local). See .env.example.",
  );
}

/** Base URL of the API gateway, without a trailing slash. */
export const API_BASE_URL = apiBaseUrl.replace(/\/+$/, "");
