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
 *
 * Each tool carries its own Lucide icon + brand accent colour (hex). The
 * mega menu tints a soft tile from the same colour, giving every item a
 * distinct, premium-looking icon. `color` is used inline (not via Tailwind
 * classes) so the JIT compiler can't purge the dynamic values.
 */
import type { ComponentType } from "react";
import {
  Combine,
  Scissors,
  FileOutput,
  Trash2,
  FilePlus2,
  FileImage,
  Image as ImageIcon,
  FileText,
  FileSpreadsheet,
  Minimize2,
} from "lucide-react";

const SUITE = "/pdf-expiry/tools";

export interface ToolLink {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
}

export interface ToolColumn {
  title: string;
  tools: ToolLink[];
}

export const ONLINE_TOOL_COLUMNS: ToolColumn[] = [
  {
    title: "Organise a PDF",
    tools: [
      { label: "Merge PDF", href: `${SUITE}/merge-pdf`, icon: Combine, color: "#6366F1" },
      { label: "Split PDF", href: `${SUITE}/split-pdf`, icon: Scissors, color: "#8B5CF6" },
      { label: "Extract Pages", href: `${SUITE}/extract-pages`, icon: FileOutput, color: "#7C3AED" },
      { label: "Remove Pages", href: `${SUITE}/remove-pages`, icon: Trash2, color: "#A855F7" },
      { label: "Insert Pages", href: `${SUITE}/insert-pages`, icon: FilePlus2, color: "#4F46E5" },
    ],
  },
  {
    title: "Convert from PDF",
    tools: [
      { label: "PDF to Jpeg", href: `${SUITE}/pdf-to-jpeg`, icon: FileImage, color: "#F97316" },
      { label: "PDF to Jpg", href: `${SUITE}/pdf-to-jpg`, icon: FileImage, color: "#FB923C" },
      { label: "PDF to PNG", href: `${SUITE}/pdf-to-png`, icon: FileImage, color: "#EF4444" },
      { label: "PDF to BMP", href: `${SUITE}/pdf-to-bmp`, icon: FileImage, color: "#F59E0B" },
      { label: "PDF to GIF", href: `${SUITE}/pdf-to-gif`, icon: FileImage, color: "#EC4899" },
      { label: "PDF to WEBP", href: `${SUITE}/pdf-to-webp`, icon: FileImage, color: "#D946EF" },
      { label: "PDF to Word", href: `${SUITE}/pdf-to-word`, icon: FileText, color: "#2563EB" },
      { label: "PDF to Excel", href: `${SUITE}/pdf-to-excel`, icon: FileSpreadsheet, color: "#16A34A" },
    ],
  },
  {
    title: "Convert to PDF",
    tools: [
      { label: "Jpeg to PDF", href: `${SUITE}/jpeg-to-pdf`, icon: ImageIcon, color: "#10B981" },
      { label: "Jpg to PDF", href: `${SUITE}/jpg-to-pdf`, icon: ImageIcon, color: "#14B8A6" },
      { label: "PNG to PDF", href: `${SUITE}/png-to-pdf`, icon: ImageIcon, color: "#06B6D4" },
      { label: "BMP to PDF", href: `${SUITE}/bmp-to-pdf`, icon: ImageIcon, color: "#0EA5E9" },
      { label: "GIF to PDF", href: `${SUITE}/gif-to-pdf`, icon: ImageIcon, color: "#22C55E" },
      { label: "WEBP to PDF", href: `${SUITE}/webp-to-pdf`, icon: ImageIcon, color: "#3B82F6" },
      { label: "Excel to PDF", href: `${SUITE}/excel-to-pdf`, icon: FileSpreadsheet, color: "#16A34A" },
      { label: "Word to PDF", href: `${SUITE}/word-to-pdf`, icon: FileText, color: "#2563EB" },
    ],
  },
  {
    title: "Compress",
    tools: [
      { label: "Compress a PDF to 25 MB", href: `${SUITE}/compress-pdf-to-25mb`, icon: Minimize2, color: "#F43F5E" },
      { label: "Compress a PDF to 20 MB", href: `${SUITE}/compress-pdf-to-20mb`, icon: Minimize2, color: "#FB7185" },
      { label: "Compress a PDF to 15 MB", href: `${SUITE}/compress-pdf-to-15mb`, icon: Minimize2, color: "#F97316" },
      { label: "Compress a PDF to 10 MB", href: `${SUITE}/compress-pdf-to-10mb`, icon: Minimize2, color: "#FB923C" },
      { label: "Compress a PDF to 5 MB", href: `${SUITE}/compress-pdf-to-5mb`, icon: Minimize2, color: "#F59E0B" },
      { label: "Compress a PDF to 1000 kB", href: `${SUITE}/compress-pdf-to-1000kb`, icon: Minimize2, color: "#EAB308" },
      { label: "Compress a PDF to 500 kB", href: `${SUITE}/compress-pdf-to-500kb`, icon: Minimize2, color: "#84CC16" },
      { label: "Compress a PDF to 200 kB", href: `${SUITE}/compress-pdf-to-200kb`, icon: Minimize2, color: "#22C55E" },
      { label: "Compress a PDF to 100 kB", href: `${SUITE}/compress-pdf-to-100kb`, icon: Minimize2, color: "#10B981" },
      { label: "Compress a PDF to 50 kB", href: `${SUITE}/compress-pdf-to-50kb`, icon: Minimize2, color: "#14B8A6" },
      { label: "Compress a PDF to 20 kB", href: `${SUITE}/compress-pdf-to-20kb`, icon: Minimize2, color: "#06B6D4" },
    ],
  },
];
