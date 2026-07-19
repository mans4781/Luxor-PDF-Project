/**
 * Print pipeline for the Luxor PDF Reader.
 *
 * Two paths:
 *  - Native: the original PDF file is loaded into a hidden iframe and the
 *    browser's own PDF printing takes over (vector quality, all pages).
 *    Used when every option is at its default.
 *  - Composed: for page ranges, copies, paper size, orientation, custom
 *    scaling, pages-per-sheet, grayscale, or reverse order, the selected
 *    pages are rasterized with pdf.js and laid out into a print document
 *    whose CSS drives the requested layout.
 */

export interface PrintOptions {
  /** Which pages: every page, only the current one, or a custom list. */
  range: "all" | "current" | "custom";
  /** Custom list, e.g. "1-3, 5, 8-10". Only used when range === "custom". */
  customRange: string;
  copies: number;
  paper: "auto" | "a4" | "letter" | "legal" | "a3";
  orientation: "auto" | "portrait" | "landscape";
  /** "fit" scales to the paper, "actual" prints at 100%, number = percent. */
  scale: "fit" | "actual" | number;
  pagesPerSheet: 1 | 2 | 4;
  grayscale: boolean;
  reverseOrder: boolean;
}

export const DEFAULT_PRINT_OPTIONS: PrintOptions = {
  range: "all",
  customRange: "",
  copies: 1,
  paper: "auto",
  orientation: "auto",
  scale: "fit",
  pagesPerSheet: 1,
  grayscale: false,
  reverseOrder: false,
};

/** True when every option is at its default, so native printing is best. */
export function isDefaultPrint(o: PrintOptions): boolean {
  return (
    o.range === "all" && o.copies === 1 && o.paper === "auto" &&
    o.orientation === "auto" && o.scale === "fit" &&
    o.pagesPerSheet === 1 && !o.grayscale && !o.reverseOrder
  );
}

/**
 * Parse a page-range string like "1-3, 5, 8-10" into a sorted unique list
 * of valid 1-based page numbers. Returns null when nothing valid remains.
 */
export function parsePageRange(input: string, totalPages: number): number[] | null {
  const out = new Set<number>();
  for (const part of input.split(",")) {
    const seg = part.trim();
    if (!seg) continue;
    const m = seg.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) {
      let a = parseInt(m[1], 10);
      let b = parseInt(m[2], 10);
      if (a > b) [a, b] = [b, a];
      for (let p = a; p <= b; p++) {
        if (p >= 1 && p <= totalPages) out.add(p);
      }
      continue;
    }
    if (/^\d+$/.test(seg)) {
      const p = parseInt(seg, 10);
      if (p >= 1 && p <= totalPages) out.add(p);
      continue;
    }
    return null; // invalid token
  }
  if (out.size === 0) return null;
  return Array.from(out).sort((x, y) => x - y);
}

const PAPER_CSS: Record<Exclude<PrintOptions["paper"], "auto">, string> = {
  a4: "A4",
  letter: "letter",
  legal: "legal",
  a3: "A3",
};

/**
 * Render the requested pages with pdf.js and print them through a hidden
 * iframe. `pdfDoc` is a pdf.js document proxy.
 */
