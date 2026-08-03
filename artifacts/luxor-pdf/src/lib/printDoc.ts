/**
 * Print a PDF blob via a hidden print-only layer in the main document.
 *
 * Why not an iframe with the PDF blob? Some environments (embedded
 * previews, strict browsers) block `iframe.contentWindow.print()` on a
 * PDF frame entirely. Rendering every page to an image and calling
 * `window.print()` on the main window works everywhere — it's the same
 * approach Firefox's built-in pdf.js viewer uses. The accompanying
 * `@media print` CSS (index.css) hides the whole app UI while the
 * `.print-root` layer is present, so only the document pages print.
 *
 * The viewer's virtualized DOM can't be printed directly — only pages
 * near the viewport have canvases — hence rendering all pages here.
 */
import * as pdfjsLib from "pdfjs-dist";
import { PDF_WASM_URL } from "@/lib/pdfWasm";

const PRINT_DPI = 200; // Crisp text without exploding memory on big docs.
const MAX_EDGE_PX = 4096; // Cap per-page canvas edge for very large pages.

export async function printBlobViaDom(blob: Blob): Promise<void> {
  // Remove any leftover layer from a previous print.
  document.querySelectorAll(".print-root").forEach((n) => n.remove());

  const bytes = await blob.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: bytes, wasmUrl: PDF_WASM_URL }).promise;

  const root = document.createElement("div");
  root.className = "print-root";
  root.setAttribute("aria-hidden", "true");

  const urls: string[] = [];
  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      let scale = PRINT_DPI / 72;
      const base = page.getViewport({ scale: 1 });
      const maxEdge = Math.max(base.width, base.height) * scale;
      if (maxEdge > MAX_EDGE_PX) scale *= MAX_EDGE_PX / maxEdge;
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas 2D context unavailable");
      await page.render({ canvasContext: ctx, viewport, annotationMode: 2 } as never).promise;
      const pageBlob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.92),
      );
      if (!pageBlob) throw new Error("Page image encoding failed");
      const url = URL.createObjectURL(pageBlob);
      urls.push(url);
      const img = document.createElement("img");
      img.src = url;
      // Landscape pages get rotated by the browser's fit logic; just let
      // each image fill the printable width.
      root.appendChild(img);
      // Free canvas memory promptly on big documents.
      canvas.width = canvas.height = 0;
    }

    // Wait until every image is decoded — printing before that yields
    // blank pages.
    await Promise.all(
      Array.from(root.querySelectorAll("img")).map((img) =>
        img.decode().catch(() => undefined),
      ),
    );

    document.body.appendChild(root);
    document.body.classList.add("printing-doc");
    try {
      window.print();
    } finally {
      // In Chromium window.print() blocks until the dialog closes; in
      // others afterprint fires. Either way, clean up on the next tick
      // plus a generous fallback timer.
      const cleanup = () => {
        document.body.classList.remove("printing-doc");
        root.remove();
        urls.forEach((u) => URL.revokeObjectURL(u));
        window.removeEventListener("afterprint", cleanup);
      };
      window.addEventListener("afterprint", cleanup);
      setTimeout(cleanup, 120_000);
    }
  } catch (err) {
    document.body.classList.remove("printing-doc");
    root.remove();
    urls.forEach((u) => URL.revokeObjectURL(u));
    throw err;
  } finally {
    void doc.destroy().catch(() => undefined);
  }
}
