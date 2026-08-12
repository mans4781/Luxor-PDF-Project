import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import {
  notifyCandidates,
  downloadsRestoredIdempotencyKey,
  claimRecipient,
  markSent,
  releaseClaim,
  STALE_CLAIM_MINUTES,
  type NotifyDeps,
} from "./downloadsRestored";

// Integration tests against the dev database: verify the per-recipient claim
// model cannot double-email under concurrent triggers, crashed runs, or
// retries after failure.

const PREFIX = "test-dlr-";
const URL = "https://example.test/installer.exe";

function user(n: number): string {
  return `${PREFIX}user-${n}`;
}

async function cleanup(): Promise<void> {
  await db.execute(
    sql`DELETE FROM downloads_restored_emails WHERE user_id LIKE ${PREFIX + "%"}`,
  );
}

function deps(overrides: Partial<NotifyDeps> & { onSend?: (p: { to: string; idempotencyKey: string }) => void; sendResult?: boolean; sendDelayMs?: number } = {}): { deps: NotifyDeps; sends: Array<{ to: string; idempotencyKey: string }> } {
  const sends: Array<{ to: string; idempotencyKey: string }> = [];
  const d: NotifyDeps = {
    lookupRecipient: overrides.lookupRecipient ?? (async (userId) => ({
      email: `${userId}@example.test`,
      name: "Test User",
    })),
    send:
      overrides.send ??
      (async (p) => {
        if (overrides.sendDelayMs) {
          await new Promise((r) => setTimeout(r, overrides.sendDelayMs));
        }
        sends.push({ to: p.to, idempotencyKey: p.idempotencyKey });
        return overrides.sendResult ?? true;
      }),
  };
  return { deps: d, sends };
}

async function ledgerRow(userId: string): Promise<{ status: string; claimed_at: Date } | undefined> {
  const res = await db.execute(
    sql`SELECT status, claimed_at FROM downloads_restored_emails WHERE user_id = ${userId}`,
  );
  return res.rows[0] as { status: string; claimed_at: Date } | undefined;
}

beforeEach(cleanup);
afterAll(cleanup);

