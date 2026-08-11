import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
 * Sign-in + subscription gate.
 *
 * Almost everything in the reader is free and needs no account: reading,
 * search, themes, print, download, annotations, edit text, page numbers,
 * compress, screenshots, form filling, sharing, save/export.
 *
 * Premium features: the AI Assistant and the Protect tools (Redact, Whiteout, Watermark).
 * They call `requirePremium(label)`:
 *
 *   - Signed out                 → sign-in prompt / redirect.
 *   - Signed in, no active plan  → upgrade prompt linking to the plans page.
 *   - Signed in, active plan     → returns true, feature proceeds.
 *
 * `requireAuth(label)` (sign-in only, no plan check) is kept for flows that
 * merely need an account.
 */

interface AuthGateContextValue {
  /** Returns true if the user may use the feature; otherwise shows the
   *  sign-in prompt (labelled with `label`) and returns false. */
  requireAuth: (label: string) => boolean;
  /** Premium gate: like `requireAuth`, but additionally requires an active
   *  paid plan. Shows an upgrade prompt for signed-in users without one. */
  requirePremium: (label: string) => boolean;
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
  /** Whether the signed-in user has an active paid plan (always true in
   *  dev preview builds). Use for advisory UI only (greying out premium
   *  menu items) — the real gate is `requirePremium` at execution. */
  hasPremium: boolean;
  /** Plan name from the license server (e.g. "monthly" / "yearly"), or
   *  null when the user has no paid plan / it hasn't loaded yet. */
  planName: string | null;
  /** True once /api/license/status has resolved (or in dev bypass). While
   *  false, plan state is unknown — don't show "Free plan" badges yet. */
  planResolved: boolean;
}

const AuthGateContext = createContext<AuthGateContextValue | null>(null);

// Dev-preview bypass: in development builds every feature is unlocked and
// the sign-in prompt never shows. Production builds keep full gating.
// Add `?locked=1` to the URL (dev only) to preview the free-user view:
// premium items grey out and clicks show the upgrade prompt.
const LOCKED_PREVIEW =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("locked") === "1";
const DEV_BYPASS = import.meta.env.DEV && !LOCKED_PREVIEW;

/** Human label for the account menu's subscription badge. Returns
 *  undefined (no badge) while the plan status is still loading. */
export function planStatusLabel(
  hasPremium: boolean,
  planName: string | null,
  planResolved: boolean,
): string | undefined {
  if (!planResolved) return undefined;
  if (!hasPremium) return "Free plan";
  if (planName) {
    const pretty = planName.charAt(0).toUpperCase() + planName.slice(1);
    return `${pretty} plan`;
  }
  return "Premium plan";
}

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

/** Where the "View plans" button in the upgrade prompt goes. */
const PRICING_PATH = "/lexsecure-landing/pricing";
const ACTIVATE_KEY_PATH = "/pdf-expiry/activate-key";

// Open a suite page — desktop shells route window.open to the system browser.
function openSuitePath(path: string): void {
  if (isDesktopShell()) {
    window.open(`${window.location.origin}${path}`, "_blank", "noopener");
  } else {
    window.location.assign(path);
  }
}

/** Signed-in user's plan state, derived from GET /api/license/status. */
type LicenseState = "unknown" | "active" | "none";

/** One of the caller's activated devices on a product key. */
interface KeyDevice {
  licenseId: number;
  deviceId: string;
  deviceName: string | null;
  os: string | null;
  activatedAt: string;
}

const DESKTOP_POLL_INTERVAL_MS = 2500;
const DESKTOP_POLL_TIMEOUT_MS = 10 * 60 * 1000;

