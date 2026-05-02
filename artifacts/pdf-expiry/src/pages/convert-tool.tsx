import { useState, useRef, useCallback } from "react";
import { useSearch } from "wouter";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import { formatBytes } from "@/lib/utils";
import { saveFile } from "@/lib/save-file";
import {
  Upload, X, Download, Loader2, Image as ImageIcon,
  FileText, GripVertical, ArrowLeftRight, FileOutput, ChevronDown,
  FileSpreadsheet,
} from "lucide-react";
import {
  Document, Paragraph, TextRun, Packer,
  HeadingLevel, AlignmentType, LineRuleType,
} from "docx";

// Set the worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).href;

// ─── Shared helpers ────────────────────────────────────────────────────────────

function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as ArrayBuffer);
    r.onerror = reject;
    r.readAsArrayBuffer(file);
  });
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// saveFile is imported from @/lib/save-file — opens a native Save As dialog

type ConvertColorScheme = "emerald" | "orange" | "amber" | "green" | "sky" | "lime";

const convertDropColors: Record<ConvertColorScheme, {
  drag: string; idle: string; icon: string; iconBg: string; label: string; hint: string;
}> = {
  emerald: {
    drag: "border-emerald-400 bg-emerald-50 scale-[1.01]",
    idle: "border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/60 bg-gradient-to-br from-emerald-50/50 to-teal-50/30",
    icon: "text-white", iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
    label: "text-emerald-700", hint: "text-emerald-400",
  },
  orange: {
    drag: "border-orange-400 bg-orange-50 scale-[1.01]",
    idle: "border-orange-200 hover:border-orange-400 hover:bg-orange-50/60 bg-gradient-to-br from-orange-50/50 to-amber-50/30",
    icon: "text-white", iconBg: "bg-gradient-to-br from-orange-500 to-amber-500",
    label: "text-orange-700", hint: "text-orange-400",
  },
  amber: {
    drag: "border-amber-400 bg-amber-50 scale-[1.01]",
    idle: "border-amber-200 hover:border-amber-400 hover:bg-amber-50/60 bg-gradient-to-br from-amber-50/50 to-yellow-50/30",
    icon: "text-white", iconBg: "bg-gradient-to-br from-amber-500 to-yellow-500",
    label: "text-amber-700", hint: "text-amber-400",
  },
  green: {
    drag: "border-green-500 bg-green-50 scale-[1.01]",
    idle: "border-green-200 hover:border-green-500 hover:bg-green-50/60 bg-gradient-to-br from-green-50/50 to-emerald-50/30",
    icon: "text-white", iconBg: "bg-gradient-to-br from-green-600 to-emerald-700",
    label: "text-green-700", hint: "text-green-500",
  },
  sky: {
    drag: "border-sky-500 bg-sky-50 scale-[1.01]",
    idle: "border-sky-200 hover:border-sky-500 hover:bg-sky-50/60 bg-gradient-to-br from-sky-50/50 to-blue-50/30",
    icon: "text-white", iconBg: "bg-gradient-to-br from-sky-600 to-blue-700",
    label: "text-sky-700", hint: "text-sky-500",
  },
  lime: {
    drag: "border-lime-500 bg-lime-50 scale-[1.01]",
    idle: "border-lime-200 hover:border-lime-500 hover:bg-lime-50/60 bg-gradient-to-br from-lime-50/50 to-green-50/30",
    icon: "text-white", iconBg: "bg-gradient-to-br from-lime-600 to-green-700",
    label: "text-lime-700", hint: "text-lime-500",
  },
};

