import { chromium } from "playwright";
import { PDFDocument } from "pdf-lib";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const DOMAIN = "4170004a-1faf-4c15-ace7-247f51abd493-00-1ijqhn7q82s34.worf.replit.dev";
const BASE = `https://${DOMAIN}/__mockup/preview/luxor-invoices`;

const INVOICES: { name: string; comp: string }[] = [
  { name: "Bold Branded — India (INR)", comp: "BoldBranded" },
  { name: "Bold Branded — International (USD)", comp: "BoldBrandedUSD" },
];

// A4 portrait, CSS px at 96 dpi.
const A4_W_PX = 794;
const A4_H_PX = 1123;
const MARGIN_PX = 24;
const CAPTURE_WIDTH = 880; // px — natural render width of each invoice

async function main() {
  const outDir = path.resolve("dist");
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: CAPTURE_WIDTH, height: 1200 },
    deviceScaleFactor: 2,
  });

  const merged = await PDFDocument.create();

  for (const inv of INVOICES) {
    const url = `${BASE}/${inv.comp}`;
    console.log(`Rendering ${inv.name} -> ${url}`);
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(1200); // let webfonts settle

    const contentHeight = await page.evaluate(() =>
      Math.ceil(
        Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
          document.body.offsetHeight,
        ),
      ),
    );

    // Resize so min-h-screen backgrounds fill the whole captured area.
    await page.setViewportSize({ width: CAPTURE_WIDTH, height: contentHeight });
    await page.waitForTimeout(300);

    // Scale the invoice so it fits inside one A4 page's printable area.
    const usableW = A4_W_PX - MARGIN_PX * 2;
    const usableH = A4_H_PX - MARGIN_PX * 2;
    const scale = Math.min(usableW / CAPTURE_WIDTH, usableH / contentHeight, 1);

    // Native Chromium A4 PDF — the most universally compatible output.
    const pdfBytes = await page.pdf({
      format: "A4",
      printBackground: true,
      scale,
      pageRanges: "1",
      margin: {
        top: `${MARGIN_PX}px`,
        right: `${MARGIN_PX}px`,
        bottom: `${MARGIN_PX}px`,
        left: `${MARGIN_PX}px`,
      },
    });

    // Merge via plain page copy (no XObject embedding) for max compatibility.
    const srcDoc = await PDFDocument.load(pdfBytes);
    const [copied] = await merged.copyPages(srcDoc, [0]);
    merged.addPage(copied);
  }

  await browser.close();

  merged.setTitle("Luxor PDF — Invoice Templates");
  merged.setAuthor("Luxor PDF Suite");
  merged.setSubject("Sample invoice / license receipt templates");

  const bytes = await merged.save();
  const outPath = path.join(outDir, "luxor-invoices-A4.pdf");
  await writeFile(outPath, bytes);
  console.log(
    `\nSaved combined A4 PDF: ${outPath} (${(bytes.length / 1024).toFixed(0)} KB, ${INVOICES.length} pages)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
