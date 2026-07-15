import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Eye, FileText, HardDrive, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AdminStats } from "../types";
import { ACQUISITION_CHANNELS } from "../mock-data";
import { KpiCard, PageHeader, fmtBytes, fmtNum } from "../shared";

export function AnalyticsPage({ stats }: { stats: AdminStats }) {
  const { overview } = stats;

  return (
    <div>
      <PageHeader title="Analytics" sub="Traffic, engagement and document activity" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={<Eye className="h-4 w-4" />} label="Page Views (30d)" value={fmtNum(overview.pageViews)} hint="Live page views recorded by the site counter." />
        <KpiCard icon={<FileText className="h-4 w-4" />} label="Documents Secured" value={fmtNum(overview.totalPdfs)} hint="PDFs processed by the expiry tool (live)." />
        <KpiCard icon={<Timer className="h-4 w-4" />} label="Active vs Expired" value={`${overview.activePdfs} / ${overview.expiredPdfs}`} hint="Currently active vs already expired documents." />
        <KpiCard icon={<HardDrive className="h-4 w-4" />} label="Storage Used" value={fmtBytes(overview.totalStorageBytes)} hint="Total bytes stored in the uploads directory." />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Daily Page Views (live)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stats.dailyViews} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} tickFormatter={(d: string) => d.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <ChartTooltip contentStyle={{ borderRadius: 8, borderColor: "#E2E8F0", fontSize: 12 }} />
                <Line type="monotone" dataKey="views" stroke="#2563EB" strokeWidth={2} dot={false} name="Views" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Top Pages (live)</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topPages.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No page data yet.</p>
            ) : (
              <div className="space-y-2">
                {stats.topPages.slice(0, 8).map((p) => {
                  const max = stats.topPages[0]?.views ?? 1;
                  return (
                    <div key={p.path}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="truncate font-mono text-slate-600">{p.path}</span>
                        <span className="ml-2 shrink-0 text-slate-400">{fmtNum(p.views)}</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                        <div className="h-1.5 rounded-full bg-gradient-to-r from-[#2563EB] to-[#6D5DFB]" style={{ width: `${Math.max(4, (p.views / max) * 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4 border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-semibold">Channel Performance</CardTitle>
          <Badge variant="outline" className="border-slate-200 text-[10px] text-slate-400">sample</Badge>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ACQUISITION_CHANNELS} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <ChartTooltip contentStyle={{ borderRadius: 8, borderColor: "#E2E8F0", fontSize: 12 }} />
              <Bar dataKey="users" fill="#6D5DFB" radius={[4, 4, 0, 0]} name="Users" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
