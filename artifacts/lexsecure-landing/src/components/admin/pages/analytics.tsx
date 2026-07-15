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
import { useEffect, useMemo, useState } from "react";
import { Download, Eye, FileText, Globe2, HardDrive, Timer, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminStats, VisitorAnalytics } from "../types";
import { adminApi, isUnauthorized } from "../api";
import { ACQUISITION_CHANNELS } from "../mock-data";
import { KpiCard, PageHeader, fmtBytes, fmtNum } from "../shared";

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });
function countryLabel(code: string): string {
  if (!code || code === "Unknown") return "Unknown";
  try {
    return countryNames.of(code) ?? code;
  } catch {
    return code;
  }
}

function downloadVisitorsCsv(data: VisitorAnalytics) {
  const lines = [
    "Date,Visitors",
    ...data.days.map((d) => `${d.day},${d.visitors}`),
    "",
    "Country,City,Visitors (30d)",
    ...data.locations.map(
      (l) => `"${countryLabel(l.country).replace(/"/g, '""')}","${l.city.replace(/"/g, '""')}",${l.visitors}`,
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `luxor-visitors-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function AnalyticsPage({
  stats,
  token,
  onLogout,
}: {
  stats: AdminStats;
  token: string;
  onLogout: () => void;
}) {
  const { overview } = stats;
  const [visitors, setVisitors] = useState<VisitorAnalytics | null>(null);
  const [visitorsError, setVisitorsError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .visitorAnalytics(token, 30)
      .then((v) => {
        if (!cancelled) setVisitors(v);
      })
      .catch((err) => {
        if (cancelled) return;
        if (isUnauthorized(err)) onLogout();
        else setVisitorsError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [token, onLogout]);

  const totalVisitors30d = useMemo(
    () => visitors?.days.reduce((s, d) => s + d.visitors, 0) ?? 0,
    [visitors],
  );

  return (
    <div>
      <PageHeader title="Analytics" sub="Traffic, engagement and document activity" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={<Eye className="h-4 w-4" />} label="Page Views (30d)" value={fmtNum(overview.pageViews)} hint="Live page views recorded by the site counter." />
        <KpiCard icon={<FileText className="h-4 w-4" />} label="Documents Secured" value={fmtNum(overview.totalPdfs)} hint="PDFs processed by the expiry tool (live)." />
        <KpiCard icon={<Timer className="h-4 w-4" />} label="Active vs Expired" value={`${overview.activePdfs} / ${overview.expiredPdfs}`} hint="Currently active vs already expired documents." />
        <KpiCard icon={<HardDrive className="h-4 w-4" />} label="Storage Used" value={fmtBytes(overview.totalStorageBytes)} hint="Total bytes stored in the uploads directory." />
      </div>

      {/* ── Visitors: daily uniques + locations ── */}
      <Card className="mt-4 border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#2563EB]" />
            <CardTitle className="text-sm font-semibold">Daily Visitors (last 30 days)</CardTitle>
            {visitors && (
              <Badge variant="outline" className="border-slate-200 text-[10px] text-slate-500">
                {fmtNum(totalVisitors30d)} total
              </Badge>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 border-slate-200 text-xs"
            disabled={!visitors}
            onClick={() => visitors && downloadVisitorsCsv(visitors)}
          >
            <Download className="h-3.5 w-3.5" />
            Download CSV
          </Button>
        </CardHeader>
        <CardContent>
          {visitorsError ? (
            <p className="py-8 text-center text-xs text-slate-400">Could not load visitor data.</p>
          ) : !visitors ? (
            <p className="py-8 text-center text-xs text-slate-400">Loading visitor data…</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={visitors.days} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} tickFormatter={(d: string) => d.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <ChartTooltip contentStyle={{ borderRadius: 8, borderColor: "#E2E8F0", fontSize: 12 }} />
                <Bar dataKey="visitors" fill="#2563EB" radius={[4, 4, 0, 0]} name="Visitors" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="mt-4 border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <Globe2 className="h-4 w-4 text-[#6D5DFB]" />
          <CardTitle className="text-sm font-semibold">Visitor Locations (last 30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {visitorsError ? (
            <p className="py-8 text-center text-xs text-slate-400">Could not load location data.</p>
          ) : !visitors ? (
            <p className="py-8 text-center text-xs text-slate-400">Loading location data…</p>
          ) : visitors.locations.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">No location data yet. Locations appear as new visitors arrive.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] uppercase tracking-wide text-slate-400">
                    <th className="py-2 pr-4 font-medium">Country</th>
                    <th className="py-2 pr-4 font-medium">City</th>
                    <th className="py-2 pr-4 text-right font-medium">Visitors</th>
                    <th className="w-1/3 py-2 font-medium">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {visitors.locations.slice(0, 15).map((l, i) => {
                    const max = visitors.locations[0]?.visitors ?? 1;
                    return (
                      <tr key={`${l.country}-${l.city}-${i}`} className="border-b border-slate-50">
                        <td className="py-2 pr-4 font-medium text-slate-700">{countryLabel(l.country)}</td>
                        <td className="py-2 pr-4 text-slate-500">{l.city}</td>
                        <td className="py-2 pr-4 text-right tabular-nums text-slate-600">{fmtNum(l.visitors)}</td>
                        <td className="py-2">
                          <div className="h-1.5 rounded-full bg-slate-100">
                            <div className="h-1.5 rounded-full bg-gradient-to-r from-[#2563EB] to-[#6D5DFB]" style={{ width: `${Math.max(4, (l.visitors / max) * 100)}%` }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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
