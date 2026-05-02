import { Show, UserButton } from "@clerk/react";
import { LogIn } from "lucide-react";
import { SUITE_AUTH_HOST_BASE } from "./LuxorClerkProvider";

export interface AuthMenuProps {
  /**
   * Where the Sign-In page lives. Default points to the suite-wide auth host
   * (`/pdf-expiry/sign-in`). The auth-host artifact (pdf-expiry) overrides
   * this with its own local path.
   */
  signInUrl?: string;
  signUpUrl?: string;
  /**
   * If true (default), append `?redirect_url=<current absolute URL>` so Clerk
   * bounces the user back here after sign-in. Disable when already on the auth
   * host so Clerk's own internal navigation isn't disturbed.
   */
  redirectBackOnAuth?: boolean;
  /** Visual variant. `dark` is for use over dark toolbars/backgrounds. */
  variant?: "light" | "dark";
}

function buildAuthUrl(base: string, redirectBack: boolean): string {
  if (!redirectBack || typeof window === "undefined") return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}redirect_url=${encodeURIComponent(window.location.href)}`;
}

export function AuthMenu({
  signInUrl = `${SUITE_AUTH_HOST_BASE}/sign-in`,
  signUpUrl = `${SUITE_AUTH_HOST_BASE}/sign-up`,
  redirectBackOnAuth = true,
  variant = "light",
}: AuthMenuProps) {
  const isDark = variant === "dark";
  const goSignIn = () => {
    window.location.href = buildAuthUrl(signInUrl, redirectBackOnAuth);
  };
  const goSignUp = () => {
    window.location.href = buildAuthUrl(signUpUrl, redirectBackOnAuth);
  };

  return (
    <>
      <Show when="signed-in">
        <UserButton
          appearance={{
            elements: {
              userButtonAvatarBox: "h-8 w-8",
              userButtonTrigger:
                "rounded-full ring-2 ring-transparent hover:ring-[#1e3a8a]/30 transition-all focus:ring-[#1e3a8a]/40",
              userButtonPopoverCard:
                "shadow-2xl shadow-slate-900/15 border border-slate-200 rounded-xl",
              userButtonPopoverActionButton:
                "hover:bg-slate-50 text-slate-700",
              userButtonPopoverActionButton__signOut:
                "text-rose-600 hover:text-rose-700 hover:bg-rose-50",
              userPreviewMainIdentifier: "font-semibold text-slate-900",
              userPreviewSecondaryIdentifier: "text-slate-500",
            },
          }}
        />
      </Show>
      <Show when="signed-out">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goSignIn}
            data-testid="button-sign-in"
            className={
              isDark
                ? "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                : "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-[#1e3a8a] hover:bg-slate-100 transition-colors"
            }
          >
            <LogIn className="h-4 w-4" />
            Sign in
          </button>
          <button
            type="button"
            onClick={goSignUp}
            data-testid="button-sign-up"
            className="inline-flex items-center rounded-md bg-[#1e3a8a] hover:bg-[#312E81] text-white px-3 py-1.5 text-sm font-semibold shadow-sm transition-colors"
          >
            Create account
          </button>
        </div>
      </Show>
    </>
  );
}
