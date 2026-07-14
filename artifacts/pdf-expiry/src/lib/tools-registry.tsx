import { lazy } from "react";
import type { ComponentType, ReactNode } from "react";
import {
  Combine,
  Scissors,
  FileOutput,
  Trash2,
  FilePlus2,
  Image as ImageIcon,
  FileImage,
  FileText,
  FileSpreadsheet,
  Minimize2,
} from "lucide-react";
import { COMPRESS_TARGETS } from "@/lib/compress-targets";

// All tool implementations are lazy-loaded so the registry (used by the
// mega menu and tools index for metadata only) doesn't pull the heavy
// PDF/Office libraries into the initial bundle.
const PdfToImages = lazy(() =>
  import("@/pages/convert-tool").then((m) => ({ default: m.PdfToImages })),
);
const ImagesToPdf = lazy(() =>
  import("@/pages/convert-tool").then((m) => ({ default: m.ImagesToPdf })),
);
const WordToPdf = lazy(() =>
  import("@/pages/convert-tool").then((m) => ({ default: m.WordToPdf })),
);
const ExcelToPdf = lazy(() =>
  import("@/pages/convert-tool").then((m) => ({ default: m.ExcelToPdf })),
);
const PdfToWord = lazy(() =>
  import("@/pages/convert-tool").then((m) => ({ default: m.PdfToWord })),
);
const PdfToExcel = lazy(() =>
  import("@/pages/convert-tool").then((m) => ({ default: m.PdfToExcel })),
);
const MergeTab = lazy(() =>
  import("@/pages/pdf-tool").then((m) => ({ default: m.MergeTab })),
);
const SplitTab = lazy(() =>
  import("@/pages/pdf-tool").then((m) => ({ default: m.SplitTab })),
);
const ExtractTab = lazy(() =>
  import("@/pages/pdf-tool").then((m) => ({ default: m.ExtractTab })),
);
const DeleteTab = lazy(() =>
  import("@/pages/pdf-tool").then((m) => ({ default: m.DeleteTab })),
);
const AddTab = lazy(() =>
  import("@/pages/pdf-tool").then((m) => ({ default: m.AddTab })),
);
const CompressToSize = lazy(() =>
  import("@/pages/compress-pdf").then((m) => ({ default: m.CompressToSize })),
);

export type ToolCategoryKey =
  | "organise"
  | "convert-from-pdf"
  | "convert-to-pdf"
  | "compress";

export type Tool = {
  slug: string;
  category: ToolCategoryKey;
  title: string;
  subtitle: string;
  icon: ComponentType<{ className?: string }>;
  /** Tailwind gradient classes for the hero banner. */
  accent: string;
  render: () => ReactNode;
};

export type ToolCategory = {
  key: ToolCategoryKey;
  label: string;
  tools: Tool[];
};

const ORGANISE_ACCENT = "from-violet-600 to-indigo-600";
const FROM_PDF_ACCENT = "from-orange-500 to-amber-500";
const TO_PDF_ACCENT = "from-emerald-600 to-teal-600";
const COMPRESS_ACCENT = "from-[#F37311] to-[#D4640C]";

const organiseTools: Tool[] = [
  {
    slug: "merge-pdf",
    category: "organise",
    title: "Merge PDF",
    subtitle: "Combine several PDFs into one file, in the order you choose.",
    icon: Combine,
    accent: ORGANISE_ACCENT,
    render: () => <MergeTab />,
  },
  {
    slug: "split-pdf",
    category: "organise",
    title: "Split PDF",
    subtitle: "Break one PDF into separate files by page ranges.",
    icon: Scissors,
    accent: ORGANISE_ACCENT,
    render: () => <SplitTab />,
  },
  {
    slug: "extract-pages",
    category: "organise",
    title: "Extract Pages",
    subtitle: "Pull selected pages out into a brand-new PDF.",
    icon: FileOutput,
    accent: ORGANISE_ACCENT,
    render: () => <ExtractTab />,
  },
  {
    slug: "remove-pages",
    category: "organise",
    title: "Remove Pages",
    subtitle: "Delete the pages you don't need and keep the rest.",
    icon: Trash2,
    accent: ORGANISE_ACCENT,
    render: () => <DeleteTab />,
  },
  {
    slug: "insert-pages",
    category: "organise",
    title: "Insert Pages",
    subtitle: "Add pages from another PDF at any position.",
    icon: FilePlus2,
    accent: ORGANISE_ACCENT,
    render: () => <AddTab />,
  },
];

type FromPdfImageSpec = {
  slug: string;
  title: string;
  subtitle: string;
  format: "jpeg" | "jpg" | "png" | "bmp" | "gif" | "webp";
};

const fromPdfImageSpecs: FromPdfImageSpec[] = [
  { slug: "pdf-to-jpeg", title: "PDF to JPEG", subtitle: "Turn each page into a high-quality JPEG image.", format: "jpeg" },
  { slug: "pdf-to-jpg", title: "PDF to JPG", subtitle: "Turn each page into a high-quality JPG image.", format: "jpg" },
  { slug: "pdf-to-png", title: "PDF to PNG", subtitle: "Turn each page into a crisp, lossless PNG image.", format: "png" },
  { slug: "pdf-to-bmp", title: "PDF to BMP", subtitle: "Turn each page into an uncompressed BMP image.", format: "bmp" },
  { slug: "pdf-to-gif", title: "PDF to GIF", subtitle: "Turn each page into a GIF image.", format: "gif" },
  { slug: "pdf-to-webp", title: "PDF to WEBP", subtitle: "Turn each page into a modern, compact WEBP image.", format: "webp" },
];

