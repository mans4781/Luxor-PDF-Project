import { useState, useRef, useEffect, useCallback } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import {
  FileText, Upload, ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  Download, Type, Trash2, Loader2, X, Shield, FolderOpen,
  RotateCcw, Maximize2, AlignLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).href;

// ─── Font options ─────────────────────────────────────────────────────────────

const FONTS = [
  { label: "Helvetica",       pdfFont: StandardFonts.Helvetica,      css: "Helvetica, Arial, sans-serif",          bold: false },
  { label: "Helvetica Bold",  pdfFont: StandardFonts.HelveticaBold,  css: "Helvetica, Arial, sans-serif",          bold: true  },
  { label: "Times Roman",     pdfFont: StandardFonts.TimesRoman,     css: "'Times New Roman', Times, serif",       bold: false },
  { label: "Times Bold",      pdfFont: StandardFonts.TimesRomanBold, css: "'Times New Roman', Times, serif",       bold: true  },
  { label: "Courier",         pdfFont: StandardFonts.Courier,        css: "'Courier New', Courier, monospace",     bold: false },
  { label: "Courier Bold",    pdfFont: StandardFonts.CourierBold,    css: "'Courier New', Courier, monospace",     bold: true  },
];

const QUICK_COLORS = [
  "#000000", "#1e3a8a", "#15803d", "#b91c1c",
  "#7c3aed", "#c2410c", "#0369a1", "#374151",
];