function DropZone({
  onFiles,
  multiple = false,
  accept,
  label,
  hint,
  colorScheme = "emerald",
}: {
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  accept: string;
  label: string;
  hint?: string;
  colorScheme?: ConvertColorScheme;
}) {
  const [dragging, setDragging] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const c = convertDropColors[colorScheme];

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length) onFiles(files);
    },
    [onFiles]
  );

  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all select-none ${
        dragging ? c.drag : c.idle
      }`}
    >
      <div className={`w-14 h-14 ${c.iconBg} rounded-2xl flex items-center justify-center shadow-md mx-auto mb-3 opacity-85`}>
        <Upload className={`w-7 h-7 ${c.icon}`} />
      </div>
      <p className={`text-sm font-semibold ${c.label}`}>{label}</p>
      {hint && <p className={`text-xs mt-1 ${c.hint}`}>{hint}</p>}
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function FileRow({ name, size, onRemove }: { name: string; size: number; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2 bg-muted rounded-md px-3 py-2">
      <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className="text-xs text-muted-foreground">{formatBytes(size)}</p>
      </div>
      <button onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Images → PDF ─────────────────────────────────────────────────────────────

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp"];

function ImagesToPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  function addFiles(incoming: File[]) {
    const valid = incoming.filter((f) => IMAGE_TYPES.includes(f.type));
    if (valid.length < incoming.length) setError("Some files were skipped — only image files are accepted.");
    else setError(null);
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...valid.filter((f) => !names.has(f.name))];
    });
  }

  async function convert() {
    if (!files.length) { setError("Add at least one image."); return; }
    setLoading(true);
    setError(null);
    try {
      const pdf = await PDFDocument.create();
      for (const file of files) {
        const dataUrl = await readAsDataURL(file);
        const img = new globalThis.Image();
        await new Promise<void>((res, rej) => {
          img.onload = () => res();
          img.onerror = rej;
          img.src = dataUrl;
        });
        const { naturalWidth: w, naturalHeight: h } = img;
        const page = pdf.addPage([w, h]);
        let embedded;
        if (file.type === "image/png") {
          embedded = await pdf.embedPng(await readAsArrayBuffer(file));
        } else {
          embedded = await pdf.embedJpg(await readAsArrayBuffer(file));
        }
        page.drawImage(embedded, { x: 0, y: 0, width: w, height: h });
      }
      const bytes = await pdf.save();
      await saveFile(new Blob([bytes], { type: "application/pdf" }), "converted.pdf");
    } catch {
      setError("Conversion failed. Make sure all images are valid and not corrupted.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <DropZone
        onFiles={addFiles}
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
        label="Click or drag images here"
        hint="Supports JPG, PNG, WEBP, GIF, BMP — each image becomes one page"
        colorScheme="emerald"
      />

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Images ({files.length}) — order determines page order
          </p>
          <div className="space-y-2">
            {files.map((f, i) => (
              <FileRow
                key={`${f.name}-${i}`}
                name={f.name}
                size={f.size}
                onRemove={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
              />
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        onClick={convert}
        disabled={!files.length || loading}
        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 shadow-md"
        data-testid="button-images-to-pdf"
      >
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Converting...</> : <><Download className="w-4 h-4 mr-2" />Convert to PDF &amp; Download</>}
      </Button>
    </div>
  );
}

// ─── Word → PDF ───────────────────────────────────────────────────────────────

function WordToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setError(null);
    setDone(false);
    setProgress("");
    if (!/\.docx$/i.test(f.name)) {
      setFile(null);
      setError("Only .docx files are supported. Older .doc files must be saved as .docx first.");
      return;
    }
    setFile(f);
  }

  async function convert() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setDone(false);
    setProgress("Reading Word document…");

    let container: HTMLDivElement | null = null;

    try {
      const buf = await readAsArrayBuffer(file);
      // Vite resolves "mammoth" to its browser bundle via the package's `browser` field
      const mammoth = await import("mammoth");
      const { value: html, messages } = await mammoth.convertToHtml({ arrayBuffer: buf });
      if (!html || html.trim() === "") {
        setError("This Word document is empty or could not be read.");
        setProgress("");
        return;
      }
      if (messages?.length) {
        // Non-fatal: log unsupported features but keep going
        console.warn("mammoth conversion warnings:", messages);
      }

      setProgress("Rendering layout…");

      // Render the HTML in a hidden A4-width container so jsPDF.html()
      // can rasterise it page-by-page with html2canvas.
      container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-99999px";
      container.style.top = "0";
      container.style.width = "794px"; // A4 width @ 96dpi
      container.style.padding = "40px";
      container.style.background = "#ffffff";
      container.style.color = "#000000";
      container.style.fontFamily = "Calibri, Arial, sans-serif";
      container.style.fontSize = "11pt";
      container.style.lineHeight = "1.45";
      container.innerHTML = `
        <style>
          h1 { font-size: 20pt; font-weight: 700; margin: 12pt 0 6pt; }
          h2 { font-size: 16pt; font-weight: 700; margin: 10pt 0 5pt; }
          h3 { font-size: 13pt; font-weight: 700; margin: 8pt 0 4pt; }
          p  { margin: 4pt 0; }
          ul, ol { margin: 4pt 0 4pt 18pt; padding: 0; }
          li { margin: 2pt 0; }
          table { border-collapse: collapse; width: 100%; margin: 6pt 0; }
          td, th { border: 1px solid #999; padding: 4pt 6pt; vertical-align: top; }
          img { max-width: 100%; height: auto; }
          a  { color: #1d4ed8; text-decoration: underline; }
        </style>
        ${html}
      `;
      document.body.appendChild(container);

      setProgress("Building PDF…");

      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });

      await doc.html(container, {
        x: 40,
        y: 40,
        width: 515, // A4 width 595pt − 80pt margins
        windowWidth: 794,
        autoPaging: "text",
        html2canvas: {
          scale: 0.6,
          useCORS: true,
          backgroundColor: "#ffffff",
        },
      });

      const blob = doc.output("blob");
      const baseName = file.name.replace(/\.docx$/i, "");
      await saveFile(blob, `${baseName}.pdf`);
      setDone(true);
      setProgress("");
    } catch (e) {
      console.error(e);
      setError("Conversion failed. The Word document may be corrupted or use unsupported features.");
      setProgress("");
    } finally {
      if (container && container.parentNode) container.parentNode.removeChild(container);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {!file ? (
        <DropZone
          onFiles={handleFile}
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          label="Click or drag a Word document here"
          hint="Supports .docx — formatting, tables and images are preserved as best as possible"
          colorScheme="sky"
        />
      ) : (
        <div className="flex items-center justify-between bg-muted rounded-md px-3 py-2">
          <div>
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
          </div>
          <button
            onClick={() => { setFile(null); setDone(false); setError(null); setProgress(""); }}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {progress && <p className="text-sm text-sky-700 font-medium">{progress}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {done && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <FileOutput className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">PDF saved!</p>
            <p className="text-xs text-emerald-600">Check your downloads folder for the .pdf file.</p>
          </div>
        </div>
      )}

      <Button
        onClick={convert}
        disabled={!file || loading}
        className="w-full bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white border-0 shadow-md"
        data-testid="button-word-to-pdf"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{progress || "Converting…"}</>
          : <><FileOutput className="w-4 h-4 mr-2" />Convert to PDF</>}
      </Button>

      {done && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setFile(null); setDone(false); setError(null); }}
          className="w-full text-muted-foreground"
        >
          Convert another document
        </Button>
      )}
    </div>
  );
}

// ─── Excel → PDF ──────────────────────────────────────────────────────────────

function ExcelToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [sheetCount, setSheetCount] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  async function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setError(null);
    setDone(false);
    setProgress("");
    if (!/\.(xlsx|xls|csv)$/i.test(f.name)) {
      setFile(null);
      setSheetCount(null);
      setError("Please pick a .xlsx, .xls or .csv file.");
      return;
    }
    try {
      const buf = await readAsArrayBuffer(f);
      const wb = XLSX.read(buf, { type: "array" });
      setFile(f);
      setSheetCount(wb.SheetNames.length);
    } catch {
      setFile(null);
      setSheetCount(null);
      setError("Could not read this spreadsheet. Make sure it is a valid .xlsx file.");
    }
  }

  async function convert() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setDone(false);
    setProgress("Reading workbook…");

    try {
      const buf = await readAsArrayBuffer(file);
      const wb = XLSX.read(buf, { type: "array" });

      const { jsPDF } = await import("jspdf");
      const autoTableMod = await import("jspdf-autotable");
      // Guard against ESM/CJS module-shape differences across bundlers
      const autoTable = (autoTableMod.default ?? (autoTableMod as unknown)) as typeof autoTableMod.default;

      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      let firstSheet = true;
      let anyData = false;

      for (let i = 0; i < wb.SheetNames.length; i++) {
        const name = wb.SheetNames[i];
        setProgress(`Rendering sheet ${i + 1} of ${wb.SheetNames.length} (${name})…`);

        const sheet = wb.Sheets[name];
        const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
          blankrows: false,
        });

        if (!rows.length) continue;
        anyData = true;

        if (!firstSheet) doc.addPage();
        firstSheet = false;

        // Sheet name as page title
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(name, 40, 36);

        const head = [rows[0].map((c) => String(c ?? ""))];
        const body = rows.slice(1).map((r) => r.map((c) => String(c ?? "")));

        autoTable(doc, {
          head,
          body,
          startY: 50,
          margin: { left: 40, right: 40 },
          styles: { fontSize: 9, cellPadding: 4, overflow: "linebreak", valign: "top" },
          headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: "bold" },
          alternateRowStyles: { fillColor: [240, 253, 244] },
          theme: "grid",
        });
      }

      if (!anyData) {
        setError("All sheets in this workbook are empty.");
        return;
      }

      const blob = doc.output("blob");
      const baseName = file.name.replace(/\.(xlsx|xls|csv)$/i, "");
      await saveFile(blob, `${baseName}.pdf`);
      setDone(true);
      setProgress("");
    } catch (e) {
      console.error(e);
      setError("Conversion failed. The spreadsheet may be password-protected or corrupted.");
      setProgress("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {!file ? (
        <DropZone
          onFiles={handleFile}
          accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
          label="Click or drag a spreadsheet here"
          hint="Supports .xlsx, .xls and .csv — every sheet becomes a page in the PDF"
          colorScheme="lime"
        />
      ) : (
        <div className="flex items-center justify-between bg-muted rounded-md px-3 py-2">
          <div>
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(file.size)}
              {sheetCount !== null && ` · ${sheetCount} sheet${sheetCount !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={() => { setFile(null); setSheetCount(null); setDone(false); setError(null); setProgress(""); }}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {progress && <p className="text-sm text-lime-700 font-medium">{progress}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {done && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">PDF saved!</p>
            <p className="text-xs text-emerald-600">Each worksheet became its own landscape PDF page.</p>
          </div>
        </div>
      )}

      <Button
        onClick={convert}
        disabled={!file || loading}
        className="w-full bg-gradient-to-r from-lime-600 to-green-700 hover:from-lime-700 hover:to-green-800 text-white border-0 shadow-md"
        data-testid="button-excel-to-pdf"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{progress || "Converting…"}</>
          : <><FileSpreadsheet className="w-4 h-4 mr-2" />Convert to PDF</>}
      </Button>

      {done && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setFile(null); setSheetCount(null); setDone(false); setError(null); }}
          className="w-full text-muted-foreground"
        >
          Convert another spreadsheet
        </Button>
      )}
    </div>
  );
}

