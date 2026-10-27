/**
 * Feature switches. A disabled feature stays visible in the nav (greyed out with a tooltip) but
 * can't be opened, and its route redirects home.
 */

/** Notifications inbox and anything that sends one (e.g. the account verification link). Off while notification-service is down. */
export const NOTIFICATIONS_ENABLED = false;

export const NOTIFICATIONS_DISABLED_TITLE = "Notifications are unavailable right now";