export function AuthGateProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { signIn, setActive } = useSignIn();
  const [promptLabel, setPromptLabel] = useState<string | null>(null);
  // Which prompt the dialog shows: sign-in (no account) or upgrade (no plan).
  const [promptMode, setPromptMode] = useState<"signin" | "upgrade">("signin");
  const [licenseState, setLicenseState] = useState<LicenseState>("unknown");
  const [planName, setPlanName] = useState<string | null>(null);
  const licenseRef = useRef<LicenseState>("unknown");
  licenseRef.current = licenseState;

  // In-app license-key activation (upgrade prompt): no website redirect.
  const [keyMode, setKeyMode] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);
  const [activated, setActivated] = useState(false);

  // Device-slot manager: shown when activation fails because the key has no
  // slots left. Lists the user's activated devices so they can free one up.
  const [slotsFull, setSlotsFull] = useState(false);
  const [devices, setDevices] = useState<KeyDevice[] | null>(null);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [devicesError, setDevicesError] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);
  const [otherAccountSlots, setOtherAccountSlots] = useState(0);

  const resetDevicePanel = () => {
    setSlotsFull(false);
    setDevices(null);
    setDevicesLoading(false);
    setDevicesError(null);
    setDeactivatingId(null);
    setOtherAccountSlots(0);
  };

  // Invalidate in-flight activations and pending auto-close timers when the
  // dialog closes, so a late response can't mutate a newer prompt's state.
  const activationGenRef = useRef(0);
  const closeTimerRef = useRef<number | null>(null);

  // Reset the key-entry form whenever the prompt dialog goes away.
  useEffect(() => {
    if (promptLabel === null) {
      activationGenRef.current++;
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setKeyMode(false);
      setKeyInput("");
      setActivating(false);
      setActivateError(null);
      setActivated(false);
      setSlotsFull(false);
      setDevices(null);
      setDevicesLoading(false);
      setDevicesError(null);
      setDeactivatingId(null);
      setOtherAccountSlots(0);
    }
  }, [promptLabel]);

  /** Fetch the caller's activated devices for the key that just failed. */
  const loadDevices = async (productKey: string, gen: number) => {
    setDevicesLoading(true);
    setDevicesError(null);
    try {
      const res = await fetch("/api/license/key-devices", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productKey }),
      });
      if (gen !== activationGenRef.current) return;
      if (!res.ok) {
        setDevicesError("Couldn't load your devices. Try again.");
        return;
      }
      const data: {
        devices?: KeyDevice[];
        otherAccountSlots?: number;
      } = await res.json();
      setDevices(data.devices ?? []);
      setOtherAccountSlots(data.otherAccountSlots ?? 0);
    } catch {
      if (gen === activationGenRef.current) {
        setDevicesError("Couldn't load your devices. Check your connection.");
      }
    } finally {
      if (gen === activationGenRef.current) setDevicesLoading(false);
    }
  };

  /** Deactivate one device, then automatically retry the key activation. */
  const deactivateDevice = async (licenseId: number) => {
    setDeactivatingId(licenseId);
    setDevicesError(null);
    const gen = activationGenRef.current;
    try {
      const res = await fetch("/api/license/deactivate-device", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseId }),
      });
      if (gen !== activationGenRef.current) return;
      if (!res.ok) {
        setDevicesError("Couldn't deactivate that device. Try again.");
        return;
      }
      // Slot freed — retry activation on this device right away.
      resetDevicePanel();
      setActivateError(null);
      await activateKey();
    } catch {
      if (gen === activationGenRef.current) {
        setDevicesError("Couldn't reach the license server. Check your connection.");
      }
    } finally {
      if (gen === activationGenRef.current) setDeactivatingId(null);
    }
  };

  const activateKey = async () => {
    const productKey = keyInput.trim().toUpperCase();
    if (!/^LUXOR(-[A-Z0-9]{4}){4}$/.test(productKey)) {
      setActivateError("Enter the full key, like LUXOR-XXXX-XXXX-XXXX-XXXX.");
      return;
    }
    setActivating(true);
    setActivateError(null);
    setSlotsFull(false);
    const gen = ++activationGenRef.current;
    try {
      const { getDeviceId, getDeviceName, detectOs } = await import("@/lib/deviceId");
      const res = await fetch("/api/license/activate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productKey,
          deviceId: await getDeviceId(),
          deviceName: getDeviceName(),
          os: detectOs(),
        }),
      });
      if (res.ok) {
        // The server accepted the key, so premium is real regardless of
        // which dialog is open — always reflect it in license state.
        setLicenseState("active");
        if (gen !== activationGenRef.current) return; // dialog closed meanwhile
        setActivated(true);
        closeTimerRef.current = window.setTimeout(() => {
          closeTimerRef.current = null;
          setPromptLabel(null);
          setPromptMode("signin");
        }, 1400);
      } else {
        const body: { error?: string } = await res.json().catch(() => ({}));
        if (gen !== activationGenRef.current) return;
        const reasons: Record<string, string> = {
          not_found: "That key wasn't recognized. Check it and try again.",
          already_activated: "This key is already active on this account.",
          max_activations_reached:
            "This key has no device slots left. Deactivate a device below to free one up.",
          revoked: "This key has been revoked.",
          expired: "This key's subscription has expired.",
        };
        setActivateError(
          reasons[body.error ?? ""] ??
            (res.status === 401
              ? "Please sign in first, then enter your key."
              : "Couldn't activate that key. Check it and try again."),
        );
        if (body.error === "max_activations_reached") {
          setSlotsFull(true);
          void loadDevices(productKey, gen);
        }
      }
    } catch {
      if (gen === activationGenRef.current) {
        setActivateError("Couldn't reach the license server. Check your connection and try again.");
      }
    } finally {
      if (gen === activationGenRef.current) setActivating(false);
    }
  };

  // Keep the plan state fresh while signed in: check on load, on sign-in,
  // and whenever the window regains focus (e.g. after buying a plan in
  // another tab). Fail closed — errors leave the previous state in place.
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setLicenseState("unknown");
      return;
    }
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch("/api/license/status", {
          credentials: "include",
        });
        if (!res.ok) return;
        const data: { canUsePdfTools?: boolean; planName?: string | null } =
          await res.json();
        if (!cancelled) {
          setLicenseState(data.canUsePdfTools === true ? "active" : "none");
          setPlanName(typeof data.planName === "string" ? data.planName : null);
        }
      } catch {
        // Offline / transient error — keep the previous state.
      }
    };
    void check();
    const onFocus = () => void check();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
    };
  }, [isLoaded, isSignedIn]);

  // If the plan check resolves to "active" while the upgrade prompt is
  // open (status was still loading when the user clicked), dismiss it.
  useEffect(() => {
    if (licenseState === "active" && promptMode === "upgrade") {
      setPromptLabel(null);
      setPromptMode("signin");
    }
  }, [licenseState, promptMode]);
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
        setPromptMode("signin");
        setPromptLabel(GENERIC_PROMPT_LABEL);
        if (!offlineNow) startDesktopAuth(kind);
        return;
      }
      if (offlineNow) {
        // The dialog can explain instead of navigating to a page that fails.
        setPromptMode("signin");
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
        setPromptMode("signin");
        setPromptLabel(label);
        return false;
      }
      // Web: go straight to the suite sign-in page — no blocking dialog.
      window.location.assign(suiteAuthUrl("sign-in"));
      return false;
    }
    // Desktop: the dialog hosts the browser-handoff flow, so keep it.
    setPromptMode("signin");
    setPromptLabel(label);
    return false;
  }, []);

  const requirePremium = useCallback(
    (label: string): boolean => {
      if (DEV_BYPASS) return true;
      const { isLoaded: loaded, isSignedIn: signedIn } = authRef.current;
      // Step 1: must be signed in (reuses the sign-in prompt / redirect).
      if (!loaded || !signedIn) return requireAuth(label);
      // Step 2: must have an active paid plan. "unknown" fails closed —
      // the focus/mount check is usually done long before a click, and if
      // it resolves to "active" while the prompt is open it auto-closes.
      if (licenseRef.current === "active") return true;
      setPromptMode("upgrade");
      setPromptLabel(label);
      return false;
    },
    [requireAuth],
  );

  const value = useMemo(
    () => ({
      requireAuth,
      requirePremium,
      beginSignIn,
      beginSignUp,
      isLoaded: DEV_BYPASS || isLoaded,
      isSignedIn: DEV_BYPASS || isSignedIn === true,
      hasPremium: DEV_BYPASS || licenseState === "active",
      planName,
      planResolved: DEV_BYPASS || licenseState !== "unknown",
    }),
    [requireAuth, requirePremium, beginSignIn, beginSignUp, isLoaded, isSignedIn, licenseState, planName],
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
              setPromptMode("signin");
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              stopDesktopFlow();
              setPromptLabel(null);
              setPromptMode("signin");
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
              {promptMode === "upgrade"
                ? `Upgrade to use ${promptLabel}`
                : promptLabel === GENERIC_PROMPT_LABEL
                  ? "Sign in to Luxor PDF"
                  : `Sign in to use ${promptLabel}`}
            </h2>
            <p style={{ margin: "0 0 18px", fontSize: 13.5, lineHeight: 1.55, color: "#475569" }}>
              {promptMode === "upgrade"
                ? "This feature is part of the Luxor PDF paid plans. Reading and everyday annotation stay free — pick a plan to unlock the document tools, stamps, and the AI Assistant."
                : offline
                  ? "You're offline right now. Reading works without internet, but you'll need to connect and sign in to use this feature."
                  : desktopWait === "waiting"
                    ? "We've opened your web browser. Sign in (or create an account) there — this app will finish signing you in automatically."
                    : desktopWait === "failed"
                      ? "That sign-in attempt didn't complete. Please try again."
                      : "Reading and everyday annotation are free. Sign in to use the document tools, stamps, and the AI Assistant with a Luxor PDF plan."}
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
              {promptMode === "upgrade" && keyMode ? (
                <>
                  {activated ? (
                    <div
                      aria-live="polite"
                      style={{
                        padding: "14px 12px",
                        borderRadius: 9,
                        background: "#ecfdf5",
                        border: "1px solid #6ee7b7",
                        color: "#047857",
                        fontSize: 14.5,
                        fontWeight: 700,
                      }}
                    >
                      ✓ Activated Successfully
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        autoFocus
                        value={keyInput}
                        onChange={(e) => {
                          // Auto-format: LUXOR-XXXX-XXXX-XXXX-XXXX
                          let raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                          if (raw.startsWith("LUXOR")) raw = raw.slice(5);
                          const groups = raw.slice(0, 16).match(/.{1,4}/g) ?? [];
                          setKeyInput(["LUXOR", ...groups].join("-"));
                          setActivateError(null);
                          resetDevicePanel();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !activating) void activateKey();
                          e.stopPropagation();
                        }}
                        placeholder="LUXOR-XXXX-XXXX-XXXX-XXXX"
                        spellCheck={false}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 9,
                          border: activateError ? "1px solid #f87171" : "1px solid #cbd5e1",
                          fontSize: 14,
                          fontFamily: "ui-monospace, monospace",
                          letterSpacing: 1,
                          textAlign: "center",
                          outline: "none",
                        }}
                      />
                      {activateError && (
                        <div style={{ fontSize: 12.5, color: "#dc2626", lineHeight: 1.45 }}>
                          {activateError}
                        </div>
                      )}
                      {slotsFull && (
                        <div
                          style={{
                            border: "1px solid #e2e8f0",
                            borderRadius: 9,
                            padding: "10px 12px",
                            textAlign: "left",
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                          }}
                        >
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a" }}>
                            Your activated devices
                          </div>
                          {devicesLoading ? (
                            <div style={{ fontSize: 12.5, color: "#64748b" }}>
                              Loading devices…
                            </div>
                          ) : devices !== null && devices.length > 0 ? (
                            devices.map((d) => (
                              <div
                                key={d.licenseId}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: 8,
                                }}
                              >
                                <div style={{ minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontSize: 13,
                                      fontWeight: 600,
                                      color: "#0f172a",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {d.deviceName || "Unknown device"}
                                  </div>
                                  <div style={{ fontSize: 11.5, color: "#64748b" }}>
                                    {[d.os, `activated ${new Date(d.activatedAt).toLocaleDateString()}`]
                                      .filter(Boolean)
                                      .join(" · ")}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => void deactivateDevice(d.licenseId)}
                                  disabled={deactivatingId !== null || activating}
                                  style={{
                                    padding: "6px 10px",
                                    borderRadius: 8,
                                    border: "1px solid #fca5a5",
                                    background: "#fff",
                                    color: deactivatingId !== null ? "#94a3b8" : "#dc2626",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: deactivatingId !== null ? "not-allowed" : "pointer",
                                    flexShrink: 0,
                                  }}
                                >
                                  {deactivatingId === d.licenseId
                                    ? "Deactivating…"
                                    : "Deactivate"}
                                </button>
                              </div>
                            ))
                          ) : devices !== null ? (
                            <div style={{ fontSize: 12.5, color: "#64748b", lineHeight: 1.5 }}>
                              {otherAccountSlots > 0
                                ? "All slots on this key are used by other accounts, so there's nothing you can free up from here."
                                : "No devices found for this key on your account."}
                            </div>
                          ) : null}
                          {devices !== null &&
                            devices.length > 0 &&
                            otherAccountSlots > 0 && (
                              <div style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.5 }}>
                                {otherAccountSlots === 1
                                  ? "1 more slot is used by another account."
                                  : `${otherAccountSlots} more slots are used by other accounts.`}
                              </div>
                            )}
                          {devicesError && (
                            <div style={{ fontSize: 12, color: "#dc2626" }}>{devicesError}</div>
                          )}
                          <div style={{ fontSize: 11.5, color: "#64748b", lineHeight: 1.5 }}>
                            Deactivating a device frees its slot and retries your key on this
                            device automatically.
                          </div>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => void activateKey()}
                        disabled={activating || offline}
                        style={{
                          padding: "10px 14px",
                          borderRadius: 9,
                          border: "none",
                          background: activating || offline ? "#94a3b8" : "#2563eb",
                          color: "#fff",
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: activating || offline ? "not-allowed" : "pointer",
                        }}
                      >
                        {activating ? "Activating…" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setKeyMode(false);
                          setKeyInput("");
                          setActivateError(null);
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
                        Back
                      </button>
                    </>
                  )}
                </>
              ) : promptMode === "upgrade" ? (
                <>
                  <button
                    type="button"
                    onClick={() => openSuitePath(PRICING_PATH)}
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
                    Upgrade — go to checkout
                  </button>
                  <button
                    type="button"
                    onClick={() => setKeyMode(true)}
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
                    Enter license key
                  </button>
                </>
              ) : (
                <>
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
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  stopDesktopFlow();
                  setPromptLabel(null);
                  setPromptMode("signin");
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
                {promptMode === "upgrade" ? "Not now" : "Keep reading without an account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthGateContext.Provider>
  );
}
