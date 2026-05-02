/**
 * Admin CLI: mint product keys directly into the database.
 *
 *   pnpm --filter @workspace/scripts run keys:generate -- \
 *     --plan yearly --count 10 --max-activations 1 [--notes "promo Q2"] \
 *     [--expires-at 2099-01-01T00:00:00Z]
 *
 * Prints the raw keys to stdout exactly once — the server only stores their
 * SHA-256 hashes, so this is the only chance to capture them.
 */
import { db, productKeysTable } from "@workspace/db";
import {
  generateProductKey,
  hashProductKey,
  isProductPlan,
  PLAN_DURATION_DAYS,
  type ProductPlan,
} from "@workspace/license-keys";

interface Args {
  plan: ProductPlan;
  count: number;
  maxActivations: number;
  expiresAt: Date | null;
  notes: string | null;
}

function parseArgs(argv: readonly string[]): Args {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg && arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        out[key] = "true";
      } else {
        out[key] = next;
        i++;
      }
    }
  }

  const plan = out["plan"];
  if (!plan || !isProductPlan(plan)) {
    throw new Error(
      `--plan must be one of: ${Object.keys(PLAN_DURATION_DAYS).join(", ")}`,
    );
  }
  const count = Number(out["count"] ?? "1");
  if (!Number.isInteger(count) || count < 1 || count > 1000) {
    throw new Error("--count must be an integer between 1 and 1000");
  }
  const maxActivations = Number(out["max-activations"] ?? "1");
  if (!Number.isInteger(maxActivations) || maxActivations < 1) {
    throw new Error("--max-activations must be a positive integer");
  }

  const expiresAtRaw = out["expires-at"];
  let expiresAt: Date | null = null;
  if (expiresAtRaw) {
    expiresAt = new Date(expiresAtRaw);
    if (Number.isNaN(expiresAt.getTime())) {
      throw new Error(`--expires-at is not a valid date: ${expiresAtRaw}`);
    }
  }

  return {
    plan,
    count,
    maxActivations,
    expiresAt,
    notes: out["notes"] ?? null,
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const durationDays = PLAN_DURATION_DAYS[args.plan];

  const minted: { id: number; rawKey: string; prefix: string }[] = [];

  for (let i = 0; i < args.count; i++) {
    const rawKey = generateProductKey();
    const { hash, prefix } = hashProductKey(rawKey);

    const [row] = await db
      .insert(productKeysTable)
      .values({
        keyHash: hash,
        keyPrefix: prefix,
        planName: args.plan,
        durationDays,
        maxActivations: args.maxActivations,
        status: "active",
        expiresAt: args.expiresAt,
        notes: args.notes,
        createdBy: "cli",
      })
      .returning({ id: productKeysTable.id });

    if (!row) throw new Error("Insert returned no row");
    minted.push({ id: row.id, rawKey, prefix });
  }

  // Single, well-formatted block to stdout. The raw keys are printed ONCE.
  console.log("");
  console.log(`Minted ${minted.length} ${args.plan} key(s):`);
  console.log("─".repeat(60));
  for (const { id, rawKey } of minted) {
    console.log(`  #${id.toString().padStart(6, " ")}  ${rawKey}`);
  }
  console.log("─".repeat(60));
  console.log(
    "Save these now — only their SHA-256 hashes are stored on the server.",
  );
  console.log("");

  // Drizzle's pg pool keeps the process alive; close it explicitly.
  const { pool } = await import("@workspace/db");
  await pool.end();
}

main().catch((err) => {
  console.error("Failed to mint product keys:", err);
  process.exit(1);
});
