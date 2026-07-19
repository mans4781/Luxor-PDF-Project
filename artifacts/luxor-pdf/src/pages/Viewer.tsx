import { useState, useCallback, useRef, useEffect, useLayoutEffect, useMemo } from "react";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";
import StatusBar from "@/components/StatusBar";
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
import ScreenshotOverlay from "@/components/ScreenshotOverlay";
import type { WatermarkConfig, PageNoConfig } from "@/lib/editTypes";
import { exportPdfWithEdits } from "@/lib/pdfExport";
import { useAuthGate } from "@/components/AuthGate";
import PasswordModal from "@/components/PasswordModal";
import ErrorScreen from "@/components/ErrorScreen";
import DocInfoPanel from "@/components/DocInfoPanel";
import NavPanel from "@/components/NavPanel";
import OCRPanel from "@/components/OCRPanel";
import AIToolsPanel from "@/components/AIToolsPanel";
import FormsPanel from "@/components/FormsPanel";
import SettingsModal from "@/components/SettingsModal";
import HelpModal from "@/components/HelpModal";
import { loadSettings, saveSettings, ReaderSettings } from "@/lib/settings";
import { addRecent, saveRecentBlob, loadRecentBlob, type RecentFileEntry } from "@/lib/recentFiles";
import { detectScanned } from "@/lib/docFeatures";

/** Right-hand side panels — only one can be open at a time. */
export type PanelKey = "info" | "nav" | "ocr" | "ai" | "forms";

/** Per-document localStorage key for the last-viewed page. */
const lastPageKey = (docKey: string) => `luxor-pdf:lastpage:${docKey}`;

// Friendly labels for the sign-in prompt when a gated tool is activated.
const TOOL_LABELS: Record<Exclude<ToolType, "hand">, string> = {
  highlight: "Highlighting",
  eraser: "the Eraser",
  text: "Text notes",
  freehand: "Pen drawing",
  line: "Shapes",
  arrow: "Shapes",
  oval: "Shapes",
  rectangle: "Shapes",
  redact: "Redaction",
  whiteout: "Whiteout",
  image: "Add Image",
  edittext: "Edit Text",
};

// localStorage keys for persisting tool-color preferences across sessions.
const LS_KEYS = {
  highlight: "luxor-pdf:highlightColor",
  text: "luxor-pdf:textColor",
  draw: "luxor-pdf:drawColor",
  drawThickness: "luxor-pdf:drawThickness",
  textSize: "luxor-pdf:textSize",
  textFont: "luxor-pdf:textFont",
  textUnderline: "luxor-pdf:textUnderline",
  textStrike: "luxor-pdf:textStrike",
  shapeFill: "luxor-pdf:shapeFill",
  watermark: "luxor-pdf:watermark",
  pageNo: "luxor-pdf:pageNo",
  theme: "luxor-pdf:theme",
} as const;

/** Per-document localStorage key under which highlights are persisted. */
const highlightsKey = (docKey: string) => `luxor-pdf:highlights:${docKey}`;

const THEME_KEYS = ["light", "sepia", "navy", "dark"] as const;
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

// Use a custom worker entry (polyfills + pdf.js worker) via workerPort so
// the upsert polyfills are active inside the worker's global scope too.
// This global port serves one-off getDocument calls (e.g. compression);
// each Viewer creates its OWN dedicated worker below, because pdf.js
// destroys a worker together with its owning loading task — with multiple
// document tabs mounted at once, a shared worker would be torn down by
// whichever tab closes or swaps its file first.
pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(
  new URL("../pdf-worker.ts", import.meta.url),
  { type: "module" }
);

const createDedicatedPdfWorker = () => {
  const port = new Worker(new URL("../pdf-worker.ts", import.meta.url), { type: "module" });
  const worker = pdfjsLib.PDFWorker.create({ port });
  return { port, worker };
};

// Actual zoom values where 1.875 = "100%" (the new baseline; old 125%)
const ZOOM_BASE = 1.875;
const zoomLabel = (z: number) => `${Math.round((z / ZOOM_BASE) * 100)}%`;

/* Excel-style non-linear zoom slider: 0–50 maps to 10%–100%, 50–100 maps
   to 100%–500%, so the centre notch is exactly 100%. */
const ZOOM_MIN = ZOOM_BASE * 0.1;   // 10%
const ZOOM_MAX = ZOOM_BASE * 5;     // 500%
const sliderToPct = (v: number) =>
  v <= 50 ? 10 + (v / 50) * 90 : 100 + ((v - 50) / 50) * 400;
const pctToSlider = (pct: number) =>
  pct <= 100 ? ((pct - 10) / 90) * 50 : 50 + ((pct - 100) / 400) * 50;

interface ViewerProps {
  file: File;
  onClose: () => void;
  onFileLoad: (f: File) => void;
  /** False when this document sits in a background tab. Global listeners
   *  (keyboard shortcuts, ctrl+wheel zoom, theme) only run when active. */
  active?: boolean;
  /** Incremented by the tab strip to request this viewer close itself
   *  through its own unsaved-changes flow. */
  closeSignal?: number;
}

type CloseIntent = null | "close" | "open" | { kind: "swap"; file: File };

