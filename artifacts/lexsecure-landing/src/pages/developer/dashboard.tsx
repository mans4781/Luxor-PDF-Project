import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  LayoutDashboard, KeyRound, Activity, ScrollText, Webhook, CreditCard,
  BookOpen, Settings, Search, Bell, ChevronDown, LogOut, Plus, Copy, Eye,
  EyeOff, RefreshCw, Trash2, ArrowUpRight, ArrowDownRight, Sparkles,
  CheckCircle2, AlertTriangle, XCircle, Globe, Zap, Server, Code, Download,
  MonitorDown, MapPin,
} from "lucide-react";
import { isDevAuthed, setDevAuthed } from "@/lib/devAuth";

type Section = "overview" | "downloads" | "keys" | "usage" | "logs" | "webhooks" | "billing" | "docs" | "settings";

// ── Mock data ────────────────────────────────────────────────────────────────
const REQUESTS_30D = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  const base = 1200 + Math.sin(i / 3) * 220 + i * 18;
  return {
    day: `${day}`,
    requests: Math.round(base + (Math.random() * 180 - 90)),
    errors: Math.round(40 + Math.random() * 30 + (i > 22 ? 25 : 0)),
  };
});

const STATUS_BREAKDOWN = [
  { code: "2xx", count: 38420, color: "#059669" },
  { code: "3xx", count: 1840, color: "#2563EB" },
  { code: "4xx", count: 920, color: "#D97706" },
  { code: "5xx", count: 142, color: "#DC2626" },
];

const TOP_ENDPOINTS = [
  { path: "/v2/documents",        method: "POST", calls: 18420, latency: 124 },
  { path: "/v2/documents/:id",    method: "GET",  calls: 14210, latency: 38 },
  { path: "/v2/signatures",       method: "POST", calls: 6420,  latency: 218 },
  { path: "/v2/expiry/policies",  method: "PUT",  calls: 2310,  latency: 64 },
  { path: "/v2/webhooks",         method: "POST", calls: 1180,  latency: 41 },
];

const INITIAL_KEYS = [
  { id: "k_live_1", name: "Production",  prefix: "sk_live_4f2a", created: "2025-09-12", lastUsed: "2 min ago",  scope: "full",  status: "active"  },
  { id: "k_live_2", name: "CI / Staging", prefix: "sk_test_9c7b", created: "2025-10-04", lastUsed: "1 hour ago", scope: "read",  status: "active"  },
  { id: "k_live_3", name: "Mobile SDK",   prefix: "sk_live_a13e", created: "2026-01-18", lastUsed: "3 days ago", scope: "scoped",status: "active"  },
  { id: "k_live_4", name: "Old key — Q4", prefix: "sk_live_77df", created: "2024-12-01", lastUsed: "5 mo ago",   scope: "full",  status: "revoked" },
];

const RECENT_LOGS = [
  { id: 1, time: "12:04:21", method: "POST", path: "/v2/documents",       status: 201, ms: 142, ip: "203.0.113.42" },
  { id: 2, time: "12:04:18", method: "GET",  path: "/v2/documents/abc12", status: 200, ms: 38,  ip: "203.0.113.42" },
  { id: 3, time: "12:04:11", method: "POST", path: "/v2/signatures",      status: 200, ms: 211, ip: "198.51.100.7" },
  { id: 4, time: "12:03:58", method: "POST", path: "/v2/documents",       status: 201, ms: 167, ip: "203.0.113.42" },
  { id: 5, time: "12:03:42", method: "GET",  path: "/v2/expiry/status",   status: 200, ms: 22,  ip: "192.0.2.18"   },
  { id: 6, time: "12:03:31", method: "POST", path: "/v2/documents",       status: 429, ms: 9,   ip: "198.51.100.7" },
  { id: 7, time: "12:03:14", method: "DELETE", path: "/v2/webhooks/wh_8", status: 204, ms: 51,  ip: "203.0.113.42" },
  { id: 8, time: "12:02:58", method: "POST", path: "/v2/signatures",      status: 500, ms: 982, ip: "198.51.100.7" },
];