function fontMeta(pdfFont: string) {
  return FONTS.find(f => f.pdfFont === pdfFont) ?? FONTS[0];
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return rgb(r, g, b);
}

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Annotation {
  id: string;
  pageIndex: number;
  xPct: number;
  yPct: number;
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Editor() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(1.0);
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [thumbImages, setThumbImages] = useState<string[]>([]);
  const [rendering, setRendering] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Style controls
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState<string>(StandardFonts.Helvetica);
  const [fontColor, setFontColor] = useState("#000000");

  const pdfRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const fileRef = useRef<File | null>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  // ── File loading ───────────────────────────────────────────────────────────

  const loadFile = useCallback(async (f: File) => {
    fileRef.current = f;
    setFile(f);
    setAnnotations([]);
    setSelectedId(null);
    setCurrentPage(0);
    setPageImages([]);
    setThumbImages([]);
    setEditMode(false);
    try {
      const buf = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      pdfRef.current = pdf;
      setPageCount(pdf.numPages);
    } catch {
      alert("Could not open this PDF. Make sure it is valid and not password-protected.");
      setFile(null);
      fileRef.current = null;
    }
  }, []);

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) loadFile(f);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type === "application/pdf") loadFile(f);
  }

  // ── Page rendering ─────────────────────────────────────────────────────────

  async function renderPage(pageIdx: number, scale: number): Promise<string> {
    if (!pdfRef.current) return "";
    const page = await pdfRef.current.getPage(pageIdx + 1);
    const vp = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = vp.width;
    canvas.height = vp.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    return canvas.toDataURL("image/jpeg", 0.9);
  }

  // Render current page at current zoom
  useEffect(() => {
    if (!pageCount) return;
    let cancelled = false;
    setRendering(true);
    renderPage(currentPage, zoom * 1.5).then(img => {
      if (!cancelled) {
        setPageImages(prev => {
          const next = [...prev];
          next[currentPage] = img;
          return next;
        });
        setRendering(false);
      }
    });
    return () => { cancelled = true; };
  }, [currentPage, pageCount, zoom]);

  // Render all thumbnails when PDF first loads
  useEffect(() => {
    if (!pageCount) return;
    const scale = 0.2;
    const go = async () => {
      const thumbs: string[] = [];
      for (let i = 0; i < pageCount; i++) {
        thumbs.push(await renderPage(i, scale));
      }
      setThumbImages(thumbs);
    };
    go();
  }, [pageCount]);

  // ── Annotations ────────────────────────────────────────────────────────────

  const selectedAnn = annotations.find(a => a.id === selectedId) ?? null;

  useEffect(() => {
    if (selectedAnn) {
      setFontSize(selectedAnn.fontSize);
      setFontFamily(selectedAnn.fontFamily);
      setFontColor(selectedAnn.color);
    }
  }, [selectedId]); // eslint-disable-line

  function updateCtrl(field: "fontSize" | "fontFamily" | "color", value: string | number) {
    if (field === "fontSize") setFontSize(value as number);
    if (field === "fontFamily") setFontFamily(value as string);
    if (field === "color") setFontColor(value as string);
    if (selectedId) {
      setAnnotations(prev => prev.map(a => a.id === selectedId ? { ...a, [field]: value } : a));
    }
  }

  function handlePageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!editMode) return;
    const target = e.target as HTMLElement;
    if (!target.classList.contains("pdf-page-img") && target !== overlayRef.current) return;
    const rect = overlayRef.current!.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    const id = `ann-${Date.now()}`;
    const ann: Annotation = {
      id, pageIndex: currentPage, xPct, yPct,
      text: "Type here", fontFamily, fontSize, color: fontColor,
    };
    setAnnotations(prev => [...prev, ann]);
    setSelectedId(id);
  }

  function deleteAnn(id: string) {
    setAnnotations(prev => prev.filter(a => a.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  // ── Export ─────────────────────────────────────────────────────────────────

  async function exportPdf() {
    if (!fileRef.current) return;
    setSaving(true);
    try {
      const buf = await fileRef.current.arrayBuffer();
      const doc = await PDFDocument.load(buf);
      const pages = doc.getPages();
      const fontCache: Record<string, Awaited<ReturnType<typeof doc.embedFont>>> = {};

      async function getFont(f: string) {
        if (!fontCache[f]) fontCache[f] = await doc.embedFont(f as StandardFonts);
        return fontCache[f];
      }

      for (let pi = 0; pi < pages.length; pi++) {
        const page = pages[pi];
        const { width, height } = page.getSize();
        for (const ann of annotations.filter(a => a.pageIndex === pi)) {
          const font = await getFont(ann.fontFamily);
          const x = (ann.xPct / 100) * width;
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

      const bytes = await doc.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      const name = (fileRef.current.name.replace(/\.pdf$/i, "") || "document") + "_edited.pdf";

      if ("showSaveFilePicker" in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: name,
            types: [{ description: "PDF", accept: { "application/pdf": [".pdf"] } }],
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          return;
        } catch (err: any) {
          if (err.name === "AbortError") return;
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to save PDF.");
    } finally {
      setSaving(false);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  const pageAnns = annotations.filter(a => a.pageIndex === currentPage);
  const currentImg = pageImages[currentPage];

  const displayFontSize   = selectedAnn ? selectedAnn.fontSize   : fontSize;
  const displayFontFamily = selectedAnn ? selectedAnn.fontFamily : fontFamily;
  const displayFontColor  = selectedAnn ? selectedAnn.color      : fontColor;

  // ── Welcome screen ─────────────────────────────────────────────────────────

  if (!file) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <canvas ref={hiddenCanvasRef} className="hidden" />

        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
            <Shield className="w-8 h-8 text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">LuxorPDF Editor</h1>
            <p className="text-sm text-slate-500">Professional PDF viewer & editor</p>
          </div>
        </div>

        {/* Drop zone */}
        <label
          className={`flex flex-col items-center justify-center w-[480px] max-w-[90vw] h-72 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
            dragOver
              ? "border-blue-500 bg-blue-50 scale-105 shadow-lg"
              : "border-blue-300 bg-white/60 hover:border-blue-400 hover:bg-white/80 hover:shadow-md"
          }`}
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-5">
            <FileText className="w-10 h-10 text-blue-500" />
          </div>
          <p className="text-xl font-semibold text-slate-700">
            {dragOver ? "Drop your PDF here" : "Open a PDF"}
          </p>
          <p className="text-sm text-slate-400 mt-1">Click to browse or drag & drop</p>
          <div className="mt-5 px-5 py-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium shadow-sm">
            Browse files
          </div>
          <input type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFileInput} />
        </label>

        {/* Feature pills */}
        <div className="flex gap-3 flex-wrap justify-center mt-8">
          {["View any PDF", "Add text anywhere", "Choose font & colour", "Save edited PDF", "Windows & Android ready"].map(f => (
            <span key={f} className="px-3 py-1 rounded-full bg-white/70 border border-blue-100 text-xs text-slate-600 shadow-sm">{f}</span>
          ))}
        </div>
      </div>
    );
  }

  // ── Editor UI ──────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden">
      <canvas ref={hiddenCanvasRef} className="hidden" />

      {/* ── Toolbar ── */}
      <header className="h-14 bg-gradient-to-r from-slate-800 to-slate-900 flex items-center gap-2 px-3 shrink-0 shadow-md z-30">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-4">
          <div className="p-1.5 rounded-lg bg-blue-600">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold text-sm hidden sm:block">LuxorPDF</span>
        </div>

        {/* Open file */}
        <label className="toolbar-btn cursor-pointer" title="Open PDF">
          <FolderOpen className="w-4 h-4" />
          <span className="hidden md:block text-xs">Open</span>
          <input type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFileInput} />
        </label>

        <div className="w-px h-6 bg-slate-600 mx-1" />

        {/* Page navigation */}
        <button
          className="toolbar-btn"
          onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
          disabled={currentPage === 0}
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1 bg-slate-700 rounded px-2 py-1 min-w-[80px] justify-center">
          <input
            type="number"
            value={currentPage + 1}
            min={1}
            max={pageCount}
            onChange={e => {
              const v = Math.max(1, Math.min(pageCount, parseInt(e.target.value) || 1));
              setCurrentPage(v - 1);
            }}
            className="w-8 bg-transparent text-white text-xs text-center outline-none"
          />
          <span className="text-slate-400 text-xs">/ {pageCount}</span>
        </div>
        <button
          className="toolbar-btn"
          onClick={() => setCurrentPage(p => Math.min(pageCount - 1, p + 1))}
          disabled={currentPage === pageCount - 1}
          title="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-slate-600 mx-1" />

        {/* Zoom */}
        <button className="toolbar-btn" onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} title="Zoom out">
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-slate-300 text-xs min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
        <button className="toolbar-btn" onClick={() => setZoom(z => Math.min(4, z + 0.25))} title="Zoom in">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button className="toolbar-btn" onClick={() => setZoom(1)} title="Reset zoom">
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button className="toolbar-btn" onClick={() => setZoom(1.5)} title="Fit width">
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-6 bg-slate-600 mx-1" />

        {/* Edit mode toggle */}
        <button
          className={`toolbar-btn ${editMode ? "bg-blue-600 text-white" : ""}`}
          onClick={() => { setEditMode(m => !m); setSelectedId(null); }}
          title={editMode ? "Exit text edit mode" : "Add text (click page to place)"}
        >
          <Type className="w-4 h-4" />
          <span className="hidden md:block text-xs">{editMode ? "Editing" : "Edit Text"}</span>
        </button>

        <div className="flex-1" />

        {/* File name */}
        <span className="text-slate-400 text-xs truncate max-w-[180px] hidden sm:block">{file.name}</span>

        {/* Close */}
        <button className="toolbar-btn" onClick={() => { setFile(null); pdfRef.current = null; fileRef.current = null; }} title="Close PDF">
          <X className="w-4 h-4" />
        </button>

        {/* Save */}
        <button
          onClick={exportPdf}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors ml-1 disabled:opacity-60"
          title="Save edited PDF"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          <span className="hidden md:block">Save PDF</span>
        </button>
      </header>

      {/* ── Edit mode banner ── */}
      {editMode && (
        <div className="bg-blue-600 text-white text-xs text-center py-1 shrink-0">
          Click anywhere on the page to add a text block · Click a block to select and edit it · <kbd className="bg-blue-700 px-1 py-0.5 rounded">Esc</kbd> to deselect
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Thumbnails ── */}
        <aside className="w-28 shrink-0 bg-slate-800 overflow-y-auto border-r border-slate-700 flex flex-col gap-2 p-2">
          {Array.from({ length: pageCount }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={`relative rounded overflow-hidden border-2 transition-all ${
                currentPage === i ? "border-blue-500 shadow-lg" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {thumbImages[i] ? (
                <img src={thumbImages[i]} alt={`Page ${i + 1}`} className="w-full block" />
              ) : (
                <div className="w-full aspect-[3/4] bg-slate-700 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
                </div>
              )}
              <span className="absolute bottom-0 left-0 right-0 text-center text-[9px] text-slate-300 bg-slate-900/60 py-0.5">
                {i + 1}
              </span>
            </button>
          ))}
        </aside>

        {/* ── Centre: Page viewer ── */}
        <main
          ref={viewerRef}
          className="flex-1 overflow-auto bg-slate-300 flex items-start justify-center p-6"
          onClick={e => {
            if ((e.target as HTMLElement).classList.contains("viewer-bg")) setSelectedId(null);
          }}
        >
          <div className="viewer-bg relative">
            {rendering && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10 rounded-sm">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            )}

            <div
              ref={overlayRef}
              className="relative shadow-2xl"
              style={{ cursor: editMode ? "crosshair" : "default" }}
              onClick={handlePageClick}
            >
              {currentImg ? (
                <img
                  src={currentImg}
                  alt={`Page ${currentPage + 1}`}
                  className="block pdf-page-img select-none"
                  style={{ width: `${Math.round(595 * zoom)}px` }}
                  draggable={false}
                />
              ) : (
                <div
                  className="bg-white"
                  style={{ width: `${Math.round(595 * zoom)}px`, height: `${Math.round(842 * zoom)}px` }}
                />
              )}

              {/* Annotation overlays */}
              {pageAnns.map(ann => {
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
                      fontFamily: meta.css,
                      fontWeight: meta.bold ? "bold" : "normal",
                      fontSize: `${ann.fontSize * zoom}px`,
                      color: ann.color,
                      cursor: "text",
                      outline: isSelected ? "2px dashed #3b82f6" : "1px dashed rgba(99,102,241,0.25)",
                      outlineOffset: "3px",
                      borderRadius: "2px",
                      padding: "1px 4px",
                      whiteSpace: "nowrap",
                      background: isSelected ? "rgba(239,246,255,0.7)" : "transparent",
                      zIndex: isSelected ? 20 : 10,
                      userSelect: "none",
                      transform: "translate(-2px, -2px)",
                    }}
                  >
                    {isSelected ? (
                      <input
                        autoFocus
                        value={ann.text}
                        onChange={e => setAnnotations(prev => prev.map(a => a.id === ann.id ? { ...a, text: e.target.value } : a))}
                        onClick={e => e.stopPropagation()}
                        onKeyDown={e => { if (e.key === "Escape") setSelectedId(null); }}
                        style={{
                          background: "transparent", border: "none", outline: "none",
                          fontFamily: "inherit", fontWeight: "inherit",
                          fontSize: "inherit", color: "inherit",
                          width: Math.max(80, ann.text.length * ann.fontSize * zoom * 0.6) + "px",
                          minWidth: "60px",
                        }}
                      />
                    ) : (
                      ann.text || <span style={{ opacity: 0.4, fontStyle: "italic", fontSize: "0.85em" }}>Type here</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        {/* ── Right: Text editing panel ── */}
        {editMode && (
          <aside className="w-56 shrink-0 bg-white border-l border-slate-200 flex flex-col overflow-y-auto">
            <div className="p-3 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <AlignLeft className="w-3.5 h-3.5" /> Text Style
              </p>
            </div>

            <div className="p-3 space-y-4">
              {/* Font family */}
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Font</Label>
                <select
                  value={displayFontFamily}
                  onChange={e => updateCtrl("fontFamily", e.target.value)}
                  className="w-full h-8 rounded border border-slate-200 bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
                >
                  {FONTS.map(f => (
                    <option key={f.pdfFont} value={f.pdfFont}>{f.label}</option>
                  ))}
                </select>
              </div>

              {/* Font size */}
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Size (pt)</Label>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => updateCtrl("fontSize", Math.max(6, displayFontSize - 1))}
                    className="w-7 h-7 rounded border border-slate-200 flex items-center justify-center text-sm hover:bg-slate-50 font-bold"
                  >−</button>
                  <Input
                    type="number" min={6} max={200}
                    value={displayFontSize}
                    onChange={e => updateCtrl("fontSize", Math.max(6, parseInt(e.target.value) || 16))}
                    className="h-7 text-xs text-center"
                  />
                  <button
                    onClick={() => updateCtrl("fontSize", Math.min(200, displayFontSize + 1))}
                    className="w-7 h-7 rounded border border-slate-200 flex items-center justify-center text-sm hover:bg-slate-50 font-bold"
                  >+</button>
                </div>
              </div>

              {/* Colour */}
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Colour</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={displayFontColor}
                    onChange={e => updateCtrl("color", e.target.value)}
                    className="w-9 h-8 rounded border border-slate-200 cursor-pointer p-0.5 bg-white"
                  />
                  <span className="text-xs font-mono text-slate-500">{displayFontColor.toUpperCase()}</span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {QUICK_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => updateCtrl("color", c)}
                      style={{ backgroundColor: c }}
                      className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${displayFontColor === c ? "border-blue-500 scale-110" : "border-white ring-1 ring-slate-200"}`}
                    />
                  ))}
                </div>
              </div>

              {/* Text blocks on this page */}
              {pageAnns.length > 0 && (
                <div className="space-y-1.5 pt-1 border-t border-slate-100">
                  <Label className="text-xs text-slate-500">Text blocks — page {currentPage + 1}</Label>
                  <div className="space-y-1 max-h-44 overflow-y-auto">
                    {pageAnns.map(ann => (
                      <div
                        key={ann.id}
                        onClick={() => setSelectedId(ann.id)}
                        className={`flex items-center gap-2 rounded px-2 py-1.5 cursor-pointer text-xs transition-colors ${
                          selectedId === ann.id ? "bg-blue-50 border border-blue-200" : "bg-slate-50 hover:bg-slate-100"
                        }`}
                      >
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: ann.color }} />
                        <span className="flex-1 truncate text-slate-700">{ann.text || "(empty)"}</span>
                        <button
                          onClick={e => { e.stopPropagation(); deleteAnn(ann.id); }}
                          className="shrink-0 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* ── Status bar ── */}
      <footer className="h-7 bg-slate-800 border-t border-slate-700 flex items-center px-4 gap-6 shrink-0">
        <span className="text-slate-400 text-xs">{file.name}</span>
        <span className="text-slate-500 text-xs">Page {currentPage + 1} of {pageCount}</span>
        <span className="text-slate-500 text-xs">Zoom {Math.round(zoom * 100)}%</span>
        {annotations.length > 0 && (
          <span className="text-blue-400 text-xs">{annotations.length} text block{annotations.length !== 1 ? "s" : ""} added</span>
        )}
        <div className="flex-1" />
        <span className="text-slate-600 text-xs">LuxorPDF Editor — Windows & Android ready</span>
      </footer>

      <style>{`
        .toolbar-btn {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.375rem 0.5rem;
          border-radius: 0.375rem;
          color: #94a3b8;
          font-size: 0.75rem;
          transition: background-color 0.15s, color 0.15s;
          cursor: pointer;
        }
        .toolbar-btn:hover:not(:disabled) {
          background-color: #334155;
          color: #f1f5f9;
        }
        .toolbar-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
