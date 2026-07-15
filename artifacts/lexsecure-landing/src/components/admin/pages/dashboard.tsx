import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DollarSign,
  Repeat,
  UserPlus,
  Users,
  TrendingUp,
  TrendingDown,
  Globe2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { AdminStats } from "../types";
import { ACQUISITION_CHANNELS, OPS_METRICS, REGION_SAMPLE } from "../mock-data";
import { KpiCard, PageHeader, Sparkline, fmtMoney, fmtNum, timeAgo } from "../shared";

function monthlySeries(stats: AdminStats) {
  return stats.monthlyData.map((m) => ({
    month: m.month,
    USD: Math.round(m.revenue["USD"] ?? 0),
    INR: Math.round(m.revenue["INR"] ?? 0),
    signups: m.signups,
  }));
}

export function DashboardPage({ stats }: { stats: AdminStats }) {
  const { overview } = stats;
  const series = useMemo(() => monthlySeries(stats), [stats]);
  const [revRange, setRevRange] = useState("12m");
  const [userRange, setUserRange] = useState("30d");

  const signupSpark = series.map((m) => m.signups);
  const revSpark = series.map((m) => m.USD + m.INR);
  const thisMonthSignups = series.at(-1)?.signups ?? 0;
  const prevMonthSignups = series.at(-2)?.signups ?? 0;
  const signupDelta =
    prevMonthSignups > 0
      ? ((thisMonthSignups - prevMonthSignups) / prevMonthSignups) * 100
      : thisMonthSignups > 0
        ? 100
        : 0;
  const conversion =
    overview.totalUsers > 0 ? (overview.paidUsers / overview.totalUsers) * 100 : 0;

  const revSeries =
    revRange === "3m" ? series.slice(-3) : revRange === "6m" ? series.slice(-6) : series;
  const viewsSeries =
    userRange === "7d" ? stats.dailyViews.slice(-7) : stats.dailyViews;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        sub="Live overview across the Luxor PDF suite"
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Total Revenue"
          value={fmtMoney(overview.totalRevenue)}
          spark={revSpark}
          hint="All completed payments recorded from Stripe and Razorpay."
        />
        <KpiCard
          icon={<Repeat className="h-4 w-4" />}
          label="This Month"
          value={fmtMoney(overview.monthRevenue)}
          spark={revSpark.slice(-6)}
          sparkColor="#6D5DFB"
          hint="Revenue recorded in the current calendar month."
        />
        <KpiCard
          icon={<Users className="h-4 w-4" />}
          label="Active Users"
          value={fmtNum(overview.totalUsers)}
          spark={signupSpark}
          sparkColor="#10B981"
          hint="Accounts registered across the suite."
        />
        <KpiCard
          icon={<UserPlus className="h-4 w-4" />}
          label="New Signups"
          value={fmtNum(thisMonthSignups)}
          delta={signupDelta}
          deltaLabel="vs last month"
          spark={signupSpark}
          hint="New accounts this month."
        />
        <KpiCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Conversion Rate"
          value={`${conversion.toFixed(1)}%`}
          hint="Paying customers as a share of all registered users."
        />
        <KpiCard
          icon={<TrendingDown className="h-4 w-4" />}
          label="Paid Accounts"
          value={fmtNum(overview.paidUsers)}
          hint="Accounts on an active paid plan right now."
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Revenue overview */}
        <Card className="border-slate-200 shadow-sm xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Revenue Overview</CardTitle>
            <Tabs value={revRange} onValueChange={setRevRange}>
              <TabsList className="h-7">
                <TabsTrigger value="3m" className="h-5 px-2 text-xs">3M</TabsTrigger>
                <TabsTrigger value="6m" className="h-5 px-2 text-xs">6M</TabsTrigger>
                <TabsTrigger value="12m" className="h-5 px-2 text-xs">12M</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revSeries} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashU" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="dashI" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6D5DFB" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6D5DFB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <ChartTooltip contentStyle={{ borderRadius: 8, borderColor: "#E2E8F0", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area type="monotone" dataKey="USD" stroke="#2563EB" strokeWidth={2} fill="url(#dashU)" name="USD ($)" />
                <Area type="monotone" dataKey="INR" stroke="#6D5DFB" strokeWidth={2} fill="url(#dashI)" name="INR (₹)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Acquisition */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Top Acquisition Channels</CardTitle>
            <Badge variant="outline" className="border-slate-200 text-[10px] text-slate-400">sample</Badge>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={ACQUISITION_CHANNELS}
                  dataKey="users"
                  nameKey="name"
                  innerRadius={40}
                  outerRadius={62}
                  paddingAngle={2}
                >
                  {ACQUISITION_CHANNELS.map((c) => (
                    <Cell key={c.name} fill={c.color} />
                  ))}
                </Pie>
                <ChartTooltip contentStyle={{ borderRadius: 8, borderColor: "#E2E8F0", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1.5">
              {ACQUISITION_CHANNELS.map((c) => (
                <div key={c.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                    {c.name}
                  </span>
                  <span className="text-slate-400">
                    {c.users} · {c.pct}% · {c.conversion}% conv
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* User analytics */}
        <Card className="border-slate-200 shadow-sm xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold">Traffic & Signups</CardTitle>
            <Tabs value={userRange} onValueChange={setUserRange}>
              <TabsList className="h-7">
                <TabsTrigger value="7d" className="h-5 px-2 text-xs">7D</TabsTrigger>
                <TabsTrigger value="30d" className="h-5 px-2 text-xs">30D</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <div className="mb-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md bg-slate-50 py-2">
                <div className="text-lg font-bold text-slate-900">{fmtNum(overview.pageViews)}</div>
                <div className="text-[11px] text-slate-500">Page views (30d)</div>
              </div>
              <div className="rounded-md bg-slate-50 py-2">
                <div className="text-lg font-bold text-slate-900">{fmtNum(overview.freeUsers)}</div>
                <div className="text-[11px] text-slate-500">Free users</div>
              </div>
              <div className="rounded-md bg-slate-50 py-2">
                <div className="text-lg font-bold text-slate-900">{fmtNum(overview.paidUsers)}</div>
                <div className="text-[11px] text-slate-500">Subscribers</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={170}>
              <LineChart data={viewsSeries} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(d: string) => d.slice(5)}
                />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <ChartTooltip contentStyle={{ borderRadius: 8, borderColor: "#E2E8F0", fontSize: 12 }} />
                <Line type="monotone" dataKey="views" stroke="#2563EB" strokeWidth={2} dot={false} name="Views" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                No account events yet — signups and plan changes will appear here.
              </p>
            ) : (
              <div className="space-y-3">
                {stats.recentActivity.slice(0, 7).map((a) => (
                  <div key={a.id} className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-[#2563EB]">
                      {(a.user || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-mono text-xs text-slate-700" title={a.user}>
                        {a.user}
                      </div>
                      <div className="truncate text-[11px] text-slate-400" title={a.message}>
                        {a.message || a.type} · {timeAgo(a.time)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ops metrics */}
      <div className="mt-4">
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-700">Operational Metrics</h2>
          <Badge variant="outline" className="border-slate-200 text-[10px] text-slate-400">sample</Badge>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
          {OPS_METRICS.map((m) => (
            <Card key={m.label} className="border-slate-200 shadow-sm">
              <CardContent className="p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {m.label}
                </div>
                <div className="mt-1 text-sm font-bold text-slate-900">{m.value}</div>
                <Sparkline data={m.trend} color="#6D5DFB" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Regions */}
      <Card className="mt-4 border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
            <Globe2 className="h-4 w-4 text-slate-400" /> Active Users by Region
          </CardTitle>
          <Badge variant="outline" className="border-slate-200 text-[10px] text-slate-400">sample</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {REGION_SAMPLE.map((r) => (
              <div key={r.country} className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                <div className="text-xs font-semibold text-slate-700">{r.country}</div>
                <div className="mt-1 text-lg font-bold text-slate-900">{r.users}</div>
                <div className="text-[11px] text-slate-500">
                  ${r.revenue.toLocaleString()} · {r.paid} paid · {r.conversion}% conv
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
