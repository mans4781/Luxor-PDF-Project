import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { AdminStats } from "@/components/admin/types";
import { adminApi, isUnauthorized, DEV_PREVIEW_TOKEN, DEV_SESSION_TOKEN } from "@/components/admin/api";
import { ConsoleShell, NAV_ITEMS, type ConsoleSection } from "@/components/admin/shell";
import { DashboardPage } from "@/components/admin/pages/dashboard";
import { RevenuePage } from "@/components/admin/pages/revenue";
import { UsersPage } from "@/components/admin/pages/users";
import { LicensesPage } from "@/components/admin/pages/licenses";
import { OffersPage } from "@/components/admin/pages/offers";
import { ReferralsPage } from "@/components/admin/pages/referrals";
import { ProductsPage } from "@/components/admin/pages/products";
import { AnalyticsPage } from "@/components/admin/pages/analytics";
import { FreeToolsAnalyticsPage } from "@/components/admin/pages/free-tools-analytics";
import { DownloadsPage } from "@/components/admin/pages/downloads";
import { TicketsPage } from "@/components/admin/pages/tickets";
import { ReportsPage } from "@/components/admin/pages/reports";
import { IntegrationsPage } from "@/components/admin/pages/integrations";
import { SettingsPage } from "@/components/admin/pages/settings";
import NotFound from "@/pages/not-found";
import { goToSignIn } from "@/lib/authUrls";
import { LuxorClerkProvider } from "@workspace/luxor-auth-ui";
import { publishableKeyFromHost } from "@clerk/react/internal";

// Clerk must run on this page: the admin console authorizes developer
// sessions via the short-lived Clerk session cookie, and only clerk-js
// keeps that cookie refreshed. Without it, every admin API call starts
// failing ~1 minute after sign-in ("session no longer valid" on any click).
const clerkPubKey = publishableKeyFromHost(
  typeof window !== "undefined" ? window.location.hostname : "",
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

// ── Console ───────────────────────────────────────────────────────────────────
function Console({
  token,
  onLogout,
  onAuthError,
}: {
  token: string;
  /** Manual sign-out (shell menu / settings). */
  onLogout: () => void;
  /** A 401/403 from an admin API — the session expired mid-use. */
  onAuthError: () => void;
}) {
  const [section, setSection] = useState<ConsoleSection>(() => {
    const wanted = new URLSearchParams(window.location.search).get("section");
    return wanted && NAV_ITEMS.some((n) => n.id === wanted)
      ? (wanted as ConsoleSection)
      : "dashboard";
  });
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError("");
    adminApi
      .stats(token)
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isUnauthorized(err)) onAuthError();
        else setError("Failed to load console data.");
      });
    return () => {
      cancelled = true;
    };
  }, [token, onAuthError, retryKey]);

  const searchIndex = useMemo(
    () => [
      ...NAV_ITEMS.map((n) => ({ group: "Sections", label: n.label, target: n.id })),
      { group: "Actions", label: "Generate license key", target: "licenses" as ConsoleSection },
      { group: "Actions", label: "Create offer", target: "offers" as ConsoleSection },
      { group: "Actions", label: "Export revenue report", target: "reports" as ConsoleSection },
      { group: "Actions", label: "Set user quota override", target: "users" as ConsoleSection },
      { group: "Actions", label: "Grant referral reward", target: "referrals" as ConsoleSection },
      { group: "Actions", label: "View audit log", target: "reports" as ConsoleSection },
    ],
    [],
  );

  const handleQuickAction = useCallback((action: string) => {
    switch (action) {
      case "Create License Key":
        setSection("licenses");
        break;
      case "Launch Offer":
        setSection("offers");
        break;
      case "Add User":
        setSection("users");
        toast.info("Users register themselves via sign-up; manage existing accounts here.");
        break;
      case "Export Revenue Report":
        setSection("reports");
        break;
    }
  }, []);

  const statsSections: ConsoleSection[] = ["dashboard", "revenue", "products", "analytics", "reports"];

  const body = () => {
    if (!stats && statsSections.includes(section)) {
      if (error) {
        return (
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-sm text-red-500">
            {error}
            <button
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => setRetryKey((k) => k + 1)}
            >
              Retry
            </button>
          </div>
        );
      }
      return (
        <div className="flex h-64 items-center justify-center text-sm text-[#2563EB]">
          Loading console data…
        </div>
      );
    }
    switch (section) {
      case "dashboard":
        return <DashboardPage stats={stats!} />;
      case "revenue":
        return <RevenuePage stats={stats!} />;
      case "users":
        return <UsersPage token={token} onLogout={onAuthError} />;
      case "licenses":
        return <LicensesPage token={token} onLogout={onAuthError} />;
      case "offers":
        return <OffersPage />;
      case "referrals":
        return <ReferralsPage />;
      case "products":
        return <ProductsPage stats={stats!} />;
      case "analytics":
        return <AnalyticsPage stats={stats!} token={token} onLogout={onAuthError} />;
      case "free-tools-analytics":
        return <FreeToolsAnalyticsPage token={token} onLogout={onAuthError} />;
      case "downloads":
        return <DownloadsPage token={token} onLogout={onAuthError} />;
      case "tickets":
        return <TicketsPage token={token} onLogout={onAuthError} />;
      case "reports":
        return <ReportsPage stats={stats!} token={token} onLogout={onAuthError} />;
      case "integrations":
        return <IntegrationsPage />;
      case "settings":
        return <SettingsPage onLogout={onLogout} />;
    }
  };

  return (
    <ConsoleShell
      active={section}
      onSelect={setSection}
      onLogout={onLogout}
      onQuickAction={handleQuickAction}
      searchIndex={searchIndex}
    >
      {body()}
    </ConsoleShell>
  );
}

