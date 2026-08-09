import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import { Download, Eye, Globe2, Users, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FreeToolsAnalytics } from "../types";
import { adminApi, isUnauthorized } from "../api";
import { KpiCard, PageHeader, fmtNum } from "../shared";

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });
function countryLabel(code: string): string {
  if (!code || code === "Unknown") return "Unknown";
  try {
    return countryNames.of(code) ?? code;
  } catch {
    return code;
  }
}

/** "merge-pdf" → "Merge PDF" */
function toolLabel(slug: string): string {
  return slug
    .split("-")
    .map((w) => (w.toLowerCase() === "pdf" ? "PDF" : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

function downloadCsv(data: FreeToolsAnalytics) {
  const lines = [
    "Date,Views,Visitors",
    ...data.days.map((d) => `${d.day},${d.views},${d.visitors}`),
    "",
    "Tool,Views,Visitors",
    ...data.tools.map((t) => `${toolLabel(t.tool)},${t.views},${t.visitors}`),
    "",
    "Country,City,Views,Visitors",
    ...data.locations.map(
      (l) =>
        `"${countryLabel(l.country).replace(/"/g, '""')}","${l.city.replace(/"/g, '""')}",${l.views},${l.visitors}`,
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `luxor-free-tools-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function FreeToolsAnalyticsPage({
  token,
  onLogout,
}: {
  token: string;
  onLogout: () => void;
}) {
  const [data, setData] = useState<FreeToolsAnalytics | null>(null);
  const [error, setError] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .freeToolsAnalytics(token, 30)
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
    if (!data) return { views: 0, visitors: 0 };
    return {
      views: data.days.reduce((s, d) => s + d.views, 0),
      visitors: data.days.reduce((s, d) => s + d.visitors, 0),
    };
  }, [data]);

  const topTool = data?.tools[0];
  const topLocation = data?.locations[0];

  return (
    <div>
      <PageHeader
        title="Free Tools Analytics"
        sub="Daily traffic on the free tool pages, with visitor locations"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={<Eye className="h-4 w-4" />}
          label="Tool Page Views (30d)"
          value={fmtNum(totals.views)}
          hint="Views of /tools pages in the last 30 days."
        />
        <KpiCard
          icon={<Users className="h-4 w-4" />}
          label="Daily Visitors (30d sum)"
          value={fmtNum(totals.visitors)}
          hint="Sum of each day's unique visitors on tool pages."
        />
        <KpiCard
          icon={<Wrench className="h-4 w-4" />}
          label="Top Tool"
          value={topTool ? toolLabel(topTool.tool) : "—"}
          hint={topTool ? `${fmtNum(topTool.views)} views in 30 days.` : "No tool traffic yet."}
        />
        <KpiCard
          icon={<Globe2 className="h-4 w-4" />}
          label="Top Location"
          value={topLocation ? `${topLocation.city}` : "—"}
          hint={
            topLocation
              ? `${countryLabel(topLocation.country)} — ${fmtNum(topLocation.views)} views.`
              : "Locations appear as traffic arrives."
          }
        />
      </div>

      {/* ── Daily traffic, click a bar for that day's locations ── */}
      <Card className="mt-4 border-slate-200 dark:border-slate-700 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-[#2563EB] dark:text-[#60A5FA]" />
            <CardTitle className="text-sm font-semibold">Daily Tool Traffic (last 30 days)</CardTitle>
            {data && (
              <Badge
                variant="outline"
                className="border-slate-200 dark:border-slate-700 text-[10px] text-slate-500 dark:text-slate-400"
              >
                {fmtNum(totals.views)} views
              </Badge>
            )}
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
              Could not load free-tools analytics.
            </p>
          ) : !data ? (
            <p className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">Loading…</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.days} margin={{ top: 4, right: 4, left: -14, bottom: 0 }}>
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
                <Bar
                  dataKey="views"
                  radius={[4, 4, 0, 0]}
                  name="Views"
                  cursor="pointer"
                  onClick={(entry: { payload?: { day?: string } }) => {
                    const day = entry?.payload?.day;
                    if (day) setSelectedDay((prev) => (prev === day ? null : day));
                  }}
                >
                  {data.days.map((d) => (
                    <Cell key={d.day} fill={selectedDay === d.day ? "#6D5DFB" : "#2563EB"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          {!error && data && !selectedDay && (
            <p className="mt-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
              Click a bar to see that day's visitor locations and tools used.
            </p>
          )}
          {data && selectedDay && (
            <div className="mt-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Traffic on{" "}
                  {new Date(`${selectedDay}T00:00:00`).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <button
                  type="button"
                  className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                  onClick={() => setSelectedDay(null)}
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Locations
                  </p>
                  {(data.dayLocations?.[selectedDay] ?? []).length === 0 ? (
                    <p className="py-2 text-xs text-slate-400 dark:text-slate-500">No visits recorded.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {(data.dayLocations?.[selectedDay] ?? []).map((l, i) => (
                        <li key={`${l.country}-${l.city}-${i}`} className="flex items-center gap-2 text-xs">
                          <span className="w-10 shrink-0 text-right font-semibold tabular-nums text-[#2563EB] dark:text-[#60A5FA]">
                            {fmtNum(l.views)}
                          </span>
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                          <span className="text-slate-600 dark:text-slate-400">
                            {l.city}, {countryLabel(l.country)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Tools used
                  </p>
                  {(data.dayTools?.[selectedDay] ?? []).length === 0 ? (
                    <p className="py-2 text-xs text-slate-400 dark:text-slate-500">No tool views recorded.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {(data.dayTools?.[selectedDay] ?? []).map((t, i) => (
                        <li key={`${t.tool}-${i}`} className="flex items-center gap-2 text-xs">
                          <span className="w-10 shrink-0 text-right font-semibold tabular-nums text-[#6D5DFB]">
                            {fmtNum(t.views)}
                          </span>
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                          <span className="text-slate-600 dark:text-slate-400">{toolLabel(t.tool)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* ── Top tools table ── */}
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Wrench className="h-4 w-4 text-[#2563EB] dark:text-[#60A5FA]" />
            <CardTitle className="text-sm font-semibold">Top Tools (last 30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <p className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">Could not load tool data.</p>
            ) : !data ? (
              <p className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">Loading…</p>
            ) : data.tools.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                No tool traffic yet. Data appears as visitors use the free tools.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      <th className="py-2 pr-4 font-medium">Tool</th>
                      <th className="py-2 pr-4 text-right font-medium">Views</th>
                      <th className="py-2 pr-4 text-right font-medium">Visitors</th>
                      <th className="w-1/3 py-2 font-medium">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.tools.slice(0, 15).map((t) => {
                      const max = data.tools[0]?.views ?? 1;
                      return (
                        <tr key={t.tool} className="border-b border-slate-50 dark:border-slate-800">
                          <td className="py-2 pr-4 font-medium text-slate-700 dark:text-slate-300">{toolLabel(t.tool)}</td>
                          <td className="py-2 pr-4 text-right tabular-nums text-slate-600 dark:text-slate-400">{fmtNum(t.views)}</td>
                          <td className="py-2 pr-4 text-right tabular-nums text-slate-600 dark:text-slate-400">{fmtNum(t.visitors)}</td>
                          <td className="py-2">
                            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                              <div
                                className="h-1.5 rounded-full bg-gradient-to-r from-[#2563EB] to-[#6D5DFB]"
                                style={{ width: `${Math.max(4, (t.views / max) * 100)}%` }}
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

        {/* ── Visitor locations table ── */}
        <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Globe2 className="h-4 w-4 text-[#6D5DFB]" />
            <CardTitle className="text-sm font-semibold">Visitor Locations (last 30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <p className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">Could not load location data.</p>
            ) : !data ? (
              <p className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">Loading…</p>
            ) : data.locations.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                No location data yet. Locations appear as new visitors arrive.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      <th className="py-2 pr-4 font-medium">Country</th>
                      <th className="py-2 pr-4 font-medium">City</th>
                      <th className="py-2 pr-4 text-right font-medium">Views</th>
                      <th className="w-1/3 py-2 font-medium">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.locations.slice(0, 15).map((l, i) => {
                      const max = data.locations[0]?.views ?? 1;
                      return (
                        <tr key={`${l.country}-${l.city}-${i}`} className="border-b border-slate-50 dark:border-slate-800">
                          <td className="py-2 pr-4 font-medium text-slate-700 dark:text-slate-300">{countryLabel(l.country)}</td>
                          <td className="py-2 pr-4 text-slate-500 dark:text-slate-400">{l.city}</td>
                          <td className="py-2 pr-4 text-right tabular-nums text-slate-600 dark:text-slate-400">{fmtNum(l.views)}</td>
                          <td className="py-2">
                            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                              <div
                                className="h-1.5 rounded-full bg-gradient-to-r from-[#2563EB] to-[#6D5DFB]"
                                style={{ width: `${Math.max(4, (l.views / max) * 100)}%` }}
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
      </div>
    </div>
  );
}
