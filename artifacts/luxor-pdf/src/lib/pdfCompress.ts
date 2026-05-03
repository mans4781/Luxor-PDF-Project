/**
 * Client-side PDF compression — same approach Smallpdf / iLovePDF use:
 * re-rasterize every page via pdf.js to a canvas at a chosen DPI, encode
 * each canvas as JPEG at a chosen quality, then assemble a brand-new PDF
 * with one full-page JPEG per page using pdf-lib.
 *
 * Trade-offs (worth surfacing in the UI):
 *  - Searchable text and vector content are flattened into pixels.
 *  - Existing annotations from the original PDF are NOT carried over;
 *    callers should run their own edit-burn-in pipeline FIRST and pass
 *    those bytes here if they want everything baked.
 *  - Already-small / mostly-vector PDFs may grow slightly under "low".
 *    The caller decides whether to keep the result or fall back to the
 *    original — `compressPdf` simply returns the raster blob.
 */

import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument } from "pdf-lib";

export interface CompressOptions {
  /** Render DPI. PDF default is 72; 96 ≈ screen, 120 ≈ readable print. */
  dpi: number;
  /** JPEG quality 0..1 passed to canvas.toBlob. */
  jpegQuality: number;
  /** Optional progress callback (0..1). */
  onProgress?: (frac: number) => void;
}

export const COMPRESS_PRESETS = {
  high:   { label: "High compression",   desc: "Smallest file, lower quality (72 DPI, JPEG 0.45).",      dpi:  72, jpegQuality: 0.45 },
  medium: { label: "Medium compression", desc: "Balanced size and clarity (120 DPI, JPEG 0.65).",        dpi: 120, jpegQuality: 0.65 },
  low:    { label: "Low compression",    desc: "Best quality, modest size reduction (150 DPI, JPEG 0.80).", dpi: 150, jpegQuality: 0.80 },
} as const;

export type CompressPreset = keyof typeof COMPRESS_PRESETS;

/**
 * Re-rasterize every page of `file` and emit a new PDF with one
 * embedded JPEG per page. The output is *always* a brand-new PDF —
 * callers should compare sizes themselves and decide whether to keep
 * it or hand back the original.
 */
export async function compressPdf(file: File | Blob, opts: CompressOptions): Promise<Blob> {
  const { dpi, jpegQuality, onProgress } = opts;
  const scale = dpi / 72; // pdf.js scale is points → CSS px at 72dpi base.

  const srcBytes = await file.arrayBuffer();
  // Load via pdf.js for rasterization (typed pages, viewport, render).
  const srcDoc = await pdfjsLib.getDocument({ data: srcBytes.slice(0) }).promise;
  // Build the output PDF.
  const outDoc = await PDFDocument.create();

  const total = srcDoc.numPages;
  for (let i = 1; i <= total; i++) {
    const page = await srcDoc.getPage(i);
    // Use pdf.js's default rotation (matches the file's natural rotation).
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to acquire 2D canvas context for compression.");
    // White background — JPEG has no alpha, so transparent pages would
    // otherwise come out black.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: ctx, viewport } as any).promise;

    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("canvas.toBlob returned null"))),
        "image/jpeg",
        jpegQuality,
      );
    });
    const jpgBytes = new Uint8Array(await blob.arrayBuffer());
    const embedded = await outDoc.embedJpg(jpgBytes);

    // Use the original page's points-size so the printed dimensions
    // stay identical regardless of DPI.
    const ptsViewport = page.getViewport({ scale: 1 });
    const pageWidthPts = ptsViewport.width;
    const pageHeightPts = ptsViewport.height;
    const newPage = outDoc.addPage([pageWidthPts, pageHeightPts]);
    newPage.drawImage(embedded, { x: 0, y: 0, width: pageWidthPts, height: pageHeightPts });

    // Free canvas memory between pages.
    canvas.width = 0; canvas.height = 0;

    onProgress?.(i / total);
    // Yield to the event loop so the modal can repaint progress.
    await new Promise((r) => setTimeout(r, 0));
  }

  const out = await outDoc.save({ useObjectStreams: true });
  return new Blob([out as BlobPart], { type: "application/pdf" });
}

/** Format byte count as KB / MB / GB for UI display. */
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(2)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
