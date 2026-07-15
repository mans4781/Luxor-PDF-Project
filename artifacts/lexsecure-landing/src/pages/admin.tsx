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
import { TicketsPage } from "@/components/admin/pages/tickets";
import { ReportsPage } from "@/components/admin/pages/reports";
import { IntegrationsPage } from "@/components/admin/pages/integrations";
import { SettingsPage } from "@/components/admin/pages/settings";

// ── Login Screen (two-step: email+password, then developer passphrase) ──────
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "#fff",
  fontSize: 15, outline: "none", marginBottom: 12, boxSizing: "border-box",
};

function LoginScreen({ onUnlock }: { onUnlock: (token: string) => void }) {
  const [step, setStep] = useState<"credentials" | "passphrase">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);

  const fail = (msg: string) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const submitCredentials = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        setError("");
        setStep("passphrase");
      } else if (res.status === 429) {
        fail("Too many attempts. Try again later.");
      } else {
        fail("Incorrect email or password");
        setPassword("");
      }
    } catch {
      setError("Unable to reach server. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitPassphrase = async () => {
    if (!pin) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, passphrase: pin }),
      });
      if (res.ok) {
        const data = await res.json() as { token: string };
        onUnlock(data.token);
      } else if (res.status === 429) {
        fail("Too many attempts. Try again later.");
      } else {
        fail("Incorrect passphrase");
        setPin("");
      }
    } catch {
      setError("Unable to reach server. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f13", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{ width: 44, height: 44, background: "linear-gradient(135deg,#2563EB,#6D5DFB)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, color: "#fff" }}>L</div>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>Luxor PDF Admin</div>
          <div style={{ color: "#555", fontSize: 12 }}>Developer Console</div>
        </div>
      </div>
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "36px 40px", width: 340, animation: shake ? "shake 0.4s ease" : undefined }}>
        {step === "credentials" ? (
          <>
            <div style={{ color: "#ccc", fontSize: 14, marginBottom: 16, textAlign: "center" }}>Sign in with your admin account</div>
            <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }} placeholder="Email" autoFocus autoComplete="username" style={inputStyle} />
            <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(""); }} onKeyDown={e => { if (e.key === "Enter") { void submitCredentials(); } }} placeholder="Password" autoComplete="current-password" style={inputStyle} />
            {error && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 10 }}>{error}</div>}
            <button onClick={() => { void submitCredentials(); }} disabled={loading} style={{ width: "100%", padding: "11px", background: "#2563EB", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>{loading ? "Checking…" : "Continue"}</button>
          </>
        ) : (
          <>
            <div style={{ color: "#fff", fontSize: 17, fontWeight: 700, marginBottom: 6, textAlign: "center" }}>Welcome, Admin</div>
            <div style={{ color: "#ccc", fontSize: 13, marginBottom: 16, textAlign: "center" }}>Enter your developer passphrase to continue</div>
            <input type="password" value={pin} onChange={e => { setPin(e.target.value); setError(""); }} onKeyDown={e => { if (e.key === "Enter") { void submitPassphrase(); } }} placeholder="Developer passphrase" autoFocus style={inputStyle} />
            {error && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 10 }}>{error}</div>}
            <button onClick={() => { void submitPassphrase(); }} disabled={loading} style={{ width: "100%", padding: "11px", background: "#2563EB", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>{loading ? "Verifying…" : "Unlock Console"}</button>
            <button onClick={() => { setStep("credentials"); setPin(""); setError(""); }} disabled={loading} style={{ width: "100%", padding: "9px", background: "transparent", border: "none", color: "#888", fontSize: 12, cursor: "pointer", marginTop: 8 }}>← Back to sign in</button>
          </>
        )}
      </div>
      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }`}</style>
    </div>
  );
}

// ── Console ───────────────────────────────────────────────────────────────────
function Console({ token, onLogout }: { token: string; onLogout: () => void }) {
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
        if (isUnauthorized(err)) onLogout();
        else setError("Failed to load console data.");
      });
    return () => {
      cancelled = true;
    };
  }, [token, onLogout, retryKey]);

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
        return <UsersPage token={token} onLogout={onLogout} />;
      case "licenses":
        return <LicensesPage token={token} onLogout={onLogout} />;
      case "offers":
        return <OffersPage />;
      case "referrals":
        return <ReferralsPage />;
      case "products":
        return <ProductsPage stats={stats!} />;
      case "analytics":
        return <AnalyticsPage stats={stats!} token={token} onLogout={onLogout} />;
      case "tickets":
        return <TicketsPage token={token} onLogout={onLogout} />;
      case "reports":
        return <ReportsPage stats={stats!} token={token} onLogout={onLogout} />;
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

  const handleUnlock = useCallback((t: string) => {
    sessionStorage.setItem("luxor_admin_token", t);
    setToken(t);
  }, []);
  const handleLogout = useCallback(() => {
    sessionStorage.removeItem("luxor_admin_token");
    sessionStorage.removeItem("luxor_admin_dev_preview");
    if (token === DEV_SESSION_TOKEN) {
      // Session-based unlock can't be "logged out" here (the sign-in session
      // lives in the PDF app) — send the developer back to their dashboard.
      window.location.href = "/pdf-expiry/dashboard";
      return;
    }
    setToken("");
  }, [token]);

  if (!token && probing) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0f13", display: "flex", alignItems: "center", justifyContent: "center", color: "#888", fontSize: 14 }}>
        Checking access…
      </div>
    );
  }
  if (!token) return <LoginScreen onUnlock={handleUnlock} />;
  return (
    <>
      {isPreview && (
        <div className="sticky top-0 z-50 bg-amber-400 px-4 py-1.5 text-center text-xs font-semibold text-amber-950">
          Developer preview — sample data, no login. This mode exists only in development builds.
        </div>
      )}
      <Console token={token} onLogout={handleLogout} />
    </>
  );
}