// ── Page Root ─────────────────────────────────────────────────────────────────
export default function AdminPage() {
  // Keep the console usable even if the key is somehow missing (e.g. a build
  // without the env var): fall back to rendering without Clerk rather than
  // crashing the page.
  if (!clerkPubKey) return <AdminPageInner />;
  return (
    <LuxorClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl}>
      <AdminPageInner />
    </LuxorClerkProvider>
  );
}

function AdminPageInner() {
  const [token, setToken] = useState(() => {
    // Dev-only preview entry (?dev=1 from the footer). Never active in production builds.
    if (import.meta.env.DEV) {
      if (new URLSearchParams(window.location.search).has("dev")) {
        sessionStorage.setItem("luxor_admin_dev_preview", "1");
      }
      if (sessionStorage.getItem("luxor_admin_dev_preview") === "1") {
        return DEV_PREVIEW_TOKEN;
      }
    }
    return sessionStorage.getItem("luxor_admin_token") ?? "";
  });

  const isPreview = import.meta.env.DEV && token === DEV_PREVIEW_TOKEN;

  // A developer who signed in and passed the two-passphrase step gets the
  // console directly — no separate admin email/password login. We probe the
  // server once; on success the sentinel token unlocks the console and the
  // server authorizes each request via the session cookie.
  const [probing, setProbing] = useState(() => !token);
  useEffect(() => {
    if (token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/session", {
          credentials: "include",
          signal: AbortSignal.timeout(8000),
        });
        if (!cancelled && res.ok) {
          setToken(DEV_SESSION_TOKEN);
          return;
        }
      } catch {
        // Not a developer session — fall through to the login screen.
      }
      if (!cancelled) setProbing(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // True when a signed-in admin was kicked out by a 401/403 mid-use. In that
  // case we show a "session expired" prompt instead of the intruder-disguise
  // 404 — the admin already proved they know the console exists, so the
  // disguise only confuses them. Fresh visitors still get the 404.
  const [sessionExpired, setSessionExpired] = useState(false);

  // Manual sign-out (shell menu / settings): clear the unlock and re-probe.
  // If the developer session is still valid the probe silently re-unlocks
  // the console; otherwise the page renders as a plain 404.
  const handleLogout = useCallback(() => {
    sessionStorage.removeItem("luxor_admin_token");
    sessionStorage.removeItem("luxor_admin_dev_preview");
    setSessionExpired(false);
    setToken("");
    setProbing(true);
  }, []);

  // A 401/403 from an admin API while the console was open. Re-probe first —
  // if the 401 was transient the console silently re-unlocks; if the probe
  // also fails, the render below shows the session-expired prompt.
  const handleAuthError = useCallback(() => {
    sessionStorage.removeItem("luxor_admin_token");
    sessionStorage.removeItem("luxor_admin_dev_preview");
    setSessionExpired(true);
    setToken("");
    setProbing(true);
  }, []);

  if (!token && probing) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0f13", display: "flex", alignItems: "center", justifyContent: "center", color: "#888", fontSize: 14 }}>
        Checking access…
      </div>
    );
  }
  // A legitimate admin whose session just expired gets a clear prompt —
  // never the intruder-disguise 404 they'd mistake for a broken page.
  if (!token && sessionExpired) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0f0f13",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          color: "#d4d4d8",
          fontSize: 14,
          textAlign: "center",
          padding: 24,
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 600, color: "#fafafa" }}>
          Session expired
        </div>
        <div style={{ maxWidth: 360, color: "#a1a1aa" }}>
          Your admin session is no longer valid. Sign in again to get back to
          the console.
        </div>
        <button
          onClick={() => goToSignIn("/lx-console")}
          style={{
            marginTop: 8,
            borderRadius: 8,
            border: "1px solid #3f3f46",
            background: "#2563EB",
            color: "#fff",
            padding: "8px 20px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Sign in again
        </button>
      </div>
    );
  }
  // No login form here: without a verified admin session this page is
  // indistinguishable from a missing page.
  if (!token) return <NotFound />;
  return (
    <>
      {isPreview && (
        <div className="sticky top-0 z-50 bg-amber-400 px-4 py-1.5 text-center text-xs font-semibold text-amber-950">
          Developer preview — sample data, no login. This mode exists only in development builds.
        </div>
      )}
      <Console token={token} onLogout={handleLogout} onAuthError={handleAuthError} />
    </>
  );
}
