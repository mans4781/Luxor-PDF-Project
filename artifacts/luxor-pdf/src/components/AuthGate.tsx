import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@clerk/react";
import { useSignIn } from "@clerk/react/legacy";
import { SUITE_AUTH_HOST_BASE } from "@workspace/luxor-auth-ui";
import { isDesktopShell } from "../lib/desktopBridge";

/**
 * Sign-in gate for non-reading features.
 *
 * Reading a PDF (open, scroll, zoom, navigate, search, themes, print,
 * download, read-aloud) is always free and works offline. Everything that
 * modifies or extracts content (annotation tools, Edit-menu features,
 * Save As / Save a Copy) calls `requireAuth(label)` first:
 *
 *   - Signed in            → returns true, feature proceeds.
 *   - Signed out / Clerk   → returns false and opens a sign-in prompt
 *     not loaded (offline)   (with an offline-specific message when the
 *                            browser reports no connectivity).
 */

interface AuthGateContextValue {
  /** Returns true if the user may use the feature; otherwise shows the
   *  sign-in prompt (labelled with `label`) and returns false. */
  requireAuth: (label: string) => boolean;
  /** Explicitly start the sign-in flow (e.g. from the profile menu).
   *  Web: navigates to the suite sign-in page. Desktop: opens the system
   *  browser and waits for the handoff to complete. */
  beginSignIn: () => void;
  /** Same as `beginSignIn` but for account creation. */
  beginSignUp: () => void;
  /** Whether Clerk has finished loading the auth state. */
  isLoaded: boolean;
  /** Whether a user is currently signed in (false until loaded). */
  isSignedIn: boolean;
}

const AuthGateContext = createContext<AuthGateContextValue | null>(null);

// Dev-preview bypass: in development builds every feature is unlocked and
// the sign-in prompt never shows. Production builds keep full gating.
const DEV_BYPASS = import.meta.env.DEV;

export function useAuthGate(): AuthGateContextValue {
  const ctx = useContext(AuthGateContext);
  if (!ctx) throw new Error("useAuthGate must be used inside <AuthGateProvider>");
  return ctx;
}

function suiteAuthUrl(kind: "sign-in" | "sign-up"): string {
  const redirect = encodeURIComponent(window.location.href);
  return `${SUITE_AUTH_HOST_BASE}/${kind}?redirect_url=${redirect}`;
}

