import {
  Router,
  type IRouter,
  type Request,
  type Response,
  raw,
} from "express";
import { getAuth, clerkClient } from "@clerk/express";
import Stripe from "stripe";
import {
  CreateCheckoutSessionBody,
} from "@workspace/api-zod";
import { isProductPlan, type ProductPlan } from "@workspace/license-keys";
import {
  applyPaidPlan,
  applyBusinessPlan,
  applyTeamPlan,
  recordPayment,
  claimBillingEvent,
  saveStripeCustomerId,
  getStripeCustomerId,
  listProviders,
  stripePriceIdFor,
  stripeTeamPriceId,
  stripeBusinessPriceId,
  razorpayConfigured,
  razorpayAmountFor,
  isRazorpayPlan,
  normalizeRazorpayCurrency,
  type BillingProviderId,
} from "../lib/billing";
import { createPaymentLink, verifyRazorpaySignature } from "../lib/razorpay";
import { extendOrgSubscription } from "../lib/org";
import { sendLicenseEmail } from "../lib/email";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Resolve the Clerk user's primary email + display name (best-effort). */
async function lookupClerkEmail(
  userId: string,
): Promise<{ email: string | null; name: string | null }> {
  try {
    const user = await clerkClient.users.getUser(userId);
    const primaryId = user.primaryEmailAddressId;
    const primary =
      user.emailAddresses.find((e) => e.id === primaryId) ??
      user.emailAddresses[0];
    const first = user.firstName ?? "";
    const last = user.lastName ?? "";
    const composed = `${first} ${last}`.trim();
    return { email: primary?.emailAddress ?? null, name: composed || null };
  } catch {
    return { email: null, name: null };
  }
}

function buildInstallerDownloadUrl(req: Request): string {
  const host = req.get("host");
  const proto =
    (req.get("x-forwarded-proto") ?? "").split(",")[0]?.trim() ||
    (req.secure ? "https" : "http");
  const base = host ? `${proto}://${host}` : "";
  return `${base}/api/downloads/luxor-pdf-secure-latest.exe`;
}

const router: IRouter = Router();

let _stripe: Stripe | null = null;
function getStripe(): Stripe | null {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) return null;
  if (!_stripe) {
    _stripe = new Stripe(key);
  }
  return _stripe;
}

// ─── GET /billing/providers ───────────────────────────────────────────────────

router.get("/billing/providers", (_req: Request, res: Response): void => {
  res.json({ providers: listProviders() });
});

// ─── POST /billing/checkout-session ───────────────────────────────────────────

