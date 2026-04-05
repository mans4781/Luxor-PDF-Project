import { useState, useRef, useCallback } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PDFDocument } from "pdf-lib";
import { formatBytes } from "@/lib/utils";
import { saveFile } from "@/lib/save-file";
import { Merge, Scissors, FileOutput, Upload, X, GripVertical, Download, Loader2, Wrench } from "lucide-react";

type DropColorScheme = "violet" | "indigo" | "purple";

const dropColors: Record<DropColorScheme, {
  drag: string; idle: string; icon: string; label: string; hint: string; iconBg: string;
}> = {
  violet: {
    drag: "border-violet-400 bg-violet-50 scale-[1.01]",
    idle: "border-violet-200 hover:border-violet-400 hover:bg-violet-50/60 bg-gradient-to-br from-violet-50/50 to-indigo-50/30",
    icon: "text-white", iconBg: "bg-gradient-to-br from-violet-500 to-indigo-600",
    label: "text-violet-700", hint: "text-violet-400",
  },
  indigo: {
    drag: "border-indigo-400 bg-indigo-50 scale-[1.01]",
    idle: "border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/60 bg-gradient-to-br from-indigo-50/50 to-blue-50/30",
    icon: "text-white", iconBg: "bg-gradient-to-br from-indigo-500 to-blue-600",
    label: "text-indigo-700", hint: "text-indigo-400",
  },
  purple: {
    drag: "border-purple-400 bg-purple-50 scale-[1.01]",
    idle: "border-purple-200 hover:border-purple-400 hover:bg-purple-50/60 bg-gradient-to-br from-purple-50/50 to-violet-50/30",
    icon: "text-white", iconBg: "bg-gradient-to-br from-purple-500 to-violet-600",
    label: "text-purple-700", hint: "text-purple-400",
  },
};

function FileDropZone({
  onFiles,
  multiple = false,
  label,
  hint,
  accept = ".pdf",
  colorScheme = "violet",
}: {
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  label: string;
  hint?: string;
  accept?: string;
  colorScheme?: DropColorScheme;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const c = dropColors[colorScheme];

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

// saveFile is imported from @/lib/save-file — opens a native Save As dialog

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
      await saveFile(new Blob([bytes], { type: "application/pdf" }), "merged.pdf");
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
        colorScheme="violet"
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
        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 shadow-md font-semibold"
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

function SplitTab() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleFile(files: File[]) {
    const f = files[0];
    setFile(f);
    setError(null);
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

  async function splitPdf() {
    if (!file || pageCount === null) return;
    setLoading(true);
    setError(null);
    const baseName = file.name.replace(/\.pdf$/i, "");
    try {
      const buf = await readFileAsArrayBuffer(file);
      const srcDoc = await PDFDocument.load(buf);

      for (let i = 0; i < pageCount; i++) {
        setProgress(`Saving page ${i + 1} of ${pageCount}…`);
        const newDoc = await PDFDocument.create();
        const [page] = await newDoc.copyPages(srcDoc, [i]);
        newDoc.addPage(page);
        const bytes = await newDoc.save();
        await saveFile(
          new Blob([bytes], { type: "application/pdf" }),
          `${baseName}-${i + 1}.pdf`
        );
      }
      setProgress("");
    } catch {
      setError("Failed to split PDF. Make sure it is a valid, non-encrypted file.");
      setProgress("");
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
          hint="Each page will be saved as a separate PDF"
          colorScheme="indigo"
        />
      ) : (
        <div className="flex items-center justify-between bg-muted rounded-md px-3 py-2">
          <div>
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(file.size)} &middot; {pageCount} page{pageCount !== 1 ? "s" : ""} → {pageCount} files
            </p>
          </div>
          <button
            data-testid="button-clear-split-file"
            onClick={() => { setFile(null); setPageCount(null); setError(null); setProgress(""); }}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {file && pageCount !== null && (
        <p className="text-xs text-muted-foreground">
          Output files will be named <span className="font-mono">{file.name.replace(/\.pdf$/i, "")}-1.pdf</span>,{" "}
          <span className="font-mono">{file.name.replace(/\.pdf$/i, "")}-2.pdf</span>, …
        </p>
      )}

      {progress && (
        <p className="text-sm text-indigo-600">{progress}</p>
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
        className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white border-0 shadow-md font-semibold"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {progress || "Splitting…"}
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Split into Pages
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
      await saveFile(
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
          colorScheme="purple"
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
        className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white border-0 shadow-md font-semibold"
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

        {/* ── Vibrant header banner ── */}
        <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner backdrop-blur-sm">
              <Wrench className="w-7 h-7 text-white" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">PDF Tool</h1>
              <p className="text-violet-200 text-sm mt-0.5">Merge, split &amp; extract pages — all processed in your browser</p>
            </div>
          </div>
          <div className="flex gap-2 mt-5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs px-3 py-1.5 rounded-full font-medium"><Merge className="w-3 h-3" />Merge PDFs</span>
            <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs px-3 py-1.5 rounded-full font-medium"><Scissors className="w-3 h-3" />Split by Range</span>
            <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs px-3 py-1.5 rounded-full font-medium"><FileOutput className="w-3 h-3" />Extract Pages</span>
          </div>
        </div>

        <Card className="border-violet-100 shadow-sm">
          <CardContent className="pt-6">
            <Tabs defaultValue="merge">
              <TabsList className="grid w-full grid-cols-3 mb-6 bg-violet-50 border border-violet-100 p-1 rounded-xl h-auto">
                <TabsTrigger
                  value="merge"
                  data-testid="tab-merge"
                  className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                >
                  <Merge className="w-4 h-4" />
                  Merge
                </TabsTrigger>
                <TabsTrigger
                  value="split"
                  data-testid="tab-split"
                  className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                >
                  <Scissors className="w-4 h-4" />
                  Split
                </TabsTrigger>
                <TabsTrigger
                  value="extract"
                  data-testid="tab-extract"
                  className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                >
                  <FileOutput className="w-4 h-4" />
                  Extract
                </TabsTrigger>
              </TabsList>

              <TabsContent value="merge">
                <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                    <Merge className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-violet-900">Merge PDFs</h2>
                    <p className="text-xs text-violet-600">Combine multiple PDFs into one document in the listed order.</p>
                  </div>
                </div>
                <MergeTab />
              </TabsContent>

              <TabsContent value="split">
                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                    <Scissors className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-indigo-900">Split PDF</h2>
                    <p className="text-xs text-indigo-600">Divide a PDF by page ranges — each range downloads as its own file.</p>
                  </div>
                </div>
                <SplitTab />
              </TabsContent>

              <TabsContent value="extract">
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                    <FileOutput className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-purple-900">Extract Pages</h2>
                    <p className="text-xs text-purple-600">Pick specific pages from a PDF and save them as a new document.</p>
                  </div>
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
