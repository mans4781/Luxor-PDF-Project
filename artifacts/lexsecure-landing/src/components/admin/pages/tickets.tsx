import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, Inbox, Mail, RefreshCw, Send } from "lucide-react";
import type { SupportTicket } from "../types";
import { adminApi, isUnauthorized } from "../api";

const STATUSES = ["open", "in_progress", "resolved", "closed"] as const;

const STATUS_META: Record<string, { label: string; cls: string }> = {
  open: { label: "Open", cls: "bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900" },
  in_progress: { label: "In progress", cls: "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900" },
  resolved: { label: "Resolved", cls: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900" },
  closed: { label: "Closed", cls: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700" },
};

const CATEGORY_META: Record<string, { label: string; cls: string }> = {
  general: { label: "General", cls: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400" },
  technical: { label: "Technical", cls: "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400" },
  billing: { label: "Billing", cls: "bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400" },
  refund: { label: "Refund", cls: "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400" },
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.floor(ms / 60_000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function TicketsPage({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [tickets, setTickets] = useState<SupportTicket[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [openId, setOpenId] = useState<number | null>(null);
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setError("");
    adminApi
      .tickets(token)
      .then(setTickets)
      .catch((err: unknown) => {
        if (isUnauthorized(err)) onLogout();
        else setError("Failed to load tickets.");
      });
  }, [token, onLogout]);

  useEffect(() => {
    load();
  }, [load]);

  const applyPatch = async (id: number, patch: { status?: string; adminReply?: string }) => {
    setSaving(true);
    try {
      const updated = await adminApi.updateTicket(token, id, patch);
      setTickets((prev) => prev?.map((t) => (t.id === id ? updated : t)) ?? prev);
      toast.success(patch.adminReply !== undefined ? "Reply saved" : "Status updated");
      if (patch.adminReply !== undefined) setReply("");
    } catch (err: unknown) {
      if (isUnauthorized(err)) onLogout();
      else toast.error("Update failed. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-sm text-red-500 dark:text-red-400">
        {error}
        <button
          className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          onClick={load}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!tickets) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[#2563EB] dark:text-[#60A5FA]">
        Loading tickets…
      </div>
    );
  }

  const counts = STATUSES.reduce<Record<string, number>>(
    (acc, s) => ({ ...acc, [s]: tickets.filter((t) => t.status === s).length }),
    {},
  );
  const visible = filter === "all" ? tickets : tickets.filter((t) => t.status === filter);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Support Tickets</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Queries from the contact form — including billing and refund requests.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              filter === s
                ? "border-[#2563EB] bg-[#2563EB] text-white"
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            {s === "all" ? `All (${tickets.length})` : `${STATUS_META[s]?.label ?? s} (${counts[s] ?? 0})`}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500">
          <Inbox className="h-8 w-8" strokeWidth={1.5} />
          <span className="text-sm">No tickets here yet.</span>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((t) => {
            const status = STATUS_META[t.status] ?? STATUS_META["open"]!;
            const cat = CATEGORY_META[t.category] ?? CATEGORY_META["general"]!;
            const expanded = openId === t.id;
            return (
              <div key={t.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
                <button
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                  onClick={() => {
                    setOpenId(expanded ? null : t.id);
                    setReply("");
                  }}
                >
                  <span className="hidden text-xs font-semibold text-slate-400 dark:text-slate-500 sm:block">#{t.id}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{t.subject}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cat.cls}`}>{cat.label}</span>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                      {t.name} · {t.email} · {t.product} · {timeAgo(t.createdAt)}
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${status.cls}`}>
                    {status.label}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500 transition-transform ${expanded ? "rotate-180" : ""}`}
                  />
                </button>

                {expanded && (
                  <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 px-4 py-4">
                    <p className="whitespace-pre-wrap rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3 text-sm text-slate-700 dark:text-slate-300">{t.message}</p>

                    {t.adminReply && (
                      <div className="rounded-lg border border-emerald-100 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/50/60 p-3">
                        <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                          <Mail className="h-3.5 w-3.5" /> Your reply
                        </div>
                        <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{t.adminReply}</p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Status:</span>
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          disabled={saving || t.status === s}
                          onClick={() => void applyPatch(t.id, { status: s })}
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:cursor-default ${
                            t.status === s
                              ? STATUS_META[s]!.cls
                              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          {STATUS_META[s]!.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-start gap-2">
                      <textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        rows={2}
                        placeholder={t.adminReply ? "Update your reply…" : "Write a reply to this customer…"}
                        className="min-w-0 flex-1 resize-none rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <button
                        disabled={saving || !reply.trim()}
                        onClick={() => void applyPatch(t.id, { adminReply: reply.trim() })}
                        className="flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        <Send className="h-3.5 w-3.5" /> Save reply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
