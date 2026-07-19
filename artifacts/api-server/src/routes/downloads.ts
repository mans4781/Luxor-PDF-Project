import { Router, type IRouter, type Request, type Response } from "express";
import { createHash } from "node:crypto";
import geoip from "geoip-lite";
import { db, downloadEventsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

// ── Download tracking ────────────────────────────────────────────────────────
const IP_HASH_SALT = process.env["SESSION_SECRET"];
if (!IP_HASH_SALT) {
  throw new Error("SESSION_SECRET must be set: it salts download IP hashes for privacy");
}

/**
 * Idempotent startup migration: makes sure the download_events table exists
 * on fresh/production databases (same pattern as runPdfMigrations()).
 */
export async function runDownloadMigrations(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS download_events (
      id serial PRIMARY KEY,
      app text NOT NULL,
      day date NOT NULL,
      ip_hash text NOT NULL,
      country text,
      city text,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS download_events_app_day_idx ON download_events (app, day)`,
  );
  await db.execute(
    sql`CREATE INDEX IF NOT EXISTS download_events_day_idx ON download_events (day)`,
  );
}

function hashIp(ip: string): string {
  return createHash("sha256").update(`${IP_HASH_SALT}:${ip}`).digest("hex").slice(0, 32);
}

/**
 * Fire-and-forget: record one download event with a coarse GeoIP location.
 * Never blocks or fails the actual download redirect.
 */
function recordDownload(req: Request, app: "reader" | "secure"): void {
  const ip = req.ip;
  if (!ip) return;
  let country: string | null = null;
  let city: string | null = null;
  try {
    const geo = geoip.lookup(ip);
    country = geo?.country || null;
    city = geo?.city || null;
  } catch {
    /* location stays unknown */
  }
  const day = new Date().toISOString().slice(0, 10);
  db.insert(downloadEventsTable)
    .values({ app, day, ipHash: hashIp(ip), country, city })
    .then(() => undefined)
    .catch((err: unknown) => {
      req.log.warn({ err, app }, "Failed to record download event");
    });
}

// ---------------------------------------------------------------------------
// Windows desktop installers (Luxor PDF Reader + Luxor PDF Secure).
//
// Each desktop app is published to its OWN GitHub Releases by its CI workflow:
//   - Reader → mans4781/Luxor-PDF-Project
//   - Secure → mans4781/Luxor-Secure-Project
//
// electron-builder writes the current asset name into latest.yml, and that name
// changes with every version. The website links to the stable routes below; we
// resolve the real asset name from latest.yml, then 302 the browser straight to
// the release asset.
//
// Do NOT stream installers through this server: the deployed edge caps response
// sizes (~32 MB), so proxying a ~100 MB installer returns a 500 in production
// even though the server logs a 200.
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 5 * 60 * 1000;

type NameCache = { name: string; fetchedAt: number } | null;

/**
 * Resolve the current installer asset name for a GitHub "releases/latest"
 * base URL by reading its latest.yml. Results are cached for CACHE_TTL_MS.
 * Throws when the release/latest.yml cannot be resolved.
 */
async function resolveAssetName(
  releasesLatestBase: string,
  cache: NameCache,
): Promise<{ name: string; cache: NameCache }> {
  if (cache && Date.now() - cache.fetchedAt <= CACHE_TTL_MS) {
    return { name: cache.name, cache };
  }
  const ymlRes = await fetch(`${releasesLatestBase}/latest.yml`, {
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  });
  if (!ymlRes.ok) {
    throw new Error(`latest.yml lookup failed (${ymlRes.status})`);
  }
  const yml = await ymlRes.text();
  const m = /^path:\s*(.+)$/m.exec(yml);
  if (!m || !m[1]) {
    throw new Error("Could not resolve installer name");
  }
  const next = { name: m[1].trim(), fetchedAt: Date.now() };
  return { name: next.name, cache: next };
}

// --- Luxor PDF Secure ------------------------------------------------------
const SECURE_RELEASES_LATEST =
  "https://github.com/mans4781/Luxor-Secure-Project/releases/latest/download";
let secureCache: NameCache = null;

router.get(
  "/downloads/luxor-pdf-secure-latest.exe",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const resolved = await resolveAssetName(SECURE_RELEASES_LATEST, secureCache);
      secureCache = resolved.cache;
      recordDownload(req, "secure");
      res.setHeader("Cache-Control", "no-store");
      res.redirect(
        302,
        `${SECURE_RELEASES_LATEST}/${encodeURIComponent(resolved.name)}`,
      );
    } catch (err) {
      // Until the first Secure release is published this resolves to a 404,
      // which the download page renders as "installer being prepared".
      req.log.warn({ err }, "Secure installer not available yet");
      res.status(404).json({ error: "Installer not yet available" });
    }
  },
);

// --- Luxor PDF Reader ------------------------------------------------------
const READER_RELEASES_LATEST =
  "https://github.com/mans4781/Luxor-PDF-Project/releases/latest/download";
let readerCache: NameCache = null;

router.get(
  "/downloads/luxor-pdf-reader-latest",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const resolved = await resolveAssetName(READER_RELEASES_LATEST, readerCache);
      readerCache = resolved.cache;
      recordDownload(req, "reader");
      res.setHeader("Cache-Control", "no-store");
      res.redirect(
        302,
        `${READER_RELEASES_LATEST}/${encodeURIComponent(resolved.name)}`,
      );
    } catch (err) {
      req.log.error({ err }, "Reader installer redirect failed");
      res.status(502).json({ error: "Release lookup failed" });
    }
  },
);

/** GET /downloads/installer-info — lightweight check for the download page. */
router.get(
  "/downloads/installer-info",
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const resolved = await resolveAssetName(SECURE_RELEASES_LATEST, secureCache);
      secureCache = resolved.cache;
      res.json({
        available: true,
        downloadUrl: "/api/downloads/luxor-pdf-secure-latest.exe",
      });
    } catch {
      res.json({ available: false });
    }
  },
);

export default router;
