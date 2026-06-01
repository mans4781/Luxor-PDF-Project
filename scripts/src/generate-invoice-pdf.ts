import { chromium } from "playwright";
import { PDFDocument } from "pdf-lib";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const DOMAIN = "4170004a-1faf-4c15-ace7-247f51abd493-00-1ijqhn7q82s34.worf.replit.dev";
const BASE = `https://${DOMAIN}/__mockup/preview/luxor-invoices`;

const INVOICES: { name: string; comp: string }[] = [
  { name: "1 - Minimal", comp: "Minimal" },
  { name: "2 - Bold Branded", comp: "BoldBranded" },
  { name: "3 - Classic Professional", comp: "ClassicProfessional" },
  { name: "4 - Obsidian (Dark Luxury)", comp: "Obsidian" },
  { name: "5 - Aurora (Gradient Glass)", comp: "Aurora" },
  { name: "6 - Editorial (Ivory Luxe)", comp: "Editorial" },
  { name: "7 - Midnight Royal (Fintech)", comp: "MidnightRoyal" },
];

// A4 portrait in PDF points (72 dpi): 595.28 x 841.89
const A4_W = 595.28;
const A4_H = 841.89;
const MARGIN = 18; // points

const CAPTURE_WIDTH = 900; // px

async function main() {
  const outDir = path.resolve("dist");
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: CAPTURE_WIDTH, height: 1200 }, deviceScaleFactor: 2 });

  const merged = await PDFDocument.create();

  for (const inv of INVOICES) {
    const url = `${BASE}/${inv.comp}`;
    console.log(`Rendering ${inv.name} -> ${url}`);
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    // give webfonts a moment
    await page.waitForTimeout(1200);

    const contentHeight = await page.evaluate(() => {
      return Math.ceil(
        Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
          document.body.offsetHeight,
        ),
      );
    });

    // Resize the viewport so min-h-screen backgrounds fill the full captured area.
    await page.setViewportSize({ width: CAPTURE_WIDTH, height: contentHeight });
    await page.waitForTimeout(300);

    const pdfBytes = await page.pdf({
      printBackground: true,
      width: `${CAPTURE_WIDTH}px`,
      height: `${contentHeight}px`,
      pageRanges: "1",
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    // Embed this single-page PDF and scale it to fit one A4 page.
    const srcDoc = await PDFDocument.load(pdfBytes);
    const [embedded] = await merged.embedPdf(srcDoc, [0]);
    const { width: ew, height: eh } = embedded;

    const availW = A4_W - MARGIN * 2;
    const availH = A4_H - MARGIN * 2;
    const scale = Math.min(availW / ew, availH / eh);
    const drawW = ew * scale;
    const drawH = eh * scale;

    const a4Page = merged.addPage([A4_W, A4_H]);
    a4Page.drawPage(embedded, {
      x: (A4_W - drawW) / 2,
      y: A4_H - MARGIN - drawH, // top-align within margin
      width: drawW,
      height: drawH,
    });
  }

  await browser.close();

  const bytes = await merged.save();
  const outPath = path.join(outDir, "luxor-invoices-A4.pdf");
  await writeFile(outPath, bytes);
  console.log(`\nSaved combined A4 PDF: ${outPath} (${(bytes.length / 1024).toFixed(0)} KB, ${INVOICES.length} pages)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
