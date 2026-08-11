import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Ban,
  CalendarPlus,
  Download,
  Eye,
  KeyRound,
  MailQuestion,
  MoreHorizontal,
  RotateCcwKey,
  Trash2,
  RefreshCw,
  Search,
  ShieldAlert,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AdminCustomer } from "../types";
import { adminApi, isUnauthorized } from "../api";
import { logAudit, downloadCsv } from "../services";
import {
  CopyButton,
  EmptyState,
  LoadingRows,
  PageHeader,
  Pager,
  StatusBadge,
  fmtDate,
  useTableState,
} from "../shared";

function displayStatus(c: AdminCustomer) {
  if (c.accountStatus !== "active") return c.accountStatus;
  return c.isPaid ? "paid" : "free";
}

function remainingDays(iso: string | null) {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}

export function UsersPage({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [customers, setCustomers] = useState<AdminCustomer[] | null>(null);
  const [error, setError] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [selected, setSelected] = useState<AdminCustomer | null>(null);
  const [blockTarget, setBlockTarget] = useState<AdminCustomer | null>(null);
  const [extendTarget, setExtendTarget] = useState<AdminCustomer | null>(null);
  const [quotaTarget, setQuotaTarget] = useState<AdminCustomer | null>(null);
  const [quotaValue, setQuotaValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminCustomer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [reissueTarget, setReissueTarget] = useState<AdminCustomer | null>(null);
  const [reissuing, setReissuing] = useState(false);
  const [reissuedKey, setReissuedKey] = useState<{
    rawKey: string;
    planName: string;
    email: string | null;
  } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setCustomers(null);
    adminApi
      .customers(token)
      .then((rows) => {
        if (!cancelled) setCustomers(rows);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isUnauthorized(err)) onLogout();
        else setError("Failed to load users.");
      });
    return () => {
      cancelled = true;
    };
  }, [token, onLogout, reloadKey]);

  const filtered = useMemo(() => {
    const rows = customers ?? [];
    if (planFilter === "all") return rows;
    if (planFilter === "paid") return rows.filter((c) => c.isPaid);
    if (planFilter === "free") return rows.filter((c) => !c.isPaid);
    return rows.filter((c) => (c.planName ?? "free") === planFilter);
  }, [customers, planFilter]);

  const [pageSize, setPageSize] = useState(20);
  const table = useTableState(filtered, {
    pageSize,
    searchable: (c) =>
      `${c.userId} ${c.name ?? ""} ${c.email ?? ""} ${c.location ?? ""} ${c.planName ?? ""} ${c.tier ?? ""} ${c.accountStatus}`,
  });

  const planOptions = useMemo(() => {
    const set = new Set<string>();
    (customers ?? []).forEach((c) => c.planName && set.add(c.planName));
    return Array.from(set);
  }, [customers]);

  const exportUsers = () => {
    downloadCsv(
      "luxor-users.csv",
      table.filtered.map((c) => ({
        user_id: c.userId,
        name: c.name ?? "",
        email: c.email ?? "",
        location: c.location ?? "",
        plan: c.planName ?? "free",
        paid: c.isPaid,
        status: c.accountStatus,
        joined: c.createdAt,
        valid_until: c.subscriptionEndDate ?? "",
        monthly_used: c.monthlyUsed,
        monthly_limit: c.monthlyLimit ?? "",
      })),
    );
    toast.success("User list exported as CSV.");
  };

  const saveQuota = async () => {
    if (!quotaTarget) return;
    const value = quotaValue.trim() === "" ? null : Number(quotaValue);
    if (value !== null && (!Number.isFinite(value) || value < 0)) {
      toast.error("Enter a positive number or leave blank to clear.");
      return;
    }
    try {
      await adminApi.setQuotaOverride(token, quotaTarget.userId, value);
      logAudit(
        "Quota override set",
        quotaTarget.userId,
        String(quotaTarget.quotaOverrideSecure ?? "default"),
        String(value ?? "default"),
      );
      toast.success(value === null ? "Quota override cleared." : `Monthly quota set to ${value}.`);
      setQuotaTarget(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      if (isUnauthorized(err)) onLogout();
      else toast.error("Could not update quota.");
    }
  };

  const confirmReissue = async () => {
    if (!reissueTarget || reissuing) return;
    setReissuing(true);
    try {
      const result = await adminApi.reissueLicenseKey(token, reissueTarget.userId);
      logAudit(
        "License key reissued",
        reissueTarget.userId,
        "old key revoked",
        result.keyPrefix + "-••••",
      );
      setReissuedKey({
        rawKey: result.rawKey,
        planName: result.planName,
        email: reissueTarget.email ?? null,
      });
      setReissueTarget(null);
    } catch (err) {
      // The "no paid license" case comes back as HTTP 400 with a clear message.
      if (err instanceof Error && err.message.includes("no paid license"))
        toast.error("This user has no paid license to reissue.");
      else if (isUnauthorized(err)) onLogout();
      else toast.error("Could not reissue the key. Please try again.");
    } finally {
      setReissuing(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await adminApi.deleteCustomer(token, deleteTarget.userId);
      logAudit("User deleted", deleteTarget.userId, deleteTarget.email ?? "", "deleted");
      toast.success("User permanently deleted.", {
        description: "Account and all data removed. They can sign up fresh anytime.",
      });
      setDeleteTarget(null);
      setDeleteConfirm("");
      setSelected(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      // Check the specific protected-account error before the generic
      // unauthorized handler (both come back as HTTP 403).
      if (err instanceof Error && err.message.includes("Developer accounts"))
        toast.error("Developer accounts can't be deleted from the console.");
      else if (isUnauthorized(err)) onLogout();
      else toast.error("Could not delete the user. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Users"
        sub="Every registered account across the Luxor PDF suite (live data)"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportUsers}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Export
            </Button>
          </>
        }
      />

      <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
        <CardContent className="p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              <Input
                value={table.search}
                onChange={(e) => table.setSearch(e.target.value)}
                placeholder="Search user id, plan, status…"
                className="h-9 pl-8 text-[13px]"
              />
            </div>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="h-9 w-36 text-[13px]">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All plans</SelectItem>
                <SelectItem value="paid">Paid only</SelectItem>
                <SelectItem value="free">Free only</SelectItem>
                {planOptions.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 dark:text-slate-500">Show</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  table.setPage(0);
                }}
              >
                <SelectTrigger className="h-9 w-20 text-[13px]" data-testid="select-page-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="30">30</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="75">75</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-slate-400 dark:text-slate-500">per page</span>
            </div>
            <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
              {table.filtered.length} of {customers?.length ?? 0} users
            </span>
          </div>

          {customers === null ? (
            error ? (
              <EmptyState title="Could not load users" detail={error} />
            ) : (
              <LoadingRows rows={6} />
            )
          ) : table.filtered.length === 0 ? (
            <EmptyState
              title="No users match"
              detail="Adjust the search or plan filter to see more accounts."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => table.toggleSort("userId")}>
                      User
                    </TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => table.toggleSort("createdAt")}>
                      Joined
                    </TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Usage (month)</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => table.toggleSort("subscriptionEndDate")}>
                      Valid Until
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.pageRows.map((c, i) => {
                    const rem = remainingDays(c.subscriptionEndDate);
                    return (
                      <TableRow
                        key={c.userId}
                        className="cursor-pointer"
                        onClick={() => setSelected(c)}
                      >
                        <TableCell className="text-xs tabular-nums text-slate-400 dark:text-slate-500">
                          {table.page * pageSize + i + 1}
                        </TableCell>
                        <TableCell className="max-w-56">
                          <div className="flex flex-col gap-0.5">
                            <span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-300" title={c.userId}>
                              {c.name ?? c.email ?? c.userId}
                            </span>
                            {c.email && c.name && (
                              <span className="truncate text-[11px] text-slate-400 dark:text-slate-500" title={c.email}>
                                {c.email}
                              </span>
                            )}
                            {!c.name && !c.email && (
                              <span className="truncate font-mono text-[10px] text-slate-400 dark:text-slate-500">
                                {c.userId}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                          {c.location ?? "—"}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 dark:text-slate-400">{fmtDate(c.createdAt)}</TableCell>
                        <TableCell className="text-xs capitalize">{c.planName ?? "free"}</TableCell>
                        <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                          {c.monthlyUsed}
                          {c.monthlyLimit != null ? ` / ${c.monthlyLimit}` : " / ∞"}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                          {fmtDate(c.subscriptionEndDate)}
                          {rem !== null && rem >= 0 && (
                            <span className="ml-1 text-[10px] text-slate-400 dark:text-slate-500">({rem}d left)</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={displayStatus(c)} />
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="User actions">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setSelected(c)}>
                                <Eye className="mr-2 h-3.5 w-3.5" /> View profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setQuotaTarget(c)}>
                                <KeyRound className="mr-2 h-3.5 w-3.5" /> Set monthly quota
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setExtendTarget(c)}>
                                <CalendarPlus className="mr-2 h-3.5 w-3.5" /> Extend validity
                              </DropdownMenuItem>
                              {c.isPaid && c.planName !== "team" && (
                                <DropdownMenuItem onClick={() => setReissueTarget(c)}>
                                  <RotateCcwKey className="mr-2 h-3.5 w-3.5" /> Reissue license key
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() =>
                                  toast.info("Password resets are managed by the sign-in provider", {
                                    description:
                                      "Users can reset their password from the sign-in page; a console-triggered reset will arrive with the user-management backend.",
                                  })
                                }
                              >
                                <MailQuestion className="mr-2 h-3.5 w-3.5" /> Send reset link
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 dark:text-red-400 focus:text-red-600"
                                onClick={() => setBlockTarget(c)}
                              >
                                <Ban className="mr-2 h-3.5 w-3.5" /> Block user
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 dark:text-red-400 focus:text-red-600"
                                onClick={() => {
                                  setDeleteConfirm("");
                                  setDeleteTarget(c);
                                }}
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete user
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <Pager
                page={table.page}
                pageCount={table.pageCount}
                setPage={table.setPage}
                total={table.filtered.length}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail drawer */}
      <Sheet open={selected !== null} onOpenChange={(v) => !v && setSelected(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto p-5 sm:max-w-md">
          {selected && (
            <>
              <SheetHeader className="p-0 pb-4">
                <SheetTitle className="flex items-center gap-2 text-base">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#6D5DFB] text-xs font-bold text-white">
                    {selected.userId.charAt(selected.userId.length - 1).toUpperCase()}
                  </div>
                  <span className="truncate font-mono text-sm">{selected.userId}</span>
                  <CopyButton text={selected.userId} label="User id copied" />
                </SheetTitle>
              </SheetHeader>
              <Tabs defaultValue="overview">
                <TabsList className="grid h-8 w-full grid-cols-3">
                  <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                  <TabsTrigger value="subscription" className="text-xs">Subscription</TabsTrigger>
                  <TabsTrigger value="usage" className="text-xs">Usage</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="mt-4 space-y-2 text-sm">
                  {[
                    ["Joined", fmtDate(selected.createdAt)],
                    ["Account status", selected.accountStatus],
                    ["Plan", selected.planName ?? "free"],
                    ["Tier", selected.tier ?? "—"],
                    ["Lock reason", selected.lockReason ?? "—"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <span className="text-xs text-slate-500 dark:text-slate-400">{k}</span>
                      <span className="text-xs font-medium capitalize text-slate-800 dark:text-slate-200">{v}</span>
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="subscription" className="mt-4 space-y-2 text-sm">
                  {[
                    ["Paid account", selected.isPaid ? "Yes" : "No"],
                    ["Plan", selected.planName ?? "free"],
                    ["Starts", fmtDate(selected.subscriptionStartDate)],
                    ["Ends", fmtDate(selected.subscriptionEndDate)],
                    [
                      "Remaining",
                      (() => {
                        const r = remainingDays(selected.subscriptionEndDate);
                        return r === null ? "—" : r >= 0 ? `${r} days` : "expired";
                      })(),
                    ],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <span className="text-xs text-slate-500 dark:text-slate-400">{k}</span>
                      <span className="text-xs font-medium capitalize text-slate-800 dark:text-slate-200">{v}</span>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => setExtendTarget(selected)}
                  >
                    <CalendarPlus className="mr-1.5 h-3.5 w-3.5" /> Extend validity
                  </Button>
                </TabsContent>
                <TabsContent value="usage" className="mt-4 space-y-2 text-sm">
                  {[
                    [
                      "Monthly secure quota",
                      selected.monthlyLimit != null ? String(selected.monthlyLimit) : "Unlimited",
                    ],
                    ["Used this month", String(selected.monthlyUsed)],
                    [
                      "Remaining",
                      selected.monthlyRemaining != null ? String(selected.monthlyRemaining) : "∞",
                    ],
                    ["Password-protect used", String(selected.passwordProtectUsed)],
                    ["Secure PDFs created", String(selected.securePdfUsed)],
                    ["Quota resets", fmtDate(selected.resetDate)],
                    [
                      "Custom override",
                      selected.quotaOverrideSecure != null
                        ? String(selected.quotaOverrideSecure)
                        : "none",
                    ],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <span className="text-xs text-slate-500 dark:text-slate-400">{k}</span>
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{v}</span>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={() => {
                      setQuotaValue(
                        selected.quotaOverrideSecure != null
                          ? String(selected.quotaOverrideSecure)
                          : "",
                      );
                      setQuotaTarget(selected);
                    }}
                  >
                    <KeyRound className="mr-1.5 h-3.5 w-3.5" /> Set quota override
                  </Button>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Block modal (advisory until user-management backend ships) */}
      <Dialog open={blockTarget !== null} onOpenChange={(v) => !v && setBlockTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-4 w-4 text-red-500 dark:text-red-400" /> Block user
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="rounded-md bg-amber-50 dark:bg-amber-950/50 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              Account blocking needs a server-side endpoint that is not live yet. This form records
              your intent in the console audit log so the action isn't lost.
            </p>
            <div>
              <Label className="text-xs">Reason for blocking</Label>
              <Input id="block-reason" placeholder="e.g. abuse of upload quota" className="mt-1 h-9 text-[13px]" />
            </div>
            <div>
              <Label className="text-xs">Internal notes</Label>
              <Textarea placeholder="Visible to admins only" className="mt-1 text-[13px]" rows={2} />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Checkbox defaultChecked /> Block immediately
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Checkbox /> Send notification to user
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setBlockTarget(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (blockTarget) {
                  logAudit("Block requested", blockTarget.userId, "active", "blocked (pending backend)");
                  toast.warning("Block recorded in audit log.", {
                    description: "Enforcement will activate once the blocking endpoint ships.",
                  });
                }
                setBlockTarget(null);
              }}
            >
              Record block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend validity modal (advisory) */}
      <Dialog open={extendTarget !== null} onOpenChange={(v) => !v && setExtendTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Extend validity</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Current expiry:{" "}
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {fmtDate(extendTarget?.subscriptionEndDate)}
              </span>
            </p>
            <p className="rounded-md bg-amber-50 dark:bg-amber-950/50 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              Subscription dates are owned by the billing system. To extend a customer today,
              generate a license key for the extra period on the Licenses page and share it with
              them — that flow is fully live.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setExtendTarget(null)}>
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (extendTarget) logAudit("Validity extension requested", extendTarget.userId);
                toast.info("Use Licenses → Generate Key to grant extra time today.");
                setExtendTarget(null);
              }}
            >
              Note in audit log
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reissue license key — confirm modal */}
      <Dialog
        open={reissueTarget !== null}
        onOpenChange={(v) => {
          if (!v && !reissuing) setReissueTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <RotateCcwKey className="h-4 w-4 text-[#2563EB]" /> Reissue license key
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              License keys are stored encrypted and can't be looked up, so this mints a{" "}
              <span className="font-medium">fresh key</span> for{" "}
              <span className="font-medium">{reissueTarget?.email ?? reissueTarget?.userId}</span>{" "}
              ({reissueTarget?.planName ?? "paid"} plan) that you can copy and share with them.
            </p>
            <ul className="rounded-md bg-slate-50 dark:bg-slate-800/60 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <li>• Their subscription dates and activated devices are unaffected.</li>
              <li>• The old key is revoked and stops working immediately.</li>
              <li>• The new key is shown once — copy it before closing.</li>
            </ul>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              disabled={reissuing}
              onClick={() => setReissueTarget(null)}
            >
              Cancel
            </Button>
            <Button size="sm" disabled={reissuing} onClick={() => void confirmReissue()}>
              {reissuing ? "Generating…" : "Reissue key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reissued key — shown once, copyable */}
      <Dialog open={reissuedKey !== null} onOpenChange={(v) => !v && setReissuedKey(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">New license key ready</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Share this key with{" "}
              <span className="font-medium">{reissuedKey?.email ?? "the user"}</span>. It is shown{" "}
              <span className="font-medium">only once</span> and cannot be recovered later.
            </p>
            <div className="flex items-center justify-between gap-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-2.5">
              <span className="break-all font-mono text-[13px] font-semibold text-slate-900 dark:text-slate-100">
                {reissuedKey?.rawKey}
              </span>
              <CopyButton text={reissuedKey?.rawKey ?? ""} label="License key copied" />
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Plan: <span className="capitalize">{reissuedKey?.planName}</span> · the previous key
              has been revoked.
            </p>
          </div>
          <DialogFooter>
            <Button size="sm" onClick={() => setReissuedKey(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete user modal (real, permanent) */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(v) => {
          if (!v && !deleting) {
            setDeleteTarget(null);
            setDeleteConfirm("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" /> Delete user permanently
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="rounded-md bg-red-50 dark:bg-red-950/50 px-3 py-2 text-xs text-red-700 dark:text-red-400">
              This permanently deletes{" "}
              <span className="font-medium">{deleteTarget?.email ?? deleteTarget?.userId}</span> —
              their account, license, devices, usage history, payments, tickets, and team
              memberships. This cannot be undone. They can sign up again as a brand-new account.
            </p>
            <div>
              <Label className="text-xs">
                Type <span className="font-mono font-semibold">DELETE</span> to confirm
              </Label>
              <Input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="mt-1 h-9 text-[13px]"
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              disabled={deleting}
              onClick={() => {
                setDeleteTarget(null);
                setDeleteConfirm("");
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteConfirm !== "DELETE" || deleting}
              onClick={() => void confirmDelete()}
            >
              {deleting ? "Deleting…" : "Delete permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quota override modal (real) */}
      <Dialog open={quotaTarget !== null} onOpenChange={(v) => !v && setQuotaTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Monthly quota override</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sets a custom monthly secure-PDF limit for{" "}
              <span className="font-mono">{quotaTarget?.userId}</span>. Leave blank to restore the
              plan default. Applies immediately.
            </p>
            <Label className="text-xs">Custom limit</Label>
            <Input
              value={quotaValue}
              onChange={(e) => setQuotaValue(e.target.value)}
              placeholder="e.g. 100 (blank = plan default)"
              className="h-9 text-[13px]"
              inputMode="numeric"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setQuotaTarget(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => void saveQuota()}>
              Save override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
