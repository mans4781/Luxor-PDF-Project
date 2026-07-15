import { toast } from "sonner";
import { Download, FileBarChart, ScrollText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminStats, AdminCustomer, ProductKey } from "../types";
import { adminApi, isUnauthorized } from "../api";
import { downloadCsv, useAuditLog } from "../services";
import { EmptyState, PageHeader, timeAgo } from "../shared";

export function ReportsPage({
  stats,
  token,
  onLogout,
}: {
  stats: AdminStats;
  token: string;
  onLogout: () => void;
}) {
  const audit = useAuditLog();

  const reports = [
    {
      name: "Revenue Report",
      desc: "Monthly revenue by currency plus signups (live).",
      run: () => {
        downloadCsv(
          "luxor-report-revenue.csv",
          stats.monthlyData.map((m) => ({
            month: m.month,
            usd: Math.round(m.revenue["USD"] ?? 0),
            inr: Math.round(m.revenue["INR"] ?? 0),
            signups: m.signups,
          })),
        );
        toast.success("Revenue report downloaded.");
      },
    },
    {
      name: "User Report",
      desc: "All accounts with plan, status, quota and validity (live).",
      run: async () => {
        try {
          const customers: AdminCustomer[] = await adminApi.customers(token);
          downloadCsv(
            "luxor-report-users.csv",
            customers.map((c) => ({
              user_id: c.userId,
              plan: c.planName ?? "free",
              paid: c.isPaid,
              status: c.accountStatus,
              joined: c.createdAt,
              valid_until: c.subscriptionEndDate ?? "",
              monthly_used: c.monthlyUsed,
            })),
          );
          toast.success("User report downloaded.");
        } catch (err) {
          if (isUnauthorized(err)) onLogout();
          else toast.error("Could not build user report.");
        }
      },
    },
    {
      name: "License Report",
      desc: "Every product key with plan, activations and status (live).",
      run: async () => {
        try {
          const keys: ProductKey[] = await adminApi.productKeys(token);
          downloadCsv(
            "luxor-report-licenses.csv",
            keys.map((k) => ({
              key_prefix: k.keyPrefix,
              plan: k.planName,
              duration_days: k.durationDays,
              activations: `${k.currentActivations}/${k.maxActivations}`,
              status: k.status,
              created: k.createdAt,
            })),
          );
          toast.success("License report downloaded.");
        } catch (err) {
          if (isUnauthorized(err)) onLogout();
          else toast.error("Could not build license report.");
        }
      },
    },
    {
      name: "Traffic Report",
      desc: "Daily page views and top pages (live).",
      run: () => {
        downloadCsv(
          "luxor-report-traffic.csv",
          stats.dailyViews.map((d) => ({ day: d.day, views: d.views })),
        );
        toast.success("Traffic report downloaded.");
      },
    },
  ];

  return (
    <div>
      <PageHeader title="Reports" sub="One-click CSV exports built from live console data" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {reports.map((r) => (
          <Card key={r.name} className="border-slate-200 dark:border-slate-700 shadow-sm">
            <CardContent className="p-4">
              <FileBarChart className="h-5 w-5 text-[#2563EB] dark:text-[#60A5FA]" />
              <div className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200">{r.name}</div>
              <div className="mt-0.5 min-h-8 text-[11px] text-slate-500 dark:text-slate-400">{r.desc}</div>
              <Button variant="outline" size="sm" className="mt-3 h-8 w-full text-xs" onClick={() => void r.run()}>
                <Download className="mr-1.5 h-3 w-3" /> Download CSV
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-4 border-slate-200 dark:border-slate-700 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
            <ScrollText className="h-4 w-4 text-slate-400 dark:text-slate-500" /> Console Audit Log
          </CardTitle>
          <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-[10px] text-slate-400 dark:text-slate-500">
            local to this console session
          </Badge>
        </CardHeader>
        <CardContent>
          {audit.length === 0 ? (
            <EmptyState title="No admin actions recorded yet" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Change</TableHead>
                    <TableHead>When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {audit.slice(0, 20).map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-xs font-medium text-slate-800 dark:text-slate-200">{a.action}</TableCell>
                      <TableCell className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{a.target}</TableCell>
                      <TableCell className="text-[11px] text-slate-500 dark:text-slate-400">
                        {a.prev} → {a.next}
                      </TableCell>
                      <TableCell className="text-[11px] text-slate-400 dark:text-slate-500">{timeAgo(a.time)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
