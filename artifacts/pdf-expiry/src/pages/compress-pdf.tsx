import { useState, useRef, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument } from "@cantoo/pdf-lib";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Minimize2,
  Upload,
  X,
  Download,
  Loader2,
  FileText,
  CheckCircle2,
  Info,
} from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { saveFile } from "@/lib/save-file";
import { AccentProvider, useAccentBtn, useAccentDrop } from "@/lib/accent";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).href;

type MapProtoWithPolyfill = Map<unknown, unknown> & {
  getOrInsertComputed?: (
    key: unknown,
    computer: (key: unknown) => unknown
  ) => unknown;
};
const _mapProto = Map.prototype as MapProtoWithPolyfill;
if (typeof _mapProto.getOrInsertComputed !== "function") {
  _mapProto.getOrInsertComputed = function (
    this: Map<unknown, unknown>,
    key: unknown,
    computer: (key: unknown) => unknown
  ) {
    if (this.has(key)) return this.get(key);
    const value = computer(key);
    this.set(key, value);
    return value;
  };
}

const MB = 1024 * 1024;

type CompressionTarget = {
  label: string;
  bytes: number;
  minOriginalBytes: number;
  accent: string;
};

const TARGETS: CompressionTarget[] = [
  {
    label: "15 MB",
    bytes: 15 * MB,
    minOriginalBytes: 15 * MB,
    accent: "from-[#F37311] to-[#D4640C]",
  },
  {
    label: "10 MB",
    bytes: 10 * MB,
    minOriginalBytes: 10 * MB,
    accent: "from-[#F37311] to-[#D4640C]",
  },
  {
    label: "5 MB",
    bytes: 5 * MB,
    minOriginalBytes: 5 * MB,
    accent: "from-[#F37311] to-[#D4640C]",
  },
  {
    label: "1 MB",
    bytes: 1 * MB,
    minOriginalBytes: 1 * MB,
    accent: "from-[#F37311] to-[#D4640C]",
  },
];