router.post(
  "/billing/checkout-session",
  async (req: Request, res: Response): Promise<void> => {
    const auth = getAuth(req);
    if (!auth.userId) {
      res.status(401).json({ error: "Not signed in" });
      return;
    }

    const parsed = CreateCheckoutSessionBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }
    const { plan, successUrl, cancelUrl, seats, orgName } = parsed.data;
    const provider: BillingProviderId = (parsed.data.provider ??
      "razorpay") as BillingProviderId;

    // ─── Razorpay (one-time payment links; monthly/yearly, INR or USD) ───────
    if (provider === "razorpay") {
      if (!razorpayConfigured()) {
        res.status(503).json({ error: "Razorpay not configured" });
        return;
      }
      if (!isRazorpayPlan(plan)) {
        res.status(400).json({
          error: `Razorpay supports only the monthly and yearly plans, not: ${plan}`,
        });
        return;
      }
      const currency = normalizeRazorpayCurrency(parsed.data.currency);
      const amount = razorpayAmountFor(plan, currency);
      if (!amount) {
        res.status(503).json({
          error: `Razorpay price for ${plan} (${currency}) not configured`,
        });
        return;
      }
      try {
        const { email, name } = await lookupClerkEmail(auth.userId);
        const link = await createPaymentLink({
          amount,
          currency,
          description: `Luxor PDF — ${plan} plan`,
          // Razorpay limits reference_id to 40 chars; the user is identified
          // via `notes.clerkUserId`, so this only needs to be short + unique.
          referenceId: `lx_${plan}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
          customer: { email, name },
          notes: { clerkUserId: auth.userId, plan },
          callbackUrl: successUrl,
        });
        req.log.info(
          { userId: auth.userId, plan, currency, paymentLinkId: link.id },
          "Razorpay payment link created",
        );
        res.json({
          provider: "razorpay",
          sessionId: link.id,
          url: link.shortUrl,
        });
      } catch (err) {
        req.log.error(
          { err, userId: auth.userId, plan, currency },
          "Razorpay checkout failed",
        );
        res.status(500).json({ error: "Failed to create checkout session" });
      }
      return;
    }

    if (provider !== "stripe") {
      res.status(400).json({ error: `Provider not supported: ${provider}` });
      return;
    }

    const stripe = getStripe();
    if (!stripe) {
      res.status(503).json({ error: "Stripe not configured" });
      return;
    }

    // ─── Team / Business plan (seat-based subscription) ──────────────────────
    if (plan === "team") {
      const teamPriceId = stripeTeamPriceId();
      if (!teamPriceId) {
        res.status(503).json({ error: "Stripe price for team not configured" });
        return;
      }
      const seatCount = Math.max(1, Math.floor(seats ?? 1));
      const teamName = (orgName ?? "").trim() || "My Team";
      const teamMetadata: Record<string, string> = {
        clerkUserId: auth.userId,
        plan: "team",
        seats: String(seatCount),
        orgName: teamName,
      };
      try {
        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          line_items: [{ price: teamPriceId, quantity: seatCount }],
          client_reference_id: auth.userId,
          metadata: teamMetadata,
          subscription_data: { metadata: teamMetadata },
          success_url: successUrl,
          cancel_url: cancelUrl,
        });
        if (!session.url) {
          res.status(500).json({ error: "Stripe did not return a URL" });
          return;
        }
        req.log.info(
          { userId: auth.userId, plan, seats: seatCount, sessionId: session.id },
          "Stripe team checkout session created",
        );
        res.json({
          provider: "stripe",
          sessionId: session.id,
          url: session.url,
        });
      } catch (err) {
        req.log.error(
          { err, userId: auth.userId, plan },
          "Stripe team checkout failed",
        );
        res.status(500).json({ error: "Failed to create checkout session" });
      }
      return;
    }

    // ─── Business plan (flat recurring subscription, unlimited pool) ─────────
    if (plan === "business") {
      const businessPriceId = stripeBusinessPriceId();
      if (!businessPriceId) {
        res
          .status(503)
          .json({ error: "Stripe price for business not configured" });
        return;
      }
      const businessMetadata: Record<string, string> = {
        clerkUserId: auth.userId,
        plan: "business",
      };
      try {
        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          line_items: [{ price: businessPriceId, quantity: 1 }],
          client_reference_id: auth.userId,
          metadata: businessMetadata,
          subscription_data: { metadata: businessMetadata },
          success_url: successUrl,
          cancel_url: cancelUrl,
        });
        if (!session.url) {
          res.status(500).json({ error: "Stripe did not return a URL" });
          return;
        }
        req.log.info(
          { userId: auth.userId, plan, sessionId: session.id },
          "Stripe business checkout session created",
        );
        res.json({ provider: "stripe", sessionId: session.id, url: session.url });
      } catch (err) {
        req.log.error(
          { err, userId: auth.userId, plan },
          "Stripe business checkout failed",
        );
        res.status(500).json({ error: "Failed to create checkout session" });
      }
      return;
    }

    if (!isProductPlan(plan)) {
      res.status(400).json({ error: `Unknown plan: ${plan}` });
      return;
    }

    const priceId = stripePriceIdFor(plan as ProductPlan);
    if (!priceId) {
      res.status(503).json({
        error: `Stripe price for ${plan} not configured`,
      });
      return;
    }

    // Yearly and lifetime are one-time payments. Yearly customers receive a
    // renewal license key by email and renew manually by redeeming the key
    // (no auto-charge). Monthly/quarterly are recurring subscriptions that
    // auto-renew until the user cancels.
    const isOneTime = plan === "lifetime" || plan === "yearly";

    try {
      const session = await stripe.checkout.sessions.create({
        mode: isOneTime ? "payment" : "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        client_reference_id: auth.userId,
        metadata: {
          clerkUserId: auth.userId,
          plan,
        },
        ...(isOneTime
          ? {}
          : {
              subscription_data: {
                metadata: { clerkUserId: auth.userId, plan },
              },
            }),
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      if (!session.url) {
        res.status(500).json({ error: "Stripe did not return a URL" });
        return;
      }

      req.log.info(
        { userId: auth.userId, plan, sessionId: session.id },
        "Stripe checkout session created",
      );
      res.json({ provider: "stripe", sessionId: session.id, url: session.url });
    } catch (err) {
      req.log.error({ err, userId: auth.userId, plan }, "Stripe checkout failed");
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  },
);

// ─── POST /billing/portal ─────────────────────────────────────────────────────
// Opens a Stripe Billing Portal session so recurring subscribers (monthly /
// quarterly / business / team) can update their card or cancel auto-renewal.

router.post(
  "/billing/portal",
  async (req: Request, res: Response): Promise<void> => {
    const auth = getAuth(req);
    if (!auth.userId) {
      res.status(401).json({ error: "Not signed in" });
      return;
    }
    const stripe = getStripe();
    if (!stripe) {
      res.status(503).json({ error: "Stripe not configured" });
      return;
    }
    try {
      const customerId = await getStripeCustomerId(auth.userId);
      if (!customerId) {
        res.status(404).json({
          error:
            "No billing profile found. Only recurring plans purchased with a card can be managed here.",
        });
        return;
      }
      const body = (req.body ?? {}) as { returnUrl?: unknown };
      const host = req.get("host");
      const proto =
        (req.get("x-forwarded-proto") ?? "").split(",")[0]?.trim() ||
        (req.secure ? "https" : "http");
      const fallbackReturnUrl = `${host ? `${proto}://${host}` : ""}/pdf-expiry/dashboard`;
      // Only accept same-origin return URLs to avoid an open-redirect surface.
      let returnUrl = fallbackReturnUrl;
      if (typeof body.returnUrl === "string" && body.returnUrl) {
        try {
          const parsed = new URL(body.returnUrl);
          if (host && parsed.host === host) returnUrl = body.returnUrl;
        } catch {
          // ignore malformed URLs, keep fallback
        }
      }
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      });
      res.json({ url: session.url });
    } catch (err) {
      req.log.error({ err, userId: auth.userId }, "Billing portal failed");
      res.status(500).json({ error: "Failed to open billing portal" });
    }
  },
);

export default router;

// ─── Raw-body webhook router (mounted on app BEFORE express.json) ─────────────

export const billingWebhookRouter: IRouter = Router();

billingWebhookRouter.post(
  "/",
  raw({ type: "application/json" }),
  async (req: Request, res: Response): Promise<void> => {
    const stripe = getStripe();
    const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"];
    if (!stripe || !webhookSecret) {
      res.status(503).json({ error: "Stripe webhook not configured" });
      return;
    }

    const sig = req.headers["stripe-signature"];
    if (!sig || typeof sig !== "string") {
      res.status(400).json({ error: "Missing stripe-signature header" });
      return;
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body as Buffer,
        sig,
        webhookSecret,
      );
    } catch (err) {
      req.log.warn({ err }, "Stripe webhook signature verification failed");
      res.status(400).json({ error: "Invalid signature" });
      return;
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId =
          (session.metadata?.["clerkUserId"] as string | undefined) ??
          session.client_reference_id ??
          null;
        const plan = session.metadata?.["plan"] as string | undefined;

        if (
          !userId ||
          !plan ||
          (plan !== "team" && plan !== "business" && !isProductPlan(plan))
        ) {
          req.log.warn(
            { eventId: event.id, userId, plan },
            "Webhook missing userId or plan; ignoring",
          );
          // Acknowledge so Stripe doesn't retry forever on bad-data sessions.
          res.json({ received: true, processed: false });
          return;
        }

        const isFresh = await claimBillingEvent(
          "stripe",
          event.id,
          event.type,
          userId,
        );
        if (!isFresh) {
          req.log.info(
            { eventId: event.id },
            "Stripe webhook already processed (idempotent replay)",
          );
          res.json({ received: true, processed: false });
          return;
        }

        // Revenue ledger (best-effort; never fails the webhook).
        try {
          await recordPayment({
            provider: "stripe",
            eventId: event.id,
            userId,
            planName: plan,
            amountMinor: session.amount_total ?? null,
            currency: session.currency ?? null,
          });
        } catch (payErr) {
          req.log.error({ err: payErr, eventId: event.id }, "Failed to record payment");
        }

        // Remember the Stripe customer so the user can open the Billing
        // Portal later (manage card / cancel auto-renewal). Best-effort;
        // runs again after applyPaidPlan below for first-time buyers whose
        // user_licenses row doesn't exist yet.
        const sessionCustomerId =
          typeof session.customer === "string"
            ? session.customer
            : (session.customer?.id ?? null);

        // ─── Team / Business: provision the organization ────────────────────
        if (plan === "team") {
          const now = new Date();
          const seatCount = Math.max(
            1,
            parseInt(session.metadata?.["seats"] ?? "1", 10) || 1,
          );
          const teamName =
            (session.metadata?.["orgName"] as string | undefined)?.trim() ||
            "My Team";
          const stripeSubId =
            typeof session.subscription === "string"
              ? session.subscription
              : (session.subscription?.id ?? null);
          const stripeCustId =
            typeof session.customer === "string"
              ? session.customer
              : (session.customer?.id ?? null);

          let subStart = now;
          let subEnd = new Date(now.getTime() + 30 * MS_PER_DAY);
          if (stripeSubId) {
            try {
              const sub = await stripe.subscriptions.retrieve(stripeSubId);
              const period = sub as unknown as {
                current_period_start?: number;
                current_period_end?: number;
              };
              if (period.current_period_start) {
                subStart = new Date(period.current_period_start * 1000);
              }
              if (period.current_period_end) {
                subEnd = new Date(period.current_period_end * 1000);
              }
            } catch (subErr) {
              req.log.warn(
                { err: subErr, stripeSubId },
                "Could not retrieve team subscription period; using 30-day fallback",
              );
            }
          }

          const ownerEmail =
            session.customer_details?.email ??
            (session.customer_email as string | null) ??
            (await lookupClerkEmail(userId)).email;

          const { orgId } = await applyTeamPlan({
            ownerUserId: userId,
            ownerEmail,
            orgName: teamName,
            seats: seatCount,
            stripeCustomerId: stripeCustId,
            stripeSubscriptionId: stripeSubId,
            subscriptionStartDate: subStart,
            subscriptionEndDate: subEnd,
          });

          req.log.info(
            { userId, orgId, seats: seatCount, subEnd: subEnd.toISOString() },
            "Team organization provisioned",
          );
          res.json({ received: true, processed: true });
          return;
        }

        // ─── Business: flat recurring subscription (unlimited pool) ─────────
        if (plan === "business") {
          const now = new Date();
          const stripeSubId =
            typeof session.subscription === "string"
              ? session.subscription
              : (session.subscription?.id ?? null);

          let subEnd = new Date(now.getTime() + 30 * MS_PER_DAY);
          if (stripeSubId) {
            try {
              const sub = await stripe.subscriptions.retrieve(stripeSubId);
              const period = sub as unknown as {
                current_period_end?: number;
              };
              if (period.current_period_end) {
                subEnd = new Date(period.current_period_end * 1000);
              }
            } catch (subErr) {
              req.log.warn(
                { err: subErr, stripeSubId },
                "Could not retrieve business subscription period; using 30-day fallback",
              );
            }
          }

          const bizOutcome = await applyBusinessPlan(
            userId,
            { provider: "stripe", eventId: event.id },
            subEnd,
            now,
          );

          if (sessionCustomerId) {
            try {
              await saveStripeCustomerId(userId, sessionCustomerId);
            } catch (custErr) {
              req.log.warn({ err: custErr, userId }, "Could not save Stripe customer id");
            }
          }

          req.log.info(
            {
              userId,
              plan,
              licenseId: bizOutcome.licenseId,
              firstActivation: bizOutcome.isFirstActivation,
              newEnd: bizOutcome.subscriptionEndDate.toISOString(),
            },
            "Stripe business payment applied",
          );

          // Best-effort license email (mirror of the individual-plan path).
          try {
            let recipient: string | null =
              session.customer_details?.email ??
              (session.customer_email as string | null) ??
              null;
            let recipientName: string | null =
              session.customer_details?.name ?? null;
            if (!recipient) {
              const looked = await lookupClerkEmail(userId);
              recipient = looked.email;
            }
            if (recipient) {
              await sendLicenseEmail({
                to: recipient,
                customerName: recipientName,
                productKey: bizOutcome.rawProductKey,
                plan: "business",
                subscriptionEndDate: bizOutcome.subscriptionEndDate.toISOString(),
                downloadUrl: buildInstallerDownloadUrl(req),
              });
            }
          } catch (emailErr) {
            req.log.error(
              { err: emailErr, userId, plan },
              "Business license email pipeline failed",
            );
          }

          res.json({ received: true, processed: true });
          return;
        }

        const outcome = await applyPaidPlan(userId, plan, {
          provider: "stripe",
          eventId: event.id,
        });

        if (sessionCustomerId) {
          try {
            await saveStripeCustomerId(userId, sessionCustomerId);
          } catch (custErr) {
            req.log.warn({ err: custErr, userId }, "Could not save Stripe customer id");
          }
        }

        req.log.info(
          {
            userId,
            plan,
            licenseId: outcome.licenseId,
            firstActivation: outcome.isFirstActivation,
            newEnd: outcome.subscriptionEndDate.toISOString(),
          },
          "Stripe payment applied",
        );

        // ─── Email the license key to the customer ─────────────────────────
        // Best-effort: never let an email failure break the webhook.
        try {
          const customerEmail =
            session.customer_details?.email ??
            (session.customer_email as string | null) ??
            null;
          const customerName = session.customer_details?.name ?? null;

          let recipient: string | null = customerEmail;
          let recipientName: string | null = customerName;

          if (!recipient) {
            // Fall back to the Clerk user's primary email.
            try {
              const user = await clerkClient.users.getUser(userId);
              const primaryId = user.primaryEmailAddressId;
              const primary =
                user.emailAddresses.find((e) => e.id === primaryId) ??
                user.emailAddresses[0];
              recipient = primary?.emailAddress ?? null;
              if (!recipientName) {
                const first = user.firstName ?? "";
                const last = user.lastName ?? "";
                const composed = `${first} ${last}`.trim();
                recipientName = composed || null;
              }
            } catch (clerkErr) {
              req.log.warn(
                { err: clerkErr, userId },
                "Could not look up Clerk user email",
              );
            }
          }

          if (recipient) {
            const downloadUrl = buildInstallerDownloadUrl(req);
            const sent = await sendLicenseEmail({
              to: recipient,
              customerName: recipientName,
              productKey: outcome.rawProductKey,
              plan,
              subscriptionEndDate: outcome.subscriptionEndDate.toISOString(),
              downloadUrl,
            });
            if (!sent) {
              req.log.warn(
                { userId, plan, recipient },
                "License email send returned false",
              );
            }
          } else {
            req.log.warn(
              { userId, plan },
              "No email available — skipping license email send",
            );
          }
        } catch (emailErr) {
          req.log.error(
            { err: emailErr, userId, plan },
            "License email pipeline failed",
          );
        }
      } else if (event.type === "invoice.paid") {
        // ─── Recurring renewal (monthly / quarterly / business / team) ──────
        // Fires every billing cycle until the user cancels. The first cycle
        // is already handled by checkout.session.completed, so we only act
        // on `billing_reason === "subscription_cycle"` to avoid granting the
        // first period twice.
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceAny = invoice as unknown as {
          billing_reason?: string;
          subscription?: string | { id?: string } | null;
          parent?: {
            subscription_details?: {
              subscription?: string | { id?: string } | null;
              metadata?: Record<string, string | undefined> | null;
            } | null;
          } | null;
          customer?: string | { id?: string } | null;
          customer_email?: string | null;
          customer_name?: string | null;
          amount_paid?: number | null;
          currency?: string | null;
        };

        if (invoiceAny.billing_reason !== "subscription_cycle") {
          req.log.debug(
            { eventId: event.id, billingReason: invoiceAny.billing_reason },
            "Stripe invoice ignored (not a renewal cycle)",
          );
          res.json({ received: true, processed: false });
          return;
        }

        // Resolve the subscription id (shape differs across Stripe API versions).
        const subRef =
          invoiceAny.subscription ??
          invoiceAny.parent?.subscription_details?.subscription ??
          null;
        const stripeSubId =
          typeof subRef === "string" ? subRef : (subRef?.id ?? null);

        // Prefer metadata already present on the invoice; fall back to the
        // subscription object.
        let meta: Record<string, string | undefined> | null =
          invoiceAny.parent?.subscription_details?.metadata ?? null;
        let subPeriodEnd: Date | null = null;
        if (stripeSubId) {
          try {
            const sub = await stripe.subscriptions.retrieve(stripeSubId);
            if (!meta || !meta["clerkUserId"]) {
              meta = (sub.metadata ?? null) as Record<string, string | undefined> | null;
            }
            const period = sub as unknown as { current_period_end?: number };
            if (period.current_period_end) {
              subPeriodEnd = new Date(period.current_period_end * 1000);
            }
          } catch (subErr) {
            req.log.warn(
              { err: subErr, stripeSubId },
              "Could not retrieve subscription for renewal invoice",
            );
          }
        }

        const renewUserId = meta?.["clerkUserId"] ?? null;
        const renewPlan = meta?.["plan"] ?? null;

        if (!renewUserId || !renewPlan) {
          req.log.warn(
            { eventId: event.id, stripeSubId },
            "Renewal invoice missing clerkUserId/plan metadata; ignoring",
          );
          res.json({ received: true, processed: false });
          return;
        }

        const isFresh = await claimBillingEvent(
          "stripe",
          event.id,
          event.type,
          renewUserId,
        );
        if (!isFresh) {
          req.log.info(
            { eventId: event.id },
            "Stripe renewal webhook already processed (idempotent replay)",
          );
          res.json({ received: true, processed: false });
          return;
        }

        try {
          await recordPayment({
            provider: "stripe",
            eventId: event.id,
            userId: renewUserId,
            planName: renewPlan,
            amountMinor: invoiceAny.amount_paid ?? null,
            currency: invoiceAny.currency ?? null,
          });
        } catch (payErr) {
          req.log.error({ err: payErr, eventId: event.id }, "Failed to record renewal payment");
        }

        const renewCustomerId =
          typeof invoiceAny.customer === "string"
            ? invoiceAny.customer
            : (invoiceAny.customer?.id ?? null);
        if (renewCustomerId) {
          try {
            await saveStripeCustomerId(renewUserId, renewCustomerId);
          } catch (custErr) {
            req.log.warn({ err: custErr, userId: renewUserId }, "Could not save Stripe customer id");
          }
        }

        const now = new Date();

        if (renewPlan === "team") {
          if (stripeSubId && subPeriodEnd) {
            const org = await extendOrgSubscription(stripeSubId, subPeriodEnd, undefined, now);
            req.log.info(
              { userId: renewUserId, stripeSubId, orgId: org?.id ?? null, newEnd: subPeriodEnd.toISOString() },
              org ? "Team subscription renewed" : "Team renewal: no org found for subscription",
            );
          } else {
            req.log.warn(
              { eventId: event.id, stripeSubId },
              "Team renewal invoice missing subscription/period; skipped",
            );
          }
          res.json({ received: true, processed: true });
          return;
        }

        let renewOutcome: Awaited<ReturnType<typeof applyPaidPlan>>;
        if (renewPlan === "business") {
          renewOutcome = await applyBusinessPlan(
            renewUserId,
            { provider: "stripe", eventId: event.id },
            subPeriodEnd ?? new Date(now.getTime() + 30 * MS_PER_DAY),
            now,
          );
        } else if (isProductPlan(renewPlan)) {
          renewOutcome = await applyPaidPlan(renewUserId, renewPlan, {
            provider: "stripe",
            eventId: event.id,
          });
        } else {
          req.log.warn(
            { eventId: event.id, plan: renewPlan },
            "Renewal invoice for unknown plan; ignoring",
          );
          res.json({ received: true, processed: false });
          return;
        }

        req.log.info(
          {
            userId: renewUserId,
            plan: renewPlan,
            licenseId: renewOutcome.licenseId,
            newEnd: renewOutcome.subscriptionEndDate.toISOString(),
          },
          "Stripe recurring renewal applied",
        );

        // Best-effort renewal license email.
        try {
          let recipient: string | null = invoiceAny.customer_email ?? null;
          let recipientName: string | null = invoiceAny.customer_name ?? null;
          if (!recipient) {
            const looked = await lookupClerkEmail(renewUserId);
            recipient = looked.email;
            recipientName = recipientName ?? looked.name;
          }
          if (recipient) {
            await sendLicenseEmail({
              to: recipient,
              customerName: recipientName,
              productKey: renewOutcome.rawProductKey,
              plan: renewPlan,
              subscriptionEndDate: renewOutcome.subscriptionEndDate.toISOString(),
              downloadUrl: buildInstallerDownloadUrl(req),
            });
          }
        } catch (emailErr) {
          req.log.error(
            { err: emailErr, userId: renewUserId, plan: renewPlan },
            "Renewal license email pipeline failed",
          );
        }
      } else {
        req.log.debug(
          { eventType: event.type, eventId: event.id },
          "Stripe webhook ignored (unhandled type)",
        );
      }

      res.json({ received: true, processed: true });
    } catch (err) {
      req.log.error({ err, eventId: event.id }, "Stripe webhook handler failed");
      res.status(500).json({ error: "Webhook handler failed" });
    }
  },
);

// ─── Razorpay webhook (mounted on app BEFORE express.json) ────────────────────

interface RazorpayWebhookPayload {
  event?: string;
  payload?: {
    payment_link?: {
      entity?: {
        id?: string;
        notes?: Record<string, string | undefined>;
        customer?: { email?: string | null; name?: string | null } | null;
      };
    };
    payment?: {
      entity?: {
        id?: string;
        email?: string | null;
        amount?: number;
        currency?: string | null;
      };
    };
  };
}

export const razorpayWebhookRouter: IRouter = Router();

razorpayWebhookRouter.post(
  "/",
  raw({ type: "application/json" }),
  async (req: Request, res: Response): Promise<void> => {
    const secret = process.env["RAZORPAY_WEBHOOK_SECRET"];
    if (!secret) {
      res.status(503).json({ error: "Razorpay webhook not configured" });
      return;
    }

    const sig = req.headers["x-razorpay-signature"];
    if (!sig || typeof sig !== "string") {
      res.status(400).json({ error: "Missing x-razorpay-signature header" });
      return;
    }

    const rawBody = req.body as Buffer;
    if (!verifyRazorpaySignature(rawBody, sig, secret)) {
      req.log.warn("Razorpay webhook signature verification failed");
      res.status(400).json({ error: "Invalid signature" });
      return;
    }

    let payload: RazorpayWebhookPayload;
    try {
      payload = JSON.parse(rawBody.toString("utf8")) as RazorpayWebhookPayload;
    } catch {
      res.status(400).json({ error: "Invalid JSON body" });
      return;
    }

    const eventType = payload.event ?? "";
    const linkEntity = payload.payload?.payment_link?.entity;
    const paymentEntity = payload.payload?.payment?.entity;
    // Idempotency key MUST be derived from the signed body only. The HMAC
    // signature covers the request body, NOT headers — trusting
    // `x-razorpay-event-id` would let an attacker replay one valid signed
    // payload with a varied header to dodge dedupe and re-trigger
    // applyPaidPlan (license-extension abuse). The payment_link id is stable
    // across Razorpay's own legitimate retries, so dedupe still holds.
    const eventId = linkEntity?.id ?? paymentEntity?.id ?? null;

    try {
      if (eventType === "payment_link.paid") {
        const notes = linkEntity?.notes ?? {};
        const userId = notes["clerkUserId"] ?? null;
        const plan = notes["plan"] ?? null;

        // Enforce the monthly/yearly-only policy at the fulfillment boundary
        // too: a signed event for any other plan (old links, dashboard-created
        // links) must be acknowledged but never fulfilled.
        if (!userId || !plan || !isRazorpayPlan(plan)) {
          req.log.warn(
            { eventId, userId, plan },
            "Razorpay webhook missing userId or unsupported plan; ignoring",
          );
          res.json({ received: true, processed: false });
          return;
        }
        if (!eventId) {
          req.log.warn("Razorpay webhook missing event id; ignoring");
          res.json({ received: true, processed: false });
          return;
        }

        const isFresh = await claimBillingEvent(
          "razorpay",
          eventId,
          eventType,
          userId,
        );
        if (!isFresh) {
          req.log.info(
            { eventId },
            "Razorpay webhook already processed (idempotent replay)",
          );
          res.json({ received: true, processed: false });
          return;
        }

        // Revenue ledger (best-effort; never fails the webhook).
        try {
          await recordPayment({
            provider: "razorpay",
            eventId,
            userId,
            planName: plan,
            amountMinor:
              typeof paymentEntity?.amount === "number"
                ? paymentEntity.amount
                : null,
            currency: paymentEntity?.currency ?? null,
          });
        } catch (payErr) {
          req.log.error({ err: payErr, eventId }, "Failed to record payment");
        }

        const outcome = await applyPaidPlan(userId, plan, {
          provider: "razorpay",
          eventId,
        });

        req.log.info(
          {
            userId,
            plan,
            licenseId: outcome.licenseId,
            firstActivation: outcome.isFirstActivation,
            newEnd: outcome.subscriptionEndDate.toISOString(),
          },
          "Razorpay payment applied",
        );

        // Best-effort license email (mirror of the Stripe path).
        try {
          let recipient: string | null =
            linkEntity?.customer?.email ?? paymentEntity?.email ?? null;
          let recipientName: string | null =
            linkEntity?.customer?.name ?? null;
          if (!recipient) {
            const looked = await lookupClerkEmail(userId);
            recipient = looked.email;
            recipientName = recipientName ?? looked.name;
          }
          if (recipient) {
            await sendLicenseEmail({
              to: recipient,
              customerName: recipientName,
              productKey: outcome.rawProductKey,
              plan,
              subscriptionEndDate: outcome.subscriptionEndDate.toISOString(),
              downloadUrl: buildInstallerDownloadUrl(req),
            });
          } else {
            req.log.warn(
              { userId, plan },
              "No email available — skipping Razorpay license email",
            );
          }
        } catch (emailErr) {
          req.log.error(
            { err: emailErr, userId, plan },
            "Razorpay license email pipeline failed",
          );
        }

        res.json({ received: true, processed: true });
        return;
      }

      req.log.debug(
        { eventType, eventId },
        "Razorpay webhook ignored (unhandled type)",
      );
      res.json({ received: true, processed: true });
    } catch (err) {
      req.log.error({ err, eventId }, "Razorpay webhook handler failed");
      res.status(500).json({ error: "Webhook handler failed" });
    }
  },
);
