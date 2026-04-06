import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, pdfsTable } from "@workspace/db";
import fs from "fs";
import path from "path";
import multer from "multer";
import { logger } from "../../lib/logger";

const router: IRouter = Router();

const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
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
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new Error("Only PDF files are allowed"));
      return;
    }
    cb(null, true);
  },
});

function isExpired(expiryDate: string): boolean {
  const expiry = new Date(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return expiry < today;
}

function formatPdfRecord(record: typeof pdfsTable.$inferSelect) {
  return {
    id: record.id,
    originalName: record.originalName,
    fileSize: record.fileSize,
    expiryDate: record.expiryDate,
    isExpired: isExpired(record.expiryDate),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

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

router.get("/pdfs", async (_req, res): Promise<void> => {
  const records = await db.select().from(pdfsTable).orderBy(sql`${pdfsTable.createdAt} DESC`);
  res.json(records.map(formatPdfRecord));
});

router.post("/pdfs/upload", upload.single("file"), async (req, res): Promise<void> => {
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

  const [record] = await db
    .insert(pdfsTable)
    .values({
      originalName: req.file.originalname,
      storedPath: req.file.path,
      fileSize: req.file.size,
      expiryDate,
    })
    .returning();

  req.log.info({ id: record.id, name: record.originalName }, "PDF uploaded");
  res.status(201).json(formatPdfRecord(record));
});

router.get("/pdfs/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [record] = await db.select().from(pdfsTable).where(eq(pdfsTable.id, id));

  if (!record) {
    res.status(404).json({ error: "PDF not found" });
    return;
  }

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

  const [record] = await db.select().from(pdfsTable).where(eq(pdfsTable.id, id));

  if (!record) {
    res.status(404).json({ error: "PDF not found" });
    return;
  }

  if (isExpired(record.expiryDate)) {
    req.log.info({ id: record.id }, "Serving corrupted PDF — expired");
    const corruptedData = Buffer.from(
      "%PDF-1.4\n%\xc7\xec\x8f\xa2\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n" +
      "CORRUPTED_INVALID_DATA_THIS_FILE_HAS_EXPIRED_" +
      Array(512).fill("X").join("") +
      "\n%%EOF",
      "latin1"
    );
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${securedFilename(record.originalName)}"`);
    res.setHeader("Content-Length", corruptedData.length);
    res.send(corruptedData);
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

  const [record] = await db.delete(pdfsTable).where(eq(pdfsTable.id, id)).returning();

  if (!record) {
    res.status(404).json({ error: "PDF not found" });
    return;
  }

  if (fs.existsSync(record.storedPath)) {
    fs.unlinkSync(record.storedPath);
  }

  req.log.info({ id: record.id }, "PDF deleted");
  res.sendStatus(204);
});

export default router;
