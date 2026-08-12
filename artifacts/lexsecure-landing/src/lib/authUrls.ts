/**
 * Suite sign-in/sign-up URLs. The pdf-expiry artifact hosts the only
 * Clerk sign-in/up pages for the whole Luxor suite; the shared proxy
 * routes `/pdf-expiry/*` there from any artifact.
 *
 * Pass `redirectTo` (a same-origin path like "/lx-console") to return the
 * user there after auth; without it the sign-in page's default destination
 * (the account dashboard) is used. The auth host validates the target and
 * ignores cross-origin URLs.
 */
const SUITE_AUTH_HOST_BASE = "/app";

export function suiteAuthUrl(
  kind: "sign-in" | "sign-up",
  redirectTo?: string,
): string {
  const base = `${SUITE_AUTH_HOST_BASE}/${kind}`;
  if (!redirectTo) return base;
  return `${base}?redirect_url=${encodeURIComponent(redirectTo)}`;
}

export function goToSignIn(redirectTo?: string): void {
  window.location.assign(suiteAuthUrl("sign-in", redirectTo));
}

export function goToSignUp(redirectTo?: string): void {
  window.location.assign(suiteAuthUrl("sign-up", redirectTo));
}
