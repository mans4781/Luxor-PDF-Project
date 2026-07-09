import { useEffect, useRef, useState } from "react";
import { Show, UserButton } from "@clerk/react";
import { LogIn, UserRound, UserRoundPlus } from "lucide-react";
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
  /**
   * Compact mode: when signed out, render a single small circular profile
   * icon instead of the "Sign in" + "Create account" button pair. Clicking
   * it opens a tiny dropdown with both auth actions. Signed-in rendering
   * (avatar with initials) is unchanged.
   */
  iconOnly?: boolean;
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
  iconOnly = false,
}: AuthMenuProps) {
  const isDark = variant === "dark";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const goSignIn = () => {
    window.location.href = buildAuthUrl(signInUrl, redirectBackOnAuth);
  };
  const goSignUp = () => {
    window.location.href = buildAuthUrl(signUpUrl, redirectBackOnAuth);
  };

  // Close the icon dropdown on outside click / Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

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
        {iconOnly ? (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(o => !o)}
              data-testid="button-profile"
              aria-label="Account"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              title="Account"
              className={
                isDark
                  ? "flex h-8 w-8 items-center justify-center rounded-full border border-white/25 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                  : "flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:text-[#1e3a8a] hover:bg-slate-100 transition-colors"
              }
            >
              <UserRound className="h-[18px] w-[18px]" />
            </button>
            {menuOpen && (
              <div
                role="menu"
                className={
                  "absolute right-0 top-10 z-[300] w-48 overflow-hidden rounded-lg py-1 shadow-xl " +
                  (isDark
                    ? "border border-white/15 bg-[#262626] shadow-black/40"
                    : "border border-slate-200 bg-white shadow-slate-900/15")
                }
              >
                <div
                  className={
                    "px-3 py-1.5 text-[11px] " +
                    (isDark ? "text-slate-400" : "text-slate-500")
                  }
                >
                  Sign in to unlock editing
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={goSignIn}
                  data-testid="button-sign-in"
                  className={
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium transition-colors " +
                    (isDark
                      ? "text-slate-200 hover:bg-white/10 hover:text-white"
                      : "text-slate-700 hover:bg-slate-50 hover:text-[#1e3a8a]")
                  }
                >
                  <LogIn className="h-4 w-4" />
                  Sign in
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={goSignUp}
                  data-testid="button-sign-up"
                  className={
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium transition-colors " +
                    (isDark
                      ? "text-slate-200 hover:bg-white/10 hover:text-white"
                      : "text-slate-700 hover:bg-slate-50 hover:text-[#1e3a8a]")
                  }
                >
                  <UserRoundPlus className="h-4 w-4" />
                  Create account
                </button>
              </div>
            )}
          </div>
        ) : (
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
        )}
      </Show>
    </>
  );
}
