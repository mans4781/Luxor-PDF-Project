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
import { scheduleAutoRefresh } from "@/lib/auto-refresh";
import { Merge, Scissors, FileOutput, Upload, X, GripVertical, Download, Loader2, Trash2, FilePlus, Shield, ShieldCheck, CloudOff, Zap, FileLock2 } from "lucide-react";
import { AccentProvider, useAccentBtn, useAccentInnerBanner, useAccentDrop } from "@/lib/accent";
import { useGuardedAction } from "@/license/useGuardedAction";
import { useUploadAuthGate } from "@/license/useUploadAuthGate";

type DropColorScheme = "violet" | "indigo" | "purple" | "rose" | "emerald";

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
  rose: {
    drag: "border-rose-400 bg-rose-50 scale-[1.01]",
    idle: "border-rose-200 hover:border-rose-400 hover:bg-rose-50/60 bg-gradient-to-br from-rose-50/50 to-red-50/30",
    icon: "text-white", iconBg: "bg-gradient-to-br from-rose-500 to-red-600",
    label: "text-rose-700", hint: "text-rose-400",
  },
  emerald: {
    drag: "border-emerald-400 bg-emerald-50 scale-[1.01]",
    idle: "border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/60 bg-gradient-to-br from-emerald-50/50 to-teal-50/30",
    icon: "text-white", iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
    label: "text-emerald-700", hint: "text-emerald-400",
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
  const accentDrop = useAccentDrop();
  const c = accentDrop ? { ...accentDrop, icon: "text-white" } : dropColors[colorScheme];
  const upload = useUploadAuthGate({ bypass: true });

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      upload.requireAuth(() => {
        const dropped = Array.from(e.dataTransfer.files).filter((f) =>
          f.type === "application/pdf" || f.name.endsWith(".pdf")
        );
        if (dropped.length) onFiles(dropped);
      });
    },
    [onFiles, upload]
  );

  return (
    <>
    <div
      data-testid="file-drop-zone"
      onClick={() => upload.requireAuth(() => inputRef.current?.click())}
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
          e.target.value = "";
          if (files.length) upload.requireAuth(() => onFiles(files));
        }}
      />
    </div>
    {upload.modal}
    </>
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

export function MergeTab() {
  const accentBtn = useAccentBtn("from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700");
  const guard = useGuardedAction({ bypass: true });
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
      scheduleAutoRefresh();
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
        onClick={() => { void guard("merge", mergePdfs); }}
        disabled={files.length < 2 || loading}
        className={`w-full bg-gradient-to-r ${accentBtn} text-white border-0 shadow-md font-semibold`}
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

export function SplitTab() {
  const accentBtn = useAccentBtn("from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700");
  const guard = useGuardedAction({ bypass: true });
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
        const blob = new Blob([bytes], { type: "application/pdf" });
        const filename = `${baseName}-${i + 1}.pdf`;
        await saveFile(blob, filename);
      }
      setProgress("");
      scheduleAutoRefresh();
    } catch {
      setError("Failed to split PDF. Make sure it is a valid, non-encrypted file.");
      setProgress("");
    } finally {
      setLoading(false);
    }
  }

  const baseName = file?.name.replace(/\.pdf$/i, "") ?? "";

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
        <>
          <p className="text-xs text-muted-foreground">
            Files will be named{" "}
            <span className="font-mono">{baseName}-1.pdf</span>,{" "}
            <span className="font-mono">{baseName}-2.pdf</span>, …
          </p>

        </>
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
        onClick={() => { void guard("split", splitPdf); }}
        disabled={!file || loading}
        className={`w-full bg-gradient-to-r ${accentBtn} text-white border-0 shadow-md font-semibold`}
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

