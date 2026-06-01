import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { eq, sql, and, isNull } from "drizzle-orm";
import { db, pdfsTable, pdfOtpsTable } from "@workspace/db";
import fs from "fs";
import path from "path";
import multer from "multer";
import { randomUUID, createHash, randomInt } from "crypto";
import { getAuth } from "@clerk/express";
import { logger } from "../../lib/logger";
import { getLicenseStatus, recordUsage } from "../../lib/license";

// ─── OTP config ────────────────────────────────────────────────────────────────

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_MAX_ATTEMPTS = 5;
const OTP_PEPPER = process.env.SESSION_SECRET ?? "luxor-otp-pepper";

function hashOtpCode(code: string): string {
  return createHash("sha256").update(`${OTP_PEPPER}:${code}`).digest("hex");
}

function generateOtpCode(): string {
  // Cryptographically random 6-digit code, zero-padded
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

const router: IRouter = Router();

/**
 * Compensating cleanup when a freshly-inserted upload must be undone (usage
 * recording threw or was refused). Each step is attempted independently and
 * non-throwing so one failure can't leave the other behind — a missing file
 * (ENOENT) is treated as already-clean.
 */
async function cleanupUpload(
  recordId: number,
  filePath: string,
  req: Request,
): Promise<void> {
  try {
    await db.delete(pdfsTable).where(eq(pdfsTable.id, recordId));
  } catch (err) {
    req.log.error({ err, recordId }, "cleanupUpload: failed to delete row");
  }
  try {
    await fs.promises.unlink(filePath);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      req.log.error({ err, filePath }, "cleanupUpload: failed to delete file");
    }
  }
}

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
    // Ensure share_token column exists (no-op if already present)
    await db.execute(
      sql`ALTER TABLE pdfs ADD COLUMN IF NOT EXISTS share_token TEXT`,
    );

    // Ensure expiry_action column exists with sensible default ('revoke' = legacy behavior)
    await db.execute(
      sql`ALTER TABLE pdfs ADD COLUMN IF NOT EXISTS expiry_action TEXT NOT NULL DEFAULT 'revoke'`,
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

    // Create the pdf_otps table for the Revoke Expiry feature
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pdf_otps (
        id SERIAL PRIMARY KEY,
        pdf_id INTEGER NOT NULL REFERENCES pdfs(id) ON DELETE CASCADE,
        code_hash TEXT NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used_at TIMESTAMP WITH TIME ZONE,
        attempts INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS pdf_otps_pdf_id_idx ON pdf_otps(pdf_id)
    `);
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

/**
 * Parse an expiryDate string. Supports both new ISO 8601 datetime values
 * (e.g. "2025-12-31T18:30:00.000Z") and legacy date-only values
 * (e.g. "2025-12-31") for backwards compatibility.
 */
function parseExpiryDate(expiryDate: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)) {
    return new Date(expiryDate + "T23:59:59.999Z");
  }
  return new Date(expiryDate);
}

function isExpired(expiryDate: string): boolean {
  return new Date() > parseExpiryDate(expiryDate);
}

function formatPdfRecord(record: typeof pdfsTable.$inferSelect, includeToken = false) {
  return {
    id: record.id,
    ...(includeToken ? { shareToken: record.shareToken } : {}),
    originalName: record.originalName,
    fileSize: record.fileSize,
    expiryDate: record.expiryDate,
    expiryAction: record.expiryAction,
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
    if (isExpired(r.expiryDate)) {
      expired++;
    } else {
      active++;
    }
  }

  res.json({ total: records.length, active, expired, totalSize });
});

// Server-side gate for the secure upload flow (Password & Expiry protection).
// This is a paid-only feature excluded from the free trial. Enforced here —
// before Multer writes anything to disk — so a malicious client cannot bypass
// the advisory `/usage/check` call by hitting `/pdfs/upload` directly.
async function requirePaidForSecureUpload(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const auth = getAuth(req);
  if (!auth.userId) {
    res.status(401).json({ error: "Not signed in", lockReason: "premium_feature" });
    return;
  }
  try {
    const status = await getLicenseStatus(auth.userId);
    if (!status.isPaid) {
      res.status(403).json({
        error:
          "Password & Expiry protection is a paid feature. Activate a license to continue.",
        lockReason: "premium_feature",
      });
      return;
    }
    // Early shared-pool check (read-only) so we don't write the file to disk
    // when the monthly secure quota is already exhausted. The authoritative,
    // atomic enforcement happens via recordUsage() in the handler below.
    if (status.monthlyUsage.remaining === 0) {
      res.status(403).json({
        error:
          "You've used all your secure actions for this billing month. Upgrade your plan for a higher monthly limit.",
        lockReason: "monthly_limit_reached",
      });
      return;
    }
    next();
  } catch (err) {
    req.log.error({ err, userId: auth.userId }, "upload license check failed");
    res.status(500).json({ error: "Failed to verify license" });
  }
}

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
  // 2. Require a signed-in, paid user (secure feature is paid-only).
  requirePaidForSecureUpload,
  // 3. Storage quota check (runs before Multer writes to disk)
  checkStorageQuota,
  // 4. Multer — file size and type enforced
  upload.single("file"),
  async (req, res): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const { expiryDate, expiryAction } = req.body as {
      expiryDate?: string;
      expiryAction?: string;
    };

    if (!expiryDate) {
      fs.unlinkSync(req.file.path);
      res.status(400).json({ error: "expiryDate is required" });
      return;
    }

    // Accept ISO 8601 datetime (preferred) or legacy YYYY-MM-DD for backwards compatibility.
    const parsedExpiry = new Date(expiryDate);
    if (Number.isNaN(parsedExpiry.getTime())) {
      fs.unlinkSync(req.file.path);
      res.status(400).json({ error: "expiryDate must be a valid ISO 8601 datetime" });
      return;
    }

    const action = expiryAction === "corrupt" ? "corrupt" : "revoke";

    const auth = getAuth(req);
    const shareToken = randomUUID();

    let record;
    try {
      [record] = await db
        .insert(pdfsTable)
        .values({
          shareToken,
          originalName: req.file.originalname,
          storedPath: req.file.path,
          fileSize: req.file.size,
          expiryDate,
          expiryAction: action,
        })
        .returning();
    } catch (err) {
      // Insert failed — the multer-written file would otherwise be orphaned
      // on disk with no DB row, so remove it before surfacing the error.
      try {
        await fs.promises.unlink(req.file.path);
      } catch (unlinkErr) {
        const code = (unlinkErr as NodeJS.ErrnoException).code;
        if (code !== "ENOENT") {
          req.log.error(
            { err: unlinkErr, filePath: req.file.path },
            "upload: failed to unlink orphaned file after insert error",
          );
        }
      }
      throw err;
    }

    // Authoritative shared-pool enforcement: setting an expiry is a metered
    // secure action. We record usage AFTER the row is persisted so a failed
    // insert can never consume monthly quota. recordUsage() atomically
    // increments the shared monthly pool and refuses when the user is over
    // their limit, so a client cannot bypass the quota by hitting this
    // endpoint directly. If recording fails or is refused, we compensate by
    // removing the just-created row + file so no orphaned state remains.
    if (auth.userId) {
      let usage;
      try {
        usage = await recordUsage(auth.userId, "set_expiry", 1);
      } catch (err) {
        await cleanupUpload(record.id, req.file.path, req);
        throw err;
      }
      if (!usage.recorded) {
        await cleanupUpload(record.id, req.file.path, req);
        res.status(403).json({
          error:
            usage.lockReason === "monthly_limit_reached"
              ? "You've used all your secure actions for this billing month. Upgrade your plan for a higher monthly limit."
              : "This secure action isn't available on your current plan.",
          lockReason: usage.lockReason,
          monthlyUsage: {
            used: usage.monthlyUsed,
            limit: usage.monthlyLimit,
            remaining: usage.monthlyRemaining,
          },
        });
        return;
      }
    }

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
    if (record.expiryAction === "corrupt") {
      // Once-only: replace the stored file with random garbage so the PDF
      // becomes unreadable but the download endpoint still returns a "file".
      try {
        if (fs.existsSync(record.storedPath)) {
          const stats = fs.statSync(record.storedPath);
          // Cap garbage size at 64 KB to avoid wasting disk on huge originals.
          const garbageSize = Math.min(stats.size, 64 * 1024);
          const { randomBytes } = await import("crypto");
          fs.writeFileSync(record.storedPath, randomBytes(garbageSize));
          req.log.info({ id: record.id }, "Expired PDF replaced with garbage bytes (corrupt mode)");
        }
      } catch (err) {
        req.log.error({ id: record.id, err }, "Failed to corrupt expired PDF on disk");
      }

      if (fs.existsSync(record.storedPath)) {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${securedFilename(record.originalName)}"`,
        );
        res.sendFile(record.storedPath);
        return;
      }
      // Fallthrough to 410 if the file vanished (e.g. previously deleted)
    } else {
      // Default = revoke: delete the file and return 410 Gone.
      if (fs.existsSync(record.storedPath)) {
        try {
          fs.unlinkSync(record.storedPath);
          req.log.info({ id: record.id }, "Expired PDF deleted from disk (revoke mode)");
        } catch (err) {
          req.log.error({ id: record.id, err }, "Failed to delete expired PDF from disk");
        }
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

// ─── Revoke Expiry (OTP) ──────────────────────────────────────────────────────

router.post("/pdfs/:id/revoke/request", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const { shareToken } = (req.body ?? {}) as { shareToken?: string };

  const [record] = await db.select().from(pdfsTable).where(eq(pdfsTable.id, id));

  if (!record) {
    res.status(404).json({ error: "PDF not found" });
    return;
  }

  if (!requireShareToken(shareToken, record, res)) return;

  // If the file has already been purged from disk we cannot revoke
  if (!fs.existsSync(record.storedPath)) {
    res.status(409).json({
      error: "This PDF has already been permanently deleted and cannot be revoked.",
    });
    return;
  }

  // Invalidate any prior unused OTPs for this PDF so only the latest is valid
  await db
    .update(pdfOtpsTable)
    .set({ usedAt: new Date() })
    .where(and(eq(pdfOtpsTable.pdfId, id), isNull(pdfOtpsTable.usedAt)));

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  const [otp] = await db
    .insert(pdfOtpsTable)
    .values({
      pdfId: id,
      codeHash: hashOtpCode(code),
      expiresAt,
    })
    .returning();

  req.log.info({ id: record.id, otpId: otp.id }, "Revoke OTP generated");

  res.status(201).json({
    otpId: otp.id,
    code, // demo only — would be emailed in production
    expiresAt: otp.expiresAt.toISOString(),
  });
});

router.post("/pdfs/:id/revoke/verify", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const { shareToken, otpId, code, newExpiryDate } = (req.body ?? {}) as {
    shareToken?: string;
    otpId?: number;
    code?: string;
    newExpiryDate?: string;
  };

  if (typeof otpId !== "number" || !code || !newExpiryDate) {
    res.status(400).json({ error: "otpId, code, and newExpiryDate are required" });
    return;
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(newExpiryDate)) {
    res.status(400).json({ error: "newExpiryDate must be in YYYY-MM-DD format" });
    return;
  }

  // The new expiry must be in the future
  const newExpiry = new Date(newExpiryDate + "T23:59:59.999Z");
  if (newExpiry <= new Date()) {
    res.status(400).json({ error: "newExpiryDate must be in the future" });
    return;
  }

  const [record] = await db.select().from(pdfsTable).where(eq(pdfsTable.id, id));

  if (!record) {
    res.status(404).json({ error: "PDF not found" });
    return;
  }

  if (!requireShareToken(shareToken, record, res)) return;

  if (!fs.existsSync(record.storedPath)) {
    res.status(409).json({
      error: "This PDF has already been permanently deleted and cannot be revoked.",
    });
    return;
  }

  const [otp] = await db
    .select()
    .from(pdfOtpsTable)
    .where(and(eq(pdfOtpsTable.id, otpId), eq(pdfOtpsTable.pdfId, id)));

  if (!otp) {
    res.status(404).json({ error: "OTP not found. Please request a new code." });
    return;
  }

  if (otp.usedAt) {
    res.status(400).json({ error: "This OTP has already been used. Please request a new code." });
    return;
  }

  if (otp.expiresAt.getTime() < Date.now()) {
    res.status(400).json({ error: "This OTP has expired. Please request a new code." });
    return;
  }

  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    res.status(403).json({ error: "Too many failed attempts. Please request a new code." });
    return;
  }

  const submittedHash = hashOtpCode(String(code));
  if (submittedHash !== otp.codeHash) {
    await db
      .update(pdfOtpsTable)
      .set({ attempts: otp.attempts + 1 })
      .where(eq(pdfOtpsTable.id, otp.id));
    res.status(400).json({
      error: `Incorrect code. ${OTP_MAX_ATTEMPTS - otp.attempts - 1} attempt(s) remaining.`,
    });
    return;
  }

  // Success – mark OTP used and extend the PDF expiry
  await db
    .update(pdfOtpsTable)
    .set({ usedAt: new Date() })
    .where(eq(pdfOtpsTable.id, otp.id));

  const [updated] = await db
    .update(pdfsTable)
    .set({ expiryDate: newExpiryDate })
    .where(eq(pdfsTable.id, id))
    .returning();

  req.log.info({ id: record.id, otpId: otp.id, newExpiryDate }, "Revoke OTP verified – expiry extended");

  res.json(formatPdfRecord(updated));
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
