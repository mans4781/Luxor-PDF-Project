/**
 * Suite sign-in/sign-up URLs. The pdf-expiry artifact hosts the only
 * Clerk sign-in/up pages for the whole Luxor suite; the shared proxy
 * routes `/pdf-expiry/*` there from any artifact. No `redirect_url` is
 * passed from the marketing site, so after auth the user lands on the
 * account dashboard (the sign-in page's default destination).
 */
const SUITE_AUTH_HOST_BASE = "/app";

export function suiteAuthUrl(kind: "sign-in" | "sign-up"): string {
  return `${SUITE_AUTH_HOST_BASE}/${kind}`;
}

export function goToSignIn(): void {
  window.location.assign(suiteAuthUrl("sign-in"));
}

export function goToSignUp(): void {
  window.location.assign(suiteAuthUrl("sign-up"));
}