export async function printComposed(
  pdfDoc: any,
  pageNumbers: number[],
  opts: PrintOptions,
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  // Order + copies.
  let order = [...pageNumbers];
  if (opts.reverseOrder) order.reverse();

  // Render each unique page once at print resolution (~150 DPI).
  const unique = Array.from(new Set(order));
  const images = new Map<number, { url: string; wPt: number; hPt: number }>();
  let done = 0;
  for (const pageNo of unique) {
    const page = await pdfDoc.getPage(pageNo);
    const base = page.getViewport({ scale: 1 });
    const scale = 150 / 72;
    const vp = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(vp.width);
    canvas.height = Math.ceil(vp.height);
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    // Blob URL (not a base64 data URL): one small reference per unique page
    // that is reused across copies, keeping the print HTML tiny.
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob((b) => res(b), "image/jpeg", 0.92),
    );
    if (!blob) throw new Error("Could not render a page for printing.");
    images.set(pageNo, {
      url: URL.createObjectURL(blob),
      wPt: base.width,
      hPt: base.height,
    });
    // Release the canvas buffer before rendering the next page.
    canvas.width = 0;
    canvas.height = 0;
    done++;
    onProgress?.(done, unique.length);
  }

  // Full sequence including copies.
  const sequence: number[] = [];
  for (let c = 0; c < opts.copies; c++) sequence.push(...order);

  // @page CSS.
  const first = images.get(order[0])!;
  const landscapeAuto = first.wPt > first.hPt;
  const isLandscape =
    opts.orientation === "landscape" ||
    (opts.orientation === "auto" && landscapeAuto);
  const sizeCss =
    opts.paper === "auto"
      ? isLandscape ? "landscape" : "portrait"
      : `${PAPER_CSS[opts.paper]} ${isLandscape ? "landscape" : "portrait"}`;

  // Per-image sizing.
  let imgCss: string;
  if (opts.scale === "fit") {
    imgCss = "max-width: 100%; max-height: 100%; width: auto; height: auto;";
  } else if (opts.scale === "actual") {
    imgCss = ""; // width set inline per image in points
  } else {
    imgCss = ""; // percentage set inline per image
  }

  const cellsPerSheet = opts.pagesPerSheet;
  const grid =
    cellsPerSheet === 1
      ? ""
      : cellsPerSheet === 2
        ? "display: grid; grid-template-rows: 1fr 1fr; gap: 8pt;"
        : "display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 8pt;";

  const sheets: string[] = [];
  for (let i = 0; i < sequence.length; i += cellsPerSheet) {
    const cells = sequence.slice(i, i + cellsPerSheet).map((pageNo) => {
      const img = images.get(pageNo)!;
      let style = "";
      if (opts.scale === "actual") {
        style = `width:${img.wPt}pt;`;
      } else if (typeof opts.scale === "number") {
        style = `width:${(img.wPt * opts.scale) / 100}pt;`;
      }
      return `<div class="cell"><img src="${img.url}" style="${style}" /></div>`;
    });
    sheets.push(`<section class="sheet">${cells.join("")}</section>`);
  }

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { size: ${sizeCss}; margin: 10mm; }
  html, body { margin: 0; padding: 0; }
  .sheet {
    page-break-after: always;
    width: 100%; height: 98vh;
    ${grid}
    ${cellsPerSheet === 1 ? "display: flex; align-items: center; justify-content: center;" : ""}
  }
  .sheet:last-child { page-break-after: auto; }
  .cell {
    display: flex; align-items: center; justify-content: center;
    overflow: hidden; min-height: 0; min-width: 0;
  }
  .cell img {
    ${imgCss}
    ${opts.grayscale ? "filter: grayscale(1);" : ""}
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
</style>
</head>
<body>${sheets.join("")}</body>
</html>`;

  const urls = Array.from(images.values()).map((i) => i.url);

  await new Promise<void>((resolve) => {
    // Never let composed print frames stack up between attempts.
    cleanupComposedFrame();

    const frame = document.createElement("iframe");
    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";
    document.body.appendChild(frame);
    const doc = frame.contentDocument!;
    doc.open();
    doc.write(html);
    doc.close();

    activeCleanup = () => {
      frame.remove();
      urls.forEach((u) => URL.revokeObjectURL(u));
    };

    let printed = false;
    const doPrint = () => {
      if (printed) return;
      printed = true;
      try {
        // Clean up as soon as the print dialog closes; fall back to a
        // timer for browsers that never fire afterprint on iframes.
        frame.contentWindow?.addEventListener("afterprint", () =>
          setTimeout(cleanupComposedFrame, 500),
        );
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
      } catch {
        window.print();
      }
      setTimeout(cleanupComposedFrame, 120_000);
      resolve();
    };
    // Wait for images to decode before printing.
    const imgs = Array.from(doc.images);
    if (imgs.length === 0) { setTimeout(doPrint, 50); return; }
    let loaded = 0;
    const onOne = () => { loaded++; if (loaded >= imgs.length) setTimeout(doPrint, 100); };
    imgs.forEach((im) => {
      if (im.complete) onOne();
      else { im.onload = onOne; im.onerror = onOne; }
    });
    setTimeout(doPrint, 4000); // safety fallback
  });
}

/** Cleanup for the single active composed-print iframe (and its blob URLs). */
let activeCleanup: (() => void) | null = null;
function cleanupComposedFrame() {
  if (activeCleanup) {
    const fn = activeCleanup;
    activeCleanup = null;
    fn();
  }
}
