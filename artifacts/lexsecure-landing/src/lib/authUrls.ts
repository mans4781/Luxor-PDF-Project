/**
 * Suite sign-in/sign-up URLs. The pdf-expiry artifact hosts the only
 * Clerk sign-in/up pages for the whole Luxor suite; the shared proxy
 * routes `/pdf-expiry/*` there from any artifact. After auth, the user
 * is returned to wherever they started via `redirect_url`.
 */
const SUITE_AUTH_HOST_BASE = "/pdf-expiry";

export function suiteAuthUrl(kind: "sign-in" | "sign-up"): string {
  const redirect = encodeURIComponent(window.location.href);
  return `${SUITE_AUTH_HOST_BASE}/${kind}?redirect_url=${redirect}`;
}

export function goToSignIn(): void {
  window.location.assign(suiteAuthUrl("sign-in"));
}

export function goToSignUp(): void {
  window.location.assign(suiteAuthUrl("sign-up"));
}
