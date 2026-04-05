import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const ADMIN_TOKEN = "luxor-admin-2024";
const LOCK_PIN = "luxor2024";

interface AdminStats {
  overview: {
    totalUsers: number;
    monthlyRevenue: number;
    annualRevenue: number;
    pageViews: number;
    totalPdfs: number;
    activePdfs: number;
    expiredPdfs: number;
    totalStorageBytes: number;
    avgRevenuePerUser: number;
    churnRate: number;
    nps: number;
    supportTickets: number;
  };
  plans: { free: number; pro: number; enterprise: number };
  monthlyData: { month: string; revenue: number; users: number; documents: number }[];
  recentActivity: { id: number; type: string; user: string; plan: string; time: string }[];
  topCountries: { country: string; users: number; pct: number }[];
}

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

const PIE_COLORS = ["#6366f1", "#4f8ef7", "#10b981"];

function StatCard({
  label, value, sub, color = "#4f8ef7", icon,
}: {
  label: string; value: string; sub?: string; color?: string; icon: string;
}) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 12,
      padding: "20px 22px",
      display: "flex",
      flexDirection: "column",
      gap: 8,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ color: "#888", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.6px" }}>{label}</span>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div style={{ color: "#fff", fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px" }}>{value}</div>
      {sub && <div style={{ color: color, fontSize: 12, fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

function ActivityBadge({ type }: { type: string }) {
  const cfg: Record<string, { label: string; bg: string; color: string }> = {
    signup: { label: "New User", bg: "rgba(16,185,129,0.15)", color: "#10b981" },
    upgrade: { label: "Upgrade", bg: "rgba(79,142,247,0.15)", color: "#4f8ef7" },
    cancel: { label: "Cancel", bg: "rgba(239,68,68,0.15)", color: "#ef4444" },
  };
  const c = cfg[type] ?? { label: type, bg: "rgba(255,255,255,0.08)", color: "#aaa" };
  return (
    <span style={{ background: c.bg, color: c.color, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>
      {c.label}
    </span>
  );
}

// ── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const submit = () => {
    if (pin === LOCK_PIN) {
      onUnlock();
    } else {
      setError("Incorrect passphrase");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPin("");
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0f0f13",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 24,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div style={{
          width: 44, height: 44, background: "#4f8ef7", borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: 20, color: "#fff",
        }}>L</div>
        <div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>Luxor Admin</div>
          <div style={{ color: "#555", fontSize: 12 }}>Analytics Dashboard</div>
        </div>
      </div>

      <div style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: "36px 40px",
        width: 340,
        animation: shake ? "shake 0.4s ease" : undefined,
      }}>
        <div style={{ color: "#ccc", fontSize: 14, marginBottom: 16, textAlign: "center" }}>
          Enter admin passphrase to continue
        </div>
        <input
          type="password"
          value={pin}
          onChange={e => { setPin(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="Passphrase"
          autoFocus
          style={{
            width: "100%", padding: "10px 14px",
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 8, color: "#fff", fontSize: 15,
            outline: "none", marginBottom: 12, boxSizing: "border-box",
          }}
        />
        {error && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 10 }}>{error}</div>}
        <button
          onClick={submit}
          style={{
            width: "100%", padding: "11px",
            background: "#4f8ef7", border: "none",
            borderRadius: 8, color: "#fff", fontSize: 14,
            fontWeight: 600, cursor: "pointer",
          }}
        >
          Unlock Dashboard
        </button>
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeChart, setActiveChart] = useState<"revenue" | "users" | "documents">("revenue");

  useEffect(() => {
    fetch("/api/admin/stats", {
      headers: { "x-admin-token": ADMIN_TOKEN },
    })
      .then(r => r.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load analytics data.");
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0f0f13", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#4f8ef7", fontSize: 14 }}>Loading analytics…</div>
    </div>
  );

  if (error || !stats) return (
    <div style={{ minHeight: "100vh", background: "#0f0f13", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#ef4444", fontSize: 14 }}>{error || "No data"}</div>
    </div>
  );

  const { overview, plans, monthlyData, recentActivity, topCountries } = stats;

  const pieData = [
    { name: "Free", value: plans.free },
    { name: "Pro", value: plans.pro },
    { name: "Enterprise", value: plans.enterprise },
  ];

  const chartKey = activeChart;
  const chartColor = { revenue: "#4f8ef7", users: "#10b981", documents: "#a78bfa" }[chartKey];
  const chartLabel = { revenue: "Revenue ($)", users: "New Users", documents: "Documents" }[chartKey];

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f13", color: "#fff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>

      {/* Header */}
      <div style={{
        background: "#16161e", borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "0 32px", height: 58,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: "#4f8ef7", borderRadius: 7,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 15, color: "#fff",
          }}>L</div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Luxor Admin</span>
          <span style={{
            background: "rgba(79,142,247,0.15)", color: "#4f8ef7",
            borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600,
          }}>Analytics</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ color: "#555", fontSize: 12 }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </span>
          <button
            onClick={onLogout}
            style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6, color: "#aaa", fontSize: 12, padding: "5px 12px",
              cursor: "pointer",
            }}
          >
            Lock
          </button>
        </div>
      </div>

      <div style={{ padding: "28px 32px", maxWidth: 1300, margin: "0 auto" }}>

        {/* Title row */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, marginBottom: 4 }}>Analytics Overview</h1>
          <p style={{ color: "#555", fontSize: 13, margin: 0 }}>All metrics across the Luxor PDF platform</p>
        </div>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 14, marginBottom: 28 }}>
          <StatCard label="Total Users" value={fmt(overview.totalUsers)} sub={`+${fmt(83)} this month`} icon="👥" color="#10b981" />
          <StatCard label="Monthly Revenue" value={`$${overview.monthlyRevenue.toLocaleString()}`} sub="↑ 14% vs last month" icon="💰" color="#10b981" />
          <StatCard label="Annual Revenue" value={`$${overview.annualRevenue.toLocaleString()}`} sub="Projected ARR" icon="📈" />
          <StatCard label="Page Views" value={fmt(overview.pageViews)} sub="Unique visitors tracked" icon="👁️" />
          <StatCard label="Avg Revenue/User" value={`$${overview.avgRevenuePerUser}`} sub="ARPU — Pro + Enterprise" icon="💳" />
          <StatCard label="Churn Rate" value={`${overview.churnRate}%`} sub="Monthly churn — healthy" icon="📉" color="#10b981" />
          <StatCard label="NPS Score" value={String(overview.nps)} sub="Excellent (>70)" icon="⭐" color="#f59e0b" />
          <StatCard label="PDFs Processed" value={String(overview.totalPdfs)} sub={`${overview.activePdfs} active · ${overview.expiredPdfs} expired`} icon="📄" />
          <StatCard label="Storage Used" value={fmtBytes(overview.totalStorageBytes)} sub="Across all uploads" icon="🗄️" />
          <StatCard label="Support Tickets" value={String(overview.supportTickets)} sub="Open tickets" icon="🎟️" color={overview.supportTickets > 10 ? "#ef4444" : "#10b981"} />
        </div>

        {/* Charts row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, marginBottom: 28 }}>

          {/* Area / Bar chart */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12, padding: "20px 20px 10px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>12-Month Trend</div>
              <div style={{ display: "flex", gap: 6 }}>
                {(["revenue","users","documents"] as const).map(k => (
                  <button
                    key={k}
                    onClick={() => setActiveChart(k)}
                    style={{
                      padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: activeChart === k ? "rgba(79,142,247,0.2)" : "transparent",
                      color: activeChart === k ? "#4f8ef7" : "#666",
                      cursor: "pointer",
                    }}
                  >{k.charAt(0).toUpperCase() + k.slice(1)}</button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: "#555", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#555", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#1a1a22", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                  labelStyle={{ color: "#fff" }}
                  itemStyle={{ color: chartColor }}
                  formatter={(v: any) => chartKey === "revenue" ? [`$${v.toLocaleString()}`, chartLabel] : [v.toLocaleString(), chartLabel]}
                />
                <Area type="monotone" dataKey={chartKey} stroke={chartColor} strokeWidth={2} fill="url(#cGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Plan breakdown pie */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12, padding: "20px",
          }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Plan Breakdown</div>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#1a1a22", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                  itemStyle={{ color: "#fff" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
              {pieData.map((d, i) => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: PIE_COLORS[i], flexShrink: 0 }} />
                    <span style={{ color: "#aaa", fontSize: 12 }}>{d.name}</span>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{d.value.toLocaleString()}</span>
                    <span style={{ color: "#555", fontSize: 11 }}>
                      {Math.round(d.value / Object.values(plans).reduce((a,b) => a+b, 0) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          {/* Recent activity */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12, padding: "20px",
          }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Recent Activity</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {recentActivity.map((a, i) => (
                <div key={a.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: i < recentActivity.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: "rgba(79,142,247,0.12)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#4f8ef7", fontWeight: 700, fontSize: 13,
                      flexShrink: 0,
                    }}>
                      {a.user.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ color: "#e0e0e0", fontSize: 13 }}>{a.user}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                        <ActivityBadge type={a.type} />
                        <span style={{ color: "#555", fontSize: 11 }}>{a.plan}</span>
                      </div>
                    </div>
                  </div>
                  <span style={{ color: "#444", fontSize: 11, whiteSpace: "nowrap" }}>{a.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top countries */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 12, padding: "20px",
          }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Top Countries</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {topCountries.map((c, i) => (
                <div key={c.country}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#555", fontSize: 11, width: 16, textAlign: "right" }}>{i + 1}</span>
                      <span style={{ color: "#ddd", fontSize: 13 }}>{c.country}</span>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <span style={{ color: "#888", fontSize: 12 }}>{c.users.toLocaleString()}</span>
                      <span style={{ color: "#555", fontSize: 12, width: 32, textAlign: "right" }}>{c.pct}%</span>
                    </div>
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                    <div style={{ width: `${c.pct}%`, height: "100%", background: PIE_COLORS[Math.min(i, 2)], borderRadius: 2 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Document bar chart */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 12, padding: "20px", marginTop: 16,
        }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Monthly Documents Processed</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: "#555", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#555", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#1a1a22", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                itemStyle={{ color: "#a78bfa" }}
              />
              <Bar dataKey="documents" fill="#a78bfa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ marginTop: 28, padding: "16px 0", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#333", fontSize: 11 }}>Luxor PDF Admin · Data refreshes on page load</span>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "transparent", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 6, color: "#555", fontSize: 11, padding: "4px 12px",
              cursor: "pointer",
            }}
          >↺ Refresh</button>
        </div>
      </div>
    </div>
  );
}

// ── Page Root ─────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(() => {
    return sessionStorage.getItem("luxor_admin") === "1";
  });

  const handleUnlock = () => {
    sessionStorage.setItem("luxor_admin", "1");
    setUnlocked(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("luxor_admin");
    setUnlocked(false);
  };

  if (!unlocked) return <LoginScreen onUnlock={handleUnlock} />;
  return <Dashboard onLogout={handleLogout} />;
}
