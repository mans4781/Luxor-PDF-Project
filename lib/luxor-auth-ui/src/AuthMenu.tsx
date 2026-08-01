import {
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { Show, useClerk, useUser } from "@clerk/react";
import {
  LayoutDashboard,
  LogIn,
  LogOut,
  UserRound,
  UserRoundCog,
  UserRoundPlus,
} from "lucide-react";
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
  /**
   * Optional override for the Sign-in action. When provided, it is called
   * instead of navigating to `signInUrl` — used by the desktop shell to run
   * the browser-handoff flow instead of in-place navigation.
   */
  onSignIn?: () => void;
  /** Optional override for the Create-account action (see `onSignIn`). */
  onSignUp?: () => void;
  /**
   * App-specific shortcut links shown in the account menu in BOTH auth
   * states: below a divider in the icon-only signed-out dropdown, and as
   * custom menu items inside the signed-in avatar menu.
   */
  menuLinks?: AuthMenuLink[];
}

export interface AuthMenuLink {
  label: string;
  href: string;
  /** Small icon element rendered next to the label (e.g. a lucide icon). */
  icon: ReactNode;
  testId?: string;
}

function signedInRowClass(isDark: boolean): string {
  return (
    "flex w-full items-center gap-2.5 px-4 py-2 text-left text-[13px] font-medium transition-colors " +
    (isDark
      ? "text-slate-200 hover:bg-white/10 hover:text-white"
      : "text-slate-700 hover:bg-slate-50 hover:text-[#1e3a8a]")
  );
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
  onSignIn,
  onSignUp,
  menuLinks,
}: AuthMenuProps) {
  const isDark = variant === "dark";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const clerk = useClerk();
  const [signingOut, setSigningOut] = useState(false);

  const displayName =
    user?.fullName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const avatarUrl = user?.hasImage ? user.imageUrl : "";
  const initials =
    (
      (user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "")
    ).toUpperCase() ||
    displayName.slice(0, 2).toUpperCase() ||
    "U";

  const goSignIn = () => {
    setMenuOpen(false);
    if (onSignIn) {
      onSignIn();
      return;
    }
    window.location.href = buildAuthUrl(signInUrl, redirectBackOnAuth);
  };
  const goSignUp = () => {
    setMenuOpen(false);
    if (onSignUp) {
      onSignUp();
      return;
    }
    window.location.href = buildAuthUrl(signUpUrl, redirectBackOnAuth);
  };

  // Close the dropdown on outside click / Escape (Escape returns focus to
  // the trigger button for keyboard users).
  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // Move focus into the menu when it opens.
  useEffect(() => {
    if (!menuOpen) return;
    const items = getMenuItems();
    items[0]?.focus();
  }, [menuOpen]);

  function getMenuItems(): HTMLElement[] {
    const root = popoverRef.current;
    if (!root) return [];
    return Array.from(
      root.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])'),
    );
  }

  // Arrow-key / Home / End roving focus inside the popover.
  const onMenuKeyDown = (e: ReactKeyboardEvent) => {
    const items = getMenuItems();
    if (items.length === 0) return;
    const current = items.indexOf(document.activeElement as HTMLElement);
    let next = -1;
    if (e.key === "ArrowDown") next = current < items.length - 1 ? current + 1 : 0;
    else if (e.key === "ArrowUp") next = current > 0 ? current - 1 : items.length - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    else if (e.key === "Tab") {
      setMenuOpen(false);
      return;
    } else return;
    e.preventDefault();
    items[next]?.focus();
  };

  return (
    <>
      <Show when="signed-in">
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            ref={triggerRef}
            onClick={() => setMenuOpen((o) => !o)}
            data-testid="button-account"
            aria-label="Account menu"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            title={displayName || "Account"}
            className={
              "flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-[13px] font-bold shadow-sm ring-2 transition-all hover:scale-105 hover:shadow-md " +
              (menuOpen
                ? "ring-[#1e3a8a]/50"
                : "ring-transparent hover:ring-[#1e3a8a]/30") +
              " bg-gradient-to-br from-[#1e3a8a] to-[#2563EB] text-white"
            }
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName || "Account"}
                className="h-full w-full object-cover"
                draggable={false}
              />
            ) : (
              <span aria-hidden="true">{initials}</span>
            )}
          </button>
          {menuOpen && (
            <div
              role="menu"
              ref={popoverRef}
              onKeyDown={onMenuKeyDown}
              aria-label="Account menu"
              className={
                "absolute right-0 top-11 z-[300] w-72 overflow-hidden rounded-2xl shadow-2xl " +
                (isDark
                  ? "border border-white/15 bg-[#1f1f22] shadow-black/50"
                  : "border border-slate-200 bg-white shadow-slate-900/20")
              }
            >
              {/* Identity header */}
              <div
                className={
                  "flex items-center gap-3 px-4 py-3.5 " +
                  (isDark
                    ? "border-b border-white/10 bg-white/[0.04]"
                    : "border-b border-slate-100 bg-slate-50/70")
                }
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#1e3a8a] to-[#2563EB] text-sm font-bold text-white ring-2 ring-white/60 shadow">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt=""
                      aria-hidden="true"
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <span aria-hidden="true">{initials}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p
                    className={
                      "truncate text-sm font-semibold " +
                      (isDark ? "text-white" : "text-slate-900")
                    }
                    data-testid="text-account-name"
                  >
                    {displayName || "Your account"}
                  </p>
                  {email && (
                    <p
                      className={
                        "truncate text-xs " +
                        (isDark ? "text-slate-400" : "text-slate-500")
                      }
                      data-testid="text-account-email"
                    >
                      {email}
                    </p>
                  )}
                </div>
              </div>

              {/* Account actions */}
              <div className="py-1.5">
                <a
                  href={`${SUITE_AUTH_HOST_BASE}/dashboard`}
                  role="menuitem"
                  data-testid="menu-item-dashboard"
                  onClick={() => setMenuOpen(false)}
                  className={signedInRowClass(isDark)}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Account dashboard
                </a>
                <button
                  type="button"
                  role="menuitem"
                  data-testid="menu-item-manage-account"
                  onClick={() => {
                    setMenuOpen(false);
                    clerk.openUserProfile();
                  }}
                  className={signedInRowClass(isDark)}
                >
                  <UserRoundCog className="h-4 w-4" />
                  Manage account & security
                </button>
              </div>

              {/* App-specific shortcuts */}
              {menuLinks && menuLinks.length > 0 && (
                <>
                  <div
                    className={
                      "mx-3 h-px " + (isDark ? "bg-white/10" : "bg-slate-100")
                    }
                  />
                  <div className="py-1.5">
                    {menuLinks.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        role="menuitem"
                        data-testid={link.testId}
                        onClick={() => setMenuOpen(false)}
                        className={signedInRowClass(isDark)}
                      >
                        <span className="flex h-4 w-4 items-center justify-center [&>svg]:h-4 [&>svg]:w-4">
                          {link.icon}
                        </span>
                        {link.label}
                      </a>
                    ))}
                  </div>
                </>
              )}

              {/* Sign out */}
              <div
                className={
                  "mx-3 h-px " + (isDark ? "bg-white/10" : "bg-slate-100")
                }
              />
              <div className="py-1.5">
                <button
                  type="button"
                  role="menuitem"
                  data-testid="menu-item-sign-out"
                  disabled={signingOut}
                  onClick={async () => {
                    setSigningOut(true);
                    try {
                      await clerk.signOut({ redirectUrl: "/" });
                    } finally {
                      setSigningOut(false);
                      setMenuOpen(false);
                    }
                  }}
                  className={
                    "flex w-full items-center gap-2.5 px-4 py-2 text-left text-[13px] font-medium transition-colors disabled:opacity-60 " +
                    (isDark
                      ? "text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                      : "text-rose-600 hover:bg-rose-50 hover:text-rose-700")
                  }
                >
                  <LogOut className="h-4 w-4" />
                  {signingOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            </div>
          )}
        </div>
      </Show>
      <Show when="signed-out">
        {iconOnly ? (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              ref={triggerRef}
              onClick={() => setMenuOpen(o => !o)}
              data-testid="button-profile"
              aria-label="Account"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              title="Account"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e4e4e7] text-[#52525b] shadow-sm ring-1 ring-black/10 transition-all hover:bg-[#d4d4d8] hover:shadow-md hover:scale-105"
            >
              <UserRound className="h-[18px] w-[18px]" strokeWidth={2.4} />
            </button>
            {menuOpen && (
              <div
                role="menu"
                ref={popoverRef}
                onKeyDown={onMenuKeyDown}
                aria-label="Account menu"
                className={
                  "absolute right-0 top-10 z-[300] w-48 overflow-hidden rounded-lg py-1 shadow-xl " +
                  (isDark
                    ? "border border-white/15 bg-[#262626] shadow-black/40"
                    : "border border-slate-200 bg-white shadow-slate-900/15")
                }
              >
                <div
                  className={
                    "px-3 py-1.5 text-[10px] " +
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
                    "flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium transition-colors " +
                    (isDark
                      ? "text-slate-200 hover:bg-white/10 hover:text-white"
                      : "text-slate-700 hover:bg-slate-50 hover:text-[#1e3a8a]")
                  }
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Sign in
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={goSignUp}
                  data-testid="button-sign-up"
                  className={
                    "flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium transition-colors " +
                    (isDark
                      ? "text-slate-200 hover:bg-white/10 hover:text-white"
                      : "text-slate-700 hover:bg-slate-50 hover:text-[#1e3a8a]")
                  }
                >
                  <UserRoundPlus className="h-3.5 w-3.5" />
                  Create account
                </button>
                {menuLinks && menuLinks.length > 0 && (
                  <>
                    <div
                      className={
                        "my-1 h-px " + (isDark ? "bg-white/15" : "bg-slate-200")
                      }
                    />
                    {menuLinks.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        role="menuitem"
                        data-testid={link.testId}
                        onClick={() => setMenuOpen(false)}
                        className={
                          "flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium transition-colors " +
                          (isDark
                            ? "text-slate-200 hover:bg-white/10 hover:text-white"
                            : "text-slate-700 hover:bg-slate-50 hover:text-[#1e3a8a]")
                        }
                      >
                        <span className="flex h-3.5 w-3.5 items-center justify-center [&>svg]:h-3.5 [&>svg]:w-3.5">
                          {link.icon}
                        </span>
                        {link.label}
                      </a>
                    ))}
                  </>
                )}
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
