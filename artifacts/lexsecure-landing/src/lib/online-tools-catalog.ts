/**
 * Catalog of the free browser-based PDF tools surfaced on luxorpdf.com.
 *
 * Every entry links to a dedicated tool page inside the `pdf-expiry`
 * artifact (served at `/pdf-expiry/tools/<slug>`). Those pages are free
 * for everyone — no sign-in and no usage quota. Only "Secure your PDF"
 * (password & expiry) is paid/gated and is intentionally NOT listed here.
 *
 * Cross-artifact links must be plain <a href> (absolute paths), never
 * wouter <Link>, so the shared proxy routes them to the pdf-expiry app.
 */

const SUITE = "/pdf-expiry/tools";

export interface ToolLink {
  label: string;
  href: string;
}

export interface ToolColumn {
  title: string;
  tools: ToolLink[];
}

export const ONLINE_TOOL_COLUMNS: ToolColumn[] = [
  {
    title: "Organise a PDF",
    tools: [
      { label: "Merge PDF", href: `${SUITE}/merge-pdf` },
      { label: "Split PDF", href: `${SUITE}/split-pdf` },
      { label: "Extract Pages", href: `${SUITE}/extract-pages` },
      { label: "Remove Pages", href: `${SUITE}/remove-pages` },
      { label: "Insert Pages", href: `${SUITE}/insert-pages` },
    ],
  },
  {
    title: "Convert from PDF",
    tools: [
      { label: "PDF to Jpeg", href: `${SUITE}/pdf-to-jpeg` },
      { label: "PDF to Jpg", href: `${SUITE}/pdf-to-jpg` },
      { label: "PDF to PNG", href: `${SUITE}/pdf-to-png` },
      { label: "PDF to BMP", href: `${SUITE}/pdf-to-bmp` },
      { label: "PDF to GIF", href: `${SUITE}/pdf-to-gif` },
      { label: "PDF to WEBP", href: `${SUITE}/pdf-to-webp` },
      { label: "PDF to Word", href: `${SUITE}/pdf-to-word` },
      { label: "PDF to Excel", href: `${SUITE}/pdf-to-excel` },
    ],
  },
  {
    title: "Convert to PDF",
    tools: [
      { label: "Jpeg to PDF", href: `${SUITE}/jpeg-to-pdf` },
      { label: "Jpg to PDF", href: `${SUITE}/jpg-to-pdf` },
      { label: "PNG to PDF", href: `${SUITE}/png-to-pdf` },
      { label: "BMP to PDF", href: `${SUITE}/bmp-to-pdf` },
      { label: "GIF to PDF", href: `${SUITE}/gif-to-pdf` },
      { label: "WEBP to PDF", href: `${SUITE}/webp-to-pdf` },
      { label: "Excel to PDF", href: `${SUITE}/excel-to-pdf` },
      { label: "Word to PDF", href: `${SUITE}/word-to-pdf` },
    ],
  },
  {
    title: "Compress",
    tools: [
      { label: "Compress a PDF to 25 MB", href: `${SUITE}/compress-pdf-to-25mb` },
      { label: "Compress a PDF to 20 MB", href: `${SUITE}/compress-pdf-to-20mb` },
      { label: "Compress a PDF to 15 MB", href: `${SUITE}/compress-pdf-to-15mb` },
      { label: "Compress a PDF to 10 MB", href: `${SUITE}/compress-pdf-to-10mb` },
      { label: "Compress a PDF to 5 MB", href: `${SUITE}/compress-pdf-to-5mb` },
      { label: "Compress a PDF to 1000 kB", href: `${SUITE}/compress-pdf-to-1000kb` },
      { label: "Compress a PDF to 500 kB", href: `${SUITE}/compress-pdf-to-500kb` },
      { label: "Compress a PDF to 200 kB", href: `${SUITE}/compress-pdf-to-200kb` },
      { label: "Compress a PDF to 100 kB", href: `${SUITE}/compress-pdf-to-100kb` },
      { label: "Compress a PDF to 50 kB", href: `${SUITE}/compress-pdf-to-50kb` },
      { label: "Compress a PDF to 20 kB", href: `${SUITE}/compress-pdf-to-20kb` },
    ],
  },
];
