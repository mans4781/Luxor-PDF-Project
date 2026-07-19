import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/react";
import { clerkAppearance, clerkLocalization } from "./clerk-appearance";

/**
 * The artifact base path that hosts the unified Luxor PDF Suite sign-in /
 * sign-up pages. Other artifacts redirect here for authentication, then bounce
 * back via Clerk's `redirect_url` query parameter.
 */
export const SUITE_AUTH_HOST_BASE = "/app";

export interface LuxorClerkProviderProps {
  children: ReactNode;
  /** Clerk publishable key. Required. */
  publishableKey: string;
  /** Optional Clerk proxy URL (set by Replit-managed Clerk). */
  proxyUrl?: string;
  /**
   * Where this app's sign-in page lives. Defaults to the suite-wide auth host
   * (`/pdf-expiry/sign-in`). The auth-host artifact (pdf-expiry) overrides this
   * with its own local path.
   */
  signInUrl?: string;
  /** See `signInUrl`. */
  signUpUrl?: string;
  /** Optional router integration (used by the auth-host artifact). */
  routerPush?: (to: string) => void;
  routerReplace?: (to: string) => void;
}

export function LuxorClerkProvider({
  children,
  publishableKey,
  proxyUrl,
  signInUrl = `${SUITE_AUTH_HOST_BASE}/sign-in`,
  signUpUrl = `${SUITE_AUTH_HOST_BASE}/sign-up`,
  routerPush,
  routerReplace,
}: LuxorClerkProviderProps) {
  if (!publishableKey) {
    throw new Error("LuxorClerkProvider: missing publishableKey");
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      proxyUrl={proxyUrl}
      appearance={clerkAppearance}
      localization={clerkLocalization}
      signInUrl={signInUrl}
      signUpUrl={signUpUrl}
      afterSignOutUrl="/"
      routerPush={routerPush}
      routerReplace={routerReplace}
    >
      {children}
    </ClerkProvider>
  );
}
