import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, Wallet, CreditCard, PiggyBank } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AdminStats } from "../types";
import { KpiCard, PageHeader, fmtMoney, fmtNum } from "../shared";
import { downloadCsv } from "../services";
import { toast } from "sonner";

export function RevenuePage({ stats }: { stats: AdminStats }) {
  const { overview } = stats;
  const [range, setRange] = useState("12m");

  const series = useMemo(
    () =>
      stats.monthlyData.map((m) => ({
        month: m.month,
        USD: Math.round(m.revenue["USD"] ?? 0),
        INR: Math.round(m.revenue["INR"] ?? 0),
        signups: m.signups,
      })),
    [stats],
  );
  const view = range === "3m" ? series.slice(-3) : range === "6m" ? series.slice(-6) : series;

  const exportCsv = () => {
    downloadCsv(
      "luxor-revenue-report.csv",
      series.map((m) => ({ month: m.month, usd: m.USD, inr: m.INR, signups: m.signups })),
    );
    toast.success("Revenue report exported as CSV.");
  };

  return (
    <div>
      <PageHeader
        title="Revenue"
        sub="Every number here reflects real recorded payments"
        actions={
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard
          icon={<Wallet className="h-4 w-4" />}
          label="Revenue This Month"
          value={fmtMoney(overview.monthRevenue)}
          hint="Payments completed during the current calendar month."
        />
        <KpiCard
          icon={<PiggyBank className="h-4 w-4" />}
          label="Total Revenue"
          value={fmtMoney(overview.totalRevenue)}
          hint="All completed payments across Stripe and Razorpay."
        />
        <KpiCard
          icon={<CreditCard className="h-4 w-4" />}
          label="Paying Customers"
          value={fmtNum(overview.paidUsers)}
          hint="Accounts with an active paid plan."
        />
      </div>

      <Card className="mt-4 border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-semibold">Revenue Trend</CardTitle>
          <Tabs value={range} onValueChange={setRange}>
            <TabsList className="h-7">
              <TabsTrigger value="3m" className="h-5 px-2 text-xs">3M</TabsTrigger>
              <TabsTrigger value="6m" className="h-5 px-2 text-xs">6M</TabsTrigger>
              <TabsTrigger value="12m" className="h-5 px-2 text-xs">12M</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={view} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
              <defs>
                <linearGradient id="revU" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="revI" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <ChartTooltip contentStyle={{ borderRadius: 8, borderColor: "#E2E8F0", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="USD" stroke="#2563EB" strokeWidth={2} fill="url(#revU)" name="USD ($)" />
              <Area type="monotone" dataKey="INR" stroke="#10B981" strokeWidth={2} fill="url(#revI)" name="INR (₹)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Last 6 Months</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={series.slice(-6)} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
                <ChartTooltip contentStyle={{ borderRadius: 8, borderColor: "#E2E8F0", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="USD" fill="#2563EB" radius={[4, 4, 0, 0]} name="USD ($)" />
                <Bar dataKey="INR" fill="#10B981" radius={[4, 4, 0, 0]} name="INR (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Totals by Currency</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(overview.totalRevenue).length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">
                No payments recorded yet — completed Stripe and Razorpay payments will appear here
                automatically.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Object.entries(overview.totalRevenue).map(([cur, amount]) => (
                  <div key={cur} className="rounded-lg border border-slate-100 bg-slate-50/60 p-4">
                    <div className="text-xs font-bold text-[#2563EB]">{cur}</div>
                    <div className="mt-1 text-xl font-bold text-slate-900">
                      {fmtMoney({ [cur]: amount })}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      this month: {fmtMoney({ [cur]: overview.monthRevenue[cur] ?? 0 })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
