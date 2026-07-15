import type { AdminStats, AdminCustomer, ProductKey, MintedKey } from "./types";

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
  stats: (token: string) => request<AdminStats>(token, "/stats"),

  customers: (token: string) =>
    request<{ customers: AdminCustomer[] }>(token, "/customers").then((r) => r.customers),

  setQuotaOverride: (token: string, userId: string, override: number | null) =>
    request<unknown>(token, "/customers/quota-override", {
      method: "POST",
      body: JSON.stringify({ userId, override }),
    }),

  productKeys: (token: string) =>
    request<{ keys: ProductKey[] }>(token, "/product-keys").then((r) => r.keys),

  generateKeys: (
    token: string,
    body: {
      planName: string;
      count: number;
      maxActivations?: number;
      expiresAt?: string;
      notes?: string;
    },
  ) =>
    request<{ keys: MintedKey[] }>(token, "/product-keys/generate", {
      method: "POST",
      body: JSON.stringify(body),
    }).then((r) => r.keys),

  revokeKey: (token: string, id: number) =>
    request<ProductKey>(token, "/product-keys/revoke", {
      method: "POST",
      body: JSON.stringify({ id }),
    }),

  extendKey: (token: string, id: number, additionalDays: number) =>
    request<ProductKey>(token, "/product-keys/extend", {
      method: "POST",
      body: JSON.stringify({ id, additionalDays }),
    }),
};