/** Random 64-char lowercase-hex handoff state for desktop sign-in. */
function randomState(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Absolute browser URL that starts the desktop sign-in handoff. */
function desktopAuthUrl(kind: "sign-in" | "sign-up", state: string): string {
  const origin = window.location.origin;
  const back = `${origin}${SUITE_AUTH_HOST_BASE}/desktop-link?state=${state}`;
  return `${origin}${SUITE_AUTH_HOST_BASE}/${kind}?redirect_url=${encodeURIComponent(back)}`;
}

/** Sentinel prompt label for explicit sign-in (no specific gated feature). */
const GENERIC_PROMPT_LABEL = "\u0000generic";

const DESKTOP_POLL_INTERVAL_MS = 2500;
const DESKTOP_POLL_TIMEOUT_MS = 10 * 60 * 1000;

export function AuthGateProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { signIn, setActive } = useSignIn();
  const [promptLabel, setPromptLabel] = useState<string | null>(null);
  // Desktop browser-handoff state: null = not started.
  const [desktopWait, setDesktopWait] = useState<"waiting" | "failed" | null>(
    null,
  );
  const pollAbortRef = useRef<{ cancelled: boolean } | null>(null);

  const stopDesktopFlow = useCallback(() => {
    if (pollAbortRef.current) pollAbortRef.current.cancelled = true;
    pollAbortRef.current = null;
    setDesktopWait(null);
  }, []);

  /**
   * Desktop: open the sign-in page in the user's default browser, then
   * poll the API for the one-time ticket the browser flow produces and
   * finish the Clerk session inside the app with it.
   */
  const startDesktopAuth = useCallback(
    (kind: "sign-in" | "sign-up") => {
      const state = randomState();
      // window.open is intercepted by the desktop shell and routed to the
      // system default browser.
      window.open(desktopAuthUrl(kind, state), "_blank", "noopener");

      const flow = { cancelled: false };
      if (pollAbortRef.current) pollAbortRef.current.cancelled = true;
      pollAbortRef.current = flow;
      setDesktopWait("waiting");

      const deadline = Date.now() + DESKTOP_POLL_TIMEOUT_MS;
      const poll = async (): Promise<void> => {
        while (!flow.cancelled && Date.now() < deadline) {
          await new Promise((r) => setTimeout(r, DESKTOP_POLL_INTERVAL_MS));
          if (flow.cancelled) return;
          try {
            const res = await fetch(
              `/api/desktop-auth/poll?state=${state}`,
              { credentials: "include" },
            );
            if (!res.ok) continue;
            const data: { status: string; ticket?: string } =
              await res.json();
            if (data.status === "ready" && data.ticket) {
              if (flow.cancelled) return;
              if (!signIn || !setActive) {
                // Clerk isn't ready — the one-time ticket has already been
                // claimed, so surface a failure instead of hanging.
                setDesktopWait("failed");
                return;
              }
              const result = await signIn.create({
                strategy: "ticket",
                ticket: data.ticket,
              });
              if (result.status === "complete") {
                await setActive({ session: result.createdSessionId });
                if (!flow.cancelled) {
                  setDesktopWait(null);
                  setPromptLabel(null);
                }
              } else {
                if (!flow.cancelled) setDesktopWait("failed");
              }
              return;
            }
          } catch {
            // Transient network error — keep polling.
          }
        }
        if (!flow.cancelled) setDesktopWait("failed");
      };
      void poll();
    },
    [signIn, setActive],
  );

  // Keep the latest auth state in refs so `requireAuth` stays referentially
  // stable — callers use it inside useCallback handlers.
  const authRef = useRef({ isLoaded, isSignedIn });
  authRef.current = { isLoaded, isSignedIn };

  /**
   * Explicit sign-in/up requested from the UI (profile menu). Unlike
   * `requireAuth` this is never dev-bypassed — the user asked to sign in.
   */
  const beginAuth = useCallback(
    (kind: "sign-in" | "sign-up") => {
      const offlineNow = typeof navigator !== "undefined" && !navigator.onLine;
      if (isDesktopShell()) {
        // Desktop: show the dialog (it hosts the waiting/failed states) and
        // hand off to the system browser.
        setPromptLabel(GENERIC_PROMPT_LABEL);
        if (!offlineNow) startDesktopAuth(kind);
        return;
      }
      if (offlineNow) {
        // The dialog can explain instead of navigating to a page that fails.
        setPromptLabel(GENERIC_PROMPT_LABEL);
        return;
      }
      window.location.assign(suiteAuthUrl(kind));
    },
    [startDesktopAuth],
  );

  const beginSignIn = useCallback(() => beginAuth("sign-in"), [beginAuth]);
  const beginSignUp = useCallback(() => beginAuth("sign-up"), [beginAuth]);

  const requireAuth = useCallback((label: string): boolean => {
    if (DEV_BYPASS) return true;
    const { isLoaded: loaded, isSignedIn: signedIn } = authRef.current;
    if (loaded && signedIn) return true;
    const offlineNow = typeof navigator !== "undefined" && !navigator.onLine;
    if (!isDesktopShell()) {
      if (!loaded || offlineNow) {
        // Auth state still resolving, or no connectivity — the dialog can
        // explain instead of navigating to a page that would fail.
        setPromptLabel(label);
        return false;
      }
      // Web: go straight to the suite sign-in page — no blocking dialog.
      window.location.assign(suiteAuthUrl("sign-in"));
      return false;
    }
    // Desktop: the dialog hosts the browser-handoff flow, so keep it.
    setPromptLabel(label);
    return false;
  }, []);

  const value = useMemo(
    () => ({
      requireAuth,
      beginSignIn,
      beginSignUp,
      isLoaded: DEV_BYPASS || isLoaded,
      isSignedIn: DEV_BYPASS || isSignedIn === true,
    }),
    [requireAuth, beginSignIn, beginSignUp, isLoaded, isSignedIn],
  );

  const offline = typeof navigator !== "undefined" && !navigator.onLine;

  return (
    <AuthGateContext.Provider value={value}>
      {children}
      {promptLabel !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Sign in required"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100000,
            background: "rgba(15, 23, 42, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              stopDesktopFlow();
              setPromptLabel(null);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              stopDesktopFlow();
              setPromptLabel(null);
            }
          }}
        >
          <div
            style={{
              width: "min(420px, 94vw)",
              background: "#fff",
              color: "#0f172a",
              borderRadius: 14,
              boxShadow: "0 24px 64px rgba(2, 6, 23, 0.35)",
              padding: "26px 26px 22px",
              textAlign: "center",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: 52,
                height: 52,
                margin: "0 auto 14px",
                borderRadius: "50%",
                background: "#eef2ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700 }}>
              {promptLabel === GENERIC_PROMPT_LABEL
                ? "Sign in to Luxor PDF"
                : `Sign in to use ${promptLabel}`}
            </h2>
            <p style={{ margin: "0 0 18px", fontSize: 13.5, lineHeight: 1.55, color: "#475569" }}>
              {offline
                ? "You're offline right now. Reading works without internet, but you'll need to connect and sign in to use this feature."
                : desktopWait === "waiting"
                  ? "We've opened your web browser. Sign in (or create an account) there — this app will finish signing you in automatically."
                  : desktopWait === "failed"
                    ? "That sign-in attempt didn't complete. Please try again."
                    : "Reading PDFs is always free. Create a free account or sign in to unlock annotations, editing and export tools."}
            </p>
            {desktopWait === "waiting" && (
              <div
                aria-live="polite"
                style={{
                  margin: "0 0 14px",
                  fontSize: 13,
                  color: "#2563eb",
                  fontWeight: 600,
                }}
              >
                Waiting for you to sign in in the browser…
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  if (isDesktopShell()) {
                    startDesktopAuth("sign-in");
                  } else {
                    window.location.assign(suiteAuthUrl("sign-in"));
                  }
                }}
                disabled={offline || desktopWait === "waiting"}
                style={{
                  padding: "10px 14px",
                  borderRadius: 9,
                  border: "none",
                  background: offline ? "#94a3b8" : "#2563eb",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: offline ? "not-allowed" : "pointer",
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isDesktopShell()) {
                    startDesktopAuth("sign-up");
                  } else {
                    window.location.assign(suiteAuthUrl("sign-up"));
                  }
                }}
                disabled={offline || desktopWait === "waiting"}
                style={{
                  padding: "10px 14px",
                  borderRadius: 9,
                  border: "1px solid #cbd5e1",
                  background: "#fff",
                  color: offline ? "#94a3b8" : "#0f172a",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: offline ? "not-allowed" : "pointer",
                }}
              >
                Create free account
              </button>
              <button
                type="button"
                onClick={() => {
                  stopDesktopFlow();
                  setPromptLabel(null);
                }}
                style={{
                  padding: "8px 14px",
                  borderRadius: 9,
                  border: "none",
                  background: "transparent",
                  color: "#64748b",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Keep reading without an account
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthGateContext.Provider>
  );
}
