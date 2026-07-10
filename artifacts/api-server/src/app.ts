import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import { blockReservedAdminEmail } from "./middlewares/reservedAdminEmail";
import router from "./routes";
import { billingWebhookRouter, razorpayWebhookRouter } from "./routes/billing";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Clerk proxy must be mounted BEFORE body parsers (it streams raw bytes).
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

app.use(cors({ credentials: true, origin: true }));

// Stripe webhook MUST receive raw bytes for signature verification, so
// mount it BEFORE the JSON body parser. The router itself attaches
// express.raw() to its handler.
app.use("/api/billing/webhook", billingWebhookRouter);
// Razorpay webhook also needs raw bytes for HMAC signature verification.
// Mounted on a distinct path (not a sub-path of the Stripe webhook).
app.use("/api/billing/razorpay/webhook", razorpayWebhookRouter);

// 2mb limit: the AI summarize endpoint receives extracted document text
// (capped at 400k chars in the API contract) as a JSON body.
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// Resolve the publishable key from the incoming request host so the same
// server can serve multiple Clerk custom domains. Falls back to
// CLERK_PUBLISHABLE_KEY when the host doesn't map to a custom domain.
app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

// The admin email must never work as a regular signed-in user.
app.use("/api", blockReservedAdminEmail());

app.use("/api", router);

export default app;
