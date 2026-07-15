import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BadgeCheck,
  Flag,
  Gift,
  Link2,
  MoreHorizontal,
  MousePointerClick,
  Search,
  Users,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { referralService, useReferrals } from "../services";
import {
  ConfirmDialog,
  CopyButton,
  EmptyState,
  KpiCard,
  PageHeader,
  Pager,
  StatusBadge,
  useTableState,
} from "../shared";

export function ReferralsPage() {
  const referrals = useReferrals();
  const [grantTarget, setGrantTarget] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  const table = useTableState(referrals, {
    pageSize: 8,
    searchable: (r) => `${r.referrer} ${r.code} ${r.status}`,
  });

  const stats = useMemo(
    () => ({
      clicks: referrals.reduce((s, r) => s + r.clicks, 0),
      signups: referrals.reduce((s, r) => s + r.signups, 0),
      conversions: referrals.reduce((s, r) => s + r.paidConversions, 0),
      revenue: referrals.reduce((s, r) => s + r.revenue, 0),
    }),
    [referrals],
  );

  return (
    <div>
      <PageHeader
        title="Referrals"
        sub="Give a friend 10% off — earn 2 bonus months when they subscribe"
        actions={
          <Badge variant="outline" className="border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/50 text-[10px] text-amber-600 dark:text-amber-400">
            sample workspace — referral tracking backend pending
          </Badge>
        }
      />

      {/* Program rule */}
      <Card className="mb-4 border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50/60 to-violet-50/60 dark:from-blue-950/40 dark:to-violet-950/40 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
            <Gift className="h-4 w-4 text-[#6D5DFB]" /> Program rule
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { n: "1", t: "Share your link", d: "Each customer gets a unique referral code and URL." },
              { n: "2", t: "Friend gets 10% off", d: "The discount applies automatically at checkout." },
              { n: "3", t: "You earn +2 months", d: "Reward is granted after the friend's first successful payment." },
            ].map((s) => (
              <div key={s.n} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2563EB] text-xs font-bold text-white">
                  {s.n}
                </div>
                <div className="mt-2 text-xs font-semibold text-slate-800 dark:text-slate-200">{s.t}</div>
                <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{s.d}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={<MousePointerClick className="h-4 w-4" />} label="Link Clicks" value={String(stats.clicks)} />
        <KpiCard icon={<Users className="h-4 w-4" />} label="Signups" value={String(stats.signups)} />
        <KpiCard icon={<BadgeCheck className="h-4 w-4" />} label="Paid Conversions" value={String(stats.conversions)} />
        <KpiCard icon={<Gift className="h-4 w-4" />} label="Referral Revenue" value={`$${stats.revenue.toLocaleString()}`} />
      </div>

      <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-semibold">Referrers</CardTitle>
          <div className="relative w-full max-w-56">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
            <Input
              value={table.search}
              onChange={(e) => table.setSearch(e.target.value)}
              placeholder="Search referrer or code…"
              className="h-9 pl-8 text-[13px]"
            />
          </div>
        </CardHeader>
        <CardContent>
          {table.filtered.length === 0 ? (
            <EmptyState title="No referrers match" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referrer</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => table.toggleSort("clicks")}>Clicks</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => table.toggleSort("signups")}>Signups</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => table.toggleSort("paidConversions")}>Paid</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => table.toggleSort("revenue")}>Revenue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.pageRows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="text-xs font-medium text-slate-800 dark:text-slate-200">{r.referrer}</div>
                        <div className="font-mono text-[11px] text-slate-400 dark:text-slate-500">{r.code}</div>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <Link2 className="h-3 w-3" />
                          /r/{r.code}
                          <CopyButton text={r.link} label="Referral link copied" />
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">{r.clicks}</TableCell>
                      <TableCell className="text-xs">{r.signups}</TableCell>
                      <TableCell className="text-xs">{r.paidConversions}</TableCell>
                      <TableCell className="text-xs">${r.revenue.toLocaleString()}</TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Referral actions">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem disabled={r.rewardGranted} onClick={() => setGrantTarget(r.id)}>
                              <Gift className="mr-2 h-3.5 w-3.5" /> Grant reward (+2 mo)
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled={!r.rewardGranted && r.status === "Rejected"} onClick={() => setCancelTarget(r.id)}>
                              <XCircle className="mr-2 h-3.5 w-3.5" /> Cancel / reject
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={r.status === "Fraud Review"}
                              className="text-amber-600 dark:text-amber-400 focus:text-amber-600"
                              onClick={() => {
                                referralService.flag(r.id);
                                toast.warning(`${r.code} flagged for fraud review.`);
                              }}
                            >
                              <Flag className="mr-2 h-3.5 w-3.5" /> Flag as suspicious
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pager page={table.page} pageCount={table.pageCount} setPage={table.setPage} total={table.filtered.length} />
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={grantTarget !== null}
        onOpenChange={(v) => !v && setGrantTarget(null)}
        title="Grant referral reward?"
        description="Adds 2 bonus months of validity to the referrer's subscription and marks the referral as rewarded."
        confirmLabel="Grant +2 months"
        onConfirm={() => {
          if (grantTarget) {
            referralService.grantReward(grantTarget);
            toast.success("Reward granted — +2 months recorded.");
          }
          setGrantTarget(null);
        }}
      />
      <ConfirmDialog
        open={cancelTarget !== null}
        onOpenChange={(v) => !v && setCancelTarget(null)}
        title="Cancel this referral reward?"
        description="Marks the referral as rejected. Any previously granted bonus is noted for manual review."
        confirmLabel="Reject referral"
        destructive
        onConfirm={() => {
          if (cancelTarget) {
            referralService.cancelReward(cancelTarget);
            toast.success("Referral rejected.");
          }
          setCancelTarget(null);
        }}
      />
    </div>
  );
}
