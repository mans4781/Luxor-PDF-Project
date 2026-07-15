import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Ban,
  CalendarPlus,
  Download,
  KeyRound,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { MintedKey, ProductKey } from "../types";
import { PRODUCT_PLANS } from "../types";
import { adminApi, isUnauthorized } from "../api";
import { downloadCsv, logAudit } from "../services";
import {
  ConfirmDialog,
  CopyButton,
  EmptyState,
  KpiCard,
  LoadingRows,
  PageHeader,
  Pager,
  StatusBadge,
  fmtDate,
  useTableState,
} from "../shared";

export function LicensesPage({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [keys, setKeys] = useState<ProductKey[] | null>(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");

  // generate modal
  const [genOpen, setGenOpen] = useState(false);
  const [genPlan, setGenPlan] = useState("yearly");
  const [genCount, setGenCount] = useState("1");
  const [genActivations, setGenActivations] = useState("1");
  const [genNotes, setGenNotes] = useState("");
  const [genBusy, setGenBusy] = useState(false);
  const [minted, setMinted] = useState<MintedKey[] | null>(null);

  const [revokeTarget, setRevokeTarget] = useState<ProductKey | null>(null);
  const [extendTarget, setExtendTarget] = useState<ProductKey | null>(null);
  const [extendDays, setExtendDays] = useState("30");

  useEffect(() => {
    let cancelled = false;
    setKeys(null);
    adminApi
      .productKeys(token)
      .then((rows) => {
        if (!cancelled) setKeys(rows);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (isUnauthorized(err)) onLogout();
        else setError("Failed to load license keys.");
      });
    return () => {
      cancelled = true;
    };
  }, [token, onLogout, reloadKey]);

  const filtered = useMemo(() => {
    const rows = keys ?? [];
    return statusFilter === "all" ? rows : rows.filter((k) => k.status === statusFilter);
  }, [keys, statusFilter]);

  const table = useTableState(filtered, {
    pageSize: 10,
    searchable: (k) => `${k.keyPrefix} ${k.planName} ${k.status} ${k.notes ?? ""}`,
  });

  const counts = useMemo(() => {
    const rows = keys ?? [];
    return {
      total: rows.length,
      active: rows.filter((k) => k.status === "active").length,
      revoked: rows.filter((k) => k.status === "revoked").length,
      activations: rows.reduce((s, k) => s + k.currentActivations, 0),
    };
  }, [keys]);

  const generate = async () => {
    const count = Number(genCount);
    const activations = Number(genActivations);
    if (!Number.isInteger(count) || count < 1 || count > 100) {
      toast.error("Count must be between 1 and 100.");
      return;
    }
    if (!Number.isInteger(activations) || activations < 1 || activations > 100) {
      toast.error("Activations must be between 1 and 100.");
      return;
    }
    setGenBusy(true);
    try {
      const newKeys = await adminApi.generateKeys(token, {
        planName: genPlan,
        count,
        maxActivations: activations,
        notes: genNotes.trim() || undefined,
      });
      setMinted(newKeys);
      logAudit("License keys generated", `${count} × ${genPlan}`, "—", "active");
      toast.success(`${newKeys.length} key${newKeys.length > 1 ? "s" : ""} generated.`);
      setReloadKey((k) => k + 1);
    } catch (err) {
      if (isUnauthorized(err)) onLogout();
      else toast.error("Key generation failed.");
    } finally {
      setGenBusy(false);
    }
  };

  const doRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await adminApi.revokeKey(token, revokeTarget.id);
      logAudit("License revoked", revokeTarget.keyPrefix, "active", "revoked");
      toast.success(`Key ${revokeTarget.keyPrefix}… revoked.`);
      setRevokeTarget(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      if (isUnauthorized(err)) onLogout();
      else toast.error("Revoke failed.");
    }
  };

  const doExtend = async () => {
    if (!extendTarget) return;
    const days = Number(extendDays);
    if (!Number.isInteger(days) || days < 1 || days > 3650) {
      toast.error("Days must be between 1 and 3650.");
      return;
    }
    try {
      await adminApi.extendKey(token, extendTarget.id, days);
      logAudit(
        "License extended",
        extendTarget.keyPrefix,
        `${extendTarget.durationDays}d`,
        `${extendTarget.durationDays + days}d`,
      );
      toast.success(`Key extended by ${days} days.`);
      setExtendTarget(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      if (isUnauthorized(err)) onLogout();
      else toast.error("Extension failed.");
    }
  };

  const exportKeys = () => {
    downloadCsv(
      "luxor-license-keys.csv",
      table.filtered.map((k) => ({
        key_prefix: k.keyPrefix,
        plan: k.planName,
        duration_days: k.durationDays,
        activations: `${k.currentActivations}/${k.maxActivations}`,
        status: k.status,
        created: k.createdAt,
        expires: k.expiresAt ?? "",
        notes: k.notes ?? "",
      })),
    );
    toast.success("License list exported as CSV.");
  };

  return (
    <div>
      <PageHeader
        title="Licenses"
        sub="Generate, revoke and extend Luxor product keys (live data)"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setReloadKey((k) => k + 1)}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportKeys}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Export
            </Button>
            <Button
              size="sm"
              className="bg-[#2563EB] hover:bg-blue-700"
              onClick={() => {
                setMinted(null);
                setGenOpen(true);
              }}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Generate Key
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard icon={<KeyRound className="h-4 w-4" />} label="Total Keys" value={String(counts.total)} />
        <KpiCard icon={<KeyRound className="h-4 w-4" />} label="Active" value={String(counts.active)} />
        <KpiCard icon={<Ban className="h-4 w-4" />} label="Revoked" value={String(counts.revoked)} />
        <KpiCard icon={<KeyRound className="h-4 w-4" />} label="Device Activations" value={String(counts.activations)} />
      </div>

      <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
        <CardContent className="p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              <Input
                value={table.search}
                onChange={(e) => table.setSearch(e.target.value)}
                placeholder="Search prefix, plan, notes…"
                className="h-9 pl-8 text-[13px]"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-32 text-[13px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
                <SelectItem value="redeemed">Redeemed</SelectItem>
              </SelectContent>
            </Select>
            <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">{table.filtered.length} keys</span>
          </div>

          {keys === null ? (
            error ? (
              <EmptyState title="Could not load keys" detail={error} />
            ) : (
              <LoadingRows rows={6} />
            )
          ) : table.filtered.length === 0 ? (
            <EmptyState
              title="No license keys yet"
              detail="Use Generate Key to mint LUXOR product keys for customers or promotions."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => table.toggleSort("planName")}>Plan</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Activations</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => table.toggleSort("createdAt")}>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.pageRows.map((k) => (
                    <TableRow key={k.id}>
                      <TableCell className="font-mono text-xs">{k.keyPrefix}-••••</TableCell>
                      <TableCell className="text-xs capitalize">{k.planName}</TableCell>
                      <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                        {k.durationDays >= 36_500 ? "Lifetime" : `${k.durationDays}d`}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                        {k.currentActivations}/{k.maxActivations}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 dark:text-slate-400">{fmtDate(k.createdAt)}</TableCell>
                      <TableCell>
                        <StatusBadge status={k.status} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Key actions">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem
                              disabled={k.status !== "active"}
                              onClick={() => {
                                setExtendDays("30");
                                setExtendTarget(k);
                              }}
                            >
                              <CalendarPlus className="mr-2 h-3.5 w-3.5" /> Extend duration
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={k.status === "revoked"}
                              className="text-red-600 dark:text-red-400 focus:text-red-600"
                              onClick={() => setRevokeTarget(k)}
                            >
                              <Ban className="mr-2 h-3.5 w-3.5" /> Revoke key
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

      {/* Generate modal */}
      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Generate license keys</DialogTitle>
          </DialogHeader>
          {minted === null ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Plan</Label>
                  <Select value={genPlan} onValueChange={setGenPlan}>
                    <SelectTrigger className="mt-1 h-9 text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_PLANS.map((p) => (
                        <SelectItem key={p} value={p} className="capitalize">
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Number of keys</Label>
                  <Input value={genCount} onChange={(e) => setGenCount(e.target.value)} className="mt-1 h-9 text-[13px]" inputMode="numeric" />
                </div>
                <div>
                  <Label className="text-xs">Device activations / key</Label>
                  <Input value={genActivations} onChange={(e) => setGenActivations(e.target.value)} className="mt-1 h-9 text-[13px]" inputMode="numeric" />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Notes (internal)</Label>
                  <Textarea value={genNotes} onChange={(e) => setGenNotes(e.target.value)} rows={2} placeholder="e.g. Giveaway batch, support goodwill…" className="mt-1 text-[13px]" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => setGenOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" className="bg-[#2563EB] hover:bg-blue-700" disabled={genBusy} onClick={() => void generate()}>
                  {genBusy ? "Generating…" : "Generate"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <p className="rounded-md bg-amber-50 dark:bg-amber-950/50 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                Copy these keys now — the full key is shown only once and cannot be recovered
                later.
              </p>
              <div className="max-h-56 space-y-1.5 overflow-y-auto">
                {minted.map((k) => (
                  <div key={k.id} className="flex items-center justify-between rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-2">
                    <span className="font-mono text-xs text-slate-800 dark:text-slate-200">{k.rawKey}</span>
                    <CopyButton text={k.rawKey} label="Key copied" />
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    downloadCsv(
                      "luxor-generated-keys.csv",
                      minted.map((k) => ({ key: k.rawKey, plan: k.planName, activations: k.maxActivations })),
                    );
                    toast.success("Keys downloaded as CSV.");
                  }}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Download CSV
                </Button>
                <Button size="sm" onClick={() => setGenOpen(false)}>
                  Done
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Revoke confirm */}
      <ConfirmDialog
        open={revokeTarget !== null}
        onOpenChange={(v) => !v && setRevokeTarget(null)}
        title={`Revoke ${revokeTarget?.keyPrefix ?? ""}-•••• ?`}
        description="The key immediately stops activating new devices and existing activations lose their license at next check-in. This cannot be undone."
        confirmLabel="Revoke key"
        destructive
        onConfirm={() => void doRevoke()}
      />

      {/* Extend modal */}
      <Dialog open={extendTarget !== null} onOpenChange={(v) => !v && setExtendTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Extend key duration</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Adds days to <span className="font-mono">{extendTarget?.keyPrefix}-••••</span>{" "}
              (currently {extendTarget?.durationDays} days). Applies to future redemptions and
              linked licenses.
            </p>
            <Label className="text-xs">Additional days</Label>
            <Input value={extendDays} onChange={(e) => setExtendDays(e.target.value)} className="h-9 text-[13px]" inputMode="numeric" />
            <div className="flex gap-1.5">
              {[30, 90, 365].map((d) => (
                <Button key={d} variant="outline" size="sm" className="h-7 text-xs" onClick={() => setExtendDays(String(d))}>
                  +{d}d
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setExtendTarget(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => void doExtend()}>
              Extend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
