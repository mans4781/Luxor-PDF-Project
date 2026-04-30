import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { eq, sql } from "drizzle-orm";
import { db, pdfsTable } from "@workspace/db";
import fs from "fs";
import path from "path";
import multer from "multer";
import { randomUUID } from "crypto";
import { logger } from "../../lib/logger";

const router: IRouter = Router();

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

// 50 MB per file — matches the advertised UI limit
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

// 10 GB global total storage cap; override with MAX_STORAGE_BYTES env var
const MAX_TOTAL_STORAGE_BYTES = parseInt(process.env.MAX_STORAGE_BYTES ?? "", 10) || 10 * 1024 * 1024 * 1024;

// Maximum number of stored (non-deleted) documents
const MAX_TOTAL_FILES = parseInt(process.env.MAX_TOTAL_FILES ?? "", 10) || 10_000;

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Runs once at startup: backfill any rows that somehow lack a share_token,
 * and ensure the column exists (idempotent — safe on fresh deployments too).
 */
export async function runPdfMigrations(): Promise<void> {
  try {
    // Ensure column exists (no-op if already present)
    await db.execute(
      sql`ALTER TABLE pdfs ADD COLUMN IF NOT EXISTS share_token TEXT`,
    );

    // Backfill rows missing a token
    const { rowCount } = await db.execute(
      sql`UPDATE pdfs SET share_token = gen_random_uuid()::text WHERE share_token IS NULL`,
    );

    // Enforce NOT NULL + UNIQUE after backfill
    await db.execute(
      sql`ALTER TABLE pdfs ALTER COLUMN share_token SET NOT NULL`,
    );

    await db.execute(sql`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'pdfs_share_token_unique' AND table_name = 'pdfs'
        ) THEN
          ALTER TABLE pdfs ADD CONSTRAINT pdfs_share_token_unique UNIQUE (share_token);
        END IF;
      END $$
    `);

    if ((rowCount ?? 0) > 0) {
      logger.info({ backfilled: rowCount }, "PDF migration: backfilled share_token for existing rows");
    }
  } catch (err) {
    logger.error({ err }, "PDF migration failed");
    throw err;
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new Error("Only PDF files are allowed"));
      return;
    }
    cb(null, true);
  },
});

// ─── Rate limiter ─────────────────────────────────────────────────────────────

const uploadRateLimiter = (() => {
  const windowMs = 60 * 1000;
  const maxRequests = 10;
  const requests = new Map<string, number[]>();

  return (ip: string): boolean => {
    const now = Date.now();
    const windowStart = now - windowMs;
    const timestamps = (requests.get(ip) ?? []).filter((t) => t > windowStart);
    if (timestamps.length >= maxRequests) {
      return false;
    }
    timestamps.push(now);
    requests.set(ip, timestamps);
    return true;
  };
})();

// ─── Storage quota middleware ─────────────────────────────────────────────────

