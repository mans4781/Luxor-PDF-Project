import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import { Download, Globe2, MonitorDown, ShieldCheck, Clock3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DownloadStats } from "../types";
import { adminApi, isUnauthorized } from "../api";
import { KpiCard, PageHeader, fmtNum, timeAgo } from "../shared";

const APP_LABEL: Record<string, string> = { reader: "PDF Reader", secure: "PDF Secure" };

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });
function countryLabel(code: string): string {
  if (!code || code === "Unknown") return "Unknown";
  try {
    return countryNames.of(code) ?? code;
  } catch {
    return code;
  }
}

function downloadCsv(data: DownloadStats) {
  const lines = [
    "App,Total Downloads",
    ...data.totals.map((t) => `${APP_LABEL[t.app] ?? t.app},${t.count}`),
    "",
    "Date,App,Downloads",
    ...data.daily.map((d) => `${d.day},${APP_LABEL[d.app] ?? d.app},${d.count}`),
    "",
    "Country,App,Downloads",
    ...data.countries.map(
      (c) => `"${countryLabel(c.country).replace(/"/g, '""')}",${APP_LABEL[c.app] ?? c.app},${c.count}`,
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `luxor-downloads-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function DownloadsPage({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [data, setData] = useState<DownloadStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .downloads(token)
      .then((v) => {
        if (!cancelled) setData(v);
      })
      .catch((err) => {
        if (cancelled) return;
        if (isUnauthorized(err)) onLogout();
        else setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [token, onLogout]);

  const totals = useMemo(() => {
    const reader = data?.totals.find((t) => t.app === "reader")?.count ?? 0;
    const secure = data?.totals.find((t) => t.app === "secure")?.count ?? 0;
    return { reader, secure, all: reader + secure };
  }, [data]);

  const last30 = useMemo(
    () => (data ? data.daily.reduce((s, d) => s + d.count, 0) : 0),
    [data],
  );

  // Merge per-app daily rows into one row per day for the stacked chart.
  const chartDays = useMemo(() => {
    if (!data) return [];
    const byDay = new Map<string, { day: string; reader: number; secure: number }>();
    for (const d of data.daily) {
      const row = byDay.get(d.day) ?? { day: d.day, reader: 0, secure: 0 };
      row[d.app] += d.count;
      byDay.set(d.day, row);
    }
    return [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day));
  }, [data]);

  // Merge per-app country rows into one row per country.
  const countryRows = useMemo(() => {
    if (!data) return [];
    const byCountry = new Map<string, { country: string; reader: number; secure: number; total: number }>();
    for (const c of data.countries) {
      const row = byCountry.get(c.country) ?? { country: c.country, reader: 0, secure: 0, total: 0 };
      row[c.app] += c.count;
      row.total += c.count;
      byCountry.set(c.country, row);
    }
    return [...byCountry.values()].sort((a, b) => b.total - a.total);
  }, [data]);

  const loading = !data && !error;

  return (
    <div>
      <PageHeader
        title="Downloads"
        sub="Desktop installer downloads for Luxor PDF Reader and PDF Secure"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={<Download className="h-4 w-4" />}
          label="Total Downloads"
          value={fmtNum(totals.all)}
          hint="All-time installer downloads, both apps."
        />
        <KpiCard
          icon={<MonitorDown className="h-4 w-4" />}
          label="PDF Reader"
          value={fmtNum(totals.reader)}
          hint="All-time Reader installer downloads."
        />
        <KpiCard
          icon={<ShieldCheck className="h-4 w-4" />}
          label="PDF Secure"
          value={fmtNum(totals.secure)}
          hint="All-time Secure installer downloads."
        />
        <KpiCard
          icon={<Clock3 className="h-4 w-4" />}
          label="Last 30 Days"
          value={fmtNum(last30)}
          hint="Downloads across both apps in the last 30 days."
        />
      </div>

      <Card className="mt-4 border-slate-200 dark:border-slate-700 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-[#2563EB] dark:text-[#60A5FA]" />
            <CardTitle className="text-sm font-semibold">Daily Downloads (last 30 days)</CardTitle>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 border-slate-200 dark:border-slate-700 text-xs"
            disabled={!data}
            onClick={() => data && downloadCsv(data)}
          >
            <Download className="h-3.5 w-3.5" />
            Download CSV
          </Button>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
              Could not load download stats.
            </p>
          ) : loading ? (
            <p className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">Loading…</p>
          ) : chartDays.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
              No downloads recorded in the last 30 days.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartDays} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
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
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="reader" stackId="a" fill="#2563EB" name="PDF Reader" radius={[0, 0, 0, 0]} />
                <Bar dataKey="secure" stackId="a" fill="#6D5DFB" name="PDF Secure" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Globe2 className="h-4 w-4 text-[#6D5DFB]" />
            <CardTitle className="text-sm font-semibold">Downloads by Country</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <p className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">Could not load country data.</p>
            ) : loading ? (
              <p className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">Loading…</p>
            ) : countryRows.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                No location data yet. Countries appear as downloads arrive.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      <th className="py-2 pr-4 font-medium">Country</th>
                      <th className="py-2 pr-4 text-right font-medium">Reader</th>
                      <th className="py-2 pr-4 text-right font-medium">Secure</th>
                      <th className="py-2 pr-4 text-right font-medium">Total</th>
                      <th className="w-1/3 py-2 font-medium">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {countryRows.slice(0, 15).map((c) => {
                      const max = countryRows[0]?.total ?? 1;
                      return (
                        <tr key={c.country} className="border-b border-slate-50 dark:border-slate-800">
                          <td className="py-2 pr-4 font-medium text-slate-700 dark:text-slate-300">{countryLabel(c.country)}</td>
                          <td className="py-2 pr-4 text-right tabular-nums text-slate-600 dark:text-slate-400">{fmtNum(c.reader)}</td>
                          <td className="py-2 pr-4 text-right tabular-nums text-slate-600 dark:text-slate-400">{fmtNum(c.secure)}</td>
                          <td className="py-2 pr-4 text-right tabular-nums font-semibold text-slate-700 dark:text-slate-300">{fmtNum(c.total)}</td>
                          <td className="py-2">
                            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                              <div
                                className="h-1.5 rounded-full bg-gradient-to-r from-[#2563EB] to-[#6D5DFB]"
                                style={{ width: `${Math.max(4, (c.total / max) * 100)}%` }}
                              />
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

        <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Clock3 className="h-4 w-4 text-[#2563EB] dark:text-[#60A5FA]" />
            <CardTitle className="text-sm font-semibold">Recent Downloads</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <p className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">Could not load recent downloads.</p>
            ) : loading ? (
              <p className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">Loading…</p>
            ) : (data?.recent.length ?? 0) === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                No downloads yet. New downloads show up here in real time.
              </p>
            ) : (
              <ul className="space-y-2">
                {data!.recent.map((r, i) => (
                  <li
                    key={`${r.createdAt}-${i}`}
                    className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-800 px-3 py-2 text-xs"
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {APP_LABEL[r.app] ?? r.app}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {r.city && r.city !== "Unknown" ? `${r.city}, ` : ""}
                      {countryLabel(r.country)}
                    </span>
                    <span className="tabular-nums text-slate-400 dark:text-slate-500">{timeAgo(r.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