const WEBHOOKS = [
  { id: "wh_1", url: "https://api.acme.io/hooks/luxor",  events: ["document.created", "document.signed"], status: "active",   delivered: 12480 },
  { id: "wh_2", url: "https://staging.acme.io/lx",        events: ["expiry.triggered"],                    status: "active",   delivered: 842   },
  { id: "wh_3", url: "https://hooks.zapier.com/x/9f3a",   events: ["document.viewed"],                     status: "paused",   delivered: 312   },
];

const NAV: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview",  label: "Overview",  icon: LayoutDashboard },
  { id: "downloads", label: "Downloads", icon: Download },
  { id: "keys",     label: "API Keys",  icon: KeyRound },
  { id: "usage",    label: "Usage",     icon: Activity },
  { id: "logs",     label: "Logs",      icon: ScrollText },
  { id: "webhooks", label: "Webhooks",  icon: Webhook },
  { id: "billing",  label: "Billing",   icon: CreditCard },
  { id: "docs",     label: "Docs",      icon: BookOpen },
  { id: "settings", label: "Settings",  icon: Settings },
];

// ── Component ────────────────────────────────────────────────────────────────
export default function DeveloperDashboardPage() {
  const [, setLocation] = useLocation();
  const [section, setSection] = useState<Section>("overview");
  const [userMenu, setUserMenu] = useState(false);

  // Gate: redirect to login if not authed
  useEffect(() => {
    if (!isDevAuthed()) setLocation("/developer/login");
  }, [setLocation]);

  function logout() {
    setDevAuthed(false);
    // Also drop any admin-console token held in this browser session so the
    // developer is fully logged out of every privileged surface.
    try {
      sessionStorage.removeItem("luxor_admin_token");
      sessionStorage.removeItem("luxor_admin_dev_preview");
    } catch {
      /* ignore */
    }
    // Hard navigation to the public homepage (not the login page), so no
    // in-memory dashboard state survives.
    window.location.href = "/";
  }

  // Auto-logout after 60 seconds of inactivity, for security.
  useEffect(() => {
    const INACTIVITY_LIMIT_MS = 60 * 1000;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (isDevAuthed()) logout();
      }, INACTIVITY_LIMIT_MS);
    };
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "wheel"] as const;
    for (const ev of events) window.addEventListener(ev, reset, { passive: true });
    reset();
    return () => {
      clearTimeout(timer);
      for (const ev of events) window.removeEventListener(ev, reset);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex">
      {/* ── Sidebar ────────────────────────────────────────────────── */}
      <aside className="w-60 bg-[#1e2130] text-slate-300 flex flex-col flex-shrink-0">
        <Link href="/" className="flex items-center gap-2.5 px-5 py-5 border-b border-white/5 group">
          <div className="w-9 h-9 rounded-[15%] bg-white border border-[#DC2626]/40 flex items-center justify-center">
            <span className="text-[#DC2626] font-extrabold text-sm">L</span>
          </div>
          <div className="leading-tight">
            <div className="text-[14px] font-bold text-white">Luxor PDF</div>
            <div className="text-[10px] tracking-[0.14em] uppercase text-slate-400 font-semibold">Developer</div>
          </div>
        </Link>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ id, label, icon: Icon }) => {
            const active = section === id;
            return (
              <button
                key={id}
                onClick={() => setSection(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#312E81] text-white shadow-sm"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-white/5">
          <div className="rounded-lg bg-white/5 border border-white/10 p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">Pro tip</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Rotate your live keys at least every 90 days. Set up CI to use a separate test key.
            </p>
          </div>
        </div>
      </aside>

      {/* ── Main column ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search endpoints, logs, keys…"
              className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
            <kbd className="hidden md:inline-flex px-1.5 py-0.5 rounded border border-slate-200 text-[10px] font-mono text-slate-500 bg-slate-50">
              ⌘K
            </kbd>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              All systems operational
            </span>
            <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <Bell className="w-4 h-4 text-slate-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#DC2626] rounded-full ring-2 ring-white" />
            </button>

            <div className="relative">
              <button
                onClick={() => setUserMenu((v) => !v)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#312E81] to-[#2563EB] flex items-center justify-center text-white text-xs font-bold">
                  D
                </div>
                <div className="hidden md:block text-left leading-tight">
                  <div className="text-[12px] font-semibold text-slate-900">Developer</div>
                  <div className="text-[10px] text-slate-500">dev@luxorpdf.com</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              {userMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-lg bg-white border border-slate-200 shadow-lg py-1 z-30">
                  <button
                    onClick={() => { setSection("settings"); setUserMenu(false); }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Settings className="w-4 h-4" /> Account settings
                  </button>
                  <button
                    onClick={logout}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {section === "overview"  && <OverviewPanel />}
          {section === "downloads" && <DownloadsPanel />}
          {section === "keys"      && <KeysPanel />}
          {section === "usage"     && <UsagePanel />}
          {section === "logs"      && <LogsPanel />}
          {section === "webhooks"  && <WebhooksPanel />}
          {section === "billing"   && <BillingPanel />}
          {section === "docs"      && <DocsPanel />}
          {section === "settings"  && <SettingsPanel onLogout={logout} />}
        </main>
      </div>
    </div>
  );
}

// ── Reusable bits ────────────────────────────────────────────────────────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function StatCard({
  label, value, delta, deltaPositive, icon: Icon, accent,
}: {
  label: string; value: string; delta: string; deltaPositive: boolean;
  icon: typeof LayoutDashboard; accent: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">{label}</span>
        <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent}`}>
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <div className="text-2xl font-bold text-slate-900 mb-1">{value}</div>
      <div className={`text-xs font-semibold flex items-center gap-1 ${deltaPositive ? "text-emerald-600" : "text-red-600"}`}>
        {deltaPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {delta} <span className="text-slate-400 font-normal">vs last week</span>
      </div>
    </Card>
  );
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Downloads panel (real data) ──────────────────────────────────────────────
type DownloadStats = {
  totals: { app: string; count: number }[];
  daily: { day: string; app: string; count: number }[];
  countries: { country: string | null; app: string; count: number }[];
  recent: { app: string; country: string | null; city: string | null; createdAt: string }[];
};

const APP_LABEL: Record<string, string> = {
  reader: "Luxor PDF Reader",
  secure: "Luxor PDF Secure",
};

function DownloadsPanel() {
  const [stats, setStats] = useState<DownloadStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = sessionStorage.getItem("luxor_admin_token") ?? "";
        const res = await fetch("/api/admin/downloads", {
          credentials: "include",
          headers: token ? { "x-admin-token": token } : undefined,
        });
        if (res.status === 401) {
          throw new Error(
            "Not authorized. Sign in on the Admin Console first (its session unlocks this data), then come back here.",
          );
        }
        if (!res.ok) throw new Error("Could not load download statistics.");
        const data = (await res.json()) as DownloadStats;
        if (!cancelled) setStats(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load download statistics.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const readerTotal = stats?.totals.find((t) => t.app === "reader")?.count ?? 0;
  const secureTotal = stats?.totals.find((t) => t.app === "secure")?.count ?? 0;

  const dailySeries = useMemo(() => {
    if (!stats) return [];
    const byDay = new Map<string, { day: string; reader: number; secure: number }>();
    for (const row of stats.daily) {
      const key = row.day;
      const entry = byDay.get(key) ?? { day: key, reader: 0, secure: 0 };
      if (row.app === "reader") entry.reader += row.count;
      else if (row.app === "secure") entry.secure += row.count;
      byDay.set(key, entry);
    }
    return Array.from(byDay.values())
      .sort((a, b) => a.day.localeCompare(b.day))
      .map((e) => ({ ...e, label: e.day.slice(5) }));
  }, [stats]);

  const countryRows = useMemo(() => {
    if (!stats) return [];
    const byCountry = new Map<string, { country: string; reader: number; secure: number; total: number }>();
    for (const row of stats.countries) {
      const key = row.country ?? "Unknown";
      const entry = byCountry.get(key) ?? { country: key, reader: 0, secure: 0, total: 0 };
      if (row.app === "reader") entry.reader += row.count;
      else if (row.app === "secure") entry.secure += row.count;
      entry.total += row.count;
      byCountry.set(key, entry);
    }
    return Array.from(byCountry.values()).sort((a, b) => b.total - a.total).slice(0, 12);
  }, [stats]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <SectionHeader
        title="Desktop app downloads"
        subtitle="Real installer downloads served through luxorpdf.com, with a coarse location for each download."
      />

      {loading && (
        <Card className="p-8 text-center text-sm text-slate-500">Loading download statistics…</Card>
      )}

      {!loading && error && (
        <Card className="p-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-slate-900 mb-1">Can't show download data</div>
              <p className="text-sm text-slate-600">{error}</p>
              <a
                href="/admin"
                className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-[#2563EB] hover:underline"
              >
                Open Admin Console <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </Card>
      )}

      {!loading && !error && stats && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Total downloads</span>
                <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#312E81]/10 text-[#312E81]">
                  <Download className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{(readerTotal + secureTotal).toLocaleString()}</div>
              <div className="text-xs text-slate-500 mt-1">All time, both apps</div>
            </Card>
            <Card className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Luxor PDF Reader</span>
                <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-red-50 text-[#DC2626]">
                  <MonitorDown className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{readerTotal.toLocaleString()}</div>
              <div className="text-xs text-slate-500 mt-1">Windows installer</div>
            </Card>
            <Card className="p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Luxor PDF Secure</span>
                <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#2563EB]/10 text-[#2563EB]">
                  <MonitorDown className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{secureTotal.toLocaleString()}</div>
              <div className="text-xs text-slate-500 mt-1">Windows installer</div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <Card className="p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Downloads · last 30 days</h3>
                  <p className="text-xs text-slate-500">Per app, per day</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#DC2626]" /> Reader</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#2563EB]" /> Secure</span>
                </div>
              </div>
              <div className="h-64">
                {dailySeries.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-slate-400">
                    No downloads recorded in the last 30 days yet.
                  </div>
                ) : (
                  <ResponsiveContainer>
                    <BarChart data={dailySeries} margin={{ top: 5, right: 8, left: -8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="reader" name="Reader" stackId="d" fill="#DC2626" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="secure" name="Secure" stackId="d" fill="#2563EB" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-900">Top locations</h3>
              </div>
              {countryRows.length === 0 ? (
                <p className="text-sm text-slate-400">No location data yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {countryRows.map((c) => (
                    <div key={c.country} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700 font-medium">{c.country}</span>
                      <span className="text-slate-500 tabular-nums">
                        {c.total.toLocaleString()}
                        <span className="text-slate-400 text-xs ml-1.5">({c.reader} R / {c.secure} S)</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-900">Recent downloads</h3>
            </div>
            {stats.recent.length === 0 ? (
              <p className="text-sm text-slate-400">
                No downloads yet. This list fills up as people download the desktop apps from luxorpdf.com.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                      <th className="py-2 pr-4 font-semibold">When</th>
                      <th className="py-2 pr-4 font-semibold">App</th>
                      <th className="py-2 font-semibold">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent.map((r, i) => (
                      <tr key={i} className="border-b border-slate-50 last:border-0">
                        <td className="py-2.5 pr-4 text-slate-600 whitespace-nowrap">
                          {new Date(r.createdAt).toLocaleString()}
                        </td>
                        <td className="py-2.5 pr-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            r.app === "reader" ? "bg-red-50 text-[#DC2626]" : "bg-[#2563EB]/10 text-[#2563EB]"
                          }`}>
                            {APP_LABEL[r.app] ?? r.app}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-600">
                          {[r.city, r.country].filter(Boolean).join(", ") || "Unknown"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </motion.div>
  );
}

// ── Panels ───────────────────────────────────────────────────────────────────
function OverviewPanel() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <SectionHeader
        title="Overview"
        subtitle="Real-time API health, traffic, and key metrics for the last 30 days."
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total requests" value="41,322" delta="+12.4%" deltaPositive icon={Activity} accent="bg-[#312E81]/10 text-[#312E81]" />
        <StatCard label="Success rate"   value="97.4%"  delta="+0.6%"  deltaPositive icon={CheckCircle2} accent="bg-emerald-50 text-emerald-600" />
        <StatCard label="Avg latency"    value="142 ms" delta="-8 ms"  deltaPositive icon={Zap} accent="bg-amber-50 text-amber-600" />
        <StatCard label="Active keys"    value="3"      delta="+1"     deltaPositive icon={KeyRound} accent="bg-[#2563EB]/10 text-[#2563EB]" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Requests · last 30 days</h3>
              <p className="text-xs text-slate-500">Successful vs error responses</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#2563EB]" /> Requests</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#DC2626]" /> Errors</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={REQUESTS_30D} margin={{ top: 5, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gReq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gErr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#DC2626" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#DC2626" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "white", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 8, fontSize: 12 }}
                  cursor={{ stroke: "rgba(0,0,0,0.1)" }}
                />
                <Area type="monotone" dataKey="requests" stroke="#2563EB" strokeWidth={2} fill="url(#gReq)" />
                <Area type="monotone" dataKey="errors"   stroke="#DC2626" strokeWidth={2} fill="url(#gErr)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Status codes</h3>
            <p className="text-xs text-slate-500">Last 30 days</p>
          </div>
          <div className="h-44 flex items-center justify-center">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={STATUS_BREAKDOWN} dataKey="count" nameKey="code" innerRadius={48} outerRadius={75} paddingAngle={3}>
                  {STATUS_BREAKDOWN.map((s) => <Cell key={s.code} fill={s.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "white", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-2">
            {STATUS_BREAKDOWN.map((s) => (
              <div key={s.code} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
                  <span className="font-mono font-semibold text-slate-700">{s.code}</span>
                </span>
                <span className="text-slate-500">{s.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Top endpoints + recent requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Top endpoints</h3>
          <div className="space-y-2.5">
            {TOP_ENDPOINTS.map((e) => (
              <div key={e.path} className="flex items-center gap-3">
                <MethodBadge method={e.method} />
                <code className="text-[12px] font-mono text-slate-700 flex-1 truncate">{e.path}</code>
                <span className="text-xs text-slate-500 tabular-nums">{e.calls.toLocaleString()}</span>
                <span className="text-xs text-slate-400 tabular-nums w-14 text-right">{e.latency} ms</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Recent requests</h3>
          <div className="space-y-1.5 text-[12px] font-mono">
            {RECENT_LOGS.slice(0, 6).map((l) => (
              <div key={l.id} className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-slate-50">
                <span className="text-slate-400 w-16">{l.time}</span>
                <MethodBadge method={l.method} />
                <span className="flex-1 truncate text-slate-700">{l.path}</span>
                <StatusBadge code={l.status} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </motion.div>
  );
}

function MethodBadge({ method }: { method: string }) {
  const styles: Record<string, string> = {
    GET:    "bg-emerald-50 text-emerald-700 border-emerald-200",
    POST:   "bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20",
    PUT:    "bg-amber-50 text-amber-700 border-amber-200",
    PATCH:  "bg-violet-50 text-violet-700 border-violet-200",
    DELETE: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={`inline-flex items-center justify-center w-14 px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border ${styles[method] ?? "bg-slate-100 text-slate-700 border-slate-200"}`}>
      {method}
    </span>
  );
}

function StatusBadge({ code }: { code: number }) {
  const cls = code >= 500 ? "bg-red-50 text-red-700 border-red-200"
    : code >= 400 ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-emerald-50 text-emerald-700 border-emerald-200";
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border tabular-nums ${cls}`}>
      {code}
    </span>
  );
}

// ── API Keys ─────────────────────────────────────────────────────────────────
function KeysPanel() {
  const [keys, setKeys] = useState(INITIAL_KEYS);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  function toggle(id: string) {
    setRevealed((r) => ({ ...r, [id]: !r[id] }));
  }
  function copy(id: string, prefix: string) {
    navigator.clipboard?.writeText(`${prefix}_${id}`).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }
  function revoke(id: string) {
    setKeys((k) => k.map((x) => x.id === id ? { ...x, status: "revoked" } : x));
  }
  function createKey() {
    const id = `k_live_${Date.now().toString(36)}`;
    setKeys((k) => [{
      id, name: "New key", prefix: "sk_live_" + Math.random().toString(36).slice(2, 6),
      created: new Date().toISOString().slice(0, 10), lastUsed: "just now",
      scope: "scoped", status: "active",
    }, ...k]);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <SectionHeader
        title="API Keys"
        subtitle="Create scoped keys for production, staging, and CI environments."
        action={
          <button
            onClick={createKey}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#312E81] hover:bg-[#3730A3] text-white text-sm font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create new key
          </button>
        }
      />

      <Card>
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/50">
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Token</th>
              <th className="px-5 py-3">Scope</th>
              <th className="px-5 py-3">Created</th>
              <th className="px-5 py-3">Last used</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                <td className="px-5 py-3 font-semibold text-slate-900">{k.name}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <code className="text-[12px] font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {revealed[k.id] ? `${k.prefix}_${k.id.slice(-8)}xxxx` : `${k.prefix}_••••••••`}
                    </code>
                    <button onClick={() => toggle(k.id)} className="text-slate-400 hover:text-slate-700">
                      {revealed[k.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => copy(k.id, k.prefix)} className="text-slate-400 hover:text-slate-700 relative">
                      <Copy className="w-3.5 h-3.5" />
                      {copied === k.id && (
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] bg-slate-900 text-white px-1.5 py-0.5 rounded">copied</span>
                      )}
                    </button>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 capitalize">
                    {k.scope}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-500 tabular-nums">{k.created}</td>
                <td className="px-5 py-3 text-slate-500">{k.lastUsed}</td>
                <td className="px-5 py-3">
                  {k.status === "active" ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-semibold border border-slate-200">
                      Revoked
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800" title="Rotate">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    {k.status === "active" && (
                      <button onClick={() => revoke(k.id)} className="p-1.5 rounded hover:bg-red-50 text-slate-500 hover:text-red-600" title="Revoke">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </motion.div>
  );
}

// ── Usage ────────────────────────────────────────────────────────────────────
function UsagePanel() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <SectionHeader title="Usage" subtitle="Detailed traffic and quota consumption for the current billing cycle." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <UsageBar label="Requests"         used={41322} limit={100000}   color="#2563EB" />
        <UsageBar label="Documents stored" used={1820}  limit={5000}     color="#312E81" />
        <UsageBar label="eSign envelopes"  used={342}   limit={1000}     color="#DC2626" />
      </div>

      <Card className="p-5 mb-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Daily request volume</h3>
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={REQUESTS_30D} margin={{ top: 5, right: 8, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "white", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 8, fontSize: 12 }} cursor={{ fill: "rgba(49,46,129,0.05)" }} />
              <Bar dataKey="requests" fill="#312E81" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Geographic distribution</h3>
        <div className="space-y-3">
          {[
            { country: "United States",  pct: 48 },
            { country: "United Kingdom", pct: 18 },
            { country: "Germany",        pct: 12 },
            { country: "India",          pct: 9  },
            { country: "Japan",          pct: 7  },
            { country: "Other",          pct: 6  },
          ].map((c) => (
            <div key={c.country}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-slate-700 flex items-center gap-1.5"><Globe className="w-3 h-3 text-slate-400" />{c.country}</span>
                <span className="text-slate-500 tabular-nums">{c.pct}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#312E81] to-[#2563EB]" style={{ width: `${c.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}

function UsageBar({ label, used, limit, color }: { label: string; used: number; limit: number; color: string }) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">{label}</span>
        <span className="text-[11px] text-slate-500 tabular-nums">{pct}%</span>
      </div>
      <div className="text-2xl font-bold text-slate-900 mb-3 tabular-nums">
        {used.toLocaleString()} <span className="text-sm font-normal text-slate-400">/ {limit.toLocaleString()}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </Card>
  );
}

// ── Logs ─────────────────────────────────────────────────────────────────────
function LogsPanel() {
  const [filter, setFilter] = useState<"all" | "errors">("all");
  const rows = useMemo(() => filter === "errors" ? RECENT_LOGS.filter((l) => l.status >= 400) : RECENT_LOGS, [filter]);
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <SectionHeader title="Request logs" subtitle="Live feed of API requests across all your keys." />

      <div className="mb-4 flex items-center gap-2">
        {(["all", "errors"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-colors ${
              filter === f ? "bg-[#312E81] text-white" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {f === "all" ? "All requests" : "Errors only"}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/50 text-left text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            <tr>
              <th className="px-5 py-3">Time</th>
              <th className="px-5 py-3">Method</th>
              <th className="px-5 py-3">Endpoint</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Latency</th>
              <th className="px-5 py-3">Source IP</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                <td className="px-5 py-3 text-slate-500 font-mono text-[12px]">{l.time}</td>
                <td className="px-5 py-3"><MethodBadge method={l.method} /></td>
                <td className="px-5 py-3 font-mono text-[12px] text-slate-700">{l.path}</td>
                <td className="px-5 py-3"><StatusBadge code={l.status} /></td>
                <td className="px-5 py-3 text-slate-700 tabular-nums">{l.ms} ms</td>
                <td className="px-5 py-3 text-slate-500 font-mono text-[12px]">{l.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </motion.div>
  );
}

// ── Webhooks ─────────────────────────────────────────────────────────────────
function WebhooksPanel() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <SectionHeader
        title="Webhooks"
        subtitle="Subscribe to real-time events from your account."
        action={
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#312E81] hover:bg-[#3730A3] text-white text-sm font-semibold shadow-sm">
            <Plus className="w-4 h-4" /> Add endpoint
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4">
        {WEBHOOKS.map((w) => (
          <Card key={w.id} className="p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Webhook className="w-4 h-4 text-[#2563EB]" />
                  <code className="text-[13px] font-mono text-slate-900 break-all">{w.url}</code>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {w.events.map((ev) => (
                    <span key={ev} className="text-[11px] px-2 py-0.5 rounded-full bg-[#312E81]/8 text-[#312E81] font-mono font-semibold">
                      {ev}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500"><span className="tabular-nums font-semibold text-slate-700">{w.delivered.toLocaleString()}</span> delivered</span>
                {w.status === "active" ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold border border-amber-200">
                    Paused
                  </span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}

// ── Billing ──────────────────────────────────────────────────────────────────
function BillingPanel() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <SectionHeader title="Billing" subtitle="Your current plan, usage charges, and invoice history." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="p-6 lg:col-span-2 bg-gradient-to-br from-[#312E81] to-[#3730A3] text-white border-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-white/70">Current plan</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/15 text-white font-semibold">Pro</span>
          </div>
          <div className="text-3xl font-bold mb-1">$199<span className="text-base font-normal text-white/70">/month</span></div>
          <p className="text-sm text-white/70 mb-5">Renews on May 28, 2026 · 100,000 requests included</p>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-lg bg-white text-[#312E81] text-sm font-semibold hover:bg-white/90">Upgrade plan</button>
            <button className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm font-semibold hover:bg-white/20">Manage</button>
          </div>
        </Card>

        <Card className="p-6">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">This cycle</span>
          <div className="text-3xl font-bold text-slate-900 mt-2 mb-1">$214.40</div>
          <p className="text-xs text-slate-500 mb-5">Estimated total · 12 days remaining</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between"><span className="text-slate-600">Base plan</span><span className="font-semibold tabular-nums">$199.00</span></div>
            <div className="flex items-center justify-between"><span className="text-slate-600">Overage (1,540 req)</span><span className="font-semibold tabular-nums">$15.40</span></div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900">Invoice history</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="text-left text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            <tr>
              <th className="px-5 py-3">Date</th><th className="px-5 py-3">Invoice</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {[
              { d: "Apr 28, 2026", i: "INV-1042", a: "$203.20", s: "Paid" },
              { d: "Mar 28, 2026", i: "INV-1031", a: "$199.00", s: "Paid" },
              { d: "Feb 28, 2026", i: "INV-1018", a: "$199.00", s: "Paid" },
              { d: "Jan 28, 2026", i: "INV-1004", a: "$199.00", s: "Paid" },
            ].map((r) => (
              <tr key={r.i} className="border-t border-slate-100">
                <td className="px-5 py-3 text-slate-700">{r.d}</td>
                <td className="px-5 py-3 font-mono text-[12px] text-slate-700">{r.i}</td>
                <td className="px-5 py-3 font-semibold tabular-nums">{r.a}</td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">{r.s}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </motion.div>
  );
}

// ── Docs ─────────────────────────────────────────────────────────────────────
function DocsPanel() {
  const links = [
    { icon: BookOpen, color: "text-[#2563EB] bg-[#2563EB]/10", title: "Getting started", desc: "Authenticate, make your first request, and handle errors." },
    { icon: Code,     color: "text-[#312E81] bg-[#312E81]/10", title: "API reference",   desc: "Every endpoint, parameter, and response code." },
    { icon: Webhook,  color: "text-emerald-600 bg-emerald-50", title: "Webhooks guide",  desc: "Subscribe to real-time document events." },
    { icon: Server,   color: "text-amber-600 bg-amber-50",     title: "SDKs & libraries", desc: "Official Node.js, Python, Go, and Ruby clients." },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <SectionHeader title="Documentation" subtitle="Everything you need to integrate with the Luxor PDF API." />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {links.map((l) => (
          <Card key={l.title} className="p-5 hover:shadow-md transition-shadow cursor-pointer">
            <span className={`inline-flex w-10 h-10 rounded-lg items-center justify-center mb-3 ${l.color}`}>
              <l.icon className="w-5 h-5" />
            </span>
            <h3 className="text-base font-semibold text-slate-900 mb-1">{l.title}</h3>
            <p className="text-sm text-slate-500">{l.desc}</p>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}

// ── Settings ─────────────────────────────────────────────────────────────────
function SettingsPanel({ onLogout }: { onLogout: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <SectionHeader title="Settings" subtitle="Manage your developer account and preferences." />

      <div className="space-y-4 max-w-2xl">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Profile</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Name"  defaultValue="Developer" />
            <Field label="Email" defaultValue="dev@luxorpdf.com" type="email" />
            <Field label="Company" defaultValue="Luxor PDF" />
            <Field label="Role"  defaultValue="Owner" />
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Notifications</h3>
          <div className="space-y-3">
            {[
              { l: "Weekly usage summary", on: true  },
              { l: "Failed webhook alerts", on: true  },
              { l: "Quota warnings (>80%)", on: true  },
              { l: "Product updates",       on: false },
            ].map((n) => (
              <label key={n.l} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{n.l}</span>
                <input type="checkbox" defaultChecked={n.on} className="w-4 h-4 rounded border-slate-300 text-[#312E81] focus:ring-[#312E81]/30" />
              </label>
            ))}
          </div>
        </Card>

        <Card className="p-5 border-red-200">
          <h3 className="text-sm font-semibold text-red-700 mb-1">Danger zone</h3>
          <p className="text-xs text-slate-500 mb-4">Sign out of the developer portal on this browser.</p>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </Card>
      </div>
    </motion.div>
  );
}

function Field({ label, defaultValue, type = "text" }: { label: string; defaultValue: string; type?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#312E81]/30 focus:border-[#312E81]"
      />
    </div>
  );
}