async function checkStorageQuota(_req: Request, res: Response, next: NextFunction): Promise<void> {
  const [stats] = await db
    .select({ count: sql<number>`count(*)`, total: sql<number>`coalesce(sum(file_size), 0)` })
    .from(pdfsTable);

  if (stats.count >= MAX_TOTAL_FILES) {
    res.status(507).json({ error: "Storage limit reached: maximum number of documents exceeded." });
    return;
  }
  if (stats.total >= MAX_TOTAL_STORAGE_BYTES) {
    res.status(507).json({ error: "Storage limit reached: total storage capacity exceeded." });
    return;
  }
  next();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isExpired(expiryDate: string): boolean {
  const expiry = new Date(expiryDate + "T23:59:59.999Z");
  const now = new Date();
  return now > expiry;
}

function formatPdfRecord(record: typeof pdfsTable.$inferSelect, includeToken = false) {
  return {
    id: record.id,
    ...(includeToken ? { shareToken: record.shareToken } : {}),
    originalName: record.originalName,
    fileSize: record.fileSize,
    expiryDate: record.expiryDate,
    isExpired: isExpired(record.expiryDate),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function requireShareToken(
  shareToken: string | undefined,
  record: typeof pdfsTable.$inferSelect,
  res: Response,
): boolean {
  if (!shareToken || shareToken !== record.shareToken) {
    res.status(403).json({ error: "Forbidden: invalid or missing share token" });
    return false;
  }
  return true;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

router.get("/pdfs/stats", async (_req, res): Promise<void> => {
  const records = await db.select().from(pdfsTable);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let active = 0;
  let expired = 0;
  let totalSize = 0;

  for (const r of records) {
    totalSize += r.fileSize;
    const expiry = new Date(r.expiryDate);
    if (expiry < now) {
      expired++;
    } else {
      active++;
    }
  }

  res.json({ total: records.length, active, expired, totalSize });
});

router.post(
  "/pdfs/upload",
  // 1. Rate limit
  (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip ?? "unknown";
    if (!uploadRateLimiter(ip)) {
      res.status(429).json({ error: "Too many uploads. Please wait before trying again." });
      return;
    }
    next();
  },
  // 2. Storage quota check (runs before Multer writes to disk)
  checkStorageQuota,
  // 3. Multer — file size and type enforced
  upload.single("file"),
  async (req, res): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const { expiryDate } = req.body as { expiryDate?: string };

    if (!expiryDate) {
      fs.unlinkSync(req.file.path);
      res.status(400).json({ error: "expiryDate is required" });
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(expiryDate)) {
      fs.unlinkSync(req.file.path);
      res.status(400).json({ error: "expiryDate must be in YYYY-MM-DD format" });
      return;
    }

    const shareToken = randomUUID();

    const [record] = await db
      .insert(pdfsTable)
      .values({
        shareToken,
        originalName: req.file.originalname,
        storedPath: req.file.path,
        fileSize: req.file.size,
        expiryDate,
      })
      .returning();

    req.log.info({ id: record.id, name: record.originalName }, "PDF uploaded");
    res.status(201).json(formatPdfRecord(record, true));
  },
);

router.get("/pdfs/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const shareToken = req.query.shareToken as string | undefined;

  const [record] = await db.select().from(pdfsTable).where(eq(pdfsTable.id, id));

  if (!record) {
    res.status(404).json({ error: "PDF not found" });
    return;
  }

  if (!requireShareToken(shareToken, record, res)) return;

  res.json(formatPdfRecord(record));
});

function securedFilename(originalName: string): string {
  const dot = originalName.lastIndexOf(".");
  if (dot === -1) return `${originalName} (secured)`;
  return `${originalName.slice(0, dot)} (secured)${originalName.slice(dot)}`;
}

router.get("/pdfs/:id/download", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const shareToken = req.query.shareToken as string | undefined;

  const [record] = await db.select().from(pdfsTable).where(eq(pdfsTable.id, id));

  if (!record) {
    res.status(404).json({ error: "PDF not found" });
    return;
  }

  if (!requireShareToken(shareToken, record, res)) return;

  if (isExpired(record.expiryDate)) {
    if (fs.existsSync(record.storedPath)) {
      try {
        fs.unlinkSync(record.storedPath);
        req.log.info({ id: record.id }, "Expired PDF deleted from disk");
      } catch (err) {
        req.log.error({ id: record.id, err }, "Failed to delete expired PDF from disk");
      }
    }
    res.status(410).json({
      error: "This PDF has expired and is no longer available.",
      expiredAt: record.expiryDate,
    });
    return;
  }

  if (!fs.existsSync(record.storedPath)) {
    req.log.error({ id: record.id, path: record.storedPath }, "PDF file not found on disk");
    res.status(404).json({ error: "PDF file not found on disk" });
    return;
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${securedFilename(record.originalName)}"`);
  res.sendFile(record.storedPath);
});

router.delete("/pdfs/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const shareToken = req.query.shareToken as string | undefined;

  const [record] = await db.select().from(pdfsTable).where(eq(pdfsTable.id, id));

  if (!record) {
    res.status(404).json({ error: "PDF not found" });
    return;
  }

  if (!requireShareToken(shareToken, record, res)) return;

  await db.delete(pdfsTable).where(eq(pdfsTable.id, id));

  if (fs.existsSync(record.storedPath)) {
    fs.unlinkSync(record.storedPath);
  }

  req.log.info({ id: record.id }, "PDF deleted");
  res.sendStatus(204);
});

export { router as pdfsRouter };
export default router;
