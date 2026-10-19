/**
 * Public runtime config.
 */

/**
 * Base path for API calls. Requests stay on this app's origin and `next.config.ts` proxies
 * `/api/*` to the backend monolith, so the auth cookie is first-party.
 */
export const API_BASE_URL = "/api";
