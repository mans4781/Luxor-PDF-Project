import { Router, type IRouter, type Request, type Response } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { and, eq, isNull, lt } from "drizzle-orm";
import { db, desktopAuthHandoffsTable } from "@workspace/db";
import { z } from "zod/v4";

/**
 * Browser-based sign-in handoff for the desktop apps.
 *
 * Flow:
 *  1. Desktop app generates a random `state` and opens the system browser
 *     at the suite sign-in page with a redirect to /pdf-expiry/desktop-link.
 *  2. Once signed in, the browser page POSTs /desktop-auth/complete with
 *     the state. The server mints a single-use Clerk sign-in ticket and
 *     stores it against the state (short TTL).
 *  3. The desktop app polls GET /desktop-auth/poll?state=... and claims
 *     the ticket exactly once, then signs in locally with it.
 */
const router: IRouter = Router();

const HANDOFF_TTL_MS = 10 * 60 * 1000; // 10 minutes

const stateSchema = z
  .string()
  .regex(/^[a-f0-9]{64}$/, "state must be 64 lowercase hex chars");

const completeBodySchema = z.object({ state: stateSchema });

async function deleteExpired(): Promise<void> {
  await db
    .delete(desktopAuthHandoffsTable)
    .where(lt(desktopAuthHandoffsTable.expiresAt, new Date()));
}

router.post(
  "/desktop-auth/complete",
  async (req: Request, res: Response): Promise<void> => {
    const auth = getAuth(req);
    if (!auth.userId) {
      res.status(401).json({ error: "Not signed in" });
      return;
    }

    const parsed = completeBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid state" });
      return;
    }
    const { state } = parsed.data;

    try {
      await deleteExpired();

      // One handoff per state — reject replays of an already-used state.
      const existing = await db
        .select({ id: desktopAuthHandoffsTable.id })
        .from(desktopAuthHandoffsTable)
        .where(eq(desktopAuthHandoffsTable.state, state))
        .limit(1);
      if (existing.length > 0) {
        res.status(409).json({ error: "State already used" });
        return;
      }

      const token = await clerkClient.signInTokens.createSignInToken({
        userId: auth.userId,
        expiresInSeconds: Math.floor(HANDOFF_TTL_MS / 1000),
      });

      await db.insert(desktopAuthHandoffsTable).values({
        state,
        ticket: token.token,
        expiresAt: new Date(Date.now() + HANDOFF_TTL_MS),
      });

      res.json({ ok: true });
    } catch (err) {
      req.log.error({ err }, "desktop-auth complete failed");
      res.status(500).json({ error: "Could not complete desktop sign-in" });
    }
  },
);

router.get(
  "/desktop-auth/poll",
  async (req: Request, res: Response): Promise<void> => {
    const parsed = stateSchema.safeParse(req.query.state);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid state" });
      return;
    }
    const state = parsed.data;

    try {
      // Atomically claim: only an unclaimed, unexpired handoff returns the
      // ticket, and it can never be returned twice.
      const claimed = await db
        .update(desktopAuthHandoffsTable)
        .set({ claimedAt: new Date() })
        .where(
          and(
            eq(desktopAuthHandoffsTable.state, state),
            isNull(desktopAuthHandoffsTable.claimedAt),
          ),
        )
        .returning({
          ticket: desktopAuthHandoffsTable.ticket,
          expiresAt: desktopAuthHandoffsTable.expiresAt,
        });

      const row = claimed[0];
      if (!row || row.expiresAt.getTime() < Date.now()) {
        res.json({ status: "pending" });
        return;
      }

      // Ticket is single-use; remove the row now that it is claimed.
      await db
        .delete(desktopAuthHandoffsTable)
        .where(eq(desktopAuthHandoffsTable.state, state));

      res.json({ status: "ready", ticket: row.ticket });
    } catch (err) {
      req.log.error({ err }, "desktop-auth poll failed");
      res.status(500).json({ error: "Poll failed" });
    }
  },
);

export default router;