const convertFromPdfTools: Tool[] = [
  ...fromPdfImageSpecs.map<Tool>((s) => ({
    slug: s.slug,
    category: "convert-from-pdf",
    title: s.title,
    subtitle: s.subtitle,
    icon: FileImage,
    accent: FROM_PDF_ACCENT,
    render: () => <PdfToImages fixedFormat={s.format} />,
  })),
  {
    slug: "pdf-to-word",
    category: "convert-from-pdf",
    title: "PDF to Word",
    subtitle: "Convert your PDF into an editable Word document.",
    icon: FileText,
    accent: FROM_PDF_ACCENT,
    render: () => <PdfToWord />,
  },
  {
    slug: "pdf-to-excel",
    category: "convert-from-pdf",
    title: "PDF to Excel",
    subtitle: "Pull tables from your PDF into an Excel spreadsheet.",
    icon: FileSpreadsheet,
    accent: FROM_PDF_ACCENT,
    render: () => <PdfToExcel />,
  },
];

type ToPdfImageSpec = {
  slug: string;
  title: string;
  subtitle: string;
  mime: string;
  ext: string;
};

const toPdfImageSpecs: ToPdfImageSpec[] = [
  { slug: "jpeg-to-pdf", title: "JPEG to PDF", subtitle: "Combine JPEG images into a single PDF.", mime: "image/jpeg", ext: ".jpeg,.jpg" },
  { slug: "jpg-to-pdf", title: "JPG to PDF", subtitle: "Combine JPG images into a single PDF.", mime: "image/jpeg", ext: ".jpg,.jpeg" },
  { slug: "png-to-pdf", title: "PNG to PDF", subtitle: "Combine PNG images into a single PDF.", mime: "image/png", ext: ".png" },
  { slug: "bmp-to-pdf", title: "BMP to PDF", subtitle: "Combine BMP images into a single PDF.", mime: "image/bmp", ext: ".bmp" },
  { slug: "gif-to-pdf", title: "GIF to PDF", subtitle: "Combine GIF images into a single PDF.", mime: "image/gif", ext: ".gif" },
  { slug: "webp-to-pdf", title: "WEBP to PDF", subtitle: "Combine WEBP images into a single PDF.", mime: "image/webp", ext: ".webp" },
];

const convertToPdfTools: Tool[] = [
  ...toPdfImageSpecs.map<Tool>((s) => {
    const shortLabel = s.title.split(" ")[0];
    return {
      slug: s.slug,
      category: "convert-to-pdf",
      title: s.title,
      subtitle: s.subtitle,
      icon: ImageIcon,
      accent: TO_PDF_ACCENT,
      render: () => (
        <ImagesToPdf
          acceptTypes={[s.mime]}
          accept={s.ext}
          label={`Click or drag ${shortLabel} images here`}
          hint={`Each ${shortLabel} image becomes one page in the PDF`}
        />
      ),
    };
  }),
  {
    slug: "excel-to-pdf",
    category: "convert-to-pdf",
    title: "Excel to PDF",
    subtitle: "Convert an Excel spreadsheet into a shareable PDF.",
    icon: FileSpreadsheet,
    accent: TO_PDF_ACCENT,
    render: () => <ExcelToPdf />,
  },
  {
    slug: "word-to-pdf",
    category: "convert-to-pdf",
    title: "Word to PDF",
    subtitle: "Convert a Word document into a polished PDF.",
    icon: FileText,
    accent: TO_PDF_ACCENT,
    render: () => <WordToPdf />,
  },
];

function compressSlug(label: string): string {
  return `compress-pdf-to-${label.replace(/\s+/g, "").toLowerCase()}`;
}

const compressTools: Tool[] = COMPRESS_TARGETS.map<Tool>((t) => ({
  slug: compressSlug(t.label),
  category: "compress",
  title: `Compress PDF to ${t.label}`,
  subtitle: `Shrink your PDF down toward ${t.label} while keeping it readable.`,
  icon: Minimize2,
  accent: COMPRESS_ACCENT,
  render: () => <CompressToSize bytes={t.bytes} label={t.label} />,
}));

export const TOOL_CATEGORIES: ToolCategory[] = [
  { key: "organise", label: "Organise", tools: organiseTools },
  { key: "convert-from-pdf", label: "Convert from PDF", tools: convertFromPdfTools },
  { key: "convert-to-pdf", label: "Convert to PDF", tools: convertToPdfTools },
  { key: "compress", label: "Compress", tools: compressTools },
];

export const ALL_TOOLS: Tool[] = TOOL_CATEGORIES.flatMap((c) => c.tools);

export function getToolBySlug(slug: string): Tool | undefined {
  return ALL_TOOLS.find((t) => t.slug === slug);
}
