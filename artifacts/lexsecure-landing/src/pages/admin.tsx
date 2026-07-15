import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const SIDEBAR_W = 220;

interface AdminStats {
  overview: {
    totalUsers: number; paidUsers: number; freeUsers: number;
    totalRevenue: Record<string, number>; monthRevenue: Record<string, number>;
    pageViews: number; totalPdfs: number; activePdfs: number;
    expiredPdfs: number; totalStorageBytes: number;
  };
  plans: Record<string, number>;
  monthlyData: { month: string; revenue: Record<string, number>; signups: number }[];
  topPages: { path: string; views: number }[];
  dailyViews: { day: string; views: number }[];
  recentActivity: { id: number; type: string; user: string; message: string; time: string }[];
}

type Section = "overview" | "users" | "customers" | "revenue" | "documents" | "pages" | "activity" | "settings";

interface AdminCustomer {
  userId: string;
  planName: string | null;
  tier: string | null;
  isPaid: boolean;
  accountStatus: string;
  lockReason: string | null;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  quotaOverrideSecure: number | null;
  monthlyUsed: number;
  monthlyLimit: number | null;
  monthlyRemaining: number | null;
  passwordProtectUsed: number;
  securePdfUsed: number;
  resetDate: string | null;
  createdAt: string;
}

