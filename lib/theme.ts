export const THEME_STORAGE_KEY = "bidder.theme";

/** Flips between dark (the default) and light, and remembers the choice in this browser. */
export function toggleTheme() {
  const root = document.documentElement;
  const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
  root.setAttribute("data-theme", next);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // storage blocked (private mode etc.) — the switch still applies for this page view
  }
}
