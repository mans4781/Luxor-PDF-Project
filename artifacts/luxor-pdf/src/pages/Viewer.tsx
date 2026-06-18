import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";
import Toolbar, { type ThemeKey } from "@/components/Toolbar";
import PDFPage from "@/components/PDFPage";
import ThumbnailPanel from "@/components/ThumbnailPanel";
import SearchBar from "@/components/SearchBar";
import { useAnnotations } from "@/lib/useAnnotations";
import { ToolType } from "@/lib/annotationTypes";
import { DEFAULTS as COLOR_DEFAULTS, HIGHLIGHT_COLORS, SELECTION_BLUE } from "@/lib/annotationColors";
import type { Annotation, HighlightAnnotation } from "@/lib/annotationTypes";
import WatermarkModal from "@/components/WatermarkModal";
import PageNumberModal from "@/components/PageNumberModal";
import CompressModal from "@/components/CompressModal";
import type { WatermarkConfig, PageNoConfig } from "@/lib/editTypes";
import { exportPdfWithEdits } from "@/lib/pdfExport";

// localStorage keys for persisting tool-color preferences across sessions.
const LS_KEYS = {
  highlight: "luxor-pdf:highlightColor",
  text: "luxor-pdf:textColor",
  draw: "luxor-pdf:drawColor",
  drawThickness: "luxor-pdf:drawThickness",
  textSize: "luxor-pdf:textSize",
  textFont: "luxor-pdf:textFont",
  shapeFill: "luxor-pdf:shapeFill",
  watermark: "luxor-pdf:watermark",
  pageNo: "luxor-pdf:pageNo",
  theme: "luxor-pdf:theme",
} as const;

/** Per-document localStorage key under which highlights are persisted. */
const highlightsKey = (docKey: string) => `luxor-pdf:highlights:${docKey}`;

const THEME_KEYS = ["light", "sepia", "dark", "night"] as const;
const isThemeKey = (v: string): v is ThemeKey =>
  (THEME_KEYS as readonly string[]).includes(v);

function lsGetJSON<T>(k: string): T | null {
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : null; } catch { return null; }
}
function lsSetJSON(k: string, v: unknown | null) {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, JSON.stringify(v));
  } catch { /* ignore quota */ }
}
const lsGet = (k: string, fb: string) => {
  try { return localStorage.getItem(k) ?? fb; } catch { return fb; }
};
const lsGetNum = (k: string, fb: number) => {
  try { const v = localStorage.getItem(k); return v ? Number(v) || fb : fb; } catch { return fb; }
};
const lsSet = (k: string, v: string | number) => {
  try { localStorage.setItem(k, String(v)); } catch { /* ignore quota */ }
};

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).href;

// Actual zoom values where 1.5 = "100%" (the new baseline)
const ZOOM_BASE = 1.5;
const ZOOM_PRESETS = [0.375, 0.75, 1.125, 1.5, 1.875, 2.25, 3.0];
const zoomLabel = (z: number) => `${Math.round((z / ZOOM_BASE) * 100)}%`;

interface ViewerProps {
  file: File;
  onClose: () => void;
  onFileLoad: (f: File) => void;
}

type CloseIntent = null | "close" | "open" | { kind: "swap"; file: File };

