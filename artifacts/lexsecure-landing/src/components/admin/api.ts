import type { AdminStats, AdminCustomer, ProductKey, MintedKey, VisitorAnalytics, SupportTicket } from "./types";
import { SAMPLE_STATS, SAMPLE_CUSTOMERS, SAMPLE_PRODUCT_KEYS, SAMPLE_VISITOR_ANALYTICS, SAMPLE_TICKETS } from "./mock-data";

// Dev-only preview mode: the console renders with sample data, no login.
// Never active in production builds.
export const DEV_PREVIEW_TOKEN = "__dev_preview__";
export const isDevPreview = (token: string) =>
  import.meta.env.DEV && token === DEV_PREVIEW_TOKEN;

let previewKeys: ProductKey[] = [...SAMPLE_PRODUCT_KEYS];
let previewTickets: SupportTicket[] = [...SAMPLE_TICKETS];
let previewNextId = 9100;

class AdminApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export function isUnauthorized(err: unknown): boolean {
  return err instanceof AdminApiError && (err.status === 401 || err.status === 403);
}

async function request<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/admin${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-admin-token": token,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) msg = body.error;
    } catch {
      /* keep default */
    }
    throw new AdminApiError(msg, res.status);
  }
  return (await res.json()) as T;
}

export const adminApi = {
  stats: (token: string) =>
    isDevPreview(token) ? Promise.resolve(SAMPLE_STATS) : request<AdminStats>(token, "/stats"),

  visitorAnalytics: (token: string, days = 30) =>
    isDevPreview(token)
      ? Promise.resolve(SAMPLE_VISITOR_ANALYTICS)
      : request<VisitorAnalytics>(token, `/analytics/visitors?days=${days}`),

  customers: (token: string) =>
    isDevPreview(token)
      ? Promise.resolve([...SAMPLE_CUSTOMERS])
      : request<{ customers: AdminCustomer[] }>(token, "/customers").then((r) => r.customers),

  setQuotaOverride: (token: string, userId: string, override: number | null) =>
    isDevPreview(token)
      ? Promise.resolve({})
      : request<unknown>(token, "/customers/quota-override", {
          method: "POST",
          body: JSON.stringify({ userId, override }),
        }),

  productKeys: (token: string) =>
    isDevPreview(token)
      ? Promise.resolve([...previewKeys])
      : request<{ keys: ProductKey[] }>(token, "/product-keys").then((r) => r.keys),

  generateKeys: (
    token: string,
    body: {
      planName: string;
      count: number;
      maxActivations?: number;
      expiresAt?: string;
      notes?: string;
    },
  ) => {
    if (isDevPreview(token)) {
      const minted: MintedKey[] = Array.from({ length: body.count }, () => {
        const id = previewNextId++;
        const prefix = `LUXOR-${id.toString(36).toUpperCase().padStart(4, "0")}`;
        const durationDays =
          body.planName === "lifetime" ? 36_500 :
          body.planName === "yearly" ? 365 :
          body.planName === "quarterly" ? 90 : 30;
        previewKeys = [
          {
            id, keyPrefix: prefix, planName: body.planName, durationDays,
            maxActivations: body.maxActivations ?? 1, currentActivations: 0,
            status: "active", expiresAt: body.expiresAt ?? null,
            notes: body.notes ?? "Sample — dev preview",
            createdAt: new Date().toISOString(), revokedAt: null,
          },
          ...previewKeys,
        ];
        return {
          id, rawKey: `${prefix}-XXXX-XXXX-XXXX`, keyPrefix: prefix,
          planName: body.planName, durationDays,
          maxActivations: body.maxActivations ?? 1, expiresAt: body.expiresAt ?? null,
        };
      });
      return Promise.resolve(minted);
    }
    return request<{ keys: MintedKey[] }>(token, "/product-keys/generate", {
      method: "POST",
      body: JSON.stringify(body),
    }).then((r) => r.keys);
  },

  revokeKey: (token: string, id: number) => {
    if (isDevPreview(token)) {
      previewKeys = previewKeys.map((k) =>
        k.id === id ? { ...k, status: "revoked", revokedAt: new Date().toISOString() } : k,
      );
      return Promise.resolve(previewKeys.find((k) => k.id === id) as ProductKey);
    }
    return request<ProductKey>(token, "/product-keys/revoke", {
      method: "POST",
      body: JSON.stringify({ id }),
    });
  },

  extendKey: (token: string, id: number, additionalDays: number) => {
    if (isDevPreview(token)) {
      previewKeys = previewKeys.map((k) =>
        k.id === id ? { ...k, durationDays: k.durationDays + additionalDays } : k,
      );
      return Promise.resolve(previewKeys.find((k) => k.id === id) as ProductKey);
    }
    return request<ProductKey>(token, "/product-keys/extend", {
      method: "POST",
      body: JSON.stringify({ id, additionalDays }),
    });
  },

  tickets: (token: string) =>
    isDevPreview(token)
      ? Promise.resolve([...previewTickets])
      : request<{ tickets: SupportTicket[] }>(token, "/tickets").then((r) => r.tickets),

  updateTicket: (
    token: string,
    id: number,
    patch: { status?: string; adminReply?: string },
  ) => {
    if (isDevPreview(token)) {
      previewTickets = previewTickets.map((t) =>
        t.id === id ? { ...t, ...patch, updatedAt: new Date().toISOString() } : t,
      );
      return Promise.resolve(previewTickets.find((t) => t.id === id) as SupportTicket);
    }
    return request<{ ticket: SupportTicket }>(token, "/tickets/update", {
      method: "POST",
      body: JSON.stringify({ id, ...patch }),
    }).then((r) => r.ticket);
  },
};
