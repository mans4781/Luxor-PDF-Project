import { useState, useRef, useCallback } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import JSZip from "jszip";
import { formatBytes } from "@/lib/utils";
import {
  Upload, X, Download, Loader2, Image as ImageIcon,
  FileText, AlignLeft, GripVertical, Copy, Check,
} from "lucide-react";

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

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function DropZone({
  onFiles,
  multiple = false,
  accept,
  label,
  hint,
}: {
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  accept: string;
  label: string;
  hint?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

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
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors select-none ${
        dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"
      }`}
    >
      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
      <p className="text-sm font-medium">{label}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
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
      downloadBlob(new Blob([bytes], { type: "application/pdf" }), "converted.pdf");
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

      <Button onClick={convert} disabled={!files.length || loading} className="w-full" data-testid="button-images-to-pdf">
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Converting...</> : <><Download className="w-4 h-4 mr-2" />Convert to PDF & Download</>}
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
      downloadBlob(zipBlob, `${baseName}_images.zip`);
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
        <DropZone onFiles={handleFile} accept=".pdf" label="Click or drag a PDF here" hint="Each page will be exported as a PNG image" />
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
                className={`flex-1 text-xs py-2 px-3 rounded border transition-colors ${
                  scale === opt.value
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border hover:border-primary/40 text-muted-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Pages are downloaded as a ZIP of PNG files.</p>
        </div>
      )}

      {progress && <p className="text-sm text-muted-foreground">{progress}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={convert} disabled={!file || loading} className="w-full" data-testid="button-pdf-to-images">
        {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{progress || "Converting…"}</> : <><Download className="w-4 h-4 mr-2" />Convert to Images & Download ZIP</>}
      </Button>
    </div>
  );
}

// ─── PDF → Text ───────────────────────────────────────────────────────────────

function PdfToText() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setError(null);
    setText("");
    try {
      const buf = await readAsArrayBuffer(f);
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      setFile(f);
      setPageCount(pdf.numPages);
    } catch {
      setError("Could not read PDF. Make sure it is a valid, non-encrypted file.");
    }
  }

  async function extract() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setText("");
    setProgress("");
    try {
      const buf = await readAsArrayBuffer(file);
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      const total = pdf.numPages;
      const parts: string[] = [];

      for (let i = 1; i <= total; i++) {
        setProgress(`Extracting page ${i} of ${total}…`);
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .filter((item): item is { str: string } => "str" in item)
          .map((item) => item.str)
          .join(" ");
        parts.push(`--- Page ${i} ---\n${pageText}`);
      }

      setText(parts.join("\n\n"));
      setProgress("");
    } catch {
      setError("Text extraction failed. The PDF may not contain selectable text.");
      setProgress("");
    } finally {
      setLoading(false);
    }
  }

  function downloadText() {
    const baseName = file?.name.replace(/\.pdf$/i, "") ?? "extracted";
    downloadBlob(new Blob([text], { type: "text/plain" }), `${baseName}.txt`);
  }

  async function copyText() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {!file ? (
        <DropZone onFiles={handleFile} accept=".pdf" label="Click or drag a PDF here" hint="Extracts all selectable text from the document" />
      ) : (
        <div className="flex items-center justify-between bg-muted rounded-md px-3 py-2">
          <div>
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(file.size)} · {pageCount} page{pageCount !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={() => { setFile(null); setPageCount(null); setText(""); setError(null); setProgress(""); }} className="text-muted-foreground hover:text-destructive transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {progress && <p className="text-sm text-muted-foreground">{progress}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!text && (
        <Button onClick={extract} disabled={!file || loading} className="w-full" data-testid="button-pdf-to-text">
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{progress || "Extracting…"}</> : <><AlignLeft className="w-4 h-4 mr-2" />Extract Text</>}
        </Button>
      )}

      {text && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Extracted text — {text.length.toLocaleString()} characters
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyText} data-testid="button-copy-text">
                {copied ? <><Check className="w-3 h-3 mr-1" />Copied</> : <><Copy className="w-3 h-3 mr-1" />Copy</>}
              </Button>
              <Button variant="outline" size="sm" onClick={downloadText} data-testid="button-download-text">
                <Download className="w-3 h-3 mr-1" />Save .txt
              </Button>
            </div>
          </div>
          <textarea
            readOnly
            value={text}
            className="w-full h-64 text-xs font-mono p-3 rounded-md border bg-muted resize-none focus:outline-none"
            data-testid="text-output"
          />
          <Button variant="ghost" size="sm" onClick={() => { setText(""); }} className="w-full text-muted-foreground">
            Clear &amp; start over
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConvertToolPage() {
  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Convert</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Convert between PDF and other formats. All processing happens in your browser — nothing is uploaded.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="images-to-pdf">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="images-to-pdf" data-testid="tab-images-to-pdf" className="flex items-center gap-1.5 text-xs">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Images → PDF
                </TabsTrigger>
                <TabsTrigger value="pdf-to-images" data-testid="tab-pdf-to-images" className="flex items-center gap-1.5 text-xs">
                  <FileText className="w-3.5 h-3.5" />
                  PDF → Images
                </TabsTrigger>
                <TabsTrigger value="pdf-to-text" data-testid="tab-pdf-to-text" className="flex items-center gap-1.5 text-xs">
                  <AlignLeft className="w-3.5 h-3.5" />
                  PDF → Text
                </TabsTrigger>
              </TabsList>

              <TabsContent value="images-to-pdf">
                <div className="space-y-2 mb-4">
                  <h2 className="font-semibold">Images to PDF</h2>
                  <p className="text-sm text-muted-foreground">
                    Combine JPG, PNG, WEBP, GIF, or BMP images into a single PDF document.
                  </p>
                </div>
                <ImagesToPdf />
              </TabsContent>

              <TabsContent value="pdf-to-images">
                <div className="space-y-2 mb-4">
                  <h2 className="font-semibold">PDF to Images</h2>
                  <p className="text-sm text-muted-foreground">
                    Render every page of a PDF as a high-quality PNG image, downloaded as a ZIP.
                  </p>
                </div>
                <PdfToImages />
              </TabsContent>

              <TabsContent value="pdf-to-text">
                <div className="space-y-2 mb-4">
                  <h2 className="font-semibold">PDF to Text</h2>
                  <p className="text-sm text-muted-foreground">
                    Extract all selectable text from a PDF. Copy to clipboard or save as a .txt file.
                  </p>
                </div>
                <PdfToText />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
