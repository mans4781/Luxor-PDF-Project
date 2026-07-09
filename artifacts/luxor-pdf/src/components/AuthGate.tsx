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
import { SUITE_AUTH_HOST_BASE } from "@workspace/luxor-auth-ui";

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

export function AuthGateProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [promptLabel, setPromptLabel] = useState<string | null>(null);

  // Keep the latest auth state in refs so `requireAuth` stays referentially
  // stable — callers use it inside useCallback handlers.
  const authRef = useRef({ isLoaded, isSignedIn });
  authRef.current = { isLoaded, isSignedIn };

  const requireAuth = useCallback((label: string): boolean => {
    if (DEV_BYPASS) return true;
    const { isLoaded: loaded, isSignedIn: signedIn } = authRef.current;
    if (loaded && signedIn) return true;
    setPromptLabel(label);
    return false;
  }, []);

  const value = useMemo(
    () => ({
      requireAuth,
      isLoaded: DEV_BYPASS || isLoaded,
      isSignedIn: DEV_BYPASS || isSignedIn === true,
    }),
    [requireAuth, isLoaded, isSignedIn],
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
            if (e.target === e.currentTarget) setPromptLabel(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setPromptLabel(null);
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
              Sign in to use {promptLabel}
            </h2>
            <p style={{ margin: "0 0 18px", fontSize: 13.5, lineHeight: 1.55, color: "#475569" }}>
              {offline
                ? "You're offline right now. Reading works without internet, but you'll need to connect and sign in to use this feature."
                : "Reading PDFs is always free. Create a free account or sign in to unlock annotations, editing and export tools."}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                type="button"
                onClick={() => window.location.assign(suiteAuthUrl("sign-in"))}
                disabled={offline}
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
                onClick={() => window.location.assign(suiteAuthUrl("sign-up"))}
                disabled={offline}
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
                onClick={() => setPromptLabel(null)}
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
