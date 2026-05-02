import { createHash, randomInt } from "node:crypto";

/**
 * Public-facing key format: `LUXOR-XXXX-XXXX-XXXX-XXXX`.
 *
 * 16 random characters drawn from a 32-char alphabet (no O/0/I/1) ⇒
 * 16 × log2(32) = 80 bits of entropy. The fixed `LUXOR-` prefix is for
 * human recognition and is NOT counted as entropy.
 */
const KEY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const KEY_PREFIX = "LUXOR";
const GROUP_LEN = 4;
const NUM_GROUPS = 4;

/** Plan duration in days. Lifetime is treated as ~100 years. */
export const PLAN_DURATION_DAYS = {
  monthly: 30,
  quarterly: 90,
  yearly: 365,
  lifetime: 36_500,
} as const satisfies Record<string, number>;

export type ProductPlan = keyof typeof PLAN_DURATION_DAYS;

export const PRODUCT_PLANS: readonly ProductPlan[] = Object.keys(
  PLAN_DURATION_DAYS,
) as ProductPlan[];

export function isProductPlan(value: unknown): value is ProductPlan {
  return (
    typeof value === "string" &&
    (PRODUCT_PLANS as readonly string[]).includes(value)
  );
}

function randomChar(): string {
  // crypto.randomInt is uniformly distributed; safe modulo of a power-of-two
  // alphabet length (32) avoids any bias.
  return KEY_ALPHABET[randomInt(0, KEY_ALPHABET.length)] ?? "A";
}

function randomGroup(): string {
  let out = "";
  for (let i = 0; i < GROUP_LEN; i++) out += randomChar();
  return out;
}

/**
 * Generate a fresh raw product key. The raw value is the only thing the
 * customer ever sees — the server never persists it; only the SHA-256 hash
 * and a short display prefix are stored.
 */
export function generateProductKey(): string {
  const groups: string[] = [];
  for (let i = 0; i < NUM_GROUPS; i++) groups.push(randomGroup());
  return `${KEY_PREFIX}-${groups.join("-")}`;
}

export interface HashedProductKey {
  /** SHA-256 hex digest of the raw key string (including the LUXOR- prefix). */
  hash: string;
  /**
   * First 9 characters of the raw key (`LUXOR-XXXX`). Stored alongside the
   * hash so admins can recognise / disambiguate a key in the dashboard
   * without ever seeing the secret bits. NOT used for authentication.
   */
  prefix: string;
}

export function hashProductKey(rawKey: string): HashedProductKey {
  const normalized = rawKey.trim().toUpperCase();
  return {
    hash: createHash("sha256").update(normalized).digest("hex"),
    prefix: normalized.slice(0, 9),
  };
}

/**
 * Quick syntactic check before hitting the DB. Does not authenticate the
 * key — only validates that the input string has the expected shape.
 */
export function isWellFormedProductKey(rawKey: string): boolean {
  const normalized = rawKey.trim().toUpperCase();
  const groupPattern = `[${KEY_ALPHABET}]{${GROUP_LEN}}`;
  const re = new RegExp(
    `^${KEY_PREFIX}-${groupPattern}-${groupPattern}-${groupPattern}-${groupPattern}$`,
  );
  return re.test(normalized);
}