// ── Theme ─────────────────────────────────────────────────────────────────────
function makeTheme(dark: boolean) {
  return {
    pageBg:      dark ? "#0f0f13"                      : "#f0f2f7",
    sidebarBg:   dark ? "#13131a"                      : "#1e2130",
    headerBg:    dark ? "#16161e"                      : "#ffffff",
    headerBorder:dark ? "rgba(255,255,255,0.07)"       : "rgba(0,0,0,0.08)",
    cardBg:      dark ? "rgba(255,255,255,0.04)"       : "#ffffff",
    cardBorder:  dark ? "rgba(255,255,255,0.08)"       : "rgba(0,0,0,0.09)",
    text:        dark ? "#ffffff"                      : "#111827",
    textMuted:   dark ? "#888"                         : "#6b7280",
    textFaint:   dark ? "#444"                         : "#9ca3af",
    textSub:     dark ? "#555"                         : "#9ca3af",
    divider:     dark ? "rgba(255,255,255,0.06)"       : "rgba(0,0,0,0.07)",
    btnBg:       dark ? "rgba(255,255,255,0.06)"       : "rgba(0,0,0,0.05)",
    btnBorder:   dark ? "rgba(255,255,255,0.1)"        : "rgba(0,0,0,0.12)",
    btnColor:    dark ? "#aaa"                         : "#555",
    chartGrid:   dark ? "rgba(255,255,255,0.05)"       : "rgba(0,0,0,0.06)",
    chartTick:   dark ? "#555"                         : "#9ca3af",
    tooltipBg:   dark ? "#1a1a22"                      : "#ffffff",
    tooltipBorder:dark ? "rgba(255,255,255,0.1)"       : "rgba(0,0,0,0.1)",
    avatarBg:    dark ? "rgba(79,142,247,0.12)"        : "rgba(79,142,247,0.08)",
    barTrack:    dark ? "rgba(255,255,255,0.06)"       : "rgba(0,0,0,0.06)",
    navActive:   dark ? "rgba(79,142,247,0.18)"        : "rgba(79,142,247,0.12)",
    navHover:    dark ? "rgba(255,255,255,0.05)"       : "rgba(255,255,255,0.06)",
    navText:     "#c8ccd8",
    navTextActive:"#4f8ef7",
  };
}
type Theme = ReturnType<typeof makeTheme>;

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
function fmtBytes(b: number) {
  if (b >= 1024 ** 3) return `${(b / 1024 ** 3).toFixed(2)} GB`;
  if (b >= 1024 ** 2) return `${(b / 1024 ** 2).toFixed(2)} MB`;
  if (b >= 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${b} B`;
}

const PIE_COLORS = ["#6366f1", "#4f8ef7", "#10b981", "#a78bfa", "#f59e0b", "#ef4444", "#374151"];

const CURRENCY_SYMBOL: Record<string, string> = { USD: "$", INR: "₹", EUR: "€", GBP: "£" };

/** Formats a { CUR: amount } record like "$120 + ₹4,300"; "$0" when empty. */
function fmtMoney(rec: Record<string, number> | undefined | null) {
  const entries = Object.entries(rec ?? {}).filter(([, v]) => v > 0);
  if (entries.length === 0) return "$0";
  return entries
    .map(([cur, v]) => `${CURRENCY_SYMBOL[cur] ?? `${cur} `}${Math.round(v).toLocaleString()}`)
    .join(" + ");
}

/** Flattens monthlyData for charts: one numeric column per currency + signups. */
function monthlyChartData(monthlyData: AdminStats["monthlyData"]) {
  return monthlyData.map(m => ({
    month: m.month,
    USD: Math.round(m.revenue["USD"] ?? 0),
    INR: Math.round(m.revenue["INR"] ?? 0),
    signups: m.signups,
  }));
}

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days < 30 ? `${days}d ago` : new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = "#4f8ef7", icon, t }: {
  label: string; value: string; sub?: string; color?: string; icon: string; t: Theme;
}) {
  return (
    <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 12, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ color: t.textMuted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.7px" }}>{label}</span>
        <span style={{ fontSize: 19 }}>{icon}</span>
      </div>
      <div style={{ color: t.text, fontSize: 26, fontWeight: 700, letterSpacing: "-0.5px" }}>{value}</div>
      {sub && <div style={{ color, fontSize: 12, fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ title, sub, t }: { title: string; sub?: string; t: Theme }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, marginBottom: 4, color: t.text }}>{title}</h2>
      {sub && <p style={{ color: t.textSub, fontSize: 13, margin: 0 }}>{sub}</p>}
    </div>
  );
}

function Card({ children, t, style }: { children: React.ReactNode; t: Theme; style?: React.CSSProperties }) {
  return (
    <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 12, padding: 20, ...style }}>
      {children}
    </div>
  );
}

function ActivityBadge({ type }: { type: string }) {
  const cfg: Record<string, { label: string; bg: string; color: string }> = {
    signup:  { label: "New User", bg: "rgba(16,185,129,0.15)",  color: "#10b981" },
    upgrade: { label: "Upgrade",  bg: "rgba(79,142,247,0.15)",  color: "#4f8ef7" },
    cancel:  { label: "Cancel",   bg: "rgba(239,68,68,0.15)",   color: "#ef4444" },
  };
  const c = cfg[type] ?? { label: type, bg: "rgba(150,150,150,0.15)", color: "#aaa" };
  return <span style={{ background: c.bg, color: c.color, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{c.label}</span>;
}

function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} title={dark ? "Light mode" : "Dark mode"} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 18, padding: "4px 10px 4px 7px", cursor: "pointer" }}>
      <div style={{ width: 30, height: 16, borderRadius: 8, background: dark ? "#4f8ef7" : "#d1d5db", position: "relative", flexShrink: 0 }}>
        <div style={{ position: "absolute", top: 2, left: dark ? 16 : 2, width: 12, height: 12, borderRadius: "50%", background: "#fff", transition: "left 0.18s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
      </div>
      <span style={{ fontSize: 12, color: "#ccc", fontWeight: 500 }}>{dark ? "🌙" : "☀️"}</span>
    </button>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
const NAV_ITEMS: { id: Section; label: string; icon: string; badge?: string }[] = [
  { id: "overview",   label: "Overview",   icon: "📊" },
  { id: "users",      label: "Users",      icon: "👥" },
  { id: "customers",  label: "Customers",  icon: "🪪" },
  { id: "revenue",    label: "Revenue",    icon: "💰" },
  { id: "documents",  label: "Documents",  icon: "📄" },
  { id: "pages",      label: "Pages",      icon: "📈" },
  { id: "activity",   label: "Activity",   icon: "🔔" },
  { id: "settings",   label: "Settings",   icon: "⚙️" },
];

function Sidebar({ active, onSelect, onLogout, t }: {
  active: Section; onSelect: (s: Section) => void; onLogout: () => void; t: Theme;
}) {
  return (
    <div style={{
      width: SIDEBAR_W, flexShrink: 0,
      background: t.sidebarBg,
      borderRight: "1px solid rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column",
      height: "100%", overflow: "hidden",
    }}>
      {/* Logo */}
      <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 30, height: 30, background: "#4f8ef7", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#fff", flexShrink: 0 }}>L</div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>Luxor Admin</div>
            <div style={{ color: "#555", fontSize: 10 }}>Analytics</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
        <div style={{ color: "#3a3d52", fontSize: 10, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", padding: "0 8px", marginBottom: 6 }}>Menu</div>
        {NAV_ITEMS.map(item => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "9px 10px", borderRadius: 8, border: "none",
                background: isActive ? t.navActive : "transparent",
                color: isActive ? t.navTextActive : t.navText,
                cursor: "pointer", fontSize: 13, fontWeight: isActive ? 600 : 400,
                marginBottom: 2, transition: "background 0.12s",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{ background: "#4f8ef7", color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "1px 6px", minWidth: 18, textAlign: "center" }}>
                  {item.badge}
                </span>
              )}
              {isActive && <span style={{ width: 3, height: 16, background: "#4f8ef7", borderRadius: 2, flexShrink: 0 }} />}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "rgba(255,255,255,0.04)", borderRadius: 8, marginBottom: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#4f8ef7", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, color: "#fff", flexShrink: 0 }}>A</div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ color: "#ccc", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Admin</div>
            <div style={{ color: "#444", fontSize: 10 }}>Super Admin</div>
          </div>
        </div>
        <button onClick={onLogout} style={{ width: "100%", padding: "8px 10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          🔓 Logout
        </button>
      </div>
    </div>
  );
}

// ── Section: Overview ─────────────────────────────────────────────────────────
function OverviewSection({ stats, t }: { stats: AdminStats; t: Theme }) {
  const [activeChart, setActiveChart] = useState<"revenue"|"signups">("revenue");
  const { overview, plans, monthlyData } = stats;
  const chartData = monthlyChartData(monthlyData);
  const pieData = Object.entries(plans)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));
  const totalPlanUsers = pieData.reduce((a, d) => a + d.value, 0);

  return (
    <div>
      <SectionTitle title="Overview" sub="Platform-wide metrics at a glance" t={t} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 12, marginBottom: 24 }}>
        <StatCard label="Total Users"       value={fmt(overview.totalUsers)}          sub={`${overview.paidUsers} paid · ${overview.freeUsers} free`} icon="👥" color="#10b981" t={t} />
        <StatCard label="Revenue (Month)"   value={fmtMoney(overview.monthRevenue)}   sub="This calendar month"    icon="💰" color="#10b981" t={t} />
        <StatCard label="Revenue (Total)"   value={fmtMoney(overview.totalRevenue)}   sub="All recorded payments"  icon="🏦" t={t} />
        <StatCard label="Page Views"        value={fmt(overview.pageViews)}           sub="All-time tracked"       icon="👁️" t={t} />
        <StatCard label="Active PDFs"       value={String(overview.activePdfs)}       sub={`${overview.expiredPdfs} expired`} icon="📄" t={t} />
        <StatCard label="Storage Used"      value={fmtBytes(overview.totalStorageBytes)} sub="Secure uploads"      icon="🗄️" t={t} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
        <Card t={t}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: t.text }}>12-Month Trend</span>
            <div style={{ display: "flex", gap: 5 }}>
              {(["revenue","signups"] as const).map(k => (
                <button key={k} onClick={() => setActiveChart(k)} style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, border: `1px solid ${t.cardBorder}`, background: activeChart === k ? "rgba(79,142,247,0.2)" : "transparent", color: activeChart === k ? "#4f8ef7" : t.textSub, cursor: "pointer" }}>
                  {k.charAt(0).toUpperCase() + k.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="aGradU" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f8ef7" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="aGradI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} />
              <XAxis dataKey="month" tick={{ fill: t.chartTick, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: t.chartTick, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: 8 }} labelStyle={{ color: t.text }} />
              {activeChart === "revenue" ? (
                <>
                  <Area type="monotone" dataKey="USD" stroke="#4f8ef7" strokeWidth={2} fill="url(#aGradU)" name="USD ($)" />
                  <Area type="monotone" dataKey="INR" stroke="#10b981" strokeWidth={2} fill="url(#aGradI)" name="INR (₹)" />
                </>
              ) : (
                <Area type="monotone" dataKey="signups" stroke="#10b981" strokeWidth={2} fill="url(#aGradI)" name="Signups" />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card t={t}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, color: t.text }}>Plan Breakdown</div>
          {pieData.length === 0 ? (
            <div style={{ color: t.textMuted, fontSize: 13, padding: "20px 0" }}>No users yet.</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={68} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: 8 }} itemStyle={{ color: t.text }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 10 }}>
                {pieData.map((d, i) => (
                  <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 9, height: 9, borderRadius: "50%", background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span style={{ color: t.textMuted, fontSize: 12, textTransform: "capitalize" }}>{d.name}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <span style={{ color: t.text, fontSize: 12, fontWeight: 600 }}>{d.value.toLocaleString()}</span>
                      <span style={{ color: t.textSub, fontSize: 11 }}>{totalPlanUsers ? Math.round(d.value / totalPlanUsers * 100) : 0}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

// ── Section: Users ────────────────────────────────────────────────────────────
function UsersSection({ stats, t }: { stats: AdminStats; t: Theme }) {
  const { overview, plans, monthlyData } = stats;
  const chartData = monthlyChartData(monthlyData);
  const planEntries = Object.entries(plans).sort((a, b) => b[1] - a[1]);
  const totalPlanUsers = planEntries.reduce((a, [, v]) => a + v, 0);
  const monthSignups = monthlyData[monthlyData.length - 1]?.signups ?? 0;

  return (
    <div>
      <SectionTitle title="Users" sub="Subscriber breakdown by plan" t={t} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 12, marginBottom: 24 }}>
        <StatCard label="Total Users" value={fmt(overview.totalUsers)} sub={`+${monthSignups} this month`} icon="👥" color="#10b981" t={t} />
        <StatCard label="Paid Users"  value={fmt(overview.paidUsers)}  sub={totalPlanUsers ? `${Math.round(overview.paidUsers / totalPlanUsers * 100)}% of users` : undefined} icon="💳" color="#4f8ef7" t={t} />
        <StatCard label="Free Users"  value={fmt(overview.freeUsers)}  sub={totalPlanUsers ? `${Math.round(overview.freeUsers / totalPlanUsers * 100)}% of users` : undefined} icon="🆓" t={t} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card t={t}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, color: t.text }}>Signups per Month</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} />
              <XAxis dataKey="month" tick={{ fill: t.chartTick, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: t.chartTick, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: 8 }} labelStyle={{ color: t.text }} />
              <Line type="monotone" dataKey="signups" stroke="#10b981" strokeWidth={2} dot={false} name="Signups" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card t={t}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, color: t.text }}>Plan Distribution</div>
          {planEntries.length === 0 ? (
            <div style={{ color: t.textMuted, fontSize: 13, padding: "20px 0" }}>No users yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={planEntries.map(([name, value]) => ({ name, value }))} cx="50%" cy="50%" outerRadius={75} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {planEntries.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
      <Card t={t}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, color: t.text }}>Users by Plan</div>
        {planEntries.length === 0 ? (
          <div style={{ color: t.textMuted, fontSize: 13, padding: "12px 0" }}>No users yet — plan counts will appear as accounts are created.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {planEntries.map(([name, count], i) => (
              <div key={name}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ color: t.text, fontSize: 13, textTransform: "capitalize" }}>{name}</span>
                  <span style={{ color: t.textMuted, fontSize: 13 }}>{count.toLocaleString()} users · {totalPlanUsers ? Math.round(count / totalPlanUsers * 100) : 0}%</span>
                </div>
                <div style={{ height: 6, background: t.barTrack, borderRadius: 3 }}>
                  <div style={{ width: `${totalPlanUsers ? Math.round(count / totalPlanUsers * 100) : 0}%`, height: "100%", background: PIE_COLORS[i % PIE_COLORS.length], borderRadius: 3, transition: "width 0.5s" }} />
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ color: t.textFaint, fontSize: 11, marginTop: 12 }}>Per-user details are in the Customers tab.</div>
      </Card>
    </div>
  );
}

// ── Section: Customers (plan, monthly quota, override) ────────────────────────
function CustomersSection({ token, onLogout, t }: { token: string; onLogout: () => void; t: Theme }) {
  const [customers, setCustomers] = useState<AdminCustomer[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/customers", { headers: { "x-admin-token": token } });
      if (res.status === 401 || res.status === 403) { onLogout(); return; }
      if (!res.ok) { setError("Failed to load customers."); setLoading(false); return; }
      const data = (await res.json()) as { customers: AdminCustomer[] };
      setCustomers(data.customers);
      setLoading(false);
    } catch {
      setError("Failed to load customers.");
      setLoading(false);
    }
  }, [token, onLogout]);

  useEffect(() => { void load(); }, [load]);

  const saveOverride = async (userId: string) => {
    const raw = (drafts[userId] ?? "").trim();
    let override: number | null;
    if (raw === "" || raw.toLowerCase() === "default") {
      override = null;
    } else if (raw.toLowerCase() === "unlimited" || raw === "-1") {
      override = -1;
    } else {
      const n = Number(raw);
      if (!Number.isInteger(n) || n < -1) {
        setError(`Invalid override "${raw}" — use a number, -1/unlimited, or blank for default.`);
        return;
      }
      override = n;
    }
    setSavingId(userId);
    setError("");
    try {
      const res = await fetch("/api/admin/customers/quota-override", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": token },
        body: JSON.stringify({ userId, override }),
      });
      if (res.status === 401 || res.status === 403) { onLogout(); return; }
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? "Failed to save override.");
        return;
      }
      const data = (await res.json()) as { customer: AdminCustomer };
      setCustomers(prev => prev ? prev.map(c => c.userId === userId ? data.customer : c) : prev);
      setDrafts(prev => { const next = { ...prev }; delete next[userId]; return next; });
    } catch {
      setError("Failed to save override.");
    } finally {
      setSavingId(null);
    }
  };

  const tierBadge = (tier: string | null, planName: string | null) => {
    const label = planName ?? (tier ? tier : "No plan");
    const c: Record<string, string> = {
      individual: "#4f8ef7", team: "#10b981", business: "#a78bfa", enterprise: "#f59e0b",
    };
    const color = (tier && c[tier]) || "#6b7280";
    return <span style={{ background: `${color}22`, color, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>{label}</span>;
  };

  const quotaCell = (c: AdminCustomer) => {
    if (c.monthlyLimit === null) {
      return <span style={{ color: "#10b981", fontWeight: 600 }}>∞ Unlimited</span>;
    }
    const used = c.monthlyUsed;
    const remaining = c.monthlyRemaining ?? 0;
    const low = remaining <= 0;
    return (
      <span style={{ color: low ? "#ef4444" : t.text, fontWeight: 600 }}>
        {used} / {c.monthlyLimit}{" "}
        <span style={{ color: t.textMuted, fontWeight: 400 }}>({remaining} left)</span>
      </span>
    );
  };

  const overrideLabel = (v: number | null) =>
    v === null ? "tier default" : v === -1 ? "unlimited" : String(v);

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  const list = customers ?? [];
  const paidCount = list.filter(c => c.isPaid).length;
  const overrideCount = list.filter(c => c.quotaOverrideSecure !== null).length;
  const atLimitCount = list.filter(c => c.monthlyLimit !== null && (c.monthlyRemaining ?? 0) <= 0).length;

  return (
    <div>
      <SectionTitle title="Customers" sub="Per-customer plan, shared monthly secure-feature usage, and manual quota overrides" t={t} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 22 }}>
        <StatCard label="Customers"     value={fmt(list.length)}    icon="🪪" t={t} />
        <StatCard label="Paid"          value={fmt(paidCount)}      sub="active plans"     icon="💳" color="#10b981" t={t} />
        <StatCard label="Overrides"     value={fmt(overrideCount)}  sub="manual quotas"    icon="🛠️" color="#a78bfa" t={t} />
        <StatCard label="At Limit"      value={fmt(atLimitCount)}   sub="quota exhausted"  icon="⛔" color="#ef4444" t={t} />
      </div>

      <Card t={t}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: t.text }}>All Customers</div>
          <button onClick={() => { void load(); }} style={{ background: "rgba(79,142,247,0.12)", border: "1px solid rgba(79,142,247,0.25)", borderRadius: 8, color: "#4f8ef7", fontSize: 12, fontWeight: 600, padding: "6px 12px", cursor: "pointer" }}>↺ Refresh</button>
        </div>

        {error && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 10 }}>{error}</div>}

        {loading ? (
          <div style={{ color: "#4f8ef7", fontSize: 13, padding: "20px 0" }}>Loading customers…</div>
        ) : list.length === 0 ? (
          <div style={{ color: t.textMuted, fontSize: 13, padding: "20px 0" }}>No customers yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${t.divider}` }}>
                  {["User", "Plan", "Secure usage (mo.)", "Pwd / Expiry", "Override", "Resets", "Set override"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "6px 10px 10px", color: t.textMuted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((c, i) => (
                  <tr key={c.userId} style={{ borderBottom: i < list.length - 1 ? `1px solid ${t.divider}` : "none" }}>
                    <td style={{ padding: "10px", color: t.text, fontFamily: "monospace", fontSize: 12, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={c.userId}>{c.userId}</td>
                    <td style={{ padding: "10px" }}>{tierBadge(c.tier, c.planName)}</td>
                    <td style={{ padding: "10px" }}>{quotaCell(c)}</td>
                    <td style={{ padding: "10px", color: t.textMuted }}>{c.passwordProtectUsed} / {c.securePdfUsed}</td>
                    <td style={{ padding: "10px", color: c.quotaOverrideSecure !== null ? "#a78bfa" : t.textMuted, fontWeight: c.quotaOverrideSecure !== null ? 600 : 400 }}>{overrideLabel(c.quotaOverrideSecure)}</td>
                    <td style={{ padding: "10px", color: t.textMuted, whiteSpace: "nowrap" }}>{fmtDate(c.resetDate)}</td>
                    <td style={{ padding: "10px" }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input
                          value={drafts[c.userId] ?? ""}
                          onChange={e => setDrafts(prev => ({ ...prev, [c.userId]: e.target.value }))}
                          onKeyDown={e => { if (e.key === "Enter") void saveOverride(c.userId); }}
                          placeholder={overrideLabel(c.quotaOverrideSecure)}
                          style={{ width: 78, padding: "5px 8px", background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 6, color: t.text, fontSize: 12, outline: "none" }}
                        />
                        <button
                          onClick={() => { void saveOverride(c.userId); }}
                          disabled={savingId === c.userId}
                          style={{ background: "#4f8ef7", border: "none", borderRadius: 6, color: "#fff", fontSize: 12, fontWeight: 600, padding: "5px 10px", cursor: savingId === c.userId ? "not-allowed" : "pointer", opacity: savingId === c.userId ? 0.6 : 1, whiteSpace: "nowrap" }}
                        >
                          {savingId === c.userId ? "…" : "Save"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ color: t.textFaint, fontSize: 11, marginTop: 12 }}>
              Override accepts a number (monthly secure allowance), <strong>-1</strong> or <strong>unlimited</strong>, or blank/<strong>default</strong> to revert to the plan tier default.
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Section: Revenue ──────────────────────────────────────────────────────────
function RevenueSection({ stats, t }: { stats: AdminStats; t: Theme }) {
  const { overview, monthlyData } = stats;
  const chartData = monthlyChartData(monthlyData);
  return (
    <div>
      <SectionTitle title="Revenue" sub="Real payments recorded from Stripe and Razorpay" t={t} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 24 }}>
        <StatCard label="Revenue This Month" value={fmtMoney(overview.monthRevenue)} sub="Current calendar month" icon="💰" color="#10b981" t={t} />
        <StatCard label="Total Revenue"      value={fmtMoney(overview.totalRevenue)} sub="All recorded payments"  icon="🏦" t={t} />
        <StatCard label="Paying Customers"   value={fmt(overview.paidUsers)}         sub="Active paid plans"      icon="💳" color="#4f8ef7" t={t} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card t={t}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, color: t.text }}>Monthly Revenue (12 mo)</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="rGradU" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f8ef7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="rGradI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} />
              <XAxis dataKey="month" tick={{ fill: t.chartTick, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: t.chartTick, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: 8 }} labelStyle={{ color: t.text }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="USD" stroke="#4f8ef7" strokeWidth={2} fill="url(#rGradU)" name="USD ($)" />
              <Area type="monotone" dataKey="INR" stroke="#10b981" strokeWidth={2} fill="url(#rGradI)" name="INR (₹)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card t={t}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, color: t.text }}>Last 6 Months</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData.slice(-6)} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} />
              <XAxis dataKey="month" tick={{ fill: t.chartTick, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: t.chartTick, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: 8 }} labelStyle={{ color: t.text }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="USD" fill="#4f8ef7" radius={[4, 4, 0, 0]} name="USD ($)" />
              <Bar dataKey="INR" fill="#10b981" radius={[4, 4, 0, 0]} name="INR (₹)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <Card t={t}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, color: t.text }}>Total Revenue by Currency</div>
        {Object.keys(overview.totalRevenue).length === 0 ? (
          <div style={{ color: t.textMuted, fontSize: 13, padding: "12px 0" }}>No payments recorded yet — completed Stripe/Razorpay payments will appear here.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {Object.entries(overview.totalRevenue).map(([cur, amount], i) => (
              <div key={cur} style={{ background: `${PIE_COLORS[i % PIE_COLORS.length]}12`, border: `1px solid ${PIE_COLORS[i % PIE_COLORS.length]}30`, borderRadius: 10, padding: "16px 18px" }}>
                <div style={{ color: PIE_COLORS[i % PIE_COLORS.length], fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{cur}</div>
                <div style={{ color: t.text, fontSize: 22, fontWeight: 700 }}>{fmtMoney({ [cur]: amount })}</div>
                <div style={{ color: t.textMuted, fontSize: 12, marginTop: 4 }}>this month: {fmtMoney({ [cur]: overview.monthRevenue[cur] ?? 0 })}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Section: Documents ────────────────────────────────────────────────────────
function DocumentsSection({ stats, t }: { stats: AdminStats; t: Theme }) {
  const { overview, dailyViews } = stats;
  return (
    <div>
      <SectionTitle title="Documents" sub="PDF processing and storage metrics" t={t} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        <StatCard label="Total PDFs"    value={String(overview.totalPdfs)}           sub="All time"             icon="📄" t={t} />
        <StatCard label="Active PDFs"   value={String(overview.activePdfs)}          sub="Not yet expired"      icon="✅" color="#10b981" t={t} />
        <StatCard label="Expired PDFs"  value={String(overview.expiredPdfs)}         sub="Past expiry date"     icon="⏰" color="#f59e0b" t={t} />
        <StatCard label="Storage Used"  value={fmtBytes(overview.totalStorageBytes)} sub="Across all uploads"   icon="🗄️" t={t} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card t={t}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, color: t.text }}>Site Traffic (last 30 days)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyViews} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} />
              <XAxis dataKey="day" tick={{ fill: t.chartTick, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(d: string) => d.slice(5)} />
              <YAxis tick={{ fill: t.chartTick, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: 8 }} labelStyle={{ color: t.text }} />
              <Bar dataKey="views" fill="#a78bfa" radius={[4, 4, 0, 0]} name="Page views" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card t={t}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, color: t.text }}>Active vs Expired</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={[{ name: "Active", value: overview.activePdfs || 1 }, { name: "Expired", value: overview.expiredPdfs || 0 }]}
                cx="50%" cy="50%" outerRadius={80} paddingAngle={3} dataKey="value"
              >
                <Cell fill="#10b981" />
                <Cell fill="#f59e0b" />
              </Pie>
              <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: 8 }} />
              <Legend wrapperStyle={{ color: t.textMuted, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

// ── Section: Pages (real traffic) ─────────────────────────────────────────────
function PagesSection({ stats, t }: { stats: AdminStats; t: Theme }) {
  const { topPages, dailyViews } = stats;
  const totalViews = topPages.reduce((a, p) => a + p.views, 0);
  return (
    <div>
      <SectionTitle title="Pages" sub="Daily visitors per page — last 30 days" t={t} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card t={t}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: t.text }}>Top Pages</div>
          {topPages.length === 0 ? (
            <div style={{ color: t.textMuted, fontSize: 13, padding: "12px 0" }}>No page views recorded yet. Views appear here as visitors browse the live site.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {topPages.map((p, i) => {
                const pct = totalViews ? Math.round((p.views / totalViews) * 100) : 0;
                return (
                  <div key={p.path}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <span style={{ color: t.textSub, fontSize: 12, width: 18, textAlign: "right", fontWeight: 600, flexShrink: 0 }}>{i + 1}</span>
                        <span style={{ color: t.text, fontSize: 13, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.path}>{p.path}</span>
                      </div>
                      <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
                        <span style={{ color: t.textMuted, fontSize: 13 }}>{p.views.toLocaleString()} views</span>
                        <span style={{ color: t.textSub, fontSize: 12, width: 34, textAlign: "right", fontWeight: 600 }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: 6, background: t.barTrack, borderRadius: 3 }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: PIE_COLORS[i % PIE_COLORS.length], borderRadius: 3, transition: "width 0.5s" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
        <Card t={t}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, color: t.text }}>Daily Views</div>
          {dailyViews.length === 0 ? (
            <div style={{ color: t.textMuted, fontSize: 13, padding: "12px 0" }}>No traffic yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={dailyViews} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="pvGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f8ef7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} />
                <XAxis dataKey="day" tick={{ fill: t.chartTick, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(d: string) => d.slice(5)} />
                <YAxis tick={{ fill: t.chartTick, fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: t.tooltipBg, border: `1px solid ${t.tooltipBorder}`, borderRadius: 8 }} labelStyle={{ color: t.text }} />
                <Area type="monotone" dataKey="views" stroke="#4f8ef7" strokeWidth={2} fill="url(#pvGrad)" name="Views" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}

// ── Section: Activity ─────────────────────────────────────────────────────────
function ActivitySection({ stats, t }: { stats: AdminStats; t: Theme }) {
  const { recentActivity } = stats;
  return (
    <div>
      <SectionTitle title="Activity" sub="Real-time user events and notifications" t={t} />
      <Card t={t}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16, color: t.text }}>Recent Events</div>
        {recentActivity.length === 0 ? (
          <div style={{ color: t.textMuted, fontSize: 13, padding: "12px 0" }}>No account events yet — signups, plan changes, and license events will appear here.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {recentActivity.map((a, i) => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i < recentActivity.length - 1 ? `1px solid ${t.divider}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: t.avatarBg, display: "flex", alignItems: "center", justifyContent: "center", color: "#4f8ef7", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                    {(a.user || "?").charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: t.text, fontSize: 13, fontWeight: 500, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 320 }} title={a.user}>{a.user}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                      <ActivityBadge type={a.type} />
                      {a.message && <span style={{ color: t.textSub, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 380 }} title={a.message}>{a.message}</span>}
                    </div>
                  </div>
                </div>
                <span style={{ color: t.textFaint, fontSize: 12, flexShrink: 0 }}>{timeAgo(a.time)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Section: Settings ─────────────────────────────────────────────────────────
function SettingsSection({ dark, onToggleDark, onLogout, t }: { dark: boolean; onToggleDark: () => void; onLogout: () => void; t: Theme }) {
  return (
    <div>
      <SectionTitle title="Settings" sub="Admin preferences and configuration" t={t} />
      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 560 }}>
        <Card t={t}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, color: t.text }}>Appearance</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0" }}>
            <div>
              <div style={{ color: t.text, fontSize: 13, fontWeight: 500 }}>Theme</div>
              <div style={{ color: t.textMuted, fontSize: 12 }}>Switch between dark and light mode</div>
            </div>
            <ThemeToggle dark={dark} onToggle={onToggleDark} />
          </div>
        </Card>
        <Card t={t}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, color: t.text }}>Account</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${t.divider}`, marginBottom: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#4f8ef7", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, color: "#fff" }}>A</div>
            <div>
              <div style={{ color: t.text, fontSize: 14, fontWeight: 600 }}>Admin</div>
              <div style={{ color: t.textMuted, fontSize: 12 }}>Super Admin · Full access</div>
            </div>
          </div>
          <button onClick={onLogout} style={{ padding: "9px 20px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, color: "#ef4444", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            🔓 Logout
          </button>
        </Card>
        <Card t={t}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14, color: t.text }}>API Access</div>
          <div style={{ color: t.textMuted, fontSize: 12, marginBottom: 10 }}>Admin API token (read-only display)</div>
          <div style={{ background: t.barTrack, borderRadius: 6, padding: "8px 12px", fontFamily: "monospace", fontSize: 12, color: t.textFaint, letterSpacing: "0.5px" }}>
            luxor-admin-****
          </div>
        </Card>
        <Card t={t}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: t.text }}>Data</div>
          <div style={{ color: t.textMuted, fontSize: 12, marginBottom: 12 }}>Analytics data refreshes on every page load.</div>
          <button onClick={() => window.location.reload()} style={{ padding: "8px 18px", background: t.btnBg, border: `1px solid ${t.btnBorder}`, borderRadius: 8, color: t.text, fontSize: 13, cursor: "pointer" }}>
            ↺ Refresh Data
          </button>
        </Card>
      </div>
    </div>
  );
}

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
        <div style={{ width: 44, height: 44, background: "#4f8ef7", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 20, color: "#fff" }}>L</div>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>Luxor Admin</div>
          <div style={{ color: "#555", fontSize: 12 }}>Analytics Dashboard</div>
        </div>
      </div>
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "36px 40px", width: 340, animation: shake ? "shake 0.4s ease" : undefined }}>
        {step === "credentials" ? (
          <>
            <div style={{ color: "#ccc", fontSize: 14, marginBottom: 16, textAlign: "center" }}>Sign in with your admin account</div>
            <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }} placeholder="Email" autoFocus autoComplete="username" style={inputStyle} />
            <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(""); }} onKeyDown={e => { if (e.key === "Enter") { void submitCredentials(); } }} placeholder="Password" autoComplete="current-password" style={inputStyle} />
            {error && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 10 }}>{error}</div>}
            <button onClick={() => { void submitCredentials(); }} disabled={loading} style={{ width: "100%", padding: "11px", background: "#4f8ef7", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>{loading ? "Checking…" : "Continue"}</button>
          </>
        ) : (
          <>
            <div style={{ color: "#fff", fontSize: 17, fontWeight: 700, marginBottom: 6, textAlign: "center" }}>Welcome, Admin</div>
            <div style={{ color: "#ccc", fontSize: 13, marginBottom: 16, textAlign: "center" }}>Enter your developer passphrase to continue</div>
            <input type="password" value={pin} onChange={e => { setPin(e.target.value); setError(""); }} onKeyDown={e => { if (e.key === "Enter") { void submitPassphrase(); } }} placeholder="Developer passphrase" autoFocus style={inputStyle} />
            {error && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 10 }}>{error}</div>}
            <button onClick={() => { void submitPassphrase(); }} disabled={loading} style={{ width: "100%", padding: "11px", background: "#4f8ef7", border: "none", borderRadius: 8, color: "#fff", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>{loading ? "Verifying…" : "Unlock Dashboard"}</button>
            <button onClick={() => { setStep("credentials"); setPin(""); setError(""); }} disabled={loading} style={{ width: "100%", padding: "9px", background: "transparent", border: "none", color: "#888", fontSize: 12, cursor: "pointer", marginTop: 8 }}>← Back to sign in</button>
          </>
        )}
      </div>
      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }`}</style>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
function Dashboard({ onLogout, dark, onToggleDark, token }: { onLogout: () => void; dark: boolean; onToggleDark: () => void; token: string }) {
  const [section, setSection] = useState<Section>("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const t = makeTheme(dark);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/stats", { headers: { "x-admin-token": token } });
        if (cancelled) return;
        if (res.status === 401 || res.status === 403) {
          onLogout();
          return;
        }
        if (!res.ok) {
          setError("Failed to load analytics.");
          setLoading(false);
          return;
        }
        const data = (await res.json()) as AdminStats;
        if (cancelled) return;
        setStats(data);
        setLoading(false);
      } catch {
        if (cancelled) return;
        setError("Failed to load analytics.");
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token, onLogout]);

  const sectionLabel = NAV_ITEMS.find(n => n.id === section)?.label ?? "";

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: t.pageBg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", transition: "background 0.2s" }}>
      <Sidebar active={section} onSelect={setSection} onLogout={onLogout} t={t} />

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top header */}
        <div style={{ height: 54, flexShrink: 0, background: t.headerBg, borderBottom: `1px solid ${t.headerBorder}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", transition: "background 0.2s" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: t.textSub, fontSize: 13 }}>Admin</span>
            <span style={{ color: t.textFaint, fontSize: 13 }}>›</span>
            <span style={{ color: t.text, fontSize: 13, fontWeight: 600 }}>{sectionLabel}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: t.textSub, fontSize: 12 }}>
              {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            <ThemeToggle dark={dark} onToggle={onToggleDark} />
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60%", color: "#4f8ef7", fontSize: 14 }}>Loading analytics…</div>
          ) : error || !stats ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60%", color: "#ef4444", fontSize: 14 }}>{error || "No data"}</div>
          ) : (
            <>
              {section === "overview"  && <OverviewSection  stats={stats} t={t} />}
              {section === "users"     && <UsersSection     stats={stats} t={t} />}
              {section === "customers" && <CustomersSection token={token} onLogout={onLogout} t={t} />}
              {section === "revenue"   && <RevenueSection   stats={stats} t={t} />}
              {section === "documents" && <DocumentsSection stats={stats} t={t} />}
              {section === "pages"     && <PagesSection     stats={stats} t={t} />}
              {section === "activity"  && <ActivitySection  stats={stats} t={t} />}
              {section === "settings"  && <SettingsSection  dark={dark} onToggleDark={onToggleDark} onLogout={onLogout} t={t} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page Root ─────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem("luxor_admin_token") ?? "");
  const [dark, setDark] = useState(() => localStorage.getItem("luxor_admin_theme") !== "light");

  const handleUnlock = useCallback((t: string) => { sessionStorage.setItem("luxor_admin_token", t); setToken(t); }, []);
  const handleLogout = useCallback(() => { sessionStorage.removeItem("luxor_admin_token"); setToken(""); }, []);
  const handleToggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("luxor_admin_theme", next ? "dark" : "light");
  };

  if (!token) return <LoginScreen onUnlock={handleUnlock} />;
  return <Dashboard token={token} onLogout={handleLogout} dark={dark} onToggleDark={handleToggleDark} />;
}
