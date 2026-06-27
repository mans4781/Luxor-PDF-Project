import crypto from "node:crypto";
import { razorpayCredentials } from "./billing";

const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

export interface CreatePaymentLinkParams {
  /** Amount in the smallest currency unit (paise for INR). */
  amount: number;
  currency: string;
  description: string;
  /** Unique reference so retries don't double-create the same intent. */
  referenceId?: string;
  customer?: { email?: string | null; name?: string | null };
  /** Persisted on the link + echoed back in the webhook (clerkUserId, plan). */
  notes: Record<string, string>;
  /** URL Razorpay redirects the buyer to after a successful payment. */
  callbackUrl: string;
}

export interface PaymentLinkResult {
  id: string;
  shortUrl: string;
}

/**
 * Creates a Razorpay Payment Link via the REST API (Basic auth) and returns the
 * hosted short URL the buyer is redirected to — the closest analogue to a Stripe
 * Checkout Session. Fulfillment happens server-side via the `payment_link.paid`
 * webhook, not the browser redirect.
 */
export async function createPaymentLink(
  params: CreatePaymentLinkParams,
): Promise<PaymentLinkResult> {
  const creds = razorpayCredentials();
  if (!creds) throw new Error("Razorpay not configured");

  const auth = Buffer.from(`${creds.keyId}:${creds.keySecret}`).toString(
    "base64",
  );

  const body: Record<string, unknown> = {
    amount: params.amount,
    currency: params.currency,
    accept_partial: false,
    description: params.description,
    notes: params.notes,
    callback_url: params.callbackUrl,
    callback_method: "get",
    reminder_enable: false,
    // We email the license ourselves; suppress Razorpay's own notifications.
    notify: { email: false, sms: false },
  };
  if (params.referenceId) body["reference_id"] = params.referenceId;
  if (params.customer && (params.customer.email || params.customer.name)) {
    body["customer"] = {
      ...(params.customer.email ? { email: params.customer.email } : {}),
      ...(params.customer.name ? { name: params.customer.name } : {}),
    };
  }

  const resp = await fetch(`${RAZORPAY_API_BASE}/payment_links`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Razorpay payment link failed (${resp.status}): ${text}`);
  }

  const json = (await resp.json()) as { id?: string; short_url?: string };
  if (!json.id || !json.short_url) {
    throw new Error("Razorpay payment link response missing id/short_url");
  }
  return { id: json.id, shortUrl: json.short_url };
}

/**
 * Timing-safe verification of a Razorpay webhook signature: HMAC-SHA256 of the
 * raw request body keyed by the webhook secret, hex-encoded, compared against
 * the `X-Razorpay-Signature` header.
 */
export function verifyRazorpaySignature(
  rawBody: Buffer,
  signature: string,
  secret: string,
): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signature, "utf8");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
