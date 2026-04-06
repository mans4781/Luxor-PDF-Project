import { useState, useRef, useCallback } from "react";
import { useSearch } from "wouter";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import JSZip from "jszip";
import { formatBytes } from "@/lib/utils";
import { saveFile } from "@/lib/save-file";
import {
  Upload, X, Download, Loader2, Image as ImageIcon,
  FileText, GripVertical, ArrowLeftRight, FileOutput,
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

type ConvertColorScheme = "emerald" | "orange" | "amber";

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

// ─── PDF → Images ─────────────────────────────────────────────────────────────

function PdfToImages() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [scale, setScale] = useState<number>(2);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);


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

  async function convert() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setProgress("");
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
        const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"));
        const arrayBuffer = await blob.arrayBuffer();
        zip.file(`${baseName}_page${String(i).padStart(3, "0")}.png`, arrayBuffer);
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
        <DropZone onFiles={handleFile} accept=".pdf" label="Click or drag a PDF here" hint="Each page will be exported as a PNG image" colorScheme="orange" />
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
          <p className="text-xs text-muted-foreground">Pages are downloaded as a ZIP of PNG files.</p>
        </div>
      )}

      {progress && <p className="text-sm text-orange-600 font-medium">{progress}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        onClick={convert}
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ConvertToolContent({ defaultTab = "images-to-pdf" }: { defaultTab?: string }) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">

        {/* ── Vibrant header banner ── */}
        <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-orange-400 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner backdrop-blur-sm">
              <ArrowLeftRight className="w-7 h-7 text-white" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Convert</h1>
              <p className="text-emerald-100 text-sm mt-0.5">Transform between PDF and other formats — nothing uploaded</p>
            </div>
          </div>
          <div className="flex gap-2 mt-5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs px-3 py-1.5 rounded-full font-medium"><ImageIcon className="w-3 h-3" />Images → PDF</span>
            <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs px-3 py-1.5 rounded-full font-medium"><FileText className="w-3 h-3" />PDF → Images</span>
            <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs px-3 py-1.5 rounded-full font-medium"><FileOutput className="w-3 h-3" />PDF → Word</span>
          </div>
        </div>

        <Card className="border-emerald-100 shadow-sm">
          <CardContent className="pt-6">
            <Tabs defaultValue={defaultTab}>
              <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-50 border border-slate-200 p-1 rounded-xl h-auto">
                <TabsTrigger
                  value="images-to-pdf"
                  data-testid="tab-images-to-pdf"
                  className="flex items-center gap-1.5 text-xs rounded-lg data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Images → PDF
                </TabsTrigger>
                <TabsTrigger
                  value="pdf-to-images"
                  data-testid="tab-pdf-to-images"
                  className="flex items-center gap-1.5 text-xs rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  PDF → Images
                </TabsTrigger>
                <TabsTrigger
                  value="pdf-to-word"
                  data-testid="tab-pdf-to-word"
                  className="flex items-center gap-1.5 text-xs rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                >
                  <FileOutput className="w-3.5 h-3.5" />
                  PDF → Word
                </TabsTrigger>
              </TabsList>

              <TabsContent value="images-to-pdf">
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                    <ImageIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-emerald-900">Images to PDF</h2>
                    <p className="text-xs text-emerald-600">Combine JPG, PNG, WEBP, GIF or BMP images into a single PDF document.</p>
                  </div>
                </div>
                <ImagesToPdf />
              </TabsContent>

              <TabsContent value="pdf-to-images">
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-orange-900">PDF to Images</h2>
                    <p className="text-xs text-orange-600">Render every page as a high-quality PNG, downloaded as a ZIP file.</p>
                  </div>
                </div>
                <PdfToImages />
              </TabsContent>

              <TabsContent value="pdf-to-word">
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                    <FileOutput className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-amber-900">PDF to Word</h2>
                    <p className="text-xs text-amber-600">Convert PDF text and layout into an editable Word document (.docx), downloaded to your device.</p>
                  </div>
                </div>
                <PdfToWord />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
  );
}

export default function ConvertToolPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const defaultTab = params.get("tab") || "images-to-pdf";
  return <Layout><ConvertToolContent defaultTab={defaultTab} /></Layout>;
}