function FileDropZone({
  onFiles,
}: {
  onFiles: (files: File[]) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const accentDrop = useAccentDrop();

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = Array.from(e.dataTransfer.files).filter(
        (f) => f.type === "application/pdf" || f.name.endsWith(".pdf")
      );
      if (dropped.length) onFiles(dropped);
    },
    [onFiles]
  );

  return (
    <div
      data-testid="compress-drop-zone"
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all select-none ${
        dragging
          ? (accentDrop?.drag ?? "border-teal-400 bg-teal-50 scale-[1.01]")
          : (accentDrop?.idle ?? "border-teal-200 hover:border-teal-400 hover:bg-teal-50/60 bg-gradient-to-br from-teal-50/50 to-cyan-50/30")
      }`}
    >
      <div className={`w-14 h-14 ${accentDrop?.iconBg ?? "bg-gradient-to-br from-teal-500 to-cyan-600"} rounded-2xl flex items-center justify-center shadow-md mx-auto mb-3 opacity-85`}>
        <Upload className="w-7 h-7 text-white" />
      </div>
      <p className={`text-sm font-semibold ${accentDrop?.label ?? "text-teal-700"}`}>
        Click or drag a PDF here
      </p>
      <p className={`text-xs mt-1 ${accentDrop?.hint ?? "text-teal-400"}`}>
        Pick a target size below — we'll shrink the file to fit.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
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

async function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

async function canvasToJpegBytes(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Uint8Array> {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  );
  if (!blob) throw new Error("Failed to encode page to JPEG");
  const buf = await blob.arrayBuffer();
  return new Uint8Array(buf);
}

type CompressOptions = {
  scale: number;
  quality: number;
};

async function buildCompressedPdf(
  srcBytes: ArrayBuffer,
  opts: CompressOptions,
  onProgress: (msg: string) => void
): Promise<Uint8Array> {
  const pdf = await pdfjsLib.getDocument({ data: srcBytes.slice(0) }).promise;
  const outDoc = await PDFDocument.create();
  const numPages = pdf.numPages;

  for (let i = 1; i <= numPages; i++) {
    onProgress(`Rendering page ${i} of ${numPages}…`);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: opts.scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas 2D context");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport,
      canvas,
    } as Parameters<typeof page.render>[0]).promise;

    const jpegBytes = await canvasToJpegBytes(canvas, opts.quality);
    const jpgImage = await outDoc.embedJpg(jpegBytes);
    const pageOriginal = page.getViewport({ scale: 1 });
    const newPage = outDoc.addPage([pageOriginal.width, pageOriginal.height]);
    newPage.drawImage(jpgImage, {
      x: 0,
      y: 0,
      width: pageOriginal.width,
      height: pageOriginal.height,
    });

    page.cleanup();
  }

  onProgress("Finalising compressed PDF…");
  return await outDoc.save({ useObjectStreams: true });
}

function pickInitialOptions(
  originalBytes: number,
  targetBytes: number
): CompressOptions {
  const ratio = targetBytes / originalBytes;
  if (ratio >= 0.7) return { scale: 1.5, quality: 0.85 };
  if (ratio >= 0.5) return { scale: 1.4, quality: 0.75 };
  if (ratio >= 0.3) return { scale: 1.2, quality: 0.65 };
  if (ratio >= 0.15) return { scale: 1.0, quality: 0.55 };
  if (ratio >= 0.07) return { scale: 0.85, quality: 0.45 };
  return { scale: 0.7, quality: 0.4 };
}

async function compressToTarget(
  srcBytes: ArrayBuffer,
  targetBytes: number,
  onProgress: (msg: string) => void
): Promise<Uint8Array> {
  const originalSize = srcBytes.byteLength;
  let opts = pickInitialOptions(originalSize, targetBytes);

  let attempt = 0;
  let result = await buildCompressedPdf(srcBytes, opts, onProgress);

  while (result.byteLength > targetBytes && attempt < 3) {
    attempt += 1;
    const overshoot = result.byteLength / targetBytes;
    const qualityCut = Math.min(0.2, 0.08 * overshoot);
    const scaleCut = Math.min(0.2, 0.07 * overshoot);
    opts = {
      quality: Math.max(0.3, opts.quality - qualityCut),
      scale: Math.max(0.6, opts.scale - scaleCut),
    };
    onProgress(
      `Result was ${formatBytes(
        result.byteLength
      )} — retrying at lower quality…`
    );
    result = await buildCompressedPdf(srcBytes, opts, onProgress);
  }

  return result;
}

type CompressResult = {
  bytes: Uint8Array;
  targetLabel: string;
  originalSize: number;
};

export function CompressPdfContent() {
  return (
    <AccentProvider value="orange">
      <CompressPdfContentInner />
    </AccentProvider>
  );
}

function CompressPdfContentInner() {
  const downloadAccent = useAccentBtn("from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CompressResult | null>(null);

  function handleFile(files: File[]) {
    setFile(files[0]);
    setError(null);
    setResult(null);
    setProgress("");
  }

  function clearFile() {
    setFile(null);
    setError(null);
    setResult(null);
    setProgress("");
  }

  async function compress(target: CompressionTarget) {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const buf = await readFileAsArrayBuffer(file);
      const compressed = await compressToTarget(buf, target.bytes, setProgress);
      setResult({
        bytes: compressed,
        targetLabel: target.label,
        originalSize: file.size,
      });
      setProgress("");
    } catch (e) {
      console.error(e);
      setError(
        "Could not compress this PDF. Make sure it is a valid, non-encrypted file."
      );
      setProgress("");
    } finally {
      setLoading(false);
    }
  }

  async function downloadResult() {
    if (!result || !file) return;
    const baseName = file.name.replace(/\.pdf$/i, "");
    const buffer = new Uint8Array(result.bytes).buffer;
    const blob = new Blob([buffer], { type: "application/pdf" });
    await saveFile(blob, `${baseName}-compressed.pdf`);
  }

  const availableTargets = file
    ? TARGETS.filter((t) => file.size > t.minOriginalBytes)
    : [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-gradient-to-br from-[#F37311] via-[#E26A0F] to-[#D4640C] rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner backdrop-blur-sm">
            <Minimize2 className="w-7 h-7 text-white" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Compress your PDF</h1>
            <p className="text-white/85 text-sm mt-0.5">
              Shrink a PDF to a target file size — entirely in your browser.
            </p>
          </div>
        </div>
      </div>

      {!file ? (
        <FileDropZone onFiles={handleFile} />
      ) : (
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-teal-700" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {file.name}
              </p>
              <p className="text-xs text-slate-500">
                Original size: {formatBytes(file.size)}
              </p>
            </div>
          </div>
          <button
            onClick={clearFile}
            data-testid="button-clear-compress-file"
            className="text-slate-400 hover:text-rose-600 transition-colors p-1"
            aria-label="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {file && (
        <div>
          <Label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
            Pick a target size
          </Label>

          {availableTargets.length === 0 ? (
            <div className="mt-3 flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  This PDF is already under 1 MB
                </p>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Nothing to compress. Targets only appear once a file is
                  larger than the chosen size.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {availableTargets.map((target) => (
                <Button
                  key={target.label}
                  data-testid={`button-compress-${target.label
                    .replace(/\s+/g, "")
                    .toLowerCase()}`}
                  disabled={loading}
                  onClick={() => compress(target)}
                  className={`h-auto py-4 px-4 bg-gradient-to-r ${target.accent} hover:brightness-110 text-white border-0 shadow-md font-semibold flex items-center justify-between`}
                >
                  <span className="flex items-center gap-2">
                    <Minimize2 className="w-4 h-4" />
                    Compress PDF to {target.label}
                  </span>
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {loading && progress && (
        <div className="flex items-center gap-2 text-sm text-teal-700 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          {progress}
        </div>
      )}

      {error && (
        <p
          data-testid="compress-error"
          className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2"
        >
          {error}
        </p>
      )}

      {result && (
        <div
          data-testid="compress-result"
          className="bg-white border border-emerald-200 rounded-xl p-5 shadow-sm"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900">
                Compressed to {formatBytes(result.bytes.byteLength)}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Target: {result.targetLabel} · Original:{" "}
                {formatBytes(result.originalSize)} · Saved{" "}
                {Math.max(
                  0,
                  Math.round(
                    (1 - result.bytes.byteLength / result.originalSize) * 100
                  )
                )}
                %
              </p>
            </div>
          </div>
          <Button
            data-testid="button-download-compressed"
            onClick={downloadResult}
            className={`w-full bg-gradient-to-r ${downloadAccent} text-white border-0 shadow-md font-semibold`}
          >
            <Download className="w-4 h-4 mr-2" />
            Download compressed PDF
          </Button>
        </div>
      )}

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 leading-relaxed">
          Compression works by re-rendering each page as an image at a lower
          quality. Text remains visually clear but is no longer selectable in
          the compressed copy. The original file on your device is never
          modified.
        </div>
      </div>
    </div>
  );
}
