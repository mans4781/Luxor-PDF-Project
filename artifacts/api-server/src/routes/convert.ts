import {
  Router,
  type IRouter,
  type Request,
  type Response,
} from "express";
import multer from "multer";
import fs from "fs";
import os from "os";
import path from "path";
import { randomUUID } from "crypto";
import { convertPdfToDocx, PdfConversionError } from "../lib/pdf-to-docx";

const router: IRouter = Router();

// Kept modest: server-side conversion is CPU-bound and we want fast turnaround.
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const CONVERT_TIMEOUT_MS = 120_000; // 2 min hard cap per conversion
const MAX_CONCURRENT = 2; // simultaneous conversions across the server

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const TMP_DIR = path.join(os.tmpdir(), "luxor-convert");
fs.mkdirSync(TMP_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TMP_DIR),
  filename: (_req, _file, cb) => cb(null, `${Date.now()}-${randomUUID()}.pdf`),
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    // First-pass filter on the declared type; the real check is a magic-byte
    // sniff after the bytes land on disk (MIME headers are spoofable).
    if (file.mimetype !== "application/pdf") {
      cb(new Error("Only PDF files are allowed"));
      return;
    }
    cb(null, true);
  },
});

// Per-IP rate limiter: 5 conversions / minute, with opportunistic pruning so
// the map can't grow unbounded on a public endpoint.
const rateLimiter = (() => {
  const windowMs = 60 * 1000;
  const maxRequests = 5;
  const requests = new Map<string, number[]>();

  return (ip: string): boolean => {
    const now = Date.now();
    const windowStart = now - windowMs;

    if (requests.size > 5000) {
      for (const [key, times] of requests) {
        const fresh = times.filter((t) => t > windowStart);
        if (fresh.length === 0) requests.delete(key);
        else requests.set(key, fresh);
      }
    }

    const timestamps = (requests.get(ip) ?? []).filter((t) => t > windowStart);
    if (timestamps.length >= maxRequests) {
      requests.set(ip, timestamps);
      return false;
    }
    timestamps.push(now);
    requests.set(ip, timestamps);
    return true;
  };
})();

let inFlight = 0;

async function safeUnlink(filePath: string, req: Request): Promise<void> {
  try {
    await fs.promises.unlink(filePath);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      req.log.error({ err, filePath }, "convert: failed to clean up temp file");
    }
  }
}

/** Cheap magic-byte sniff: a valid PDF carries "%PDF-" within its first 1KB. */
function looksLikePdf(filePath: string): boolean {
  let fd: number | null = null;
  try {
    fd = fs.openSync(filePath, "r");
    const buf = Buffer.alloc(1024);
    const bytes = fs.readSync(fd, buf, 0, 1024, 0);
    return buf.subarray(0, bytes).includes("%PDF-");
  } catch {
    return false;
  } finally {
    if (fd !== null) {
      try {
        fs.closeSync(fd);
      } catch {
        /* ignore */
      }
    }
  }
}

router.post("/convert/pdf-to-word", (req: Request, res: Response) => {
  const ip = req.ip ?? "unknown";

  if (!rateLimiter(ip)) {
    res
      .status(429)
      .json({ error: "Too many conversions. Please wait a minute and try again." });
    return;
  }

  // Reserve a slot synchronously. There is no `await` between the capacity
  // check and the increment, so the single-threaded event loop guarantees the
  // cap can never be exceeded by concurrent requests.
  if (inFlight >= MAX_CONCURRENT) {
    res
      .status(503)
      .json({ error: "The converter is busy right now. Please try again in a moment." });
    return;
  }
  inFlight++;

  let released = false;
  const release = () => {
    if (!released) {
      released = true;
      inFlight--;
    }
  };

  upload.single("file")(req, res, async (err: unknown) => {
    let inputPath: string | null = null;
    let outputPath: string | null = null;

    try {
      if (err) {
        const msg =
          err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE"
            ? "PDF is too large (max 25 MB)."
            : err instanceof Error
              ? err.message
              : "Upload failed.";
        res.status(400).json({ error: msg });
        return;
      }

      const file = req.file;
      if (!file) {
        res.status(400).json({ error: "No PDF uploaded." });
        return;
      }
      inputPath = file.path;

      if (!looksLikePdf(inputPath)) {
        res.status(400).json({ error: "That file does not look like a valid PDF." });
        return;
      }

      outputPath = path.join(
        TMP_DIR,
        `${path.basename(inputPath, ".pdf")}.docx`,
      );

      await convertPdfToDocx(inputPath, outputPath, {
        timeoutMs: CONVERT_TIMEOUT_MS,
      });

      const buffer = await fs.promises.readFile(outputPath);
      const base = (file.originalname || "document").replace(/\.pdf$/i, "");
      const safeName = base.replace(/[^\w.\- ]+/g, "_").trim() || "document";

      res.setHeader("Content-Type", DOCX_MIME);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${safeName}.docx"`,
      );
      res.send(buffer);
    } catch (e) {
      req.log.error({ err: e }, "pdf-to-word conversion failed");
      const detail =
        e instanceof PdfConversionError && e.timedOut
          ? "Conversion timed out. Try a smaller or simpler PDF."
          : "Conversion failed. The PDF may be scanned (image-only), encrypted, or corrupted.";
      if (!res.headersSent) res.status(422).json({ error: detail });
    } finally {
      release();
      if (inputPath) void safeUnlink(inputPath, req);
      if (outputPath) void safeUnlink(outputPath, req);
    }
  });
});

export default router;