export default function Viewer({ file, onClose, onFileLoad, active = true, closeSignal = 0 }: ViewerProps) {
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
    // Any highlight color stored under a previous palette that is no longer
    // present in HIGHLIGHT_COLORS falls back to the current default, so
    // switching palettes degrades gracefully.
    const stored = lsGet(LS_KEYS.highlight, COLOR_DEFAULTS.highlightColor);
    const valid = HIGHLIGHT_COLORS.some(
      (c) => c.value.toLowerCase() === String(stored).toLowerCase(),
    );
    return valid ? stored : COLOR_DEFAULTS.highlightColor;
  });
  const [textColor, setTextColor] = useState(() => lsGet(LS_KEYS.text, COLOR_DEFAULTS.textColor));
  const [textSize, setTextSize] = useState(() => lsGetNum(LS_KEYS.textSize, COLOR_DEFAULTS.textSize));
  const [textFont, setTextFont] = useState(() => lsGet(LS_KEYS.textFont, COLOR_DEFAULTS.textFont));
  const [textUnderline, setTextUnderline] = useState(() => lsGet(LS_KEYS.textUnderline, "0") === "1");
  const [textStrike, setTextStrike] = useState(() => lsGet(LS_KEYS.textStrike, "0") === "1");
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
    if (!active) return;
    const el = document.documentElement;
    if (theme === "light") el.removeAttribute("data-theme");
    else el.setAttribute("data-theme", theme);
    lsSet(LS_KEYS.theme, theme);
    return () => { el.removeAttribute("data-theme"); };
  }, [theme, active]);

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
  useEffect(() => { lsSet(LS_KEYS.textUnderline, textUnderline ? "1" : "0"); }, [textUnderline]);
  useEffect(() => { lsSet(LS_KEYS.textStrike, textStrike ? "1" : "0"); }, [textStrike]);
  useEffect(() => { lsSet(LS_KEYS.shapeFill, shapeFill ? "1" : "0"); }, [shapeFill]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [splitView, setSplitView] = useState(false);
  const [watermarkCfg, setWatermarkCfg] = useState<WatermarkConfig | null>(() => lsGetJSON<WatermarkConfig>(LS_KEYS.watermark));
  const [pageNoCfg, setPageNoCfg] = useState<PageNoConfig | null>(() => lsGetJSON<PageNoConfig>(LS_KEYS.pageNo));
  const [watermarkOpen, setWatermarkOpen] = useState(false);
  const [pageNoOpen, setPageNoOpen] = useState(false);
  const [compressOpen, setCompressOpen] = useState(false);
  const [screenshotActive, setScreenshotActive] = useState(false);
  /* Ribbon "Comment" button: bumping this counter tells the page that owns
   * the current text selection to open the sticky-note comment popup. */
  const [commentRequest, setCommentRequest] = useState(0);
  const [commentHint, setCommentHint] = useState(false);
  const commentHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /* Menu-bar text markups (Underline / Strikeout on the current selection). */
  const [markupRequest, setMarkupRequest] = useState<{ kind: "underline" | "strike"; n: number } | null>(null);
  const handleAddComment = useCallback(() => {
    const sel = window.getSelection();
    const selText = sel?.toString().trim();
    /* The selection must live inside a PDF page, otherwise no page would
     * respond to the request and the button would silently do nothing. */
    const anchor = sel && sel.rangeCount > 0 ? sel.getRangeAt(0).commonAncestorContainer : null;
    const anchorEl = anchor instanceof Element ? anchor : anchor?.parentElement ?? null;
    const insidePage = !!anchorEl?.closest(".pdf-page-wrapper");
    if (!selText || !insidePage) {
      setCommentHint(true);
      if (commentHintTimer.current) clearTimeout(commentHintTimer.current);
      commentHintTimer.current = setTimeout(() => setCommentHint(false), 2800);
      return;
    }
    setCommentRequest(n => n + 1);
  }, []);
  /* Menu bar Annotate → Underline / Strikeout Text. Same selection
   * validation and hint as the Comment button; the owning page applies
   * the markup via its markupRequest effect. */
  const handleMarkup = useCallback((kind: "underline" | "strike") => {
    const sel = window.getSelection();
    const selText = sel?.toString().trim();
    const anchor = sel && sel.rangeCount > 0 ? sel.getRangeAt(0).commonAncestorContainer : null;
    const anchorEl = anchor instanceof Element ? anchor : anchor?.parentElement ?? null;
    const insidePage = !!anchorEl?.closest(".pdf-page-wrapper");
    if (!selText || !insidePage) {
      setCommentHint(true);
      if (commentHintTimer.current) clearTimeout(commentHintTimer.current);
      commentHintTimer.current = setTimeout(() => setCommentHint(false), 2800);
      return;
    }
    setMarkupRequest(prev => ({ kind, n: (prev?.n ?? 0) + 1 }));
  }, []);
  useEffect(() => () => {
    if (commentHintTimer.current) clearTimeout(commentHintTimer.current);
  }, []);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  // Non-null when the browser lacks the system share sheet — holds the
  // prepared PDF so the fallback share menu can offer app links + download.
  const [shareFallback, setShareFallback] = useState<File | null>(null);
  const [closeIntent, setCloseIntent] = useState<CloseIntent>(null);

  // ── New commercial-reader state ─────────────────────────────
  const [settings, setSettings] = useState<ReaderSettings>(() => loadSettings());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelKey | null>(null);
  // Interactive AcroForm fill mode: when on, native form widgets become
  // clickable/typeable (see PDFPage's annotationLayer). Values live in
  // pdfDoc.annotationStorage and are serialized on "Download filled PDF".
  const [formFillMode, setFormFillMode] = useState(false);
  const [loadError, setLoadError] = useState<{ title: string; message: string } | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [wrongPassword, setWrongPassword] = useState(false);
  const passwordCbRef = useRef<((pw: string) => void) | null>(null);
  const loadingTaskRef = useRef<any>(null);
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [isScanned, setIsScanned] = useState<boolean | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);

  const handleSettingsChange = useCallback((next: ReaderSettings) => {
    setSettings(next);
    saveSettings(next);
  }, []);
  useEffect(() => { lsSetJSON(LS_KEYS.watermark, watermarkCfg); }, [watermarkCfg]);
  useEffect(() => { lsSetJSON(LS_KEYS.pageNo, pageNoCfg); }, [pageNoCfg]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const pageInputRef = useRef<HTMLInputElement>(null);

  const { annotations, addAnnotation, updateAnnotation, removeAnnotation, clearHighlights, undo, getPageAnnotations, replaceHighlights } = useAnnotations();

  // Premium gate: everything is free except the AI Assistant and the
  // Protect features (Redact, Whiteout, Watermark), which require a
  // signed-in user with an active paid plan (requirePremium shows the
  // sign-in / upgrade prompt when not).
  const { requirePremium } = useAuthGate();

  const handleToolChange = useCallback((t: ToolType) => {
    // All annotation tools are free except the Protect tools (Redact and
    // Whiteout), which are premium. (Exports containing Protect edits
    // stay gated at the export point.)
    if ((t === "redact" || t === "whiteout") && !requirePremium(TOOL_LABELS[t])) return;
    setTool(t);
  }, [requirePremium]);

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

  // Base (scale-1) size of page 1 — used to size placeholders for pages
  // that haven't rendered yet, so the scrollbar reflects the whole
  // document instantly even for very large PDFs.
  const [basePageSize, setBasePageSize] = useState<{ w: number; h: number } | null>(null);

  // Load PDF — with password support, friendly error handling, and
  // post-load feature detection (scanned pages / heavy files / recents).
  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    let resumeTimer: ReturnType<typeof setTimeout> | undefined;
    setLoading(true);
    setLoadError(null);
    setNeedsPassword(false);
    setWrongPassword(false);
    setPasswordProtected(false);
    setIsScanned(null);
    setActivePanel(null);
    const url = URL.createObjectURL(file);
    const { port, worker } = createDedicatedPdfWorker();
    const task = pdfjsLib.getDocument({ url, worker });
    loadingTaskRef.current = task;

    // pdf.js invokes this for encrypted PDFs. reason 1 = needs password,
    // reason 2 = previous attempt was wrong. We stash the callback and
    // show our modal; cancelling destroys the task → friendly error.
    task.onPassword = (cb: (pw: string) => void, reason: number) => {
      if (cancelled) return;
      passwordCbRef.current = cb;
      setPasswordProtected(true);
      setWrongPassword(reason === 2);
      setNeedsPassword(true);
      setLoading(false);
    };

    task.promise.then(async (doc: any) => {
      if (cancelled) return;
      setNeedsPassword(false);
      try {
        const p1 = await doc.getPage(1);
        const vp = p1.getViewport({ scale: 1, rotation: p1.rotate ?? 0 });
        setBasePageSize({ w: vp.width, h: vp.height });
      } catch {
        setBasePageSize(null);
      }
      setPdfDoc(doc);
      setTotalPages(doc.numPages);

      // Apply user preferences for a freshly-opened document.
      const prefs = loadSettings();
      setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, ZOOM_BASE * (prefs.defaultZoomPct / 100))));
      setSplitView(prefs.defaultView === "double");
      setShowContents(prefs.showThumbnails);

      // Resume at the last-viewed page (if enabled and still valid).
      const dk = `${file.name}::${file.size}::${file.lastModified}`;
      let startPage = 1;
      if (prefs.resumeLastPage) {
        const saved = parseInt(lsGet(lastPageKey(dk), "1"), 10);
        if (!isNaN(saved) && saved > 1 && saved <= doc.numPages) startPage = saved;
      }
      setCurrentPage(startPage);
      setLoading(false);
      if (startPage > 1) {
        // Wait a tick for pages to mount, then jump (instant — smooth
        // scrolling across hundreds of pages would look broken).
        resumeTimer = setTimeout(() => {
          if (cancelled) return;
          document.getElementById(`page-${startPage}`)?.scrollIntoView({ behavior: "auto", block: "start" });
        }, 80);
      }

      // Record in recents unless disabled — metadata in localStorage plus
      // a byte cache in IndexedDB so File > Recent Files can reopen it.
      if (prefs.enableRecents) {
        addRecent({ name: file.name, size: file.size, lastModified: file.lastModified, pages: doc.numPages });
        void saveRecentBlob(file);
      }

      // Detect scanned pages in the background (used by the search UI).
      detectScanned(doc).then((scanned) => {
        if (cancelled) return;
        setIsScanned(scanned);
      });
    }).catch((err: any) => {
      if (cancelled) return;
      console.error("PDF load error:", err);
      setNeedsPassword(false);
      setLoading(false);
      const name = err?.name ?? "";
      if (name === "PasswordException") {
        setLoadError({
          title: "Password required",
          message: "This PDF can't be opened without its password.",
        });
      } else if (name === "InvalidPDFException") {
        setLoadError({
          title: "This file can't be opened",
          message: "The file appears to be corrupted or isn't a valid PDF document.",
        });
      } else {
        setLoadError({
          title: "Something went wrong",
          message: "The document couldn't be loaded. It may be damaged, incomplete, or in an unsupported format.",
        });
      }
    });
    return () => {
      cancelled = true;
      if (resumeTimer !== undefined) clearTimeout(resumeTimer);
      passwordCbRef.current = null;
      if (loadingTaskRef.current === task) loadingTaskRef.current = null;
      // Abort any in-flight parsing/fetching for the old document, then
      // tear down this document's dedicated worker (pdf.js does not
      // terminate an externally-provided port itself).
      task.destroy().catch(() => {}).finally(() => {
        try { worker.destroy(); } catch { /* already destroyed */ }
        port.terminate();
      });
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // Persist the current page per document so reading can resume later.
  useEffect(() => {
    if (!pdfDoc || loading) return;
    lsSet(lastPageKey(docKey), currentPage);
  }, [currentPage, docKey, pdfDoc, loading]);

  // Placeholder CSS size at the current zoom (swapped when the viewer
  // rotation turns pages sideways). Real sizes replace this per page as
  // soon as that page actually renders.
  const defaultPageSize = useMemo(() => {
    if (!basePageSize) return null;
    const sideways = rotation % 180 !== 0;
    return {
      w: (sideways ? basePageSize.h : basePageSize.w) * zoom,
      h: (sideways ? basePageSize.w : basePageSize.h) * zoom,
    };
  }, [basePageSize, zoom, rotation]);

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
      if (e.key === "+" || e.key === "=") setZoom(z => Math.min(ZOOM_MAX, z + 0.15));
      if (e.key === "-") setZoom(z => Math.max(ZOOM_MIN, z - 0.15));
      if (e.key === "Escape") {
        if (searchOpen) { setSearchOpen(false); setSearchQuery(""); return; }
        setTool("hand"); speechSynthesis.cancel(); setIsSpeaking(false);
      }
    };
    if (!active) return;
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [totalPages, searchOpen, undo, active]);

  // Ctrl+Scroll → zoom PDF, not the browser
  useEffect(() => {
    const handler = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      setZoom(z => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, parseFloat((z + delta).toFixed(2)))));
    };
    if (!active) return;
    window.addEventListener("wheel", handler, { passive: false });
    return () => window.removeEventListener("wheel", handler);
  }, [active]);

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
    document.getElementById(`page-${page}`)?.scrollIntoView({ behavior: settings.smoothScroll ? "smooth" : "auto", block: "start" });
  }, [settings.smoothScroll]);

  // ── Fit to width / fit to page ─────────────────────────────
  // Compute a zoom from the visible viewer area and the page-1 base size.
  const applyFit = useCallback((mode: "width" | "page" | "height") => {
    const container = viewerRef.current;
    if (!container || !basePageSize) return;
    const sideways = rotation % 180 !== 0;
    const baseW = sideways ? basePageSize.h : basePageSize.w;
    const baseH = sideways ? basePageSize.w : basePageSize.h;
    // Horizontal padding: 24px each side + scrollbar allowance.
    const availW = container.clientWidth - 64;
    const availH = container.clientHeight - 48;
    if (availW <= 0 || availH <= 0 || baseW <= 0 || baseH <= 0) return;
    const zW = availW / baseW;
    const zH = availH / baseH;
    const z = mode === "width" ? zW : mode === "height" ? zH : Math.min(zW, zH);
    setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, parseFloat(z.toFixed(3)))));
  }, [basePageSize, rotation]);

  const handleFitWidth = useCallback(() => applyFit("width"), [applyFit]);
  const handleFitPage = useCallback(() => applyFit("page"), [applyFit]);
  const handleFitHeight = useCallback(() => applyFit("height"), [applyFit]);

  // ── Menu-bar zoom commands ─────────────────────────────────
  const handleZoomIn = useCallback(() => setZoom(z => Math.min(ZOOM_MAX, parseFloat((z + 0.25).toFixed(2)))), []);
  const handleZoomOut = useCallback(() => setZoom(z => Math.max(ZOOM_MIN, parseFloat((z - 0.25).toFixed(2)))), []);
  const handleZoomTo = useCallback((pct: number) => {
    setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, ZOOM_BASE * (pct / 100))));
  }, []);
  const handleActualSize = useCallback(() => setZoom(ZOOM_BASE), []);

  // ── Full screen ────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }, []);
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // ── Toolbar visibility & presentation mode ─────────────────
  const [toolbarHidden, setToolbarHidden] = useState(false);
  const presentationRef = useRef(false);
  const handleToggleToolbar = useCallback(() => setToolbarHidden(h => !h), []);
  const handlePresentation = useCallback(() => {
    presentationRef.current = true;
    setToolbarHidden(true);
    document.documentElement.requestFullscreen().catch(() => {});
    // Fit the whole page once the browser has settled into fullscreen.
    setTimeout(() => applyFit("page"), 350);
  }, [applyFit]);
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement && presentationRef.current) {
        presentationRef.current = false;
        setToolbarHidden(false);
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // ── Password modal actions ─────────────────────────────────
  const handlePasswordSubmit = useCallback((pw: string) => {
    const cb = passwordCbRef.current;
    if (!cb) return;
    setNeedsPassword(false);
    setLoading(true);
    cb(pw); // wrong passwords re-trigger onPassword with reason 2
  }, []);
  const handlePasswordCancel = useCallback(() => {
    setNeedsPassword(false);
    passwordCbRef.current = null;
    try { loadingTaskRef.current?.destroy(); } catch { /* already gone */ }
    setLoadError({
      title: "Password required",
      message: "This PDF can't be opened without its password.",
    });
  }, []);

  // Open a right-hand panel (the AI Assistant is a premium feature).
  const handleOpenPanel = useCallback((panel: PanelKey) => {
    if (panel === "ai" && !requirePremium("the AI Assistant")) return;
    setActivePanel(p => (p === panel ? null : panel));
  }, [requirePremium]);

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
  // Always call the LATEST handleDownload via a ref — memoized callbacks
  // (Save As, the unsaved-changes dialog) would otherwise capture a stale
  // closure whose `annotations` was still empty, silently exporting the
  // original file without redactions/images/text edits burned in.
  const handleDownloadRef = useRef<() => Promise<void>>(async () => {});
  const handleFileSaveAs = useCallback(() => {
    // Browsers can't truly "save as" — handleDownload already prompts a
    // save dialog on Windows when downloads.always_ask is enabled and
    // exports the PDF with all current edits burned in. (Text-edit
    // exports are premium-gated inside handleDownload itself.)
    if (!file) { alert("No PDF is currently open."); return; }
    handleDownloadRef.current();
  }, [file]);

  const handleFileSaveCopy = useCallback(async () => {
    if (!file) { alert("No PDF is currently open."); return; }
    if (downloading || sharing) return;
    const redactions = annotations.filter((a): a is import("@/lib/annotationTypes").RedactionAnnotation => a.type === "redact");
    const images = annotations.filter((a): a is import("@/lib/annotationTypes").ImageAnnotation => a.type === "image");
    const editTexts = annotations.filter((a): a is import("@/lib/annotationTypes").EditTextAnnotation => a.type === "edittext");
    // Burning Protect edits (redactions/whiteout/watermark) into the copy
    // is a premium feature.
    if ((redactions.length > 0 || watermarkCfg !== null) && !requirePremium("Protect features")) return;
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
  }, [file, downloading, sharing, annotations, watermarkCfg, pageNoCfg, currentPage, requirePremium]);

  // ── Interactive form filling (AcroForm) ────────────────────
  const handleToggleFormFill = useCallback(() => {
    setFormFillMode((on) => {
      const next = !on;
      // Switch to the hand tool when entering fill mode so annotation tools
      // don't fight the form widgets for clicks.
      if (next) setTool("hand");
      return next;
    });
  }, []);

  // Serialize the values the user typed/checked into the live form widgets
  // (held in pdfDoc.annotationStorage) into a real filled PDF. If other edit
  // features are also active, overlay them on top of the filled bytes.
  const handleDownloadFilledForm = useCallback(async () => {
    if (!file || !pdfDoc) { alert("No PDF is currently open."); return; }
    if (downloading || sharing) return;
    // Filled-form export is free, but burning Protect edits (redactions/
    // whiteout/watermark) into it is a premium feature.
    if (
      (annotations.some((a) => a.type === "redact") || watermarkCfg !== null) &&
      !requirePremium("Protect features")
    ) return;
    setDownloading(true);
    try {
      const filled: Uint8Array = await pdfDoc.saveDocument();
      const redactions = annotations.filter((a): a is import("@/lib/annotationTypes").RedactionAnnotation => a.type === "redact");
      const images = annotations.filter((a): a is import("@/lib/annotationTypes").ImageAnnotation => a.type === "image");
      const editTexts = annotations.filter((a): a is import("@/lib/annotationTypes").EditTextAnnotation => a.type === "edittext");
      const hasOtherEdits = watermarkCfg !== null || pageNoCfg !== null ||
        redactions.length > 0 || images.length > 0 || editTexts.length > 0;
      const blob: Blob = hasOtherEdits
        ? await exportPdfWithEdits(file, {
            watermark: watermarkCfg, pageNo: pageNoCfg,
            redactions, images, editTexts, currentPage,
            sourceBytes: filled,
          })
        : new Blob([filled as BlobPart], { type: "application/pdf" });
      const dot = file.name.lastIndexOf(".");
      const base = dot > 0 ? file.name.slice(0, dot) : file.name;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${base} - filled.pdf`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("Filled form export failed:", err);
      alert("Sorry — couldn't save the filled form. The PDF may be encrypted or corrupted.");
    } finally {
      setDownloading(false);
    }
  }, [file, pdfDoc, downloading, sharing, annotations, watermarkCfg, pageNoCfg, currentPage, requirePremium]);

  // ── Share (system share sheet, with fallback menu) ─────────
  const handleShare = useCallback(async () => {
    if (!file) { alert("No PDF is currently open."); return; }
    if (sharing || downloading) return;
    const redactions = annotations.filter((a): a is import("@/lib/annotationTypes").RedactionAnnotation => a.type === "redact");
    const images = annotations.filter((a): a is import("@/lib/annotationTypes").ImageAnnotation => a.type === "image");
    const editTexts = annotations.filter((a): a is import("@/lib/annotationTypes").EditTextAnnotation => a.type === "edittext");
    const needsExport = watermarkCfg !== null || pageNoCfg !== null ||
      redactions.length > 0 || images.length > 0 || editTexts.length > 0;
    // Sharing is free — but burning Protect edits (redactions/whiteout/
    // watermark) into the shared copy is premium, same as Save/export.
    if ((redactions.length > 0 || watermarkCfg !== null) && !requirePremium("Protect features")) return;
    setSharing(true);
    try {
      const blob: Blob = needsExport
        ? await exportPdfWithEdits(file, {
            watermark: watermarkCfg, pageNo: pageNoCfg,
            redactions, images, editTexts, currentPage,
          })
        : file;
      const name = file.name.toLowerCase().endsWith(".pdf") ? file.name : `${file.name}.pdf`;
      const shareFile = new File([blob], name, { type: "application/pdf" });
      if (typeof navigator.share === "function" && navigator.canShare?.({ files: [shareFile] })) {
        try {
          await navigator.share({ files: [shareFile], title: name });
        } catch (err: any) {
          // User closing the share sheet is not an error.
          if (err?.name !== "AbortError") setShareFallback(shareFile);
        }
      } else {
        // Browser can't open the system share sheet — offer app links.
        setShareFallback(shareFile);
      }
    } catch (err) {
      console.error("Share failed:", err);
      alert("Sorry — couldn't prepare the PDF for sharing.");
    } finally {
      setSharing(false);
    }
  }, [file, sharing, downloading, annotations, watermarkCfg, pageNoCfg, currentPage, requirePremium]);

  const downloadShareFile = useCallback((f: File) => {
    const url = URL.createObjectURL(f);
    const a = document.createElement("a");
    a.href = url; a.download = f.name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, []);

  const handleFileClose = useCallback(() => {
    if (!file) { alert("No PDF is currently open."); return; }
    if (isDirty) setCloseIntent("close");
    else { speechSynthesis.cancel(); onClose(); }
  }, [file, isDirty, onClose]);

  // ── File → Recent Files: reopen from the IndexedDB byte cache ──
  const handleOpenRecent = useCallback(async (entry: RecentFileEntry) => {
    const cached = await loadRecentBlob(entry);
    if (!cached) {
      alert(`"${entry.name}" isn't cached anymore — please pick it from your device.`);
      fileInputRef.current?.click();
      return;
    }
    if (isDirty) setCloseIntent({ kind: "swap", file: cached });
    else { speechSynthesis.cancel(); onFileLoad(cached); }
  }, [isDirty, onFileLoad]);

  // ── Help modal (User Guide / Shortcuts / About) ────────────
  const [helpSection, setHelpSection] = useState<null | "guide" | "shortcuts" | "about">(null);

  // ── File → Create New: open a fresh blank document ─────────
  const handleCreateNew = useCallback(async () => {
    try {
      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.create();
      doc.addPage([612, 792]); // US Letter
      const bytes = await doc.save();
      const f = new File([bytes as BlobPart], "Untitled.pdf", { type: "application/pdf" });
      if (isDirty) setCloseIntent({ kind: "swap", file: f });
      else { speechSynthesis.cancel(); onFileLoad(f); }
    } catch (err) {
      console.error("Create new PDF failed:", err);
      alert("Sorry — couldn't create a new document.");
    }
  }, [isDirty, onFileLoad]);

  // ── Tools → page operations (insert / delete / rotate) ─────
  // Rebuild the file with pdf-lib and reload it in place. These are
  // permanent structural edits, so the reworked file replaces the tab.
  const [pageOpBusy, setPageOpBusy] = useState(false);
  const runPageOp = useCallback(async (
    op: "insert" | "delete" | "rotate",
  ) => {
    if (!file) { alert("No PDF is currently open."); return; }
    if (pageOpBusy) return;
    if (op === "delete" && totalPages <= 1) {
      alert("This document only has one page, so it can't be deleted.");
      return;
    }
    if (isDirty) {
      const ok = window.confirm(
        "Changing pages reloads the document, and your unsaved annotations for this file will be kept separately. Continue?",
      );
      if (!ok) return;
    }
    setPageOpBusy(true);
    try {
      const { PDFDocument, degrees } = await import("pdf-lib");
      const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const idx = Math.min(Math.max(currentPage - 1, 0), src.getPageCount() - 1);
      if (op === "insert") {
        const ref = src.getPage(idx);
        const { width, height } = ref.getSize();
        src.insertPage(idx + 1, [width, height]);
      } else if (op === "delete") {
        src.removePage(idx);
      } else {
        const p = src.getPage(idx);
        p.setRotation(degrees(((p.getRotation().angle + 90) % 360)));
      }
      const bytes = await src.save();
      const f = new File([bytes as BlobPart], file.name, { type: "application/pdf" });
      speechSynthesis.cancel();
      onFileLoad(f);
    } catch (err) {
      console.error("Page operation failed:", err);
      alert("Sorry — couldn't modify the pages of this PDF. It may be encrypted or corrupted.");
    } finally {
      setPageOpBusy(false);
    }
  }, [file, pageOpBusy, totalPages, isDirty, currentPage, onFileLoad]);

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
      // Saving is free, but burning Protect edits (redactions/whiteout/
      // watermark) in is premium. Gate BEFORE proceeding so a non-premium
      // user isn't left with edits silently discarded after the prompt.
      const hasProtectEdits =
        annotations.some((a) => a.type === "redact") || watermarkCfg !== null;
      if (hasProtectEdits && !requirePremium("Protect features")) {
        setCloseIntent(null);
        return;
      }
      // Trigger save first, then proceed regardless of result.
      handleDownloadRef.current().finally(proceed);
    } else {
      proceed();
    }
  }, [closeIntent, onClose, onFileLoad, annotations, watermarkCfg, requirePremium]);

  // Tab-strip close button → run the same close flow (with the
  // unsaved-changes confirmation) as File → Close. A ref keeps the
  // latest handler without re-triggering on unrelated re-renders.
  const handleFileCloseRef = useRef(handleFileClose);
  useEffect(() => { handleFileCloseRef.current = handleFileClose; });
  useEffect(() => {
    if (closeSignal > 0) handleFileCloseRef.current();
  }, [closeSignal]);

  // File-menu keyboard shortcuts. Placed in its own effect so it can
  // depend on the handlers (which are defined just above) without TDZ
  // issues from the main shortcuts effect higher up the file.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // F11 — toggle full screen (browser default also works, but this
      // keeps the state chip in the View menu in sync).
      if (e.key === "F11") {
        e.preventDefault();
        toggleFullscreen();
        return;
      }
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
    if (!active) return;
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isDirty, handleFileSaveAs, handleFileSaveCopy, handleFileClose, toggleFullscreen, active]);

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
    if (downloading || sharing) return;
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
    // Exporting is free — except burning Protect edits (redactions/
    // whiteout/watermark) in, which is premium. Gating here also covers
    // indirect callers (Save As shortcut, unsaved-changes dialog).
    if ((redactions.length > 0 || watermarkCfg !== null) && !requirePremium("Protect features")) return;
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
  // Keep the ref pointing at the latest handleDownload so memoized
  // callers (Save As, unsaved-changes dialog) never run a stale closure.
  // Assigned post-commit (not during render) so an interrupted concurrent
  // render can never leave the ref pointing at uncommitted state.
  useLayoutEffect(() => {
    handleDownloadRef.current = handleDownload;
  });

  // Print via a hidden iframe holding the original PDF so the browser's
  // native PDF printing handles every page. (Printing the DOM would only
  // print the handful of pages the virtualized viewer has rendered.)
  const printFrameRef = useRef<HTMLIFrameElement | null>(null);
  const handlePrint = useCallback(() => {
    try {
      if (printFrameRef.current) {
        printFrameRef.current.remove();
        printFrameRef.current = null;
      }
      const url = URL.createObjectURL(file);
      const frame = document.createElement("iframe");
      frame.style.position = "fixed";
      frame.style.right = "0";
      frame.style.bottom = "0";
      frame.style.width = "0";
      frame.style.height = "0";
      frame.style.border = "0";
      frame.src = url;
      let printed = false;
      const doPrint = () => {
        if (printed) return;
        printed = true;
        try {
          frame.contentWindow?.focus();
          frame.contentWindow?.print();
        } catch {
          window.print();
        }
      };
      frame.onload = () => setTimeout(doPrint, 150);
      // Some browsers never fire onload for PDF frames — fall back.
      setTimeout(doPrint, 2000);
      printFrameRef.current = frame;
      document.body.appendChild(frame);
      // Keep the blob URL alive long enough for the print dialog.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      window.print();
    }
  }, [file]);
  useEffect(() => () => { printFrameRef.current?.remove(); }, []);

  // Ctrl+P — print via the same hidden-iframe path as the toolbar button.
  // Registered here (after handlePrint is declared) to avoid TDZ issues.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        handlePrint();
      }
    };
    if (!active) return;
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handlePrint, active]);

  const handlePageInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const val = parseInt((e.target as HTMLInputElement).value, 10);
      if (!isNaN(val) && val >= 1 && val <= totalPages) handlePageChange(val);
      else if (pageInputRef.current) pageInputRef.current.value = String(currentPage);
    }
  };

  const allPageNums = useMemo(() => Array.from({ length: totalPages }, (_, i) => i + 1), [totalPages]);

  if (needsPassword) {
    return (
      <PasswordModal
        fileName={file.name}
        wrongPassword={wrongPassword}
        onSubmit={handlePasswordSubmit}
        onCancel={handlePasswordCancel}
      />
    );
  }

  if (loadError) {
    return (
      <ErrorScreen
        title={loadError.title}
        message={loadError.message}
        fileName={file.name}
        onClose={onClose}
      />
    );
  }

  if (loading) {
    // No splash/spinner screen: PDFs open near-instantly, so a flashing
    // loading animation only adds perceived lag. A plain neutral surface
    // is shown for the few milliseconds the document takes to parse.
    return <div className="loading-scr" />;
  }

  /* ── View controls (zoom / page nav / rotate / fits) — rendered
     in the bottom StatusBar via the `viewControls` prop ── */
  const viewControls = (
    <div className="view-bar">
      {/* Page navigation */}
      {totalPages > 0 && (
        <div className="sidebar-group">
          <button
            className="sidebar-btn"
            title="Previous page"
            disabled={currentPage <= 1}
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
            <span
              className="sidebar-page-total"
              title="Reading progress"
              style={{ fontSize: 9.5, opacity: 0.8 }}
            >
              {Math.round((currentPage / Math.max(1, totalPages)) * 100)}%
            </span>
          </div>

          <button
            className="sidebar-btn"
            title="Next page"
            disabled={currentPage >= totalPages}
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2v6h-6"/>
            <path d="M21 8C19.6 5 16.8 3 13.5 3 8.8 3 5 6.8 5 11.5S8.8 20 13.5 20c3.3 0 6.2-2 7.6-5"/>
          </svg>
        </button>
        <button
          className="sidebar-btn"
          title="Rotate counter-clockwise (90°)"
          onClick={() => setRotation(r => (r + 270) % 360)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 2v6h6"/>
            <path d="M3 8c1.4-3 4.2-5 7.5-5C15.2 3 19 6.8 19 11.5S15.2 20 10.5 20c-3.3 0-6.2-2-7.6-5"/>
          </svg>
        </button>
      </div>

      <div className="sidebar-sep" />

      {/* Fullscreen toggle */}
      <div className="sidebar-group">
        <button
          className="sidebar-btn"
          title={isFullscreen ? "Exit full screen" : "Full screen"}
          onClick={toggleFullscreen}
        >
          {isFullscreen ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 9.5H21v-6"/><path d="M21 3l-6.5 6.5"/>
              <path d="M9.5 9.5H3v-6"/><path d="M3 3l6.5 6.5"/>
              <path d="M14.5 14.5H21v6"/><path d="M21 21l-6.5-6.5"/>
              <path d="M9.5 14.5H3v6"/><path d="M3 21l6.5-6.5"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6"/><path d="M21 3l-6.5 6.5"/>
              <path d="M9 3H3v6"/><path d="M3 3l6.5 6.5"/>
              <path d="M15 21h6v-6"/><path d="M21 21l-6.5-6.5"/>
              <path d="M9 21H3v-6"/><path d="M3 21l6.5-6.5"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <Toolbar
        fileName={file.name}
        tool={tool}
        highlightColor={highlightColor}
        textColor={textColor}
        textSize={textSize}
        textFont={textFont}
        textUnderline={textUnderline}
        textStrike={textStrike}
        isSpeaking={isSpeaking}
        showContents={showContents}
        searchOpen={searchOpen}
        splitView={splitView}
        onToggleContents={() => setShowContents(s => !s)}
        onToggleSearch={() => { setSearchOpen(s => !s); if (searchOpen) { setSearchQuery(""); setSearchMatchList([]); } }}
        onToggleSplit={() => setSplitView(s => !s)}
        onToolChange={handleToolChange}
        onHighlightColorChange={setHighlightColor}
        onTextColorChange={setTextColor}
        onTextSizeChange={setTextSize}
        onTextFontChange={setTextFont}
        onTextUnderlineChange={setTextUnderline}
        onTextStrikeChange={setTextStrike}
        drawColor={drawColor}
        drawThickness={drawThickness}
        shapeFill={shapeFill}
        onDrawColorChange={setDrawColor}
        onDrawThicknessChange={setDrawThickness}
        onShapeFillChange={setShapeFill}
        onEraseAll={clearHighlights}
        onReadAloud={handleReadAloud}
        onOpenFile={handleOpenFile}
        onPrint={handlePrint}
        onOpenWatermark={() => setWatermarkOpen(true)}
        onOpenPageNo={() => setPageNoOpen(true)}
        onAddImage={handleAddImage}
        onOpenCompress={() => setCompressOpen(true)}
        onScreenshot={() => setScreenshotActive(true)}
        onClearWatermark={() => setWatermarkCfg(null)}
        onClearPageNo={() => setPageNoCfg(null)}
        watermarkActive={!!watermarkCfg}
        pageNoActive={!!pageNoCfg}
        onShare={handleShare}
        sharing={sharing}
        onFileSaveAs={handleFileSaveAs}
        onOpenRecent={handleOpenRecent}
        onFileSaveCopy={handleFileSaveCopy}
        onFileClose={handleFileClose}
        theme={theme}
        onThemeChange={setTheme}
        onFitWidth={handleFitWidth}
        onFitPage={handleFitPage}
        onRotateCw={() => setRotation(r => (r + 90) % 360)}
        onRotateCcw={() => setRotation(r => (r + 270) % 360)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        activePanel={activePanel}
        onOpenPanel={handleOpenPanel}
        onAddComment={handleAddComment}
        onOpenSettings={() => setSettingsOpen(true)}
        showOCR={settings.enableOCR}
        showAI={settings.enableAI}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomTo={handleZoomTo}
        onActualSize={handleActualSize}
        onFitHeight={handleFitHeight}
        onMarkup={handleMarkup}
        onCreateNew={handleCreateNew}
        onPageOp={runPageOp}
        toolbarHidden={toolbarHidden}
        onToggleToolbar={handleToggleToolbar}
        onPresentation={handlePresentation}
        onOpenHelp={setHelpSection}
        onSetSplitView={setSplitView}
      />
      <StatusBar
        viewControls={viewControls}
        zoomSlider={
          <div className="zoom-slider-group" title="Zoom">
            <button
              className="zoom-slider-btn"
              aria-label="Zoom out"
              onClick={() => setZoom(z => Math.max(ZOOM_MIN, parseFloat((z - 0.25).toFixed(4))))}
            >
              −
            </button>
            <div className="zoom-slider-track">
              <input
                type="range"
                className="zoom-slider"
                min={0}
                max={100}
                step={1}
                value={Math.max(0, Math.min(100, pctToSlider((zoom / ZOOM_BASE) * 100)))}
                onChange={e => {
                  const v = parseFloat(e.target.value);
                  if (isNaN(v)) return;
                  const pct = sliderToPct(v);
                  setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, ZOOM_BASE * (pct / 100))));
                }}
                aria-label="Zoom level"
              />
            </div>
            <button
              className="zoom-slider-btn"
              aria-label="Zoom in"
              onClick={() => setZoom(z => Math.min(ZOOM_MAX, parseFloat((z + 0.25).toFixed(4))))}
            >
              +
            </button>
            <span className="zoom-slider-pct">{zoomLabel(zoom)}</span>
            <button
              className="zoom-slider-btn"
              title="Reset zoom to 100%"
              aria-label="Reset zoom to 100%"
              onClick={handleActualSize}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9" />
                <path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9" />
                <path d="M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15" />
                <path d="M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15" />
              </svg>
            </button>
          </div>
        }
      />

      {/* Transient hint when Comment ribbon button is used with no text selected. */}
      {commentHint && (
        <div
          style={{
            position: "fixed", top: 118, left: "50%", transform: "translateX(-50%)",
            background: "var(--lux-surface, #2a2a2e)", color: "var(--lux-text, #e0e0e0)",
            border: "1px solid rgba(128,128,128,0.35)",
            borderRadius: 8, padding: "8px 14px", fontSize: 13,
            boxShadow: "0 4px 16px rgba(0,0,0,0.25)", zIndex: 300,
            pointerEvents: "none",
          }}
        >
          Select some text in the document first, then press Comment.
        </div>
      )}

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
          onApply={(cfg) => {
            // Watermark is a Protect feature — premium only.
            if (!requirePremium("Watermark")) return;
            setWatermarkCfg(cfg); setWatermarkOpen(false);
          }}
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

      {screenshotActive && (
        <ScreenshotOverlay
          fileName={file.name}
          currentPage={currentPage}
          onClose={() => setScreenshotActive(false)}
        />
      )}

      {helpSection && (
        <HelpModal
          section={helpSection}
          onSectionChange={setHelpSection}
          onClose={() => setHelpSection(null)}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          settings={settings}
          onChange={handleSettingsChange}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {/* ── Right-hand side panels (one at a time) ─────────── */}
      {activePanel === "info" && pdfDoc && (
        <DocInfoPanel
          pdfDoc={pdfDoc}
          fileName={file.name}
          fileSize={file.size}
          totalPages={totalPages}
          passwordProtected={passwordProtected}
          onClose={() => setActivePanel(null)}
        />
      )}
      {activePanel === "nav" && pdfDoc && (
        <NavPanel
          pdfDoc={pdfDoc}
          docKey={docKey}
          currentPage={currentPage}
          totalPages={totalPages}
          annotations={annotations}
          onGoToPage={handlePageChange}
          onRemoveAnnotation={removeAnnotation}
          onClose={() => setActivePanel(null)}
        />
      )}
      {activePanel === "ocr" && (
        <OCRPanel
          isScanned={isScanned}
          totalPages={totalPages}
          onClose={() => setActivePanel(null)}
        />
      )}
      {activePanel === "ai" && pdfDoc && (
        <AIToolsPanel
          pdfDoc={pdfDoc}
          fileName={file.name}
          totalPages={totalPages}
          onClose={() => setActivePanel(null)}
        />
      )}
      {activePanel === "forms" && pdfDoc && (
        <FormsPanel
          pdfDoc={pdfDoc}
          onClose={() => setActivePanel(null)}
          onSelectTool={handleToolChange}
          onAddImage={handleAddImage}
          formFillMode={formFillMode}
          onToggleFormFill={handleToggleFormFill}
          onDownloadFilled={handleDownloadFilledForm}
        />
      )}

      {/* ── Share fallback (no system share sheet available) ── */}
      {shareFallback && (
        <div
          onClick={() => setShareFallback(null)}
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
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>Share this PDF</div>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: "#444", marginBottom: 16 }}>
              Your browser can't open the system share window here, so first download the
              PDF, then pick an app — attach the downloaded file to your message.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              <button
                onClick={() => downloadShareFile(shareFallback)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: "#b91c1c", color: "#fff", border: "none",
                  borderRadius: 8, padding: "10px 14px", fontSize: 13.5, fontWeight: 600,
                  cursor: "pointer", textAlign: "left",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 4v11"/><path d="M8.5 11.5 12 15l3.5-3.5"/>
                  <path d="M5 15v3.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V15"/>
                </svg>
                1. Download the PDF
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => {
                    window.open(
                      `https://wa.me/?text=${encodeURIComponent(`Sharing a PDF with you: ${shareFallback.name} (file attached separately)`)}`,
                      "_blank", "noopener,noreferrer",
                    );
                  }}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    background: "#fff", color: "#1a1a1a", border: "1px solid rgba(0,0,0,0.2)",
                    borderRadius: 8, padding: "10px 12px", fontSize: 13, cursor: "pointer",
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L3 21l1.9-5.6A8.5 8.5 0 1 1 21 11.5z"/>
                  </svg>
                  2. WhatsApp
                </button>
                <button
                  onClick={() => {
                    window.location.href =
                      `mailto:?subject=${encodeURIComponent(shareFallback.name)}&body=${encodeURIComponent(`Sharing a PDF with you: ${shareFallback.name}. The file is attached.`)}`;
                  }}
                  style={{
                    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    background: "#fff", color: "#1a1a1a", border: "1px solid rgba(0,0,0,0.2)",
                    borderRadius: 8, padding: "10px 12px", fontSize: 13, cursor: "pointer",
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2"/>
                    <path d="m3 7 9 6 9-6"/>
                  </svg>
                  2. Email
                </button>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShareFallback(null)}
                style={{
                  background: "#fff", color: "#1a1a1a",
                  border: "1px solid rgba(0,0,0,0.2)", borderRadius: 6,
                  padding: "8px 14px", fontSize: 13, cursor: "pointer",
                }}
              >Close</button>
            </div>
          </div>
        </div>
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
          unsearchable={isScanned === true}
        />
      )}

      {/* ── Page thumbnails panel ── */}
      {showContents && pdfDoc && (
        <ThumbnailPanel
          onCollapse={() => setShowContents(false)}
          pdfDoc={pdfDoc}
          totalPages={totalPages}
          currentPage={currentPage}
          rotation={rotation}
          onPageChange={handlePageChange}
        />
      )}

      {/* Small tab to reopen the thumbnails panel when it is collapsed. */}
      {!showContents && pdfDoc && (
        <button
          className="thumb-expand-tab"
          title="Show page thumbnails"
          aria-label="Show thumbnails panel"
          onClick={() => setShowContents(true)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 6l6 6-6 6" />
          </svg>
        </button>
      )}

      <div ref={viewerRef} className={`luxor-viewer${showContents ? " viewer-with-panel" : ""}`}>
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
                    textUnderline={textUnderline} textStrike={textStrike}
                    drawColor={drawColor} drawThickness={drawThickness}
                    shapeFill={shapeFill}
                    onAnnotationAdd={addAnnotation} onAnnotationUpdate={updateAnnotation}
                    onAnnotationRemove={removeAnnotation}
                    isCurrentPage={left === currentPage} onVisible={handlePageVisible}
                    onSearchTermChange={handleSearchFromContext}
                    commentRequest={commentRequest}
                    markupRequest={markupRequest ?? undefined}
                    watermark={watermarkCfg} pageNo={pageNoCfg}
                    totalPages={totalPages} currentPage={currentPage}
                    formFillMode={formFillMode}
defaultPageSize={defaultPageSize}
                  />
                  {right <= totalPages && (
                    <PDFPage
                      pdfDocument={pdfDoc} pageNum={right} zoom={zoom} rotation={rotation}
                      searchTerm={searchQuery.trim()} tool={tool}
                      annotations={getPageAnnotations(right)}
                      highlightColor={highlightColor} textColor={textColor} textSize={textSize} textFont={textFont}
                      textUnderline={textUnderline} textStrike={textStrike}
                      drawColor={drawColor} drawThickness={drawThickness}
                      shapeFill={shapeFill}
                      onAnnotationAdd={addAnnotation} onAnnotationUpdate={updateAnnotation}
                      onAnnotationRemove={removeAnnotation}
                      isCurrentPage={right === currentPage} onVisible={handlePageVisible}
                      onSearchTermChange={handleSearchFromContext}
                      commentRequest={commentRequest}
                      markupRequest={markupRequest ?? undefined}
                      watermark={watermarkCfg} pageNo={pageNoCfg}
                      totalPages={totalPages} currentPage={currentPage}
                      formFillMode={formFillMode}
defaultPageSize={defaultPageSize}
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
                textUnderline={textUnderline} textStrike={textStrike}
                drawColor={drawColor} drawThickness={drawThickness}
                shapeFill={shapeFill}
                onAnnotationAdd={addAnnotation} onAnnotationUpdate={updateAnnotation}
                onAnnotationRemove={removeAnnotation}
                isCurrentPage={pageNum === currentPage} onVisible={handlePageVisible}
                onSearchTermChange={handleSearchFromContext}
                commentRequest={commentRequest}
                markupRequest={markupRequest ?? undefined}
                watermark={watermarkCfg} pageNo={pageNoCfg}
                totalPages={totalPages} currentPage={currentPage}
                formFillMode={formFillMode}
defaultPageSize={defaultPageSize}
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
