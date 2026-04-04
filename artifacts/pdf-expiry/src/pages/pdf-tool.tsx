import { useState, useRef, useCallback } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PDFDocument } from "pdf-lib";
import { formatBytes } from "@/lib/utils";
import { Merge, Scissors, FileOutput, Upload, X, GripVertical, Download, Loader2, Plus, Trash2 } from "lucide-react";

function FileDropZone({
  onFiles,
  multiple = false,
  label,
  hint,
  accept = ".pdf",
}: {
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  label: string;
  hint?: string;
  accept?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = Array.from(e.dataTransfer.files).filter((f) =>
        f.type === "application/pdf" || f.name.endsWith(".pdf")
      );
      if (dropped.length) onFiles(dropped);
    },
    [onFiles]
  );

  return (
    <div
      data-testid="file-drop-zone"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors select-none ${
        dragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-muted/30"
      }`}
    >
      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
      <p className="text-sm font-medium">{label}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      <input
        ref={inputRef}
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

function FileTag({ name, size, onRemove }: { name: string; size: number; onRemove: () => void }) {
  return (
    <div
      data-testid={`file-tag-${name}`}
      className="flex items-center gap-2 bg-muted rounded-md px-3 py-2 group"
    >
      <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className="text-xs text-muted-foreground">{formatBytes(size)}</p>
      </div>
      <button
        onClick={onRemove}
        data-testid={`remove-file-${name}`}
        className="text-muted-foreground hover:text-destructive transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
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

async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// ─── Merge ────────────────────────────────────────────────────────────────────

function MergeTab() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addFiles(incoming: File[]) {
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      const unique = incoming.filter((f) => !names.has(f.name));
      return [...prev, ...unique];
    });
    setError(null);
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function mergePdfs() {
    if (files.length < 2) {
      setError("Please add at least 2 PDF files to merge.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const merged = await PDFDocument.create();
      for (const file of files) {
        const buf = await readFileAsArrayBuffer(file);
        const doc = await PDFDocument.load(buf);
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
      }
      const bytes = await merged.save();
      downloadBlob(new Blob([bytes], { type: "application/pdf" }), "merged.pdf");
    } catch (e) {
      setError("Failed to merge PDFs. Make sure all files are valid, non-encrypted PDFs.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <FileDropZone
        onFiles={addFiles}
        multiple
        label="Click or drag PDFs here"
        hint="Add multiple PDFs — they will be merged in the order shown below"
      />

      {files.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            Files to merge ({files.length})
          </Label>
          <div className="space-y-2" data-testid="merge-file-list">
            {files.map((f, i) => (
              <FileTag key={`${f.name}-${i}`} name={f.name} size={f.size} onRemove={() => removeFile(i)} />
            ))}
          </div>
        </div>
      )}

      {error && (
        <p data-testid="merge-error" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        data-testid="button-merge"
        onClick={mergePdfs}
        disabled={files.length < 2 || loading}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Merging...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Merge & Download
          </>
        )}
      </Button>
    </div>
  );
}

// ─── Split ────────────────────────────────────────────────────────────────────

interface PageRange {
  id: number;
  from: string;
  to: string;
}

function SplitTab() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [ranges, setRanges] = useState<PageRange[]>([{ id: Date.now(), from: "1", to: "1" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextId = useRef(1);

  async function handleFile(files: File[]) {
    const f = files[0];
    setFile(f);
    setError(null);
    try {
      const buf = await readFileAsArrayBuffer(f);
      const doc = await PDFDocument.load(buf);
      const count = doc.getPageCount();
      setPageCount(count);
      setRanges([{ id: nextId.current++, from: "1", to: String(count) }]);
    } catch {
      setError("Could not read PDF. Make sure it is a valid, non-encrypted file.");
      setFile(null);
      setPageCount(null);
    }
  }

  function addRange() {
    setRanges((prev) => [...prev, { id: nextId.current++, from: "1", to: String(pageCount ?? 1) }]);
  }

  function removeRange(id: number) {
    setRanges((prev) => prev.filter((r) => r.id !== id));
  }

  function updateRange(id: number, field: "from" | "to", value: string) {
    setRanges((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  async function splitPdf() {
    if (!file || pageCount === null) return;
    setLoading(true);
    setError(null);
    try {
      const buf = await readFileAsArrayBuffer(file);
      const srcDoc = await PDFDocument.load(buf);

      for (let i = 0; i < ranges.length; i++) {
        const from = Math.max(1, parseInt(ranges[i].from, 10) || 1);
        const to = Math.min(pageCount, parseInt(ranges[i].to, 10) || pageCount);

        if (from > to) {
          setError(`Range ${i + 1}: "From" page must be less than or equal to "To" page.`);
          setLoading(false);
          return;
        }

        const newDoc = await PDFDocument.create();
        const indices = Array.from({ length: to - from + 1 }, (_, k) => from - 1 + k);
        const pages = await newDoc.copyPages(srcDoc, indices);
        pages.forEach((p) => newDoc.addPage(p));
        const bytes = await newDoc.save();
        const baseName = file.name.replace(/\.pdf$/i, "");
        downloadBlob(
          new Blob([bytes], { type: "application/pdf" }),
          `${baseName}_pages${from}-${to}.pdf`
        );
        await new Promise((r) => setTimeout(r, 300));
      }
    } catch {
      setError("Failed to split PDF. Make sure it is a valid, non-encrypted file.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {!file ? (
        <FileDropZone
          onFiles={handleFile}
          label="Click or drag a PDF here"
          hint="Choose the PDF you want to split into parts"
        />
      ) : (
        <div className="flex items-center justify-between bg-muted rounded-md px-3 py-2">
          <div>
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(file.size)} &middot; {pageCount} page{pageCount !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            data-testid="button-clear-split-file"
            onClick={() => { setFile(null); setPageCount(null); setError(null); }}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {file && pageCount !== null && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Page Ranges
            </Label>
            <Button variant="ghost" size="sm" onClick={addRange} data-testid="button-add-range">
              <Plus className="w-3 h-3 mr-1" />
              Add range
            </Button>
          </div>

          <div className="space-y-2" data-testid="range-list">
            {ranges.map((r, i) => (
              <div key={r.id} className="flex items-center gap-2 bg-muted/50 rounded-md p-2">
                <span className="text-xs text-muted-foreground w-16 shrink-0">Part {i + 1}</span>
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex-1">
                    <Label className="text-xs mb-1 block">From page</Label>
                    <Input
                      data-testid={`input-range-from-${i}`}
                      type="number"
                      min={1}
                      max={pageCount}
                      value={r.from}
                      onChange={(e) => updateRange(r.id, "from", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <span className="text-muted-foreground mt-4">–</span>
                  <div className="flex-1">
                    <Label className="text-xs mb-1 block">To page</Label>
                    <Input
                      data-testid={`input-range-to-${i}`}
                      type="number"
                      min={1}
                      max={pageCount}
                      value={r.to}
                      onChange={(e) => updateRange(r.id, "to", e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                {ranges.length > 1 && (
                  <button
                    onClick={() => removeRange(r.id)}
                    data-testid={`button-remove-range-${i}`}
                    className="text-muted-foreground hover:text-destructive transition-colors mt-4"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Each range downloads as a separate PDF file.
          </p>
        </div>
      )}

      {error && (
        <p data-testid="split-error" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        data-testid="button-split"
        onClick={splitPdf}
        disabled={!file || loading}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Splitting...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Split & Download
          </>
        )}
      </Button>
    </div>
  );
}

// ─── Extract ──────────────────────────────────────────────────────────────────

function ExtractTab() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [pageInput, setPageInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(files: File[]) {
    const f = files[0];
    setFile(f);
    setError(null);
    setSelectedPages(new Set());
    setPageInput("");
    try {
      const buf = await readFileAsArrayBuffer(f);
      const doc = await PDFDocument.load(buf);
      setPageCount(doc.getPageCount());
    } catch {
      setError("Could not read PDF. Make sure it is a valid, non-encrypted file.");
      setFile(null);
      setPageCount(null);
    }
  }

  function togglePage(n: number) {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
    setError(null);
  }

  function applyPageInput() {
    if (!pageCount) return;
    const pages = new Set<number>();
    const parts = pageInput.split(",").map((s) => s.trim());
    for (const part of parts) {
      if (part.includes("-")) {
        const [a, b] = part.split("-").map(Number);
        for (let i = Math.max(1, a); i <= Math.min(pageCount, b); i++) pages.add(i);
      } else {
        const n = Number(part);
        if (!isNaN(n) && n >= 1 && n <= pageCount) pages.add(n);
      }
    }
    setSelectedPages(pages);
  }

  function selectAll() {
    if (!pageCount) return;
    setSelectedPages(new Set(Array.from({ length: pageCount }, (_, i) => i + 1)));
  }

  function clearAll() {
    setSelectedPages(new Set());
  }

  async function extractPages() {
    if (!file || selectedPages.size === 0) {
      setError("Select at least one page to extract.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const buf = await readFileAsArrayBuffer(file);
      const srcDoc = await PDFDocument.load(buf);
      const newDoc = await PDFDocument.create();
      const sorted = Array.from(selectedPages).sort((a, b) => a - b);
      const indices = sorted.map((p) => p - 1);
      const pages = await newDoc.copyPages(srcDoc, indices);
      pages.forEach((p) => newDoc.addPage(p));
      const bytes = await newDoc.save();
      const baseName = file.name.replace(/\.pdf$/i, "");
      downloadBlob(
        new Blob([bytes], { type: "application/pdf" }),
        `${baseName}_extracted.pdf`
      );
    } catch {
      setError("Failed to extract pages. Make sure the file is a valid, non-encrypted PDF.");
    } finally {
      setLoading(false);
    }
  }

  const MAX_GRID_PAGES = 50;

  return (
    <div className="space-y-4">
      {!file ? (
        <FileDropZone
          onFiles={handleFile}
          label="Click or drag a PDF here"
          hint="Select which pages to extract into a new PDF"
        />
      ) : (
        <div className="flex items-center justify-between bg-muted rounded-md px-3 py-2">
          <div>
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(file.size)} &middot; {pageCount} page{pageCount !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            data-testid="button-clear-extract-file"
            onClick={() => { setFile(null); setPageCount(null); setSelectedPages(new Set()); setPageInput(""); setError(null); }}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {file && pageCount !== null && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              data-testid="input-page-range"
              placeholder="e.g. 1, 3, 5-8, 12"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              className="h-8 text-sm"
            />
            <Button variant="outline" size="sm" onClick={applyPageInput} data-testid="button-apply-range">
              Apply
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {selectedPages.size} of {pageCount} selected
            </span>
            <button
              onClick={selectAll}
              data-testid="button-select-all"
              className="text-xs text-primary hover:underline"
            >
              Select all
            </button>
            <button
              onClick={clearAll}
              data-testid="button-clear-all"
              className="text-xs text-muted-foreground hover:underline"
            >
              Clear
            </button>
          </div>

          {pageCount <= MAX_GRID_PAGES ? (
            <div
              className="grid gap-1.5"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(40px, 1fr))" }}
              data-testid="page-grid"
            >
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  data-testid={`page-toggle-${n}`}
                  onClick={() => togglePage(n)}
                  className={`h-10 rounded text-sm font-medium transition-all border ${
                    selectedPages.has(n)
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background border-border hover:border-primary/50 hover:bg-muted/50 text-foreground"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Use the range input above to select pages (e.g. "1-10, 15, 20-25").
            </p>
          )}
        </div>
      )}

      {error && (
        <p data-testid="extract-error" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        data-testid="button-extract"
        onClick={extractPages}
        disabled={!file || selectedPages.size === 0 || loading}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Extracting...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Extract {selectedPages.size > 0 ? `${selectedPages.size} page${selectedPages.size !== 1 ? "s" : ""}` : "Pages"} & Download
          </>
        )}
      </Button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PdfToolPage() {
  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">PDF Tool</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Merge, split, and extract pages from PDF files. All processing happens in your browser — nothing is uploaded.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="merge">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="merge" data-testid="tab-merge" className="flex items-center gap-1.5">
                  <Merge className="w-4 h-4" />
                  Merge
                </TabsTrigger>
                <TabsTrigger value="split" data-testid="tab-split" className="flex items-center gap-1.5">
                  <Scissors className="w-4 h-4" />
                  Split
                </TabsTrigger>
                <TabsTrigger value="extract" data-testid="tab-extract" className="flex items-center gap-1.5">
                  <FileOutput className="w-4 h-4" />
                  Extract
                </TabsTrigger>
              </TabsList>

              <TabsContent value="merge">
                <div className="space-y-2 mb-4">
                  <h2 className="font-semibold">Merge PDFs</h2>
                  <p className="text-sm text-muted-foreground">
                    Combine multiple PDF files into a single document. Files are merged in the order listed.
                  </p>
                </div>
                <MergeTab />
              </TabsContent>

              <TabsContent value="split">
                <div className="space-y-2 mb-4">
                  <h2 className="font-semibold">Split PDF</h2>
                  <p className="text-sm text-muted-foreground">
                    Divide a PDF into separate files by defining page ranges. Each range downloads as its own file.
                  </p>
                </div>
                <SplitTab />
              </TabsContent>

              <TabsContent value="extract">
                <div className="space-y-2 mb-4">
                  <h2 className="font-semibold">Extract Pages</h2>
                  <p className="text-sm text-muted-foreground">
                    Pick specific pages from a PDF and save them as a new document.
                  </p>
                </div>
                <ExtractTab />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
