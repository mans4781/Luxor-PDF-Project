import { useSyncExternalStore } from "react";
import type { Offer, Referral, AppNotification, AuditEntry } from "./types";
import { SAMPLE_OFFERS, SAMPLE_REFERRALS, SAMPLE_NOTIFICATIONS, SAMPLE_AUDIT_LOG } from "./mock-data";

/**
 * Local mock service layer for features without live backends yet
 * (offers, referrals, notifications, audit log). Each store keeps state in
 * memory + sessionStorage so UI actions feel real and survive reloads within
 * a session. Swap the store internals for API calls when endpoints exist.
 */

class Store<T> {
  private listeners = new Set<() => void>();
  private state: T;
  constructor(
    private storageKey: string,
    initial: T,
  ) {
    let loaded: T | null = null;
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) loaded = JSON.parse(raw) as T;
    } catch {
      loaded = null;
    }
    this.state = loaded ?? initial;
  }
  get = () => this.state;
  set = (next: T) => {
    this.state = next;
    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify(next));
    } catch {
      /* storage full/unavailable — keep in-memory state */
    }
    this.listeners.forEach((l) => l());
  };
  update = (fn: (prev: T) => T) => this.set(fn(this.state));
  subscribe = (l: () => void) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };
}

const offersStore = new Store<Offer[]>("luxor_admin_offers", SAMPLE_OFFERS);
const referralsStore = new Store<Referral[]>("luxor_admin_referrals", SAMPLE_REFERRALS);
const notificationsStore = new Store<AppNotification[]>("luxor_admin_notifs", SAMPLE_NOTIFICATIONS);
const auditStore = new Store<AuditEntry[]>("luxor_admin_audit", SAMPLE_AUDIT_LOG);

function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

export function useOffers() {
  return useStore(offersStore);
}
export function useReferrals() {
  return useStore(referralsStore);
}
export function useNotifications() {
  return useStore(notificationsStore);
}
export function useAuditLog() {
  return useStore(auditStore);
}

export function logAudit(action: string, target: string, prev = "—", next = "—") {
  auditStore.update((list) => [
    {
      id: `au_${Date.now()}`,
      admin: "Admin",
      action,
      target,
      prev,
      next,
      time: new Date().toISOString(),
      ip: "console",
    },
    ...list,
  ]);
}

export const offerService = {
  create(offer: Offer) {
    offersStore.update((list) => [offer, ...list]);
    logAudit("Offer created", offer.code, "—", offer.status);
  },
  setStatus(id: string, status: Offer["status"]) {
    let code = "";
    offersStore.update((list) =>
      list.map((o) => {
        if (o.id !== id) return o;
        code = o.code;
        return { ...o, status };
      }),
    );
    if (code) logAudit(`Offer ${status.toLowerCase()}`, code, "—", status);
  },
  duplicate(id: string) {
    offersStore.update((list) => {
      const src = list.find((o) => o.id === id);
      if (!src) return list;
      return [
        {
          ...src,
          id: `of_${Date.now()}`,
          name: `${src.name} (copy)`,
          code: `${src.code}-COPY`,
          timesUsed: 0,
          status: "Draft" as const,
        },
        ...list,
      ];
    });
  },
  remove(id: string) {
    let code = "";
    offersStore.update((list) =>
      list.filter((o) => {
        if (o.id === id) code = o.code;
        return o.id !== id;
      }),
    );
    if (code) logAudit("Offer deleted", code);
  },
};

export const referralService = {
  grantReward(id: string) {
    referralsStore.update((list) =>
      list.map((r) =>
        r.id === id ? { ...r, rewardGranted: true, status: "Reward Granted" as const } : r,
      ),
    );
    logAudit("Referral reward granted", id, "pending", "+2 months");
  },
  cancelReward(id: string) {
    referralsStore.update((list) =>
      list.map((r) =>
        r.id === id ? { ...r, rewardGranted: false, status: "Rejected" as const } : r,
      ),
    );
    logAudit("Referral reward cancelled", id);
  },
  flag(id: string) {
    referralsStore.update((list) =>
      list.map((r) => (r.id === id ? { ...r, status: "Fraud Review" as const } : r)),
    );
    logAudit("Referral flagged", id, "—", "Fraud Review");
  },
};

export const notificationService = {
  markRead(id: string) {
    notificationsStore.update((list) =>
      list.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  },
  markAllRead() {
    notificationsStore.update((list) => list.map((n) => ({ ...n, read: true })));
  },
};

// ── CSV export helper ─────────────────────────────────────────────────────────

export function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) return;
  const first = rows[0]!;
  const headers = Object.keys(first);
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join(
    "\n",
  );
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
