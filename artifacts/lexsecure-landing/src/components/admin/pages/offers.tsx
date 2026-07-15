import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CopyPlus,
  Download,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Search,
  Tags,
  Trash2,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Offer, OfferStatus } from "../types";
import { offerService, useOffers } from "../services";
import {
  ConfirmDialog,
  CopyButton,
  EmptyState,
  KpiCard,
  PageHeader,
  Pager,
  StatusBadge,
  fmtDate,
  useTableState,
} from "../shared";
import { downloadCsv } from "../services";

const OCCASIONS = [
  "Eid",
  "Diwali",
  "Christmas",
  "New Year",
  "Black Friday",
  "Summer",
  "Product Launch",
  "Loyalty",
  "Custom",
];

const PRODUCTS = ["PDF Secure", "PDF Reader", "eSign"];
const PLANS = ["monthly", "quarterly", "yearly", "lifetime"];

export function OffersPage() {
  const offers = useOffers();
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Offer | null>(null);

  // form state
  const [fName, setFName] = useState("");
  const [fCode, setFCode] = useState("");
  const [fOccasion, setFOccasion] = useState("Custom");
  const [fType, setFType] = useState<Offer["discountType"]>("percent");
  const [fValue, setFValue] = useState("10");
  const [fProducts, setFProducts] = useState<string[]>(["PDF Secure"]);
  const [fPlans, setFPlans] = useState<string[]>(["monthly", "yearly"]);
  const [fEligible, setFEligible] = useState<Offer["eligibleUsers"]>("everyone");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");
  const [fLimit, setFLimit] = useState("");
  const [fDescription, setFDescription] = useState("");
  const [fAutoApply, setFAutoApply] = useState(false);
  const [fPublic, setFPublic] = useState(true);

  const filtered = useMemo(
    () => (statusFilter === "all" ? offers : offers.filter((o) => o.status === statusFilter)),
    [offers, statusFilter],
  );
  const table = useTableState(filtered, {
    pageSize: 8,
    searchable: (o) => `${o.name} ${o.code} ${o.occasion} ${o.status}`,
  });

  const stats = useMemo(
    () => ({
      active: offers.filter((o) => o.status === "Active").length,
      scheduled: offers.filter((o) => o.status === "Scheduled").length,
      used: offers.reduce((s, o) => s + o.timesUsed, 0),
    }),
    [offers],
  );

  const resetForm = () => {
    setFName("");
    setFCode("");
    setFOccasion("Custom");
    setFType("percent");
    setFValue("10");
    setFProducts(["PDF Secure"]);
    setFPlans(["monthly", "yearly"]);
    setFEligible("everyone");
    setFFrom("");
    setFTo("");
    setFLimit("");
    setFDescription("");
    setFAutoApply(false);
    setFPublic(true);
  };

  const createOffer = () => {
    if (!fName.trim() || !fCode.trim()) {
      toast.error("Name and code are required.");
      return;
    }
    const value = Number(fValue);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Discount value must be a positive number.");
      return;
    }
    if (fProducts.length === 0 || fPlans.length === 0) {
      toast.error("Pick at least one product and one plan.");
      return;
    }
    const from = fFrom ? new Date(fFrom) : new Date();
    const to = fTo ? new Date(fTo) : new Date(Date.now() + 30 * 86_400_000);
    if (to.getTime() <= from.getTime()) {
      toast.error("End date must be after start date.");
      return;
    }
    const status: OfferStatus = from.getTime() > Date.now() ? "Scheduled" : "Active";
    offerService.create({
      id: `of_${Date.now()}`,
      name: fName.trim(),
      code: fCode.trim().toUpperCase(),
      description: fDescription.trim(),
      occasion: fOccasion,
      discountType: fType,
      discountValue: value,
      products: fProducts,
      plans: fPlans,
      eligibleUsers: fEligible,
      countries: ["All"],
      validFrom: from.toISOString(),
      validTo: to.toISOString(),
      usageLimit: fLimit.trim() ? Number(fLimit) : null,
      perUserLimit: 1,
      timesUsed: 0,
      minPurchase: null,
      maxDiscount: null,
      autoApply: fAutoApply,
      isPublic: fPublic,
      status,
    });
    toast.success(`Offer ${fCode.trim().toUpperCase()} created (${status}).`);
    setCreateOpen(false);
    resetForm();
  };

  const toggleIn = (list: string[], v: string, set: (l: string[]) => void) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const fmtDiscount = (o: Offer) =>
    o.discountType === "percent"
      ? `${o.discountValue}% off`
      : o.discountType === "fixed"
        ? `$${o.discountValue} off`
        : `+${o.discountValue} days`;

  return (
    <div>
      <PageHeader
        title="Offers"
        sub="Occasion-based discounts and promotional campaigns"
        actions={
          <>
            <Badge variant="outline" className="border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/50 text-[10px] text-amber-600 dark:text-amber-400">
              sample workspace — checkout integration pending
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                downloadCsv(
                  "luxor-offers.csv",
                  offers.map((o) => ({
                    name: o.name,
                    code: o.code,
                    discount: fmtDiscount(o),
                    status: o.status,
                    valid_from: o.validFrom,
                    valid_to: o.validTo,
                    times_used: o.timesUsed,
                  })),
                );
                toast.success("Offers exported as CSV.");
              }}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" /> Export
            </Button>
            <Button size="sm" className="bg-[#2563EB] hover:bg-blue-700" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Offer
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-3 gap-3">
        <KpiCard icon={<Tags className="h-4 w-4" />} label="Active Offers" value={String(stats.active)} />
        <KpiCard icon={<Tags className="h-4 w-4" />} label="Scheduled" value={String(stats.scheduled)} />
        <KpiCard icon={<Tags className="h-4 w-4" />} label="Total Redemptions" value={String(stats.used)} />
      </div>

      <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
        <CardContent className="p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              <Input
                value={table.search}
                onChange={(e) => table.setSearch(e.target.value)}
                placeholder="Search name, code, occasion…"
                className="h-9 pl-8 text-[13px]"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-36 text-[13px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {["Active", "Scheduled", "Paused", "Draft", "Expired", "Cancelled"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {table.filtered.length === 0 ? (
            <EmptyState title="No offers match" detail="Create an offer or change the filters." />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Offer</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Validity</TableHead>
                    <TableHead>Used</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.pageRows.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{o.name}</div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500">
                          {o.occasion} · {o.products.join(", ")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <code className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[11px]">{o.code}</code>
                          <CopyButton text={o.code} label="Code copied" />
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-[#2563EB] dark:text-[#60A5FA]">{fmtDiscount(o)}</TableCell>
                      <TableCell className="text-[11px] text-slate-500 dark:text-slate-400">
                        {fmtDate(o.validFrom)} → {fmtDate(o.validTo)}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                        {o.timesUsed}
                        {o.usageLimit ? ` / ${o.usageLimit}` : ""}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={o.status} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Offer actions">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            {o.status === "Active" ? (
                              <DropdownMenuItem onClick={() => { offerService.setStatus(o.id, "Paused"); toast.success(`${o.code} paused.`); }}>
                                <Pause className="mr-2 h-3.5 w-3.5" /> Pause
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                disabled={o.status === "Expired"}
                                onClick={() => { offerService.setStatus(o.id, "Active"); toast.success(`${o.code} activated.`); }}
                              >
                                <Play className="mr-2 h-3.5 w-3.5" /> Activate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => { offerService.duplicate(o.id); toast.success(`${o.code} duplicated as draft.`); }}>
                              <CopyPlus className="mr-2 h-3.5 w-3.5" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={o.status === "Cancelled" || o.status === "Expired"}
                              onClick={() => { offerService.setStatus(o.id, "Cancelled"); toast.success(`${o.code} cancelled.`); }}
                            >
                              <XCircle className="mr-2 h-3.5 w-3.5" /> Cancel
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 dark:text-red-400 focus:text-red-600" onClick={() => setDeleteTarget(o)}>
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
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

      {/* Create offer */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">Create offer</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-xs">Offer name</Label>
              <Input value={fName} onChange={(e) => setFName(e.target.value)} placeholder="e.g. Diwali Festival Offer" className="mt-1 h-9 text-[13px]" />
            </div>
            <div>
              <Label className="text-xs">Promo code</Label>
              <Input value={fCode} onChange={(e) => setFCode(e.target.value.toUpperCase())} placeholder="DIWALI30" className="mt-1 h-9 font-mono text-[13px]" />
            </div>
            <div>
              <Label className="text-xs">Occasion</Label>
              <Select value={fOccasion} onValueChange={setFOccasion}>
                <SelectTrigger className="mt-1 h-9 text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OCCASIONS.map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Discount type</Label>
              <Select value={fType} onValueChange={(v) => setFType(v as Offer["discountType"])}>
                <SelectTrigger className="mt-1 h-9 text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percentage off</SelectItem>
                  <SelectItem value="fixed">Fixed amount off</SelectItem>
                  <SelectItem value="extension">Validity extension (days)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">
                {fType === "percent" ? "Percent (%)" : fType === "fixed" ? "Amount ($)" : "Extra days"}
              </Label>
              <Input value={fValue} onChange={(e) => setFValue(e.target.value)} className="mt-1 h-9 text-[13px]" inputMode="numeric" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Products</Label>
              <div className="mt-1 flex flex-wrap gap-3">
                {PRODUCTS.map((p) => (
                  <label key={p} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <Checkbox checked={fProducts.includes(p)} onCheckedChange={() => toggleIn(fProducts, p, setFProducts)} />
                    {p}
                  </label>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Plans</Label>
              <div className="mt-1 flex flex-wrap gap-3">
                {PLANS.map((p) => (
                  <label key={p} className="flex items-center gap-1.5 text-xs capitalize text-slate-600 dark:text-slate-400">
                    <Checkbox checked={fPlans.includes(p)} onCheckedChange={() => toggleIn(fPlans, p, setFPlans)} />
                    {p}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">Eligible users</Label>
              <Select value={fEligible} onValueChange={(v) => setFEligible(v as Offer["eligibleUsers"])}>
                <SelectTrigger className="mt-1 h-9 text-[13px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Everyone</SelectItem>
                  <SelectItem value="new">New users only</SelectItem>
                  <SelectItem value="existing">Existing customers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Total usage limit</Label>
              <Input value={fLimit} onChange={(e) => setFLimit(e.target.value)} placeholder="blank = unlimited" className="mt-1 h-9 text-[13px]" inputMode="numeric" />
            </div>
            <div>
              <Label className="text-xs">Valid from</Label>
              <Input type="datetime-local" value={fFrom} onChange={(e) => setFFrom(e.target.value)} className="mt-1 h-9 text-[13px]" />
            </div>
            <div>
              <Label className="text-xs">Valid to</Label>
              <Input type="datetime-local" value={fTo} onChange={(e) => setFTo(e.target.value)} className="mt-1 h-9 text-[13px]" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Description</Label>
              <Textarea value={fDescription} onChange={(e) => setFDescription(e.target.value)} rows={2} className="mt-1 text-[13px]" placeholder="Shown internally and, if public, on the pricing page." />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Checkbox checked={fAutoApply} onCheckedChange={(v) => setFAutoApply(v === true)} /> Auto-apply at checkout
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Checkbox checked={fPublic} onCheckedChange={(v) => setFPublic(v === true)} /> Publicly visible
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button size="sm" className="bg-[#2563EB] hover:bg-blue-700" onClick={createOffer}>Create offer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={`Delete offer ${deleteTarget?.code ?? ""}?`}
        description="The offer is removed from the console workspace. Customers who already used it are unaffected."
        confirmLabel="Delete offer"
        destructive
        onConfirm={() => {
          if (deleteTarget) {
            offerService.remove(deleteTarget.id);
            toast.success(`Offer ${deleteTarget.code} deleted.`);
          }
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
