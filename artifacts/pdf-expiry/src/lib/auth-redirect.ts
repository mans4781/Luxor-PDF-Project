import { basePath } from "@/lib/base-path";

/**
 * Resolve the post-auth destination from the `redirect_url` query param.
 *
 * Only same-origin targets are honoured (an attacker-supplied absolute URL
 * to another site is ignored); everything else falls back to the app home.
 * Used by the sign-in/sign-up pages so flows like the desktop-app browser
 * handoff (/desktop-link?state=...) resume correctly after auth — including
 * when the browser is already signed in.
 */
export function authRedirectTarget(): string {
  // With no explicit redirect target, land the user on their account
  // dashboard after signing in.
  const fallback = `${basePath}/dashboard`;
  try {
    const raw = new URLSearchParams(window.location.search).get("redirect_url");
    if (!raw) return fallback;
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