export function ExtractTab() {
  const accentBtn = useAccentBtn("from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700");
  const guard = useGuardedAction({ bypass: true });
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
      scheduleAutoRefresh();
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
        onClick={() => { void guard("extract_pages", extractPages); }}
        disabled={!file || selectedPages.size === 0 || loading}
        className={`w-full bg-gradient-to-r ${accentBtn} text-white border-0 shadow-md font-semibold`}
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

// ─── Delete Pages ─────────────────────────────────────────────────────────────

export function DeleteTab() {
  const accentBtn = useAccentBtn("from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700");
  const guard = useGuardedAction({ bypass: true });
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

  async function deletePages() {
    if (!file || pageCount === null) return;
    if (selectedPages.size === 0) {
      setError("Select at least one page to delete.");
      return;
    }
    if (selectedPages.size >= pageCount) {
      setError("You cannot delete every page. At least one page must remain.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const buf = await readFileAsArrayBuffer(file);
      const srcDoc = await PDFDocument.load(buf);
      const newDoc = await PDFDocument.create();
      const keepIndices = Array.from({ length: pageCount }, (_, i) => i)
        .filter((i) => !selectedPages.has(i + 1));
      const pages = await newDoc.copyPages(srcDoc, keepIndices);
      pages.forEach((p) => newDoc.addPage(p));
      const bytes = await newDoc.save();
      const baseName = file.name.replace(/\.pdf$/i, "");
      await saveFile(
        new Blob([bytes], { type: "application/pdf" }),
        `${baseName}_trimmed.pdf`
      );
      scheduleAutoRefresh();
    } catch {
      setError("Failed to delete pages. Make sure the file is a valid, non-encrypted PDF.");
    } finally {
      setLoading(false);
    }
  }

  const MAX_GRID_PAGES = 50;
  const remaining = pageCount !== null ? pageCount - selectedPages.size : 0;

  return (
    <div className="space-y-4">
      {!file ? (
        <FileDropZone
          onFiles={handleFile}
          label="Click or drag a PDF here"
          hint="Pick which pages to remove — the rest are saved as a new PDF"
          colorScheme="rose"
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
            data-testid="button-clear-delete-file"
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
              data-testid="input-delete-range"
              placeholder="e.g. 1, 3, 5-8, 12"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              className="h-8 text-sm"
            />
            <Button variant="outline" size="sm" onClick={applyPageInput} data-testid="button-apply-delete-range">
              Apply
            </Button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-muted-foreground">
              {selectedPages.size} marked for deletion · {remaining} will remain
            </span>
            <button
              onClick={selectAll}
              data-testid="button-delete-select-all"
              className="text-xs text-rose-600 hover:underline"
            >
              Select all
            </button>
            <button
              onClick={clearAll}
              data-testid="button-delete-clear-all"
              className="text-xs text-muted-foreground hover:underline"
            >
              Clear
            </button>
          </div>

          {pageCount <= MAX_GRID_PAGES ? (
            <div
              className="grid gap-1.5"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(40px, 1fr))" }}
              data-testid="delete-page-grid"
            >
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  data-testid={`delete-page-toggle-${n}`}
                  onClick={() => togglePage(n)}
                  className={`h-10 rounded text-sm font-medium transition-all border ${
                    selectedPages.has(n)
                      ? "bg-rose-600 text-white border-rose-600 shadow-sm line-through"
                      : "bg-background border-border hover:border-rose-400 hover:bg-rose-50/50 text-foreground"
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
        <p data-testid="delete-error" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        data-testid="button-delete-pages"
        onClick={() => { void guard("delete_pages", deletePages); }}
        disabled={!file || selectedPages.size === 0 || loading}
        className={`w-full bg-gradient-to-r ${accentBtn} text-white border-0 shadow-md font-semibold`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Deleting...
          </>
        ) : (
          <>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete {selectedPages.size > 0 ? `${selectedPages.size} page${selectedPages.size !== 1 ? "s" : ""}` : "Pages"} & Download
          </>
        )}
      </Button>
    </div>
  );
}

// ─── Add Pages ────────────────────────────────────────────────────────────────

type AddSource = "pdf" | "blank";
type BlankSize = "A4" | "Letter";
type InsertWhere = "start" | "end" | "after";

const PAGE_SIZES: Record<BlankSize, [number, number]> = {
  // points (1pt = 1/72 inch)
  A4: [595.28, 841.89],
  Letter: [612, 792],
};

export function AddTab() {
  const accentBtn = useAccentBtn("from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700");
  const guard = useGuardedAction({ bypass: true });
  const [hostFile, setHostFile] = useState<File | null>(null);
  const [hostPageCount, setHostPageCount] = useState<number | null>(null);

  const [source, setSource] = useState<AddSource>("pdf");

  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourcePageCount, setSourcePageCount] = useState<number | null>(null);

  const [blankCount, setBlankCount] = useState<number>(1);
  const [blankSize, setBlankSize] = useState<BlankSize>("A4");

  const [insertWhere, setInsertWhere] = useState<InsertWhere>("end");
  const [afterPage, setAfterPage] = useState<number>(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleHostFile(files: File[]) {
    const f = files[0];
    setHostFile(f);
    setError(null);
    try {
      const buf = await readFileAsArrayBuffer(f);
      const doc = await PDFDocument.load(buf);
      const count = doc.getPageCount();
      setHostPageCount(count);
      setAfterPage(count);
    } catch {
      setError("Could not read PDF. Make sure it is a valid, non-encrypted file.");
      setHostFile(null);
      setHostPageCount(null);
    }
  }

  async function handleSourceFile(files: File[]) {
    const f = files[0];
    setSourceFile(f);
    setError(null);
    try {
      const buf = await readFileAsArrayBuffer(f);
      const doc = await PDFDocument.load(buf);
      setSourcePageCount(doc.getPageCount());
    } catch {
      setError("Could not read source PDF. Make sure it is a valid, non-encrypted file.");
      setSourceFile(null);
      setSourcePageCount(null);
    }
  }

  async function addPages() {
    if (!hostFile || hostPageCount === null) {
      setError("Please choose a PDF to add pages into.");
      return;
    }

    if (source === "pdf" && !sourceFile) {
      setError("Please choose a source PDF whose pages will be inserted.");
      return;
    }
    if (source === "blank" && (!blankCount || blankCount < 1)) {
      setError("Enter how many blank pages to add (1 or more).");
      return;
    }

    let insertIndex: number;
    if (insertWhere === "start") insertIndex = 0;
    else if (insertWhere === "end") insertIndex = hostPageCount;
    else {
      if (afterPage < 1 || afterPage > hostPageCount) {
        setError(`"After page" must be between 1 and ${hostPageCount}.`);
        return;
      }
      insertIndex = afterPage; // insert AFTER page N → at index N
    }

    setLoading(true);
    setError(null);
    try {
      const hostBuf = await readFileAsArrayBuffer(hostFile);
      const hostDoc = await PDFDocument.load(hostBuf);

      if (source === "pdf" && sourceFile) {
        const srcBuf = await readFileAsArrayBuffer(sourceFile);
        const srcDoc = await PDFDocument.load(srcBuf);
        const copied = await hostDoc.copyPages(srcDoc, srcDoc.getPageIndices());
        copied.forEach((p, i) => hostDoc.insertPage(insertIndex + i, p));
      } else {
        const [w, h] = PAGE_SIZES[blankSize];
        for (let i = 0; i < blankCount; i++) {
          hostDoc.insertPage(insertIndex + i, [w, h]);
        }
      }

      const bytes = await hostDoc.save();
      const baseName = hostFile.name.replace(/\.pdf$/i, "");
      await saveFile(
        new Blob([bytes], { type: "application/pdf" }),
        `${baseName}_with_added_pages.pdf`
      );
      scheduleAutoRefresh();
    } catch {
      setError("Failed to add pages. Make sure both files are valid, non-encrypted PDFs.");
    } finally {
      setLoading(false);
    }
  }

  const insertedCount = source === "pdf" ? (sourcePageCount ?? 0) : blankCount;

  return (
    <div className="space-y-4">
      {/* Host PDF */}
      {!hostFile ? (
        <FileDropZone
          onFiles={handleHostFile}
          label="Click or drag the PDF you want to add pages to"
          hint="This is the document new pages will be inserted into"
          colorScheme="emerald"
        />
      ) : (
        <div className="flex items-center justify-between bg-muted rounded-md px-3 py-2">
          <div>
            <p className="text-sm font-medium">{hostFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(hostFile.size)} &middot; {hostPageCount} page{hostPageCount !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            data-testid="button-clear-add-host"
            onClick={() => { setHostFile(null); setHostPageCount(null); setError(null); }}
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {hostFile && hostPageCount !== null && (
        <div className="space-y-4">
          {/* Source toggle */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              What to add
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                data-testid="add-source-pdf"
                onClick={() => setSource("pdf")}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                  source === "pdf"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-background border-border hover:border-emerald-400 text-foreground"
                }`}
              >
                Pages from a PDF
              </button>
              <button
                type="button"
                data-testid="add-source-blank"
                onClick={() => setSource("blank")}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                  source === "blank"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-background border-border hover:border-emerald-400 text-foreground"
                }`}
              >
                Blank pages
              </button>
            </div>
          </div>

          {/* Source PDF */}
          {source === "pdf" && (
            !sourceFile ? (
              <FileDropZone
                onFiles={handleSourceFile}
                label="Click or drag the source PDF"
                hint="All pages of this PDF will be inserted at the chosen position"
                colorScheme="emerald"
              />
            ) : (
              <div className="flex items-center justify-between bg-muted rounded-md px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{sourceFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(sourceFile.size)} &middot; {sourcePageCount} page{sourcePageCount !== 1 ? "s" : ""} to insert
                  </p>
                </div>
                <button
                  data-testid="button-clear-add-source"
                  onClick={() => { setSourceFile(null); setSourcePageCount(null); setError(null); }}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )
          )}

          {source === "blank" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="blank-count" className="text-xs">How many blank pages?</Label>
                <Input
                  id="blank-count"
                  data-testid="input-blank-count"
                  type="number"
                  min={1}
                  max={500}
                  value={blankCount}
                  onChange={(e) => setBlankCount(Math.max(1, Math.min(500, Number(e.target.value) || 1)))}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="blank-size" className="text-xs">Page size</Label>
                <select
                  id="blank-size"
                  data-testid="select-blank-size"
                  value={blankSize}
                  onChange={(e) => setBlankSize(e.target.value as BlankSize)}
                  className="h-9 w-full text-sm rounded-md border border-input bg-background px-3"
                >
                  <option value="A4">A4 (210 × 297 mm)</option>
                  <option value="Letter">Letter (8.5 × 11 in)</option>
                </select>
              </div>
            </div>
          )}

          {/* Insert position */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Where to insert
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                data-testid="insert-where-start"
                onClick={() => setInsertWhere("start")}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                  insertWhere === "start"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-background border-border hover:border-emerald-400"
                }`}
              >
                At beginning
              </button>
              <button
                type="button"
                data-testid="insert-where-end"
                onClick={() => setInsertWhere("end")}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                  insertWhere === "end"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-background border-border hover:border-emerald-400"
                }`}
              >
                At end
              </button>
              <button
                type="button"
                data-testid="insert-where-after"
                onClick={() => setInsertWhere("after")}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                  insertWhere === "after"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-background border-border hover:border-emerald-400"
                }`}
              >
                After page…
              </button>
            </div>
            {insertWhere === "after" && (
              <div className="flex items-center gap-2 pt-1">
                <Label htmlFor="after-page" className="text-xs whitespace-nowrap">
                  After page
                </Label>
                <Input
                  id="after-page"
                  data-testid="input-after-page"
                  type="number"
                  min={1}
                  max={hostPageCount}
                  value={afterPage}
                  onChange={(e) => setAfterPage(Math.max(1, Math.min(hostPageCount, Number(e.target.value) || 1)))}
                  className="h-8 text-sm w-24"
                />
                <span className="text-xs text-muted-foreground">
                  of {hostPageCount}
                </span>
              </div>
            )}
          </div>

          {insertedCount > 0 && (
            <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-3 py-2">
              Result will have {hostPageCount + insertedCount} page{hostPageCount + insertedCount !== 1 ? "s" : ""}
              {" "}({hostPageCount} original + {insertedCount} new).
            </p>
          )}
        </div>
      )}

      {error && (
        <p data-testid="add-error" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        data-testid="button-add-pages"
        onClick={() => { void guard("insert_pages", addPages); }}
        disabled={
          !hostFile ||
          loading ||
          (source === "pdf" && !sourceFile) ||
          (source === "blank" && blankCount < 1)
        }
        className={`w-full bg-gradient-to-r ${accentBtn} text-white border-0 shadow-md font-semibold`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Inserting...
          </>
        ) : (
          <>
            <FilePlus className="w-4 h-4 mr-2" />
            Insert Pages & Download
          </>
        )}
      </Button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PdfToolContent() {
  return (
    <AccentProvider value="red">
      <PdfToolContentInner />
    </AccentProvider>
  );
}

type EditTab = "merge" | "split" | "extract" | "delete" | "add";

const HERO_ACTIONS: { value: EditTab; label: string; icon: typeof Merge }[] = [
  { value: "merge", label: "Merge PDFs", icon: Merge },
  { value: "split", label: "Split Pages", icon: Scissors },
  { value: "extract", label: "Extract Pages", icon: FileOutput },
  { value: "delete", label: "Delete Pages", icon: Trash2 },
  { value: "add", label: "Insert Pages", icon: FilePlus },
];

const FEATURE_STRIP: { label: string; icon: typeof Merge }[] = [
  { label: "100% Local Processing", icon: ShieldCheck },
  { label: "No Server Upload", icon: CloudOff },
  { label: "Fast Browser-Based Tools", icon: Zap },
  { label: "Private Documents", icon: FileLock2 },
];

function PdfToolContentInner() {
  const ab = useAccentInnerBanner();
  const [tab, setTab] = useState<EditTab>("merge");
  return (
    <div className="max-w-4xl mx-auto space-y-5">

        {/* ── Red hero banner with quick-action buttons ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#E61E3C] via-[#D71B37] to-[#C81934] rounded-2xl p-6 sm:p-7 text-white shadow-lg">
          {/* Shield illustration */}
          <Shield
            className="pointer-events-none absolute -right-6 -bottom-8 w-44 h-44 text-white/10"
            strokeWidth={1.25}
            aria-hidden="true"
          />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner backdrop-blur-sm shrink-0">
              <Shield className="w-7 h-7 text-white" strokeWidth={1.9} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Edit Your PDF</h1>
              <p className="text-white/85 text-sm mt-0.5">
                Merge, split, extract, delete &amp; insert pages — all processed
                in your browser
              </p>
            </div>
          </div>
          <div className="relative flex gap-2 mt-5 flex-wrap">
            {HERO_ACTIONS.map((a) => {
              const Icon = a.icon;
              const isActive = tab === a.value;
              return (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setTab(a.value)}
                  className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-white/70 ${
                    isActive
                      ? "bg-white text-[#C81934] shadow-sm"
                      : "bg-white/15 text-white hover:bg-white/25"
                  }`}
                  data-testid={`hero-action-${a.value}`}
                >
                  <Icon className="w-3 h-3" />
                  {a.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Feature strip ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {FEATURE_STRIP.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.label}
                className="flex items-center gap-2.5 rounded-xl bg-white border border-slate-200 px-3 py-2.5"
              >
                <span className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-[#C81934]" strokeWidth={2} />
                </span>
                <span className="text-[12px] font-semibold text-slate-700 leading-tight">
                  {f.label}
                </span>
              </div>
            );
          })}
        </div>

        <Card className="border-rose-100 shadow-sm">
          <CardContent className="pt-6">
            <Tabs value={tab} onValueChange={(v) => setTab(v as EditTab)}>
              <TabsList className={`grid w-full grid-cols-3 sm:grid-cols-5 gap-1 mb-6 ${ab?.tabsListBg ?? "bg-violet-50 border border-violet-100"} p-1 rounded-xl h-auto`}>
                <TabsTrigger
                  value="merge"
                  data-testid="tab-merge"
                  className={`flex items-center gap-1.5 rounded-lg ${ab?.trigger ?? "data-[state=active]:bg-violet-600"} data-[state=active]:text-white data-[state=active]:shadow-sm transition-all`}
                >
                  <Merge className="w-4 h-4" />
                  Merge
                </TabsTrigger>
                <TabsTrigger
                  value="split"
                  data-testid="tab-split"
                  className={`flex items-center gap-1.5 rounded-lg ${ab?.trigger ?? "data-[state=active]:bg-indigo-600"} data-[state=active]:text-white data-[state=active]:shadow-sm transition-all`}
                >
                  <Scissors className="w-4 h-4" />
                  Split
                </TabsTrigger>
                <TabsTrigger
                  value="extract"
                  data-testid="tab-extract"
                  className={`flex items-center gap-1.5 rounded-lg ${ab?.trigger ?? "data-[state=active]:bg-purple-600"} data-[state=active]:text-white data-[state=active]:shadow-sm transition-all`}
                >
                  <FileOutput className="w-4 h-4" />
                  Extract
                </TabsTrigger>
                <TabsTrigger
                  value="delete"
                  data-testid="tab-delete"
                  className={`flex items-center gap-1.5 rounded-lg ${ab?.trigger ?? "data-[state=active]:bg-rose-600"} data-[state=active]:text-white data-[state=active]:shadow-sm transition-all`}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </TabsTrigger>
                <TabsTrigger
                  value="add"
                  data-testid="tab-add"
                  className={`flex items-center gap-1.5 rounded-lg ${ab?.trigger ?? "data-[state=active]:bg-emerald-600"} data-[state=active]:text-white data-[state=active]:shadow-sm transition-all`}
                >
                  <FilePlus className="w-4 h-4" />
                  Insert
                </TabsTrigger>
              </TabsList>

              <TabsContent value="merge">
                <div className={`${ab?.wrap ?? "bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100"} rounded-xl px-4 py-3 mb-5 flex items-center gap-3`}>
                  <div className={`w-9 h-9 ${ab?.iconWrap ?? "bg-gradient-to-br from-violet-500 to-indigo-600"} rounded-lg flex items-center justify-center shadow-sm shrink-0`}>
                    <Merge className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className={`font-semibold ${ab?.titleClass ?? "text-violet-900"}`}>Merge PDFs</h2>
                    <p className={`text-xs ${ab?.descClass ?? "text-violet-600"}`}>Combine multiple PDFs into one document in the listed order.</p>
                  </div>
                </div>
                <MergeTab />
              </TabsContent>

              <TabsContent value="split">
                <div className={`${ab?.wrap ?? "bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100"} rounded-xl px-4 py-3 mb-5 flex items-center gap-3`}>
                  <div className={`w-9 h-9 ${ab?.iconWrap ?? "bg-gradient-to-br from-indigo-500 to-blue-600"} rounded-lg flex items-center justify-center shadow-sm shrink-0`}>
                    <Scissors className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className={`font-semibold ${ab?.titleClass ?? "text-indigo-900"}`}>Split PDF</h2>
                    <p className={`text-xs ${ab?.descClass ?? "text-indigo-600"}`}>Divide a PDF by page ranges — each range downloads as its own file.</p>
                  </div>
                </div>
                <SplitTab />
              </TabsContent>

              <TabsContent value="extract">
                <div className={`${ab?.wrap ?? "bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100"} rounded-xl px-4 py-3 mb-5 flex items-center gap-3`}>
                  <div className={`w-9 h-9 ${ab?.iconWrap ?? "bg-gradient-to-br from-purple-500 to-violet-600"} rounded-lg flex items-center justify-center shadow-sm shrink-0`}>
                    <FileOutput className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className={`font-semibold ${ab?.titleClass ?? "text-purple-900"}`}>Extract Pages</h2>
                    <p className={`text-xs ${ab?.descClass ?? "text-purple-600"}`}>Pick specific pages from a PDF and save them as a new document.</p>
                  </div>
                </div>
                <ExtractTab />
              </TabsContent>

              <TabsContent value="delete">
                <div className={`${ab?.wrap ?? "bg-gradient-to-r from-rose-50 to-red-50 border border-rose-100"} rounded-xl px-4 py-3 mb-5 flex items-center gap-3`}>
                  <div className={`w-9 h-9 ${ab?.iconWrap ?? "bg-gradient-to-br from-rose-500 to-red-600"} rounded-lg flex items-center justify-center shadow-sm shrink-0`}>
                    <Trash2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className={`font-semibold ${ab?.titleClass ?? "text-rose-900"}`}>Delete Pages</h2>
                    <p className={`text-xs ${ab?.descClass ?? "text-rose-600"}`}>Remove any pages from anywhere in the PDF — the rest are kept in order.</p>
                  </div>
                </div>
                <DeleteTab />
              </TabsContent>

              <TabsContent value="add">
                <div className={`${ab?.wrap ?? "bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100"} rounded-xl px-4 py-3 mb-5 flex items-center gap-3`}>
                  <div className={`w-9 h-9 ${ab?.iconWrap ?? "bg-gradient-to-br from-emerald-500 to-teal-600"} rounded-lg flex items-center justify-center shadow-sm shrink-0`}>
                    <FilePlus className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className={`font-semibold ${ab?.titleClass ?? "text-emerald-900"}`}>Insert Pages</h2>
                    <p className={`text-xs ${ab?.descClass ?? "text-emerald-600"}`}>Insert pages from another PDF — or blank pages — at the start, end, or after any page.</p>
                  </div>
                </div>
                <AddTab />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
  );
}

export default function PdfToolPage() {
  return <Layout><PdfToolContent /></Layout>;
}