export default function Viewer({ file, onClose, onFileLoad }: ViewerProps) {
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(ZOOM_BASE);
  const [rotation, setRotation] = useState(0);
  const [showContents, setShowContents] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMatchList, setSearchMatchList] = useState<number[]>([]);
  const [matchIndex, setMatchIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tool, setTool] = useState<ToolType>("hand");
  const [highlightColor, setHighlightColor] = useState(() => {
    // Migrate stale highlight colors from the old neon palette
    // (#FFF200, #39FF14, #00BFFF, #FF4FB8, #FF3030, #00FFFF, #A855FF) to
    // the new ChatGPT-style soft palette default.
    const stored = lsGet(LS_KEYS.highlight, COLOR_DEFAULTS.highlightColor);
    const valid = HIGHLIGHT_COLORS.some(
      (c) => c.value.toLowerCase() === String(stored).toLowerCase(),
    );
    return valid ? stored : COLOR_DEFAULTS.highlightColor;
  });
  const [textColor, setTextColor] = useState(() => lsGet(LS_KEYS.text, COLOR_DEFAULTS.textColor));
  const [textSize, setTextSize] = useState(() => lsGetNum(LS_KEYS.textSize, COLOR_DEFAULTS.textSize));
  const [textFont, setTextFont] = useState(() => lsGet(LS_KEYS.textFont, COLOR_DEFAULTS.textFont));
  const [drawColor, setDrawColor] = useState(() => lsGet(LS_KEYS.draw, COLOR_DEFAULTS.penColor));
  const [drawThickness, setDrawThickness] = useState(() => lsGetNum(LS_KEYS.drawThickness, COLOR_DEFAULTS.penWidth));
  const [shapeFill, setShapeFill] = useState<boolean>(() => {
    try { return localStorage.getItem(LS_KEYS.shapeFill) === "1"; } catch { return false; }
  });
  const [theme, setTheme] = useState<ThemeKey>(() => {
    const stored = lsGet(LS_KEYS.theme, "light");
    return isThemeKey(stored) ? stored : "light";
  });

  // Apply the reading theme via data-theme on <html> and persist it.
  // Light is the default, so we remove the attribute for it to keep the
  // base :root tokens in effect.
  useEffect(() => {
    const el = document.documentElement;
    if (theme === "light") el.removeAttribute("data-theme");
    else el.setAttribute("data-theme", theme);
    lsSet(LS_KEYS.theme, theme);
    return () => { el.removeAttribute("data-theme"); };
  }, [theme]);

  // Persist tool-color preferences to localStorage whenever they change.
  useEffect(() => { lsSet(LS_KEYS.highlight, highlightColor); }, [highlightColor]);
  // The live text-selection overlay is always a fixed blue (matches the
  // reference design) regardless of which highlight color is picked.
  useEffect(() => {
    document.documentElement.style.setProperty("--active-selection-color", SELECTION_BLUE);
  }, []);
  useEffect(() => { lsSet(LS_KEYS.text, textColor); }, [textColor]);
  useEffect(() => { lsSet(LS_KEYS.draw, drawColor); }, [drawColor]);
  useEffect(() => { lsSet(LS_KEYS.drawThickness, drawThickness); }, [drawThickness]);
  useEffect(() => { lsSet(LS_KEYS.textSize, textSize); }, [textSize]);
  useEffect(() => { lsSet(LS_KEYS.textFont, textFont); }, [textFont]);
  useEffect(() => { lsSet(LS_KEYS.shapeFill, shapeFill ? "1" : "0"); }, [shapeFill]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [splitView, setSplitView] = useState(false);
  const [watermarkCfg, setWatermarkCfg] = useState<WatermarkConfig | null>(() => lsGetJSON<WatermarkConfig>(LS_KEYS.watermark));
  const [pageNoCfg, setPageNoCfg] = useState<PageNoConfig | null>(() => lsGetJSON<PageNoConfig>(LS_KEYS.pageNo));
  const [watermarkOpen, setWatermarkOpen] = useState(false);
  const [pageNoOpen, setPageNoOpen] = useState(false);
  const [compressOpen, setCompressOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [closeIntent, setCloseIntent] = useState<CloseIntent>(null);
  useEffect(() => { lsSetJSON(LS_KEYS.watermark, watermarkCfg); }, [watermarkCfg]);
  useEffect(() => { lsSetJSON(LS_KEYS.pageNo, pageNoCfg); }, [pageNoCfg]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pageInputRef = useRef<HTMLInputElement>(null);

  const { annotations, addAnnotation, updateAnnotation, removeAnnotation, clearHighlights, undo, getPageAnnotations, replaceHighlights } = useAnnotations();

  // Stable per-document key for persisting highlights across reloads.
  const docKey = useMemo(
    () => `${file.name}::${file.size}::${file.lastModified}`,
    [file.name, file.size, file.lastModified],
  );

  // Hydrate persisted highlights when a document opens. `hydratedKey` gates
  // the save effect below so the empty initial annotation state can never
  // overwrite stored highlights before they've been restored.
  const [hydratedKey, setHydratedKey] = useState<string | null>(null);
  useEffect(() => {
    const stored = lsGetJSON<HighlightAnnotation[]>(highlightsKey(docKey)) ?? [];
    replaceHighlights(stored as Annotation[]);
    setHydratedKey(docKey);
  }, [docKey, replaceHighlights]);

  // Persist highlights whenever they change (only after this doc is hydrated).
  useEffect(() => {
    if (hydratedKey !== docKey) return;
    const highlights = annotations.filter((a): a is HighlightAnnotation => a.type === "highlight");
    lsSetJSON(highlightsKey(docKey), highlights.length > 0 ? highlights : null);
  }, [annotations, docKey, hydratedKey]);

  // Load PDF
  useEffect(() => {
    if (!file) return;
    setLoading(true);
    const url = URL.createObjectURL(file);
    pdfjsLib.getDocument({ url }).promise.then(doc => {
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setCurrentPage(1);
      setLoading(false);
    }).catch(err => {
      console.error("PDF load error:", err);
      setLoading(false);
    });
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+Z / Cmd+Z — undo
      if ((e.key === "z" || e.key === "Z") && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      // Ctrl+F / Cmd+F — open search (works even inside inputs)
      if ((e.key === "f" || e.key === "F") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }
      if ((e.target as HTMLElement).tagName === "TEXTAREA" || (e.target as HTMLElement).tagName === "INPUT") return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") setCurrentPage(p => Math.min(totalPages, p + 1));
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") setCurrentPage(p => Math.max(1, p - 1));
      if (e.key === "+" || e.key === "=") setZoom(z => Math.min(5, z + 0.15));
      if (e.key === "-") setZoom(z => Math.max(0.25, z - 0.15));
      if (e.key === "Escape") {
        if (searchOpen) { setSearchOpen(false); setSearchQuery(""); return; }
        setTool("hand"); speechSynthesis.cancel(); setIsSpeaking(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [totalPages, searchOpen, undo]);

  // Ctrl+Scroll → zoom PDF, not the browser
  useEffect(() => {
    const handler = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      setZoom(z => Math.min(5, Math.max(0.25, parseFloat((z + delta).toFixed(2)))));
    };
    window.addEventListener("wheel", handler, { passive: false });
    return () => window.removeEventListener("wheel", handler);
  }, []);

  // Stop speech on unmount
  useEffect(() => () => speechSynthesis.cancel(), []);

  // Scan all pages for search matches whenever query changes
  useEffect(() => {
    if (!pdfDoc || !searchQuery.trim()) {
      setSearchMatchList([]);
      setMatchIndex(0);
      return;
    }
    const term = searchQuery.toLowerCase().trim();
    let cancelled = false;

    (async () => {
      const pages: number[] = [];
      for (let i = 1; i <= totalPages; i++) {
        try {
          const page = await pdfDoc.getPage(i);
          const content = await page.getTextContent();
          const text = content.items.map((item: any) => item.str).join("").toLowerCase();
          let idx = 0;
          while ((idx = text.indexOf(term, idx)) !== -1) {
            pages.push(i);
            idx += term.length;
          }
        } catch { /* skip */ }
        if (cancelled) return;
      }
      setSearchMatchList(pages);
      setMatchIndex(0);
      if (pages.length > 0) {
        document.getElementById(`page-${pages[0]}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
        setCurrentPage(pages[0]);
      }
    })();
    return () => { cancelled = true; };
  }, [searchQuery, pdfDoc, totalPages]);

  const handleSearchNext = useCallback(() => {
    if (searchMatchList.length === 0) return;
    const next = (matchIndex + 1) % searchMatchList.length;
    setMatchIndex(next);
    const page = searchMatchList[next];
    document.getElementById(`page-${page}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setCurrentPage(page);
  }, [matchIndex, searchMatchList]);

  const handleSearchPrev = useCallback(() => {
    if (searchMatchList.length === 0) return;
    const prev = (matchIndex - 1 + searchMatchList.length) % searchMatchList.length;
    setMatchIndex(prev);
    const page = searchMatchList[prev];
    document.getElementById(`page-${page}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setCurrentPage(page);
  }, [matchIndex, searchMatchList]);

  const handleSearchClose = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchMatchList([]);
    setMatchIndex(0);
  }, []);

  const handleSearchFromContext = useCallback((term: string) => {
    setSearchOpen(true);
    setSearchQuery(term);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    document.getElementById(`page-${page}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handlePageVisible = useCallback((page: number) => setCurrentPage(page), []);

  const handleReadAloud = useCallback(async () => {
    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    if (!pdfDoc) return;
    try {
      const page = await pdfDoc.getPage(currentPage);
      const content = await page.getTextContent();
      const text = content.items.map((item: any) => item.str).join(" ").trim();
      if (!text) { alert("No readable text found on this page."); return; }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    } catch (err) {
      console.error("Read aloud error:", err);
    }
  }, [isSpeaking, pdfDoc, currentPage]);

  // True whenever the user has applied any reversible edit that would
  // be lost if the PDF is closed without saving.
  const isDirty = annotations.length > 0 || watermarkCfg !== null || pageNoCfg !== null;

  const handleOpenFile = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || f.type !== "application/pdf") return;
    if (isDirty) {
      // Defer the swap until the user answers Save / Don't Save / Cancel.
      setCloseIntent({ kind: "swap", file: f });
    } else {
      speechSynthesis.cancel();
      onFileLoad(f);
    }
  };

  // ── File menu actions ──────────────────────────────────────
  const handleFileSaveAs = useCallback(() => {
    // Browsers can't truly "save as" — handleDownload already prompts a
    // save dialog on Windows when downloads.always_ask is enabled and
    // exports the PDF with all current edits burned in.
    if (!file) { alert("No PDF is currently open."); return; }
    handleDownload();
  }, [file]);

  const handleFileSaveCopy = useCallback(async () => {
    if (!file) { alert("No PDF is currently open."); return; }
    if (downloading) return;
    const redactions = annotations.filter((a): a is import("@/lib/annotationTypes").RedactionAnnotation => a.type === "redact");
    const images = annotations.filter((a): a is import("@/lib/annotationTypes").ImageAnnotation => a.type === "image");
    const editTexts = annotations.filter((a): a is import("@/lib/annotationTypes").EditTextAnnotation => a.type === "edittext");
    const dot = file.name.lastIndexOf(".");
    const base = dot > 0 ? file.name.slice(0, dot) : file.name;
    const copyName = `${base} - Copy.pdf`;
    if (!watermarkCfg && !pageNoCfg && redactions.length === 0 && images.length === 0 && editTexts.length === 0) {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(file);
      a.download = copyName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      return;
    }
    setDownloading(true);
    try {
      const blob = await exportPdfWithEdits(file, {
        watermark: watermarkCfg, pageNo: pageNoCfg,
        redactions, images, editTexts, currentPage,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = copyName; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("Save a copy failed:", err);
      alert("Sorry — couldn't save a copy of the PDF.");
    } finally {
      setDownloading(false);
    }
  }, [file, downloading, annotations, watermarkCfg, pageNoCfg, currentPage]);

  const handleFileClose = useCallback(() => {
    if (!file) { alert("No PDF is currently open."); return; }
    if (isDirty) setCloseIntent("close");
    else { speechSynthesis.cancel(); onClose(); }
  }, [file, isDirty, onClose]);

  // Resolve a pending close/open intent after the user answers the
  // unsaved-changes confirmation dialog.
  const resolveCloseIntent = useCallback((choice: "save" | "discard" | "cancel") => {
    if (closeIntent === null) return;
    if (choice === "cancel") { setCloseIntent(null); return; }
    const intent = closeIntent;
    const proceed = () => {
      speechSynthesis.cancel();
      if (intent === "close") onClose();
      else if (intent === "open") fileInputRef.current?.click();
      else if (typeof intent === "object" && intent.kind === "swap") onFileLoad(intent.file);
      setCloseIntent(null);
    };
    if (choice === "save") {
      // Trigger save first, then proceed regardless of result.
      handleDownload().finally(proceed);
    } else {
      proceed();
    }
  }, [closeIntent, onClose, onFileLoad]);

  // File-menu keyboard shortcuts. Placed in its own effect so it can
  // depend on the handlers (which are defined just above) without TDZ
  // issues from the main shortcuts effect higher up the file.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === "s" && e.shiftKey && !e.altKey) {
        e.preventDefault(); handleFileSaveAs();
      } else if (k === "s" && e.altKey && !e.shiftKey) {
        e.preventDefault(); handleFileSaveCopy();
      } else if (k === "o" && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        if (isDirty) setCloseIntent("open");
        else handleOpenFile();
      } else if (k === "w" && !e.shiftKey && !e.altKey) {
        e.preventDefault(); handleFileClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isDirty, handleFileSaveAs, handleFileSaveCopy, handleFileClose]);

  // Edit → Add Image. Opens a hidden <input type=file>, decodes the
  // chosen image to a data URL, normalizes WebP → PNG via canvas (pdf-lib
  // only embeds PNG/JPEG), and inserts an ImageAnnotation centered on the
  // current page at ~35% page width. Total displayed rotation is captured
  // so the burn-in pipeline can map back into PDF user-space.
  const handleAddImage = useCallback(() => {
    imageInputRef.current?.click();
  }, []);
  const handleImageChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !pdfDoc) return;
    if (!/^image\/(png|jpeg|jpg|webp)$/i.test(f.type)) {
      alert("Please pick a PNG, JPG, or WebP image.");
      return;
    }
    try {
      // 1. file → data URL
      const rawDataUrl: string = await new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(fr.result as string);
        fr.onerror = () => rej(fr.error);
        fr.readAsDataURL(f);
      });
      // 2. decode to get natural dims (and re-encode WebP as PNG)
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = () => rej(new Error("decode"));
        i.src = rawDataUrl;
      });
      let dataUrl = rawDataUrl;
      let mime: "image/png" | "image/jpeg" =
        f.type === "image/jpeg" || f.type === "image/jpg" ? "image/jpeg" : "image/png";
      if (f.type === "image/webp") {
        const cv = document.createElement("canvas");
        cv.width = img.naturalWidth; cv.height = img.naturalHeight;
        const ctx = cv.getContext("2d");
        if (!ctx) throw new Error("canvas-ctx");
        ctx.drawImage(img, 0, 0);
        dataUrl = cv.toDataURL("image/png");
        mime = "image/png";
      }
      // 3. read displayed page CSS dims so we can normalize to 0..1
      const wrapper = document.getElementById(`page-${currentPage}`);
      const canvasW = wrapper?.offsetWidth ?? 0;
      const canvasH = wrapper?.offsetHeight ?? 0;
      if (canvasW <= 0 || canvasH <= 0) {
        alert("Could not measure the current page — try clicking the page first.");
        return;
      }
      // 4. choose a sensible default size (~35% page width, capped at 60% page height)
      const aspect = img.naturalHeight / img.naturalWidth;
      let displayW = Math.min(canvasW * 0.35, 360);
      let displayH = displayW * aspect;
      if (displayH > canvasH * 0.6) {
        displayH = canvasH * 0.6;
        displayW = displayH / aspect;
      }
      const w = displayW / canvasW;
      const h = displayH / canvasH;
      // 5. capture total rotation for the export pipeline
      const page = await pdfDoc.getPage(currentPage);
      const totalRotation = ((((page.rotate ?? 0) + rotation) % 360) + 360) % 360;
      addAnnotation({
        id: (crypto.randomUUID?.() ?? `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`),
        type: "image",
        page: currentPage,
        x: (1 - w) / 2,
        y: (1 - h) / 2,
        w, h,
        rotation: totalRotation,
        dataUrl,
        mime,
        createdAt: new Date().toISOString(),
      });
      setTool("hand");
    } catch (err) {
      console.error("Add Image failed:", err);
      alert("Sorry — couldn't read that image.");
    }
  }, [pdfDoc, currentPage, rotation, addAnnotation]);

  const handleDownload = async () => {
    if (downloading) return;
    const redactions = annotations.filter((a): a is import("@/lib/annotationTypes").RedactionAnnotation => a.type === "redact");
    const images = annotations.filter((a): a is import("@/lib/annotationTypes").ImageAnnotation => a.type === "image");
    const editTexts = annotations.filter((a): a is import("@/lib/annotationTypes").EditTextAnnotation => a.type === "edittext");
    // If no edit feature is active, just hand back the original bytes —
    // no need to round-trip through pdf-lib.
    if (!watermarkCfg && !pageNoCfg && redactions.length === 0 && images.length === 0 && editTexts.length === 0) {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(file);
      a.download = file.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      return;
    }
    setDownloading(true);
    try {
      const blob = await exportPdfWithEdits(file, {
        watermark: watermarkCfg,
        pageNo: pageNoCfg,
        redactions,
        images,
        editTexts,
        currentPage,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dot = file.name.lastIndexOf(".");
      const base = dot > 0 ? file.name.slice(0, dot) : file.name;
      a.download = `${base} (edited).pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("Edited PDF export failed:", err);
      alert("Sorry — couldn't save the edited PDF. The original file may be encrypted or corrupted.");
    } finally {
      setDownloading(false);
    }
  };

  const handlePageInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const val = parseInt((e.target as HTMLInputElement).value, 10);
      if (!isNaN(val) && val >= 1 && val <= totalPages) handlePageChange(val);
      else if (pageInputRef.current) pageInputRef.current.value = String(currentPage);
    }
  };

  const allPageNums = useMemo(() => Array.from({ length: totalPages }, (_, i) => i + 1), [totalPages]);

  if (loading) {
    return (
      <div className="loading-scr">
        <div className="spinner" />
        <p>Loading {file.name}…</p>
      </div>
    );
  }

  return (
    <>
      <Toolbar
        fileName={file.name}
        tool={tool}
        highlightColor={highlightColor}
        textColor={textColor}
        textSize={textSize}
        textFont={textFont}
        isSpeaking={isSpeaking}
        showContents={showContents}
        searchOpen={searchOpen}
        splitView={splitView}
        onToggleContents={() => setShowContents(s => !s)}
        onToggleSearch={() => { setSearchOpen(s => !s); if (searchOpen) { setSearchQuery(""); setSearchMatchList([]); } }}
        onToggleSplit={() => setSplitView(s => !s)}
        onToolChange={setTool}
        onHighlightColorChange={setHighlightColor}
        onTextColorChange={setTextColor}
        onTextSizeChange={setTextSize}
        onTextFontChange={setTextFont}
        drawColor={drawColor}
        drawThickness={drawThickness}
        shapeFill={shapeFill}
        onDrawColorChange={setDrawColor}
        onDrawThicknessChange={setDrawThickness}
        onShapeFillChange={setShapeFill}
        onEraseAll={clearHighlights}
        onReadAloud={handleReadAloud}
        onOpenFile={handleOpenFile}
        onDownload={handleDownload}
        onPrint={() => window.print()}
        onOpenWatermark={() => setWatermarkOpen(true)}
        onOpenPageNo={() => setPageNoOpen(true)}
        onAddImage={handleAddImage}
        onOpenCompress={() => setCompressOpen(true)}
        onClearWatermark={() => setWatermarkCfg(null)}
        onClearPageNo={() => setPageNoCfg(null)}
        watermarkActive={!!watermarkCfg}
        pageNoActive={!!pageNoCfg}
        onFileSaveAs={handleFileSaveAs}
        onFileSaveCopy={handleFileSaveCopy}
        onFileClose={handleFileClose}
        theme={theme}
        onThemeChange={setTheme}
      />

      {/* Hidden file input for Edit → Add Image. */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: "none" }}
        onChange={handleImageChange}
      />

      {watermarkOpen && (
        <WatermarkModal
          initial={watermarkCfg}
          totalPages={totalPages}
          currentPage={currentPage}
          onApply={(cfg) => { setWatermarkCfg(cfg); setWatermarkOpen(false); }}
          onClear={() => { setWatermarkCfg(null); setWatermarkOpen(false); }}
          onClose={() => setWatermarkOpen(false)}
        />
      )}
      {pageNoOpen && (
        <PageNumberModal
          initial={pageNoCfg}
          totalPages={totalPages}
          onApply={(cfg) => { setPageNoCfg(cfg); setPageNoOpen(false); }}
          onClear={() => { setPageNoCfg(null); setPageNoOpen(false); }}
          onClose={() => setPageNoOpen(false)}
        />
      )}
      {compressOpen && (
        <CompressModal
          file={file}
          onClose={() => setCompressOpen(false)}
        />
      )}

      {/* ── Unsaved-changes confirmation ──────────────────── */}
      {closeIntent !== null && (
        <div
          onClick={() => resolveCloseIntent("cancel")}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            zIndex: 9200, display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff", color: "#1a1a1a",
              width: 440, maxWidth: "92vw",
              borderRadius: 12, padding: "22px 22px 18px",
              boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
            }}
          >
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>Unsaved changes</div>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: "#444", marginBottom: 18 }}>
              You have unsaved changes. Do you want to save before {closeIntent === "close" ? "closing" : "opening another file"}?
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                onClick={() => resolveCloseIntent("cancel")}
                style={{
                  background: "#fff", color: "#1a1a1a",
                  border: "1px solid rgba(0,0,0,0.2)", borderRadius: 6,
                  padding: "8px 14px", fontSize: 13, fontWeight: 400, cursor: "pointer",
                }}
              >Cancel</button>
              <button
                onClick={() => resolveCloseIntent("discard")}
                style={{
                  background: "#fff", color: "#c0392b",
                  border: "1px solid rgba(192,57,43,0.4)", borderRadius: 6,
                  padding: "8px 14px", fontSize: 13, fontWeight: 400, cursor: "pointer",
                }}
              >Don't Save</button>
              <button
                onClick={() => resolveCloseIntent("save")}
                style={{
                  background: "#0D62F2", color: "#fff",
                  border: "none", borderRadius: 6,
                  padding: "8px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer",
                }}
              >Save</button>
            </div>
          </div>
        </div>
      )}

      {downloading && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          zIndex: 9100, display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: 14, fontWeight: 500,
        }}>
          <div style={{ background: "#1a1a1a", padding: "16px 24px", borderRadius: 8 }}>
            Saving edited PDF…
          </div>
        </div>
      )}

      {/* ── Search bar ── */}
      {searchOpen && (
        <SearchBar
          query={searchQuery}
          matchIndex={matchIndex}
          totalMatches={searchMatchList.length}
          onQueryChange={setSearchQuery}
          onNext={handleSearchNext}
          onPrev={handleSearchPrev}
          onClose={handleSearchClose}
        />
      )}

      {/* ── Page thumbnails panel ── */}
      {showContents && pdfDoc && (
        <ThumbnailPanel
          pdfDoc={pdfDoc}
          totalPages={totalPages}
          currentPage={currentPage}
          rotation={rotation}
          onPageChange={handlePageChange}
        />
      )}

      {/* ── Right sidebar: zoom + page navigation ── */}
      <div className="right-sidebar">

        {/* Zoom controls */}
        <div className="sidebar-group">
          <button
            className="sidebar-btn"
            title="Zoom in"
            onClick={() => setZoom(z => Math.min(5, parseFloat((z + 0.25).toFixed(2))))}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>

          <select
            className="sidebar-zoom-select"
            value={ZOOM_PRESETS.includes(zoom) ? zoom : "custom"}
            onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) setZoom(v); }}
            title="Zoom level"
          >
            {ZOOM_PRESETS.map(z => <option key={z} value={z}>{zoomLabel(z)}</option>)}
            {!ZOOM_PRESETS.includes(zoom) && <option value="custom">{zoomLabel(zoom)}</option>}
          </select>

          <button
            className="sidebar-btn"
            title="Zoom out"
            onClick={() => setZoom(z => Math.max(0.25, parseFloat((z - 0.25).toFixed(2))))}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </button>
        </div>

        <div className="sidebar-sep" />

        {/* Page navigation */}
        {totalPages > 0 && (
          <div className="sidebar-group">
            <button
              className="sidebar-btn"
              title="Previous page"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15"/>
              </svg>
            </button>

            <div className="sidebar-page-indicator">
              <input
                ref={pageInputRef}
                type="number"
                className="sidebar-page-input"
                defaultValue={currentPage}
                key={currentPage}
                min={1}
                max={totalPages}
                onKeyDown={handlePageInput}
                title="Go to page"
              />
              <span className="sidebar-page-total">/ {totalPages}</span>
            </div>

            <button
              className="sidebar-btn"
              title="Next page"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
          </div>
        )}

        <div className="sidebar-sep" />

        {/* Rotate */}
        <div className="sidebar-group">
          <button
            className="sidebar-btn"
            title="Rotate clockwise (90°)"
            onClick={() => setRotation(r => (r + 90) % 360)}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v6h-6"/>
              <path d="M21 8C19.6 5 16.8 3 13.5 3 8.8 3 5 6.8 5 11.5S8.8 20 13.5 20c3.3 0 6.2-2 7.6-5"/>
            </svg>
          </button>
          <button
            className="sidebar-btn"
            title="Rotate counter-clockwise (90°)"
            onClick={() => setRotation(r => (r + 270) % 360)}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 2v6h6"/>
              <path d="M3 8c1.4-3 4.2-5 7.5-5C15.2 3 19 6.8 19 11.5S15.2 20 10.5 20c-3.3 0-6.2-2-7.6-5"/>
            </svg>
          </button>
        </div>

        <div className="sidebar-sep" />

        {/* Fit to width */}
        <button
          className="sidebar-btn"
          title="Reset zoom (100%)"
          onClick={() => setZoom(ZOOM_BASE)}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
          </svg>
        </button>

      </div>

      <div className={`luxor-viewer${showContents ? " viewer-with-panel" : ""}`}>
        {pdfDoc && (splitView
          /* ── Two-page spread: render pairs side by side ── */
          ? Array.from({ length: Math.ceil(totalPages / 2) }, (_, i) => {
              const left  = i * 2 + 1;
              const right = i * 2 + 2;
              return (
                <div key={left} style={{ display: "flex", gap: 12, alignItems: "flex-start", flexShrink: 0 }}>
                  <PDFPage
                    pdfDocument={pdfDoc} pageNum={left} zoom={zoom} rotation={rotation}
                    searchTerm={searchQuery.trim()} tool={tool}
                    annotations={getPageAnnotations(left)}
                    highlightColor={highlightColor} textColor={textColor} textSize={textSize} textFont={textFont}
                    drawColor={drawColor} drawThickness={drawThickness}
                    shapeFill={shapeFill}
                    onAnnotationAdd={addAnnotation} onAnnotationUpdate={updateAnnotation}
                    onAnnotationRemove={removeAnnotation}
                    isCurrentPage={left === currentPage} onVisible={handlePageVisible}
                    onSearchTermChange={handleSearchFromContext}
                    watermark={watermarkCfg} pageNo={pageNoCfg}
                    totalPages={totalPages} currentPage={currentPage}
                  />
                  {right <= totalPages && (
                    <PDFPage
                      pdfDocument={pdfDoc} pageNum={right} zoom={zoom} rotation={rotation}
                      searchTerm={searchQuery.trim()} tool={tool}
                      annotations={getPageAnnotations(right)}
                      highlightColor={highlightColor} textColor={textColor} textSize={textSize} textFont={textFont}
                      drawColor={drawColor} drawThickness={drawThickness}
                      shapeFill={shapeFill}
                      onAnnotationAdd={addAnnotation} onAnnotationUpdate={updateAnnotation}
                      onAnnotationRemove={removeAnnotation}
                      isCurrentPage={right === currentPage} onVisible={handlePageVisible}
                      onSearchTermChange={handleSearchFromContext}
                      watermark={watermarkCfg} pageNo={pageNoCfg}
                      totalPages={totalPages} currentPage={currentPage}
                    />
                  )}
                </div>
              );
            })
          /* ── Single-page view ── */
          : allPageNums.map(pageNum => (
              <PDFPage
                key={pageNum}
                pdfDocument={pdfDoc} pageNum={pageNum} zoom={zoom} rotation={rotation}
                searchTerm={searchQuery.trim()} tool={tool}
                annotations={getPageAnnotations(pageNum)}
                highlightColor={highlightColor} textColor={textColor} textSize={textSize} textFont={textFont}
                drawColor={drawColor} drawThickness={drawThickness}
                shapeFill={shapeFill}
                onAnnotationAdd={addAnnotation} onAnnotationUpdate={updateAnnotation}
                onAnnotationRemove={removeAnnotation}
                isCurrentPage={pageNum === currentPage} onVisible={handlePageVisible}
                onSearchTermChange={handleSearchFromContext}
                watermark={watermarkCfg} pageNo={pageNoCfg}
                totalPages={totalPages} currentPage={currentPage}
              />
            ))
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </>
  );
}
