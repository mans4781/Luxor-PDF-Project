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
  claimBillingEvent,
  listProviders,
  stripePriceIdFor,
  type BillingProviderId,
} from "../lib/billing";
import { sendLicenseEmail } from "../lib/email";

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
    const { plan, successUrl, cancelUrl } = parsed.data;
    const provider: BillingProviderId = (parsed.data.provider ??
      "stripe") as BillingProviderId;

    if (provider !== "stripe") {
      res.status(400).json({ error: `Provider not supported: ${provider}` });
      return;
    }
    if (!isProductPlan(plan)) {
      res.status(400).json({ error: `Unknown plan: ${plan}` });
      return;
    }

    const stripe = getStripe();
    if (!stripe) {
      res.status(503).json({ error: "Stripe not configured" });
      return;
    }

    const priceId = stripePriceIdFor(plan as ProductPlan);
    if (!priceId) {
      res.status(503).json({
        error: `Stripe price for ${plan} not configured`,
      });
      return;
    }

    const isLifetime = plan === "lifetime";

    try {
      const session = await stripe.checkout.sessions.create({
        mode: isLifetime ? "payment" : "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        client_reference_id: auth.userId,
        metadata: {
          clerkUserId: auth.userId,
          plan,
        },
        ...(isLifetime
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

        if (!userId || !plan || !isProductPlan(plan)) {
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

        const outcome = await applyPaidPlan(userId, plan, {
          provider: "stripe",
          eventId: event.id,
        });

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