describe("notifyCandidates", () => {
  it("sends once and re-runs send nothing", async () => {
    const { deps: d, sends } = deps();
    const candidates = [user(1), user(2)];

    const first = await notifyCandidates(candidates, URL, d);
    expect(first.sent).toBe(2);
    expect(sends).toHaveLength(2);
    expect((await ledgerRow(user(1)))?.status).toBe("sent");

    const second = await notifyCandidates(candidates, URL, d);
    expect(second.sent).toBe(0);
    expect(second.alreadyClaimed).toBe(2);
    expect(sends).toHaveLength(2); // no new emails
  });

  it("concurrent triggers email each recipient at most once", async () => {
    const { deps: d, sends } = deps({ sendDelayMs: 50 });
    const candidates = [user(1), user(2), user(3)];

    const [a, b] = await Promise.all([
      notifyCandidates(candidates, URL, d),
      notifyCandidates(candidates, URL, d),
    ]);

    expect(a.sent + b.sent).toBe(3);
    expect(a.alreadyClaimed + b.alreadyClaimed).toBe(3);
    expect(sends).toHaveLength(3);
    const recipients = sends.map((s) => s.to).sort();
    expect(new Set(recipients).size).toBe(3);
  });

  it("skips a fresh pending claim (in-flight worker) without sending", async () => {
    // Simulate a run that claimed the user and is still sending (or crashed
    // moments ago): fresh 'pending' row.
    await db.execute(sql`
      INSERT INTO downloads_restored_emails (user_id, email, status, claimed_at)
      VALUES (${user(1)}, ${user(1) + "@example.test"}, 'pending', now())
    `);
    const { deps: d, sends } = deps();

    const summary = await notifyCandidates([user(1)], URL, d);
    expect(summary.alreadyClaimed).toBe(1);
    expect(sends).toHaveLength(0);
  });

  it("re-claims a stale pending claim (crashed worker) with the same stable idempotency key", async () => {
    // Simulate a worker that crashed after the provider accepted the email
    // but before the ledger was marked sent: stale 'pending' claim.
    await db.execute(sql`
      INSERT INTO downloads_restored_emails (user_id, email, status, claimed_at)
      VALUES (${user(1)}, ${user(1) + "@example.test"}, 'pending',
              now() - (${STALE_CLAIM_MINUTES + 1} * interval '1 minute'))
    `);
    const { deps: d, sends } = deps();

    const summary = await notifyCandidates([user(1)], URL, d);
    expect(summary.sent).toBe(1);
    expect(sends).toHaveLength(1);
    // Stable key ⇒ the provider dedupes against the pre-crash send.
    expect(sends[0]?.idempotencyKey).toBe(downloadsRestoredIdempotencyKey(user(1)));
    expect((await ledgerRow(user(1)))?.status).toBe("sent");
  });

  it("releases the claim on send failure so a later run retries", async () => {
    const failing = deps({ sendResult: false });
    const failedRun = await notifyCandidates([user(1)], URL, failing.deps);
    expect(failedRun.failed).toBe(1);
    expect(await ledgerRow(user(1))).toBeUndefined(); // claim released

    const ok = deps();
    const retryRun = await notifyCandidates([user(1)], URL, ok.deps);
    expect(retryRun.sent).toBe(1);
    expect(ok.sends[0]?.idempotencyKey).toBe(downloadsRestoredIdempotencyKey(user(1)));
  });

  it("stale-reclaim overlap: slow first worker's FAILED send cannot release the reclaimer's claim", async () => {
    // Worker A claimed long ago (send still in flight past the stale timeout).
    const tokenA = await claimRecipient(user(1), user(1) + "@example.test");
    expect(tokenA).toBeTruthy();
    await db.execute(sql`
      UPDATE downloads_restored_emails
      SET claimed_at = now() - (${STALE_CLAIM_MINUTES + 1} * interval '1 minute')
      WHERE user_id = ${user(1)}
    `);

    // Worker B reclaims and starts sending (slow).
    let resolveSend!: (v: boolean) => void;
    const gate = new Promise<boolean>((r) => (resolveSend = r));
    const sends: string[] = [];
    const bRun = notifyCandidates([user(1)], URL, {
      lookupRecipient: async (id) => ({ email: `${id}@example.test`, name: null }),
      send: async (p) => {
        sends.push(p.idempotencyKey);
        return gate;
      },
    });
    // Wait until B has claimed (token rotated away from A) and is in flight.
    await new Promise((r) => setTimeout(r, 100));
    expect(sends).toHaveLength(1);

    // Worker A's send fails and it tries to release — must be a no-op.
    await releaseClaim(user(1), tokenA!);
    expect((await ledgerRow(user(1)))?.status).toBe("pending");

    // B finishes successfully and records delivery.
    resolveSend(true);
    const b = await bRun;
    expect(b.sent).toBe(1);
    expect((await ledgerRow(user(1)))?.status).toBe("sent");

    // Another run sends nothing more.
    const { deps: d, sends: extra } = deps();
    await notifyCandidates([user(1)], URL, d);
    expect(extra).toHaveLength(0);
  });

  it("stale-reclaim overlap: slow first worker's SUCCESS cannot mark the reclaimer's in-flight claim sent", async () => {
    const tokenA = await claimRecipient(user(1), user(1) + "@example.test");
    await db.execute(sql`
      UPDATE downloads_restored_emails
      SET claimed_at = now() - (${STALE_CLAIM_MINUTES + 1} * interval '1 minute')
      WHERE user_id = ${user(1)}
    `);

    // Worker B reclaims and is mid-send.
    let resolveSend!: (v: boolean) => void;
    const gate = new Promise<boolean>((r) => (resolveSend = r));
    const bRun = notifyCandidates([user(1)], URL, {
      lookupRecipient: async (id) => ({ email: `${id}@example.test`, name: null }),
      send: async () => gate,
    });
    await new Promise((r) => setTimeout(r, 100));

    // Worker A's provider call finally succeeds and it marks sent with its
    // stale token — must be a no-op; B still owns the pending claim.
    await markSent(user(1), tokenA!);
    expect((await ledgerRow(user(1)))?.status).toBe("pending");

    // B's send fails → B releases with ITS token; the row is gone so a later
    // run retries (provider-side idempotency key dedupes any true double).
    resolveSend(false);
    const b = await bRun;
    expect(b.failed).toBe(1);
    expect(await ledgerRow(user(1))).toBeUndefined();
  });

  it("counts recipients without a resolvable email and never claims them", async () => {
    const { deps: d, sends } = deps({
      lookupRecipient: async () => ({ email: null, name: null }),
    });
    const summary = await notifyCandidates([user(1)], URL, d);
    expect(summary.noEmail).toBe(1);
    expect(sends).toHaveLength(0);
    expect(await ledgerRow(user(1))).toBeUndefined();
  });
});