// ─── Image format options ──────────────────────────────────────────────────────

const IMAGE_FORMATS = [
  { value: "png",  label: "PNG",  mime: "image/png",  ext: "png"  },
  { value: "jpg",  label: "JPG",  mime: "image/jpeg", ext: "jpg"  },
  { value: "jpeg", label: "JPEG", mime: "image/jpeg", ext: "jpeg" },
  { value: "bmp",  label: "BMP",  mime: "image/bmp",  ext: "bmp"  },
  { value: "tiff", label: "TIFF", mime: "image/png",  ext: "tiff" }, // canvas → PNG bytes, .tiff ext
  { value: "svg",  label: "SVG",  mime: "image/png",  ext: "svg"  }, // canvas → PNG embedded in SVG
] as const;

type ImageFormatValue = typeof IMAGE_FORMATS[number]["value"];

// ─── PDF → Images ─────────────────────────────────────────────────────────────

function PdfToImages() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [scale, setScale] = useState<number>(2);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [showFormatDialog, setShowFormatDialog] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ImageFormatValue>("png");

  async function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setError(null);
    try {
      const buf = await readAsArrayBuffer(f);
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      setFile(f);
      setPageCount(pdf.numPages);
    } catch {
      setError("Could not read PDF. Make sure it is a valid, non-encrypted file.");
    }
  }

  async function convert(format: ImageFormatValue) {
    if (!file) return;
    setShowFormatDialog(false);
    setLoading(true);
    setError(null);
    setProgress("");

    const fmt = IMAGE_FORMATS.find(f => f.value === format)!;

    try {
      const buf = await readAsArrayBuffer(file);
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      const total = pdf.numPages;
      const zip = new JSZip();
      const baseName = file.name.replace(/\.pdf$/i, "");

      for (let i = 1; i <= total; i++) {
        setProgress(`Rendering page ${i} of ${total}…`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport }).promise;

        let fileBytes: ArrayBuffer;
        const pageSlug = `${baseName}_page${String(i).padStart(3, "0")}`;

        if (format === "svg") {
          // Embed rasterized PNG inside an SVG wrapper
          const dataUrl = canvas.toDataURL("image/png");
          const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">`
            + `<image href="${dataUrl}" width="${canvas.width}" height="${canvas.height}"/></svg>`;
          fileBytes = new TextEncoder().encode(svgStr).buffer;
          zip.file(`${pageSlug}.svg`, fileBytes);
        } else {
          const blob = await new Promise<Blob>((res, rej) =>
            canvas.toBlob((b) => b ? res(b) : rej(new Error("toBlob failed")), fmt.mime, fmt.mime === "image/jpeg" ? 0.92 : undefined)
          );
          fileBytes = await blob.arrayBuffer();
          zip.file(`${pageSlug}.${fmt.ext}`, fileBytes);
        }
      }

      setProgress("Packing ZIP…");
      const zipBlob = await zip.generateAsync({ type: "blob" });
      await saveFile(zipBlob, `${baseName}_images.zip`);
      setProgress("");
    } catch {
      setError("Conversion failed. Make sure the PDF is valid and non-encrypted.");
      setProgress("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {!file ? (
        <DropZone onFiles={handleFile} accept=".pdf" label="Click or drag a PDF here" hint="Each page will be exported as an image in your chosen format" colorScheme="orange" />
      ) : (
        <div className="flex items-center justify-between bg-muted rounded-md px-3 py-2">
          <div>
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(file.size)} · {pageCount} page{pageCount !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={() => { setFile(null); setPageCount(null); setError(null); setProgress(""); }} className="text-muted-foreground hover:text-destructive transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {file && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Output quality</p>
          <div className="flex gap-2">
            {[
              { label: "Standard (72 dpi)", value: 1 },
              { label: "High (144 dpi)", value: 2 },
              { label: "Ultra (216 dpi)", value: 3 },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setScale(opt.value)}
                className={`flex-1 text-xs py-2 px-3 rounded-lg border transition-all font-medium ${
                  scale === opt.value
                    ? "border-orange-500 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm"
                    : "border-border hover:border-orange-300 hover:bg-orange-50 text-muted-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Pages are packed into a ZIP archive.</p>
        </div>
      )}

      {progress && <p className="text-sm text-orange-600 font-medium">{progress}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Format picker modal */}
      {showFormatDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowFormatDialog(false)} />
          {/* Panel */}
          <div className="relative w-[90vw] max-w-sm bg-white rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                <ImageIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-base leading-tight">Choose Image Format</p>
                <p className="text-xs text-gray-500 mt-0.5">Select the output format for all pages</p>
              </div>
              <button onClick={() => setShowFormatDialog(false)} className="ml-auto text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dropdown */}
            <div className="relative mb-5">
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value as ImageFormatValue)}
                className="w-full appearance-none border border-orange-200 rounded-xl px-4 py-3 pr-10 text-sm font-medium text-gray-800 bg-orange-50/40 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 cursor-pointer"
              >
                {IMAGE_FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400 pointer-events-none" />
            </div>

            {/* Note for TIFF / SVG */}
            {(selectedFormat === "tiff" || selectedFormat === "svg") && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
                {selectedFormat === "tiff"
                  ? "TIFF uses lossless PNG encoding internally — full quality, standard .tiff extension."
                  : "SVG embeds each rasterized page as a PNG image inside an SVG wrapper."}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowFormatDialog(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => convert(selectedFormat)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-semibold shadow-sm transition-all"
              >
                Convert &amp; Download
              </button>
            </div>
          </div>
        </div>
      )}

      <Button
        onClick={() => setShowFormatDialog(true)}
        disabled={!file || loading}
        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0 shadow-md"
        data-testid="button-pdf-to-images"
      >
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{progress || "Converting…"}</> : <><Download className="w-4 h-4 mr-2" />Convert to Images &amp; Download ZIP</>}
      </Button>
    </div>
  );
}

// ─── PDF → Word ───────────────────────────────────────────────────────────────

function PdfToWord() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  async function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setError(null);
    setDone(false);
    try {
      const buf = await readAsArrayBuffer(f);
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      setFile(f);
      setPageCount(pdf.numPages);
    } catch {
      setError("Could not read PDF. Make sure it is a valid, non-encrypted file.");
    }
  }

  async function convert() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setDone(false);
    setProgress("");

    interface RawItem {
      str: string;
      x: number;
      y: number;
      fontSize: number;
      fontName: string;
      width: number;
    }

    // Convert PDF points → Word twips (1 pt = 20 twips)
    const pt2tw = (pt: number) => Math.round(pt * 20);

    try {
      const buf = await readAsArrayBuffer(file);
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      const total = pdf.numPages;

      // Build one Word section per page so page size & margins match the PDF
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sections: any[] = [];

      for (let pageNum = 1; pageNum <= total; pageNum++) {
        setProgress(`Converting page ${pageNum} of ${total}…`);

        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1 });
        const pageW = viewport.width;
        const pageH = viewport.height;
        const content = await page.getTextContent();

        // ── 1. Extract items with full metadata ─────────────────────────────
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: RawItem[] = (content.items as any[])
          .filter((item) => "str" in item && typeof item.str === "string" && item.str !== "")
          .map((item) => ({
            str: item.str as string,
            x: item.transform[4] as number,
            // pdfjs y is from the bottom; flip so y=0 is top of page
            y: pageH - (item.transform[5] as number),
            fontSize: Math.abs(item.transform[3] as number) || 12,
            fontName: (item.fontName as string) ?? "",
            width: item.width as number,
          }));

        if (items.length === 0) {
          sections.push({ children: [new Paragraph({ children: [new TextRun({ text: "" })] })] });
          continue;
        }

        // Sort top→bottom, left→right
        items.sort((a, b) => (Math.abs(a.y - b.y) < 1 ? a.x - b.x : a.y - b.y));

        // ── 2. Estimate page margins from content bounds ────────────────────
        const leftMargin = Math.max(0, Math.min(...items.map((i) => i.x)));
        const rightEdge = Math.max(...items.map((i) => i.x + i.width));
        const pageCenter = (leftMargin + rightEdge) / 2;

        // ── 3. Group into visual lines (dynamic threshold per item's font size)
        const lines: RawItem[][] = [];
        let curLine: RawItem[] = [];
        let lastY = -Infinity;
        for (const item of items) {
          const threshold = Math.max(1.5, item.fontSize * 0.4);
          if (Math.abs(item.y - lastY) <= threshold) {
            curLine.push(item);
          } else {
            if (curLine.length) lines.push(curLine);
            curLine = [item];
            lastY = item.y;
          }
        }
        if (curLine.length) lines.push(curLine);

        // ── 4. Build one Word Paragraph per visual line ────────────────────
        const pageParas: Paragraph[] = [];

        for (let li = 0; li < lines.length; li++) {
          const line = [...lines[li]].sort((a, b) => a.x - b.x);
          const avgFs = line.reduce((s, i) => s + i.fontSize, 0) / line.length;
          const maxFs = Math.max(...line.map((i) => i.fontSize));

          // Alignment: detect centering by comparing line center to page center
          const lineWidth = line.reduce((s, i) => s + i.width, 0);
          const lineCenter = line[0].x + lineWidth / 2;
          const isCentered = Math.abs(lineCenter - pageCenter) < pageCenter * 0.12;

          // Indentation relative to left margin
          const rawIndent = line[0].x - leftMargin;
          const indent = rawIndent > 6 ? pt2tw(rawIndent) : 0;

          // Vertical gap → space before (in twips)
          let spaceBefore = 0;
          if (li > 0) {
            const prevLineY = lines[li - 1][lines[li - 1].length - 1].y;
            const gap = line[0].y - prevLineY;
            if (gap > avgFs * 1.4) spaceBefore = pt2tw(gap - avgFs);
          }

          // Heading detection by font size
          let heading: (typeof HeadingLevel)[keyof typeof HeadingLevel] | undefined;
          if (maxFs >= 22) heading = HeadingLevel.HEADING_1;
          else if (maxFs >= 17) heading = HeadingLevel.HEADING_2;
          else if (maxFs >= 14) heading = HeadingLevel.HEADING_3;

          // Build runs — each pdfjs item becomes its own run so we can preserve
          // bold/italic from the embedded font name
          const runs: TextRun[] = line.map((item) => {
            const fn = item.fontName.toLowerCase();
            const isBold = /bold|heavy|black|demi|semibold/i.test(fn);
            const isItalic = /italic|oblique/i.test(fn);
            return new TextRun({
              text: item.str,
              bold: isBold,
              italics: isItalic,
              size: Math.round(Math.max(item.fontSize, 7) * 2), // half-points
              font: "Calibri",
            });
          });

          pageParas.push(
            new Paragraph({
              heading,
              children: runs,
              alignment: isCentered ? AlignmentType.CENTER : AlignmentType.LEFT,
              indent: indent > 0 ? { left: indent } : undefined,
              spacing: {
                before: spaceBefore,
                after: 0,
                line: Math.round(avgFs * 20 * 1.15), // line height in twips
                lineRule: LineRuleType.EXACT,
              },
            })
          );
        }

        // ── 5. Section carries page size + margins matching the PDF ─────────
        const margin = pt2tw(Math.max(leftMargin, 28)); // at least ~1 cm
        sections.push({
          properties: {
            page: {
              size: { width: pt2tw(pageW), height: pt2tw(pageH) },
              margin: { top: margin, bottom: margin, left: margin, right: margin },
            },
          },
          children: pageParas,
        });
      }

      const doc = new Document({ sections });
      const blob = await Packer.toBlob(doc);
      const baseName = file.name.replace(/\.pdf$/i, "");
      saveFile(blob, `${baseName}.docx`);
      setDone(true);
      setProgress("");
    } catch (e) {
      console.error(e);
      setError("Conversion failed. The PDF may not contain selectable text.");
      setProgress("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {!file ? (
        <DropZone onFiles={handleFile} accept=".pdf" label="Click or drag a PDF here" hint="Converts PDF text and layout to a Word document (.docx)" colorScheme="amber" />
      ) : (
        <div className="flex items-center justify-between bg-muted rounded-md px-3 py-2">
          <div>
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(file.size)} · {pageCount} page{pageCount !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={() => { setFile(null); setPageCount(null); setDone(false); setError(null); setProgress(""); }} className="text-muted-foreground hover:text-destructive transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {progress && <p className="text-sm text-amber-600 font-medium">{progress}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {done && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <FileOutput className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Word document saved!</p>
            <p className="text-xs text-emerald-600">Check your downloads folder for the .docx file.</p>
          </div>
        </div>
      )}

      <Button
        onClick={convert}
        disabled={!file || loading}
        className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white border-0 shadow-md"
        data-testid="button-pdf-to-word"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{progress || "Converting…"}</>
          : <><FileOutput className="w-4 h-4 mr-2" />Convert to Word (.docx)</>}
      </Button>

      {done && (
        <Button variant="ghost" size="sm" onClick={() => { setFile(null); setPageCount(null); setDone(false); setError(null); }} className="w-full text-muted-foreground">
          Convert another PDF
        </Button>
      )}
    </div>
  );
}

// ─── PDF → Excel ──────────────────────────────────────────────────────────────

function PdfToExcel() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  async function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setError(null);
    setDone(false);
    try {
      const buf = await readAsArrayBuffer(f);
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      setFile(f);
      setPageCount(pdf.numPages);
    } catch {
      setError("Could not read PDF. Make sure it is a valid, non-encrypted file.");
    }
  }

  async function convert() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setDone(false);
    setProgress("");

    interface RawItem {
      str: string;
      x: number;
      y: number;
      width: number;
      fontSize: number;
    }

    try {
      const buf = await readAsArrayBuffer(file);
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      const total = pdf.numPages;

      const wb = XLSX.utils.book_new();
      let anyData = false;

      for (let pageNum = 1; pageNum <= total; pageNum++) {
        setProgress(`Extracting page ${pageNum} of ${total}…`);

        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1 });
        const pageH = viewport.height;
        const content = await page.getTextContent();

        // ── 1. Extract items with positions ────────────────────────────────
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items: RawItem[] = (content.items as any[])
          .filter((it) => "str" in it && typeof it.str === "string" && it.str.trim() !== "")
          .map((it) => ({
            str: (it.str as string).trim(),
            x: it.transform[4] as number,
            y: pageH - (it.transform[5] as number),
            width: (it.width as number) || 0,
            fontSize: Math.abs(it.transform[3] as number) || 10,
          }));

        let rows: string[][];

        if (items.length === 0) {
          rows = [[""]];
        } else {
          // ── 2. Group items into visual rows by Y proximity ────────────────
          items.sort((a, b) => (Math.abs(a.y - b.y) < 1 ? a.x - b.x : a.y - b.y));

          const lines: RawItem[][] = [];
          let cur: RawItem[] = [];
          let lastY = -Infinity;
          let lastFs = 10;
          for (const it of items) {
            const threshold = Math.max(2, Math.max(it.fontSize, lastFs) * 0.5);
            if (Math.abs(it.y - lastY) <= threshold) {
              cur.push(it);
            } else {
              if (cur.length) lines.push(cur);
              cur = [it];
              lastY = it.y;
            }
            lastFs = it.fontSize;
          }
          if (cur.length) lines.push(cur);

          // ── 3. Detect column boundaries from gaps across the whole page ──
          // Collect all left-x positions of items, cluster by proximity.
          const xs = items.map((i) => i.x).sort((a, b) => a - b);
          const xClusters: number[] = [];
          let clusterStart = xs[0];
          let clusterPrev = xs[0];
          const X_CLUSTER_GAP = 8; // pts — anything closer is the same column
          for (let i = 1; i < xs.length; i++) {
            if (xs[i] - clusterPrev > X_CLUSTER_GAP) {
              xClusters.push(clusterStart);
              clusterStart = xs[i];
            }
            clusterPrev = xs[i];
          }
          xClusters.push(clusterStart);

          // Pick the column starts: keep clusters separated by at least 14 pts
          // so we don't over-fragment continuous text into many columns.
          const MIN_COL_WIDTH = 14;
          const cols: number[] = [];
          for (const c of xClusters) {
            if (cols.length === 0 || c - cols[cols.length - 1] >= MIN_COL_WIDTH) {
              cols.push(c);
            }
          }

          // ── 4. For each visual row, drop items into the nearest column ───
          rows = lines.map((line) => {
            const sorted = [...line].sort((a, b) => a.x - b.x);
            const cells: string[] = new Array(cols.length).fill("");
            for (const it of sorted) {
              // Find best column: largest col start that is <= item.x
              let idx = 0;
              for (let c = 0; c < cols.length; c++) {
                if (cols[c] <= it.x + 1) idx = c;
                else break;
              }
              cells[idx] = cells[idx] ? `${cells[idx]} ${it.str}` : it.str;
            }
            return cells;
          });

          // Trim trailing empty columns from each row & globally
          let lastNonEmpty = 0;
          for (const r of rows) {
            for (let c = r.length - 1; c >= 0; c--) {
              if (r[c] !== "") { lastNonEmpty = Math.max(lastNonEmpty, c); break; }
            }
          }
          rows = rows.map((r) => r.slice(0, lastNonEmpty + 1));
        }

        if (rows.some((r) => r.some((c) => c !== ""))) anyData = true;

        const ws = XLSX.utils.aoa_to_sheet(rows);

        // Auto-size columns based on content
        const colCount = rows.reduce((m, r) => Math.max(m, r.length), 0);
        const colWidths = new Array(colCount).fill(0).map((_, c) => {
          let w = 8;
          for (const r of rows) {
            const cell = r[c] ?? "";
            if (cell.length > w) w = Math.min(60, cell.length);
          }
          return { wch: Math.max(8, w + 2) };
        });
        ws["!cols"] = colWidths;

        // Sheet name: max 31 chars, no special chars
        const sheetName = `Page ${pageNum}`.slice(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }

      if (!anyData) {
        setError("No selectable text found. Scanned/image-only PDFs need OCR before they can be converted.");
        setLoading(false);
        setProgress("");
        return;
      }

      setProgress("Building Excel file…");
      const arrayBuf = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
      const blob = new Blob([arrayBuf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const baseName = file.name.replace(/\.pdf$/i, "");
      await saveFile(blob, `${baseName}.xlsx`);
      setDone(true);
      setProgress("");
    } catch (e) {
      console.error(e);
      setError("Conversion failed. The PDF may not contain selectable text.");
      setProgress("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {!file ? (
        <DropZone
          onFiles={handleFile}
          accept=".pdf"
          label="Click or drag a PDF here"
          hint="Extracts tables and text into a multi-sheet Excel workbook (.xlsx)"
          colorScheme="green"
        />
      ) : (
        <div className="flex items-center justify-between bg-muted rounded-md px-3 py-2">
          <div>
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(file.size)} · {pageCount} page{pageCount !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => { setFile(null); setPageCount(null); setDone(false); setError(null); setProgress(""); }}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {progress && <p className="text-sm text-green-700 font-medium">{progress}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {done && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Excel workbook saved!</p>
            <p className="text-xs text-emerald-600">One worksheet per PDF page — open it in Excel, Numbers or Google Sheets.</p>
          </div>
        </div>
      )}

      <Button
        onClick={convert}
        disabled={!file || loading}
        className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white border-0 shadow-md"
        data-testid="button-pdf-to-excel"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{progress || "Converting…"}</>
          : <><FileSpreadsheet className="w-4 h-4 mr-2" />Convert to Excel (.xlsx)</>}
      </Button>

      {done && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setFile(null); setPageCount(null); setDone(false); setError(null); }}
          className="w-full text-muted-foreground"
        >
          Convert another PDF
        </Button>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export type ConvertTabKey =
  | "images-to-pdf"
  | "word-to-pdf"
  | "excel-to-pdf"
  | "pdf-to-images"
  | "pdf-to-word"
  | "pdf-to-excel";

interface TabSpec {
  key: ConvertTabKey;
  testId: string;
  triggerLabel: string;
  triggerIcon: React.ComponentType<{ className?: string }>;
  triggerActiveBg: string; // tailwind class used in data-[state=active]:bg-...
  bannerWrap: string;
  bannerIconWrap: string;
  bannerIcon: React.ComponentType<{ className?: string }>;
  bannerTitle: string;
  bannerTitleClass: string;
  bannerDesc: string;
  bannerDescClass: string;
  chipIcon: React.ComponentType<{ className?: string }>;
  chipLabel: string;
  Component: React.ComponentType;
}

const TAB_SPECS: Record<ConvertTabKey, TabSpec> = {
  "images-to-pdf": {
    key: "images-to-pdf",
    testId: "tab-images-to-pdf",
    triggerLabel: "Images → PDF",
    triggerIcon: ImageIcon,
    triggerActiveBg: "data-[state=active]:bg-emerald-600",
    bannerWrap: "bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100",
    bannerIconWrap: "bg-gradient-to-br from-emerald-500 to-teal-600",
    bannerIcon: ImageIcon,
    bannerTitle: "Images to PDF",
    bannerTitleClass: "text-emerald-900",
    bannerDesc: "Combine JPG, PNG, WEBP, GIF or BMP images into a single PDF document.",
    bannerDescClass: "text-emerald-600",
    chipIcon: ImageIcon,
    chipLabel: "Images → PDF",
    Component: ImagesToPdf,
  },
  "pdf-to-images": {
    key: "pdf-to-images",
    testId: "tab-pdf-to-images",
    triggerLabel: "PDF → Images",
    triggerIcon: FileText,
    triggerActiveBg: "data-[state=active]:bg-orange-500",
    bannerWrap: "bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100",
    bannerIconWrap: "bg-gradient-to-br from-orange-500 to-amber-500",
    bannerIcon: FileText,
    bannerTitle: "PDF to Images",
    bannerTitleClass: "text-orange-900",
    bannerDesc: "Render every page as a high-quality PNG, downloaded as a ZIP file.",
    bannerDescClass: "text-orange-600",
    chipIcon: FileText,
    chipLabel: "PDF → Images",
    Component: PdfToImages,
  },
  "pdf-to-word": {
    key: "pdf-to-word",
    testId: "tab-pdf-to-word",
    triggerLabel: "PDF → Word",
    triggerIcon: FileOutput,
    triggerActiveBg: "data-[state=active]:bg-amber-500",
    bannerWrap: "bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100",
    bannerIconWrap: "bg-gradient-to-br from-amber-500 to-yellow-500",
    bannerIcon: FileOutput,
    bannerTitle: "PDF to Word",
    bannerTitleClass: "text-amber-900",
    bannerDesc: "Convert PDF text and layout into an editable Word document (.docx), downloaded to your device.",
    bannerDescClass: "text-amber-600",
    chipIcon: FileOutput,
    chipLabel: "PDF → Word",
    Component: PdfToWord,
  },
  "pdf-to-excel": {
    key: "pdf-to-excel",
    testId: "tab-pdf-to-excel",
    triggerLabel: "PDF → Excel",
    triggerIcon: FileSpreadsheet,
    triggerActiveBg: "data-[state=active]:bg-green-700",
    bannerWrap: "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100",
    bannerIconWrap: "bg-gradient-to-br from-green-600 to-emerald-700",
    bannerIcon: FileSpreadsheet,
    bannerTitle: "PDF to Excel",
    bannerTitleClass: "text-green-900",
    bannerDesc: "Pull tables and text out of every page into an Excel workbook (.xlsx), one worksheet per page.",
    bannerDescClass: "text-green-700",
    chipIcon: FileSpreadsheet,
    chipLabel: "PDF → Excel",
    Component: PdfToExcel,
  },
  "word-to-pdf": {
    key: "word-to-pdf",
    testId: "tab-word-to-pdf",
    triggerLabel: "Word → PDF",
    triggerIcon: FileOutput,
    triggerActiveBg: "data-[state=active]:bg-sky-700",
    bannerWrap: "bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-100",
    bannerIconWrap: "bg-gradient-to-br from-sky-600 to-blue-700",
    bannerIcon: FileOutput,
    bannerTitle: "Word to PDF",
    bannerTitleClass: "text-sky-900",
    bannerDesc: "Convert a .docx Word document into a paginated PDF, formatting and tables preserved.",
    bannerDescClass: "text-sky-700",
    chipIcon: FileOutput,
    chipLabel: "Word → PDF",
    Component: WordToPdf,
  },
  "excel-to-pdf": {
    key: "excel-to-pdf",
    testId: "tab-excel-to-pdf",
    triggerLabel: "Excel → PDF",
    triggerIcon: FileSpreadsheet,
    triggerActiveBg: "data-[state=active]:bg-lime-700",
    bannerWrap: "bg-gradient-to-r from-lime-50 to-green-50 border border-lime-100",
    bannerIconWrap: "bg-gradient-to-br from-lime-600 to-green-700",
    bannerIcon: FileSpreadsheet,
    bannerTitle: "Excel to PDF",
    bannerTitleClass: "text-lime-900",
    bannerDesc: "Turn every worksheet of a .xlsx, .xls or .csv file into a landscape PDF page with proper table styling.",
    bannerDescClass: "text-lime-700",
    chipIcon: FileSpreadsheet,
    chipLabel: "Excel → PDF",
    Component: ExcelToPdf,
  },
};

const ALL_TABS: ConvertTabKey[] = [
  "images-to-pdf",
  "word-to-pdf",
  "excel-to-pdf",
  "pdf-to-images",
  "pdf-to-word",
  "pdf-to-excel",
];

const TABS_GRID_BY_COUNT: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
};

const ACCENT_GRADIENTS: Record<string, string> = {
  blue: "from-[#1754F4] via-[#154EE2] to-[#1447D0]",
  green: "from-[#32AD71] via-[#2EA068] to-[#2A9460]",
  default: "from-emerald-500 via-teal-500 to-orange-400",
};

export function ConvertToolContent({
  defaultTab,
  tabs = ALL_TABS,
  accent = "default",
}: {
  defaultTab?: string;
  tabs?: ConvertTabKey[];
  accent?: "blue" | "green" | "default";
}) {
  const visibleTabs = tabs.length > 0 ? tabs : ALL_TABS;
  const isVisible = (k: string): k is ConvertTabKey =>
    (visibleTabs as string[]).includes(k);
  const initialTab =
    defaultTab && isVisible(defaultTab) ? defaultTab : visibleTabs[0];
  const gridClass = TABS_GRID_BY_COUNT[visibleTabs.length] ?? "grid-cols-1";

  return (
    <div className="max-w-2xl mx-auto space-y-6">

        {/* ── Vibrant header banner ── */}
        <div className={`bg-gradient-to-br ${ACCENT_GRADIENTS[accent] ?? ACCENT_GRADIENTS.default} rounded-2xl p-6 text-white shadow-lg`}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner backdrop-blur-sm">
              <ArrowLeftRight className="w-7 h-7 text-white" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Convert</h1>
              <p className="text-white/85 text-sm mt-0.5">Transform between PDF and other formats — nothing uploaded</p>
            </div>
          </div>
          <div className="flex gap-2 mt-5 flex-wrap">
            {visibleTabs.map((k) => {
              const spec = TAB_SPECS[k];
              const ChipIcon = spec.chipIcon;
              return (
                <span key={k} className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs px-3 py-1.5 rounded-full font-medium">
                  <ChipIcon className="w-3 h-3" />
                  {spec.chipLabel}
                </span>
              );
            })}
          </div>
        </div>

        <Card className="border-emerald-100 shadow-sm">
          <CardContent className="pt-6">
            <Tabs defaultValue={initialTab}>
              <TabsList className={`grid w-full ${gridClass} mb-6 gap-1 bg-slate-50 border border-slate-200 p-1 rounded-xl h-auto`}>
                {visibleTabs.map((k) => {
                  const spec = TAB_SPECS[k];
                  const TIcon = spec.triggerIcon;
                  return (
                    <TabsTrigger
                      key={k}
                      value={spec.key}
                      data-testid={spec.testId}
                      className={`flex items-center gap-1.5 text-xs rounded-lg ${spec.triggerActiveBg} data-[state=active]:text-white data-[state=active]:shadow-sm transition-all`}
                    >
                      <TIcon className="w-3.5 h-3.5" />
                      {spec.triggerLabel}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {visibleTabs.map((k) => {
                const spec = TAB_SPECS[k];
                const BIcon = spec.bannerIcon;
                const Body = spec.Component;
                return (
                  <TabsContent key={k} value={spec.key}>
                    <div className={`${spec.bannerWrap} rounded-xl px-4 py-3 mb-5 flex items-center gap-3`}>
                      <div className={`w-9 h-9 ${spec.bannerIconWrap} rounded-lg flex items-center justify-center shadow-sm shrink-0`}>
                        <BIcon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h2 className={`font-semibold ${spec.bannerTitleClass}`}>{spec.bannerTitle}</h2>
                        <p className={`text-xs ${spec.bannerDescClass}`}>{spec.bannerDesc}</p>
                      </div>
                    </div>
                    <Body />
                  </TabsContent>
                );
              })}
            </Tabs>
          </CardContent>
        </Card>
      </div>
  );
}

export default function ConvertToolPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const defaultTab = params.get("tab") || "pdf-to-images";
  return <Layout><ConvertToolContent defaultTab={defaultTab} /></Layout>;
}
