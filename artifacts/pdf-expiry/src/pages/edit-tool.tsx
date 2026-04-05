import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { saveFile } from "@/lib/save-file";
import {
  Upload, X, Download, Loader2, Type,
  Trash2, ChevronLeft, ChevronRight,
} from "lucide-react";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).href;

// ─── Font options ─────────────────────────────────────────────────────────────

const FONT_OPTIONS = [
  { label: "Helvetica",          value: StandardFonts.Helvetica,         css: "Helvetica,Arial,sans-serif",      bold: false },
  { label: "Helvetica Bold",     value: StandardFonts.HelveticaBold,     css: "Helvetica,Arial,sans-serif",      bold: true  },
  { label: "Times Roman",        value: StandardFonts.TimesRoman,        css: "'Times New Roman',Times,serif",   bold: false },
  { label: "Times Bold",         value: StandardFonts.TimesRomanBold,    css: "'Times New Roman',Times,serif",   bold: true  },
  { label: "Courier",            value: StandardFonts.Courier,           css: "'Courier New',Courier,monospace", bold: false },
  { label: "Courier Bold",       value: StandardFonts.CourierBold,       css: "'Courier New',Courier,monospace", bold: true  },
];

function fontMeta(value: string) {
  return FONT_OPTIONS.find(f => f.value === value) ?? FONT_OPTIONS[0];
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface TextAnnotation {
  id: string;
  pageIndex: number;
  xPct: number;
  yPct: number;
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return rgb(r, g, b);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EditTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageImage, setPageImage] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);
  const [annotations, setAnnotations] = useState<TextAnnotation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default style controls (applied to new blocks; also mirror selected block)
  const [fontSize, setFontSize] = useState(18);
  const [fontFamily, setFontFamily] = useState<string>(StandardFonts.Helvetica);
  const [fontColor, setFontColor] = useState("#000000");

  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const fileRef = useRef<File | null>(null);

  // ── File loading ──────────────────────────────────────────────────────────

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    fileRef.current = f;
    setFile(f);
    setAnnotations([]);
    setSelectedId(null);
    setCurrentPage(0);
    setPageImage(null);
    setError(null);
    try {
      const buf = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      pdfRef.current = pdf;
      setPageCount(pdf.numPages);
    } catch {
      setError("Could not open this PDF. Make sure it is valid and not password-protected.");
      setFile(null);
    }
  }

  function clearFile() {
    setFile(null);
    setPageCount(null);
    setCurrentPage(0);
    setPageImage(null);
    setAnnotations([]);
    setSelectedId(null);
    setError(null);
    pdfRef.current = null;
    fileRef.current = null;
  }

  // ── Page rendering ────────────────────────────────────────────────────────

  useEffect(() => {
    if (pageCount === null || !pdfRef.current) return;
    let cancelled = false;

    async function render() {
      if (!pdfRef.current) return;
      setRendering(true);
      setPageImage(null);
      try {
        const page = await pdfRef.current.getPage(currentPage + 1);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = hiddenCanvasRef.current;
        if (!canvas || cancelled) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport }).promise;
        if (!cancelled) setPageImage(canvas.toDataURL("image/jpeg", 0.92));
      } catch { /* ignore */ } finally {
        if (!cancelled) setRendering(false);
      }
    }

    render();
    return () => { cancelled = true; };
  }, [currentPage, pageCount]);

  // ── Annotation controls ───────────────────────────────────────────────────

  const selectedAnn = annotations.find(a => a.id === selectedId) ?? null;

  // Sync controls to selected annotation
  useEffect(() => {
    if (selectedAnn) {
      setFontSize(selectedAnn.fontSize);
      setFontFamily(selectedAnn.fontFamily);
      setFontColor(selectedAnn.color);
    }
  }, [selectedId]); // eslint-disable-line

  function addAnnotation(xPct: number, yPct: number) {
    const id = `ann-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const ann: TextAnnotation = {
      id, pageIndex: currentPage, xPct, yPct,
      text: "Type here",
      fontFamily, fontSize, color: fontColor,
    };
    setAnnotations(prev => [...prev, ann]);
    setSelectedId(id);
  }

  function updateAnn(id: string, updates: Partial<TextAnnotation>) {
    setAnnotations(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  }

  function deleteAnn(id: string) {
    setAnnotations(prev => prev.filter(a => a.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function handlePageClick(e: React.MouseEvent<HTMLDivElement>) {
    // If clicking directly on the overlay background (not a child annotation)
    if ((e.target as HTMLElement) !== overlayRef.current &&
        !(e.target as HTMLElement).classList.contains("page-img")) {
      return;
    }
    const rect = overlayRef.current!.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    addAnnotation(xPct, yPct);
  }

  // ── Style changes propagate to selected annotation ─────────────────────────

  function changeFontSize(v: number) {
    setFontSize(v);
    if (selectedId) updateAnn(selectedId, { fontSize: v });
  }

  function changeFontFamily(v: string) {
    setFontFamily(v);
    if (selectedId) updateAnn(selectedId, { fontFamily: v });
  }

  function changeFontColor(v: string) {
    setFontColor(v);
    if (selectedId) updateAnn(selectedId, { color: v });
  }

  // ── Export ────────────────────────────────────────────────────────────────

  async function exportPdf() {
    if (!fileRef.current) return;
    setSaving(true);
    setError(null);
    try {
      const buf = await fileRef.current.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buf);
      const pages = pdfDoc.getPages();

      // Cache embedded fonts to avoid re-embedding the same font multiple times
      const fontCache: Record<string, Awaited<ReturnType<typeof pdfDoc.embedFont>>> = {};
      async function getFont(f: string) {
        if (!fontCache[f]) fontCache[f] = await pdfDoc.embedFont(f as StandardFonts);
        return fontCache[f];
      }

      for (let pi = 0; pi < pages.length; pi++) {
        const page = pages[pi];
        const { width, height } = page.getSize();
        for (const ann of annotations.filter(a => a.pageIndex === pi)) {
          const font = await getFont(ann.fontFamily);
          const x = (ann.xPct / 100) * width;
          // pdf-lib uses bottom-left origin; invert Y
          const y = height - (ann.yPct / 100) * height - ann.fontSize;
          page.drawText(ann.text || " ", {
            x: Math.max(0, x),
            y: Math.max(0, y),
            size: ann.fontSize,
            font,
            color: hexToRgb(ann.color),
          });
        }
      }

      const bytes = await pdfDoc.save();
      const outName = fileRef.current.name.replace(/\.pdf$/i, "") + "_edited.pdf";
      await saveFile(new Blob([bytes], { type: "application/pdf" }), outName);
    } catch (e) {
      console.error(e);
      setError("Failed to save the PDF. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const pageAnnotations = annotations.filter(a => a.pageIndex === currentPage);
  const displayFontSize = selectedAnn ? selectedAnn.fontSize : fontSize;
  const displayFontFamily = selectedAnn ? selectedAnn.fontFamily : fontFamily;
  const displayFontColor = selectedAnn ? selectedAnn.color : fontColor;

  return (
    <Layout>
      <canvas ref={hiddenCanvasRef} className="hidden" />

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Type className="w-6 h-6 text-blue-600" />
            PDF Text Editor
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Add text anywhere on your PDF — choose font, size and colour
          </p>
        </div>

        {!file ? (
          /* ── Upload ── */
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-2xl p-16 cursor-pointer bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors group">
            <div className="w-16 h-16 rounded-full bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center mb-4 transition-colors">
              <Upload className="w-7 h-7 text-blue-500" />
            </div>
            <p className="font-semibold text-blue-700 text-lg">Click to open a PDF</p>
            <p className="text-sm text-blue-500 mt-1">Add text with custom fonts, sizes and colours</p>
            <input type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFileChange} />
          </label>
        ) : (
          <div className="flex gap-5">
            {/* ── Left: Controls ── */}
            <div className="w-60 shrink-0 space-y-4">

              {/* File card */}
              <div className="rounded-xl border bg-card p-4 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{pageCount} page{pageCount !== 1 ? "s" : ""}</p>
                  </div>
                  <button onClick={clearFile} className="shrink-0 text-muted-foreground hover:text-destructive transition-colors mt-0.5">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Style controls */}
              <div className="rounded-xl border bg-card p-4 space-y-4">
                <p className="font-semibold text-sm text-blue-700">Text Style</p>

                {/* Font family */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Font</Label>
                  <select
                    value={displayFontFamily}
                    onChange={e => changeFontFamily(e.target.value)}
                    className="w-full h-9 rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    {FONT_OPTIONS.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>

                {/* Font size */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Size</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={6}
                      max={200}
                      value={displayFontSize}
                      onChange={e => changeFontSize(Math.max(6, parseInt(e.target.value) || 18))}
                      className="h-9 text-sm"
                    />
                    <button onClick={() => changeFontSize(Math.max(6, displayFontSize - 1))} className="shrink-0 w-7 h-7 rounded border flex items-center justify-center hover:bg-muted text-sm font-bold">−</button>
                    <button onClick={() => changeFontSize(Math.min(200, displayFontSize + 1))} className="shrink-0 w-7 h-7 rounded border flex items-center justify-center hover:bg-muted text-sm font-bold">+</button>
                  </div>
                </div>

                {/* Font colour */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Colour</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={displayFontColor}
                      onChange={e => changeFontColor(e.target.value)}
                      className="w-10 h-9 rounded-md border cursor-pointer p-0.5 bg-background"
                    />
                    <span className="text-sm font-mono text-muted-foreground">{displayFontColor.toUpperCase()}</span>
                  </div>
                  {/* Colour palette shortcuts */}
                  <div className="flex gap-1.5 flex-wrap">
                    {["#000000","#1e3a8a","#15803d","#b91c1c","#7c3aed","#ea580c","#0369a1","#6b7280"].map(c => (
                      <button
                        key={c}
                        onClick={() => changeFontColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${displayFontColor === c ? "border-blue-500 scale-110" : "border-transparent"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Text blocks list */}
              {pageAnnotations.length > 0 && (
                <div className="rounded-xl border bg-card p-4 space-y-2">
                  <p className="font-semibold text-sm">Page {currentPage + 1} Text Blocks</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {pageAnnotations.map(ann => (
                      <div
                        key={ann.id}
                        onClick={() => setSelectedId(ann.id)}
                        className={`flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer text-xs transition-colors ${selectedId === ann.id ? "bg-blue-100 border border-blue-300" : "bg-muted/50 hover:bg-muted"}`}
                      >
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ann.color }} />
                        <span className="flex-1 truncate">{ann.text || "(empty)"}</span>
                        <button
                          onClick={ev => { ev.stopPropagation(); deleteAnn(ann.id); }}
                          className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Save button */}
              <Button
                onClick={exportPdf}
                disabled={saving}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-md font-semibold"
              >
                {saving
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</>
                  : <><Download className="w-4 h-4 mr-2" />Save PDF</>}
              </Button>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            {/* ── Right: Page viewer ── */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Page nav */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Click on the page to add a text block
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => { setSelectedId(null); setCurrentPage(p => Math.max(0, p - 1)); }}
                    disabled={currentPage === 0}
                    className="p-1.5 rounded-md hover:bg-muted disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-medium px-2">
                    Page {currentPage + 1} of {pageCount}
                  </span>
                  <button
                    onClick={() => { setSelectedId(null); setCurrentPage(p => Math.min((pageCount ?? 1) - 1, p + 1)); }}
                    disabled={currentPage === (pageCount ?? 1) - 1}
                    className="p-1.5 rounded-md hover:bg-muted disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Canvas + overlay */}
              <div
                className="relative rounded-2xl border shadow-lg bg-white overflow-hidden"
                onClick={e => {
                  const target = e.target as HTMLElement;
                  if (target === overlayRef.current || target.classList.contains("page-bg-img")) {
                    const rect = overlayRef.current!.getBoundingClientRect();
                    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
                    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
                    addAnnotation(xPct, yPct);
                  }
                }}
              >
                {rendering && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20 gap-2">
                    <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
                    <span className="text-sm text-muted-foreground">Rendering page…</span>
                  </div>
                )}

                <div ref={overlayRef} className="relative" style={{ cursor: "crosshair" }}>
                  {pageImage && (
                    <img
                      src={pageImage}
                      alt={`Page ${currentPage + 1}`}
                      className="w-full block page-bg-img select-none"
                      draggable={false}
                    />
                  )}

                  {/* Text annotation overlays */}
                  {pageAnnotations.map(ann => {
                    const meta = fontMeta(ann.fontFamily);
                    const isSelected = selectedId === ann.id;
                    return (
                      <div
                        key={ann.id}
                        onClick={e => { e.stopPropagation(); setSelectedId(ann.id); }}
                        style={{
                          position: "absolute",
                          left: `${ann.xPct}%`,
                          top: `${ann.yPct}%`,
                          transform: "translate(-2px, -2px)",
                          fontFamily: meta.css,
                          fontWeight: meta.bold ? "bold" : "normal",
                          fontSize: `${ann.fontSize}px`,
                          color: ann.color,
                          cursor: "text",
                          outline: isSelected ? "2px dashed #3b82f6" : "1px dashed rgba(99,102,241,0.3)",
                          outlineOffset: "3px",
                          borderRadius: "3px",
                          padding: "1px 3px",
                          whiteSpace: "nowrap",
                          userSelect: "none",
                          background: isSelected ? "rgba(239,246,255,0.6)" : "transparent",
                          zIndex: isSelected ? 10 : 5,
                        }}
                      >
                        {isSelected ? (
                          <input
                            autoFocus
                            value={ann.text}
                            onChange={e => updateAnn(ann.id, { text: e.target.value })}
                            onClick={e => e.stopPropagation()}
                            onKeyDown={e => { if (e.key === "Escape") setSelectedId(null); }}
                            style={{
                              background: "transparent",
                              border: "none",
                              outline: "none",
                              fontFamily: "inherit",
                              fontWeight: "inherit",
                              fontSize: "inherit",
                              color: "inherit",
                              width: Math.max(100, ann.text.length * (ann.fontSize * 0.6)) + "px",
                              minWidth: "80px",
                            }}
                          />
                        ) : (
                          ann.text || <span className="opacity-40 italic text-sm">Type here</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Click on blank page area to add text · Click a block to edit · <kbd className="rounded bg-muted px-1 py-0.5 text-xs">Esc</kbd> to deselect
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
