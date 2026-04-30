const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const JsonDB = require("./db");

const PORT = parseInt(process.env.PORT || "47832", 10);
const DATA_PATH = process.env.DATA_PATH || path.join(__dirname, ".data");
const STATIC_PATH = process.env.STATIC_PATH || path.join(__dirname, "public");

const db = new JsonDB(DATA_PATH);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Multer (file uploads) ───────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, db.getPdfsDir()),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${file.originalname}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new Error("Only PDF files are allowed"));
    } else {
      cb(null, true);
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isExpired(expiryDate) {
  // Use UTC end-of-day: the document is valid through the full calendar day in UTC
  const expiry = new Date(`${expiryDate}T23:59:59.999Z`);
  return Date.now() > expiry.getTime();
}

function formatRecord(record) {
  return {
    id: record.id,
    originalName: record.originalName,
    fileSize: record.fileSize,
    expiryDate: record.expiryDate,
    isExpired: isExpired(record.expiryDate),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

// ─── Health ──────────────────────────────────────────────────────────────────

app.get("/api/healthz", (_req, res) => res.json({ ok: true }));

// ─── Stats ───────────────────────────────────────────────────────────────────

app.get("/api/pdfs/stats", (_req, res) => {
  res.json(db.getStats());
});

// ─── List ────────────────────────────────────────────────────────────────────

app.get("/api/pdfs", (_req, res) => {
  res.json(db.getAllPdfs().map(formatRecord));
});

// ─── Upload ──────────────────────────────────────────────────────────────────

app.post("/api/pdfs/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const { expiryDate } = req.body;
  if (!expiryDate) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: "expiryDate is required" });
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(expiryDate)) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ error: "expiryDate must be in YYYY-MM-DD format" });
  }

  const record = db.insertPdf({
    originalName: req.file.originalname,
    storedPath: req.file.path,
    fileSize: req.file.size,
    expiryDate,
  });

  res.status(201).json(formatRecord(record));
});

// ─── Get one ─────────────────────────────────────────────────────────────────

app.get("/api/pdfs/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const record = db.getPdfById(id);
  if (!record) return res.status(404).json({ error: "PDF not found" });

  res.json(formatRecord(record));
});

// ─── Download ────────────────────────────────────────────────────────────────

app.get("/api/pdfs/:id/download", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const record = db.getPdfById(id);
  if (!record) return res.status(404).json({ error: "PDF not found" });

  if (isExpired(record.expiryDate)) {
    // Delete the file from disk immediately on first expired access
    if (fs.existsSync(record.storedPath)) {
      try { fs.unlinkSync(record.storedPath); } catch { /* ignore */ }
    }
    return res.status(410).json({ error: "This PDF has expired and is no longer available." });
  }

  if (!fs.existsSync(record.storedPath)) {
    return res.status(404).json({ error: "PDF file not found on disk" });
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${record.originalName}"`);
  res.sendFile(record.storedPath);
});

// ─── Delete ──────────────────────────────────────────────────────────────────

app.delete("/api/pdfs/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const record = db.deletePdf(id);
  if (!record) return res.status(404).json({ error: "PDF not found" });

  if (fs.existsSync(record.storedPath)) {
    try {
      fs.unlinkSync(record.storedPath);
    } catch {
      // ignore cleanup errors
    }
  }

  res.sendStatus(204);
});

// ─── Serve built frontend ────────────────────────────────────────────────────

app.use(express.static(STATIC_PATH));

app.get("*", (_req, res) => {
  res.sendFile(path.join(STATIC_PATH, "index.html"));
});

// ─── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, "127.0.0.1", () => {
  console.log(`[LexSecure] Server listening on http://localhost:${PORT}`);
});
