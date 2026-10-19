/**
 * Feature switches. A disabled feature stays visible in the nav (greyed out with a tooltip) but
 * can't be opened, and its route redirects home.
 */

/** Notifications inbox. Off until notification-service works with the monolith deployment. */
export const NOTIFICATIONS_ENABLED = false;

export const NOTIFICATIONS_DISABLED_TITLE = "Notifications are unavailable right now";
