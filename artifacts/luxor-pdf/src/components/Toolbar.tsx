import { useRef, useState, useCallback, useEffect, type ReactNode } from "react";
import { AuthMenu } from "@workspace/luxor-auth-ui";
import { useAuthGate } from "@/components/AuthGate";
import { ToolType } from "@/lib/annotationTypes";
import type { PanelKey } from "@/pages/Viewer";
import {
  DRAW_PALETTE as PALETTE_DRAW,
  DRAW_THICKNESS,
  TEXT_FONTS,
} from "@/lib/annotationColors";

// Toolbar swatches are derived from the central palette in
// src/lib/annotationColors.ts. The 30-color DRAW_PALETTE is shared by
// the pen, all shape tools, and the Add-Text color picker so every
// drawing-related surface uses one consistent color system.
const TEXT_COLORS = PALETTE_DRAW.map((c) => ({ label: c.name, value: c.value }));
const DRAW_COLORS = PALETTE_DRAW.map((c) => ({ label: c.name, value: c.value }));

/**
 * 6-column circular color swatch grid. Selected swatch shows a blue
 * ring. Reused by every drawing-related popover (pen, shape tools,
 * add-text, highlighter).
 */
function ColorGrid({
  colors, selected, onSelect,
}: {
  colors: { label: string; value: string }[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(6, 1fr)",
        gap: 6,
        justifyItems: "center",
      }}
    >
      {colors.map((c) => {
        const isSel = selected.toLowerCase() === c.value.toLowerCase();
        return (
          <button
            key={c.value}
            title={c.label}
            onClick={() => onSelect(c.value)}
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              padding: 0,
              cursor: "pointer",
              background: c.value,
              border: isSel ? "2px solid #0D62F2" : "1px solid rgba(0,0,0,0.2)",
              boxShadow: isSel ? "0 0 0 2px rgba(13,98,242,0.25)" : "none",
              transition: "transform 0.1s, box-shadow 0.1s",
              transform: isSel ? "scale(1.08)" : "none",
              outline: "none",
            }}
          />
        );
      })}
    </div>
  );
}

/**
 * Color grid + Thickness slider, used by all drawing tools so they
 * share one consistent style panel.
 */
function DrawStylePanel({
  color, thickness, onColorChange, onThicknessChange,
}: {
  color: string;
  thickness: number;
  onColorChange: (c: string) => void;
  onThicknessChange: (t: number) => void;
}) {
  const previewSize = Math.max(2, Math.min(DRAW_THICKNESS.max, thickness));
  return (
    <>
      <div className="popover-label">Colors</div>
      <ColorGrid colors={DRAW_COLORS} selected={color} onSelect={onColorChange} />
      <div style={{ height: 12 }} />
      <div className="popover-label">Thickness</div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 22,
          marginBottom: 6,
        }}
      >
        <div
          style={{
            width: "70%",
            height: previewSize,
            borderRadius: previewSize,
            background: color,
          }}
        />
      </div>
      <input
        type="range"
        min={DRAW_THICKNESS.min}
        max={DRAW_THICKNESS.max}
        step={1}
        value={thickness}
        onChange={(e) => onThicknessChange(parseInt(e.target.value, 10))}
        style={{ width: "100%", accentColor: "#0D62F2", cursor: "pointer" }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          color: "#666",
          fontSize: 10,
          marginTop: 2,
          textTransform: "uppercase",
          letterSpacing: 0.6,
        }}
      >
        <span>Thin</span>
        <span style={{ color: "#222" }}>{thickness}px</span>
        <span>Thick</span>
      </div>
    </>
  );
}

const SHAPE_TOOLS: { id: ToolType; label: string }[] = [
  { id: "line",      label: "Straight Line" },
  { id: "arrow",     label: "Line with Arrow" },
  { id: "oval",      label: "Oval (Shift = Circle)" },
  { id: "rectangle", label: "Rectangle (Shift = Square)" },
];

interface ToolbarProps {
  fileName: string;
  /** Legacy: zoom / page-nav cluster. Now rendered by the StatusBar instead. */
  viewControls?: ReactNode;
  tool: ToolType;
  highlightColor: string;
  textColor: string;
  textSize: number;
  textFont: string;
  drawColor: string;
  drawThickness: number;
  shapeFill: boolean;
  isSpeaking: boolean;
  showContents: boolean;
  searchOpen: boolean;
  splitView: boolean;
  onToggleContents: () => void;
  onToggleSearch: () => void;
  onToggleSplit: () => void;
  onToolChange: (tool: ToolType) => void;
  onHighlightColorChange: (c: string) => void;
  onTextColorChange: (c: string) => void;
  onTextSizeChange: (s: number) => void;
  onTextFontChange: (f: string) => void;
  onDrawColorChange: (c: string) => void;
  onDrawThicknessChange: (t: number) => void;
  onShapeFillChange: (v: boolean) => void;
  onEraseAll: () => void;
  onReadAloud: () => void;
  onOpenFile: () => void;
  onPrint: () => void;
  onOpenWatermark: () => void;
  onOpenPageNo: () => void;
  onAddImage: () => void;
  onOpenCompress: () => void;
  onScreenshot: () => void;
  onClearWatermark: () => void;
  onClearPageNo: () => void;
  watermarkActive: boolean;
  pageNoActive: boolean;
  onShare: () => void;
  sharing: boolean;
  // File menu
  onFileSaveAs: () => void;
  onFileSaveCopy: () => void;
  onFileClose: () => void;
  // Theme menu
  theme: ThemeKey;
  onThemeChange: (t: ThemeKey) => void;
  // View menu
  onFitWidth: () => void;
  onFitPage: () => void;
  onRotateCw: () => void;
  onRotateCcw: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  activePanel: PanelKey | null;
  onOpenPanel: (p: PanelKey) => void;
  onOpenSettings: () => void;
  showOCR: boolean;
  showAI: boolean;
}

export type ThemeKey = "light" | "sepia" | "dark" | "night";

const THEMES: { key: ThemeKey; label: string; swatch: string; ring: string }[] = [
  { key: "light", label: "Light", swatch: "#ffffff", ring: "rgba(0,0,0,0.18)" },
  { key: "sepia", label: "Sepia", swatch: "#f4ecd8", ring: "rgba(74,63,42,0.35)" },
  { key: "dark",  label: "Dark",  swatch: "#2b2b2b", ring: "rgba(255,255,255,0.25)" },
  { key: "night", label: "Night", swatch: "#0e0e0e", ring: "rgba(255,255,255,0.25)" },
];

type PopoverType = "file" | "highlight" | "text" | "shapes" | "draw" | null;

type RibbonTab = "home" | "comment" | "edit" | "view" | "protect" | "tools" | "ai";

const isShapeTool = (t: ToolType) => ["line", "arrow", "oval", "rectangle"].includes(t);

/** Quick palette for the Pen style popover. */
const FREEHAND_COLORS: { label: string; value: string }[] = [
  { label: "Bright Blue",   value: "#0D62F2" },
  { label: "Bright Red",    value: "#F21E1E" },
  { label: "Bright Green",  value: "#00C853" },
  { label: "Black",         value: "#000000" },
  { label: "Bright Violet", value: "#9D2BFF" },
];

/** Preset thickness choices for the Pen style popover. */
const FREEHAND_THICKNESSES: { label: string; value: number }[] = [
  { label: "Thin (1px)",        value: 1 },
  { label: "Regular (2px)",     value: 2 },
  { label: "Medium (3px)",      value: 3 },
  { label: "Thick (5px)",       value: 5 },
  { label: "Extra Thick (8px)", value: 8 },
];

/* ── Original inline icon set (Luxor) ─────────────────────────────── */
const S = {
  w: 20, h: 20,
  common: {
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 24 24",
    width: 20,
    height: 20,
  },
};

const Icons = {
  open: <svg {...S.common}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>,
  print: <svg {...S.common}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  save: <svg {...S.common}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  saveCopy: <svg {...S.common}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  close: <svg {...S.common}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  hand: <svg {...S.common}><path d="M6 3.5l12 9.2-5.4.9 3 6-2.5 1.2-3-6L6 18.5z"/></svg>,
  highlight: <svg {...S.common}><path d="M9 11l4 4L20.5 7.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L9 11z"/><path d="M9 11l-2.5 2.5a1.5 1.5 0 0 0 0 2.1L8 17l-4.5 4.5H9l2-2 2-2"/></svg>,
  textBox: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <rect x="1" y="1" width="22" height="22" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="3 2"/>
      <text x="12" y="20" textAnchor="middle" fontFamily="'Times New Roman', Times, serif" fontSize="20" fontWeight="normal" fill="currentColor">T</text>
    </svg>
  ),
  pen: <svg {...S.common}><path d="M2.5 15.5C4.5 9 7.5 4.5 9.5 5.5c2 1-0.5 8 1.5 10s4.5-7.5 6.5-6.5c1.5 0.8-0.5 6 1.5 6.5 0.8 0.2 1.5-0.5 2-1.5"/></svg>,
  shapes: <svg {...S.common}><rect x="3" y="12" width="9" height="9" rx="1"/><circle cx="16" cy="8" r="5.5"/></svg>,
  eraser: (
    <svg {...S.common}>
      <g transform="rotate(45 12 12) scale(0.93 1.12) rotate(-45 12 12)" style={{ transformOrigin: "12px 12px" }}>
        <path d="M20 20H8l-5.3-5.3a1.6 1.6 0 0 1 0-2.27L12.3 2.83a1.6 1.6 0 0 1 2.27 0l6.6 6.6a1.6 1.6 0 0 1 0 2.27L13 20"/>
        <line x1="18" y1="13" x2="9" y2="4"/>
      </g>
    </svg>
  ),
  eraseAll: <svg {...S.common}><path d="M4 20h16"/><path d="M7 16L16.5 6.5a2 2 0 0 1 2.8 0l.2.2a2 2 0 0 1 0 2.8L10 19H6a1 1 0 0 1-1-1v-2z"/><line x1="13" y1="10" x2="16" y2="13"/></svg>,
  thumbnails: <svg {...S.common}><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="3" y="15" width="7" height="6" rx="1"/><line x1="14" y1="5" x2="21" y2="5"/><line x1="14" y1="9" x2="21" y2="9"/><line x1="14" y1="16" x2="21" y2="16"/><line x1="14" y1="20" x2="21" y2="20"/></svg>,
  search: <svg {...S.common}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  split: <svg {...S.common}><rect x="1" y="3" width="10" height="18" rx="1.5"/><rect x="13" y="3" width="10" height="18" rx="1.5"/></svg>,
  readAloud: <svg {...S.common}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>,
  stop: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>,
  screenshot: <svg {...S.common}><path d="M4 8V6a2 2 0 0 1 2-2h2"/><path d="M16 4h2a2 2 0 0 1 2 2v2"/><path d="M20 16v2a2 2 0 0 1-2 2h-2"/><path d="M8 20H6a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/></svg>,
  notes: <svg {...S.common}><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="13" y2="12"/></svg>,
  editText: <svg {...S.common}><path d="M4 7h12M10 7v12"/><path d="M16.5 14.5l3 3-3 3-3-0 0-3 3-3z"/></svg>,
  image: <svg {...S.common}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>,
  whiteout: <svg {...S.common}><rect x="3" y="6" width="18" height="12" rx="1" strokeDasharray="3 2.5"/></svg>,
  watermark: <svg {...S.common}><path d="M12 2.5C12 2.5 5 11 5 15.5a7 7 0 0 0 14 0C19 11 12 2.5 12 2.5z"/></svg>,
  pageNo: (
    <svg {...S.common}>
      <rect x="4" y="3" width="16" height="18" rx="2"/>
      <text x="12" y="16" fontSize="9" fontWeight="700" textAnchor="middle" fill="currentColor" stroke="none">#</text>
    </svg>
  ),
  compress: <svg {...S.common}><polyline points="4 9 9 9 9 4"/><polyline points="20 15 15 15 15 20"/><path d="M9 9L3 3"/><path d="M15 15l6 6"/></svg>,
  fitWidth: <svg {...S.common}><polyline points="7 8 3 12 7 16"/><polyline points="17 8 21 12 17 16"/><line x1="3" y1="12" x2="21" y2="12"/></svg>,
  fitPage: <svg {...S.common}><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>,
  fullscreen: <svg {...S.common}><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>,
  rotateCw: <svg {...S.common}><path d="M21 2v6h-6"/><path d="M21 8C19.6 5 16.8 3 13.5 3 8.8 3 5 6.8 5 11.5S8.8 20 13.5 20c3.3 0 6.2-2 7.6-5"/></svg>,
  rotateCcw: <svg {...S.common}><path d="M3 2v6h6"/><path d="M3 8c1.4-3 4.2-5 7.5-5C15.2 3 19 6.8 19 11.5S15.2 20 10.5 20c-3.3 0-6.2-2-7.6-5"/></svg>,
  info: <svg {...S.common}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  nav: <svg {...S.common}><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>,
  forms: <svg {...S.common}><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  ocr: <svg {...S.common}><path d="M4 7V5a1 1 0 0 1 1-1h2"/><path d="M17 4h2a1 1 0 0 1 1 1v2"/><path d="M20 17v2a1 1 0 0 1-1 1h-2"/><path d="M7 20H5a1 1 0 0 1-1-1v-2"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  ai: <svg {...S.common}><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z"/></svg>,
  settings: <svg {...S.common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  redact: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="12" rx="1" fill="currentColor" stroke="none"/></svg>,
  share: <svg {...S.common}><path d="M12 15V4"/><path d="M8.5 7.5 12 4l3.5 3.5"/><path d="M5 12v6.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V12"/></svg>,
  summarize: <svg {...S.common}><rect x="4" y="3" width="16" height="18" rx="2"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/></svg>,
  question: <svg {...S.common}><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  chevron: (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 5 }}>
      <polyline points="5 8 10 13 15 8" />
    </svg>
  ),
};

/** One icon-over-label ribbon button. */
function RibbonBtn({
  icon, label, active, disabled, onClick, onContextMenu, onMouseDown, title,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  title?: string;
}) {
  return (
    <button
      className={`ribbon-btn ${active ? "active" : ""}`}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseDown={onMouseDown}
      disabled={disabled}
      title={title ?? label}
    >
      <span className="ribbon-btn-icon">{icon}</span>
      <span className="ribbon-btn-label">{label}</span>
    </button>
  );
}

/** A captioned group of ribbon buttons. */
function RibbonGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="ribbon-group">
      {children}
      <span className="ribbon-group-label">{label}</span>
    </div>
  );
}

/** Badge rendered on toggle buttons that are currently applied. */
function OnDot() {
  return (
    <span
      style={{
        position: "absolute", top: 5, right: 7,
        width: 7, height: 7, borderRadius: "50%",
        background: "#DC2626",
      }}
    />
  );
}

export default function Toolbar({
  fileName: _fileName, tool,
  highlightColor, textColor, textSize, textFont, drawColor, drawThickness, shapeFill, isSpeaking,
  showContents, searchOpen, splitView,
  onToggleContents, onToggleSearch, onToggleSplit,
  onToolChange,
  onHighlightColorChange, onTextColorChange, onTextSizeChange, onTextFontChange, onDrawColorChange, onDrawThicknessChange, onShapeFillChange,
  onEraseAll, onReadAloud, onOpenFile, onPrint,
  onOpenWatermark, onOpenPageNo, onAddImage, onOpenCompress, onScreenshot,
  onClearWatermark, onClearPageNo,
  watermarkActive, pageNoActive,
  onShare, sharing,
  onFileSaveAs, onFileSaveCopy, onFileClose,
  theme, onThemeChange,
  onFitWidth, onFitPage, onRotateCw, onRotateCcw, isFullscreen, onToggleFullscreen,
  activePanel, onOpenPanel, onOpenSettings, showOCR, showAI,
}: ToolbarProps) {
  const { beginSignIn, beginSignUp } = useAuthGate();
  const [popover, setPopover] = useState<PopoverType>(null);
  const [ribbonTab, setRibbonTab] = useState<RibbonTab>("home");
  const popoverRef = useRef<HTMLDivElement>(null);
  const [eraserIcon, setEraserIcon] = useState<string | null>(null);
  const eraserUploadRef = useRef<HTMLInputElement>(null);

  const handleEraserIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setEraserIcon(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const toggle = useCallback((p: PopoverType) => {
    setPopover(prev => prev === p ? null : p);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopover(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close any open popover when switching ribbon tabs so a panel never
  // floats over a tab that no longer contains its anchor button.
  const selectTab = useCallback((t: RibbonTab) => {
    setRibbonTab(t);
    setPopover(null);
  }, []);

  const TABS: { key: RibbonTab; label: string; show?: boolean }[] = [
    { key: "home",    label: "Home" },
    { key: "comment", label: "Comment" },
    { key: "edit",    label: "Edit" },
    { key: "view",    label: "View" },
    { key: "protect", label: "Protect" },
    { key: "tools",   label: "Tools" },
    { key: "ai",      label: "AI Assistant", show: showAI },
  ];

  /* ── Shared popover-carrying buttons (used on Home + Comment) ──── */

  const highlightBtn = (
    <div style={{ position: "relative", height: "100%" }}>
      <RibbonBtn
        icon={Icons.highlight}
        label="Highlight"
        active={tool === "highlight"}
        title="Highlighter — drag over text to highlight"
        onClick={() => { onToolChange(tool === "highlight" ? "hand" : "highlight"); toggle("highlight"); }}
      />
      {popover === "highlight" && (
        <div className="popover-panel" style={{ minWidth: 190 }}>
          <div className="popover-label">Highlight Color</div>
          <ColorGrid
            colors={DRAW_COLORS}
            selected={highlightColor}
            onSelect={onHighlightColorChange}
          />
        </div>
      )}
    </div>
  );

  const textBtn = (
    <div style={{ position: "relative", height: "100%" }}>
      <RibbonBtn
        icon={Icons.textBox}
        label="Add Text"
        active={tool === "text"}
        title="Add a text box anywhere on the page"
        onClick={() => { onToolChange(tool === "text" ? "hand" : "text"); toggle("text"); }}
      />
      {popover === "text" && (
        <div className="popover-panel" style={{ minWidth: 170 }}>
          <div className="popover-label">Font</div>
          <select
            value={textFont}
            onChange={(e) => onTextFontChange(e.target.value)}
            style={{
              width: "100%", padding: "5px 8px", marginBottom: 10,
              border: "1px solid rgba(0,0,0,0.15)", borderRadius: 4,
              background: "#fff", color: "#222", fontSize: 12, cursor: "pointer",
            }}
          >
            {TEXT_FONTS.map((f) => (
              <option key={f.key} value={f.key} style={{ fontFamily: f.css }}>{f.label}</option>
            ))}
          </select>
          <div className="popover-label">Font Size</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <button
              style={{ background: "rgba(0,0,0,0.08)", border: "none", color: "#222", borderRadius: 4, width: 22, height: 22, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
              onClick={() => onTextSizeChange(Math.max(8, textSize - 2))}
            >−</button>
            <span style={{ color: "#222", fontSize: 12, minWidth: 28, textAlign: "center" }}>{textSize}px</span>
            <button
              style={{ background: "rgba(0,0,0,0.08)", border: "none", color: "#222", borderRadius: 4, width: 22, height: 22, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
              onClick={() => onTextSizeChange(Math.min(72, textSize + 2))}
            >+</button>
          </div>
          <div className="popover-label">Text Color</div>
          <ColorGrid
            colors={TEXT_COLORS}
            selected={textColor}
            onSelect={onTextColorChange}
          />
        </div>
      )}
    </div>
  );

  const penBtn = (
    <div style={{ position: "relative", height: "100%" }}>
      <RibbonBtn
        icon={Icons.pen}
        label="Pen"
        active={tool === "freehand"}
        title="Freehand pen — draw anywhere on the page"
        onClick={() => { onToolChange(tool === "freehand" ? "hand" : "freehand"); toggle("draw"); }}
      />
      {popover === "draw" && (
        <div className="popover-panel" style={{ minWidth: 190 }}>
          <div className="popover-label">Pen Color</div>
          {!FREEHAND_COLORS.some(c => c.value.toLowerCase() === drawColor.toLowerCase()) && (
            <div
              style={{
                display: "flex", alignItems: "center", gap: 9,
                width: "100%", padding: "5px 8px", marginBottom: 2,
                background: "rgba(13,98,242,0.12)", borderRadius: 4,
                color: "#0D62F2", fontSize: 12,
              }}
            >
              <span style={{
                width: 14, height: 14, borderRadius: "50%", background: drawColor,
                border: "1px solid rgba(0,0,0,0.15)", flexShrink: 0,
              }} />
              Current color
            </div>
          )}
          {FREEHAND_COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => { onDrawColorChange(c.value); if (tool !== "freehand") onToolChange("freehand"); }}
              style={{
                display: "flex", alignItems: "center", gap: 9,
                width: "100%", padding: "5px 8px", marginBottom: 2,
                background: drawColor === c.value ? "rgba(13,98,242,0.12)" : "transparent",
                border: "none", borderRadius: 4,
                color: drawColor === c.value ? "#0D62F2" : "#222",
                cursor: "pointer", fontSize: 12, textAlign: "left",
              }}
            >
              <span style={{
                width: 14, height: 14, borderRadius: "50%", background: c.value,
                border: c.value === "#000000" ? "1px solid rgba(0,0,0,0.25)" : "1px solid rgba(0,0,0,0.08)",
                flexShrink: 0,
              }} />
              {c.label}
            </button>
          ))}
          <div style={{ height: 10 }} />
          <div className="popover-label">Thickness</div>
          <select
            value={drawThickness}
            onChange={e => { onDrawThicknessChange(parseInt(e.target.value, 10)); if (tool !== "freehand") onToolChange("freehand"); }}
            style={{
              width: "100%", padding: "6px 8px", fontSize: 12,
              border: "1px solid rgba(0,0,0,0.15)", borderRadius: 5,
              background: "#fff", color: "#222", cursor: "pointer",
            }}
          >
            {!FREEHAND_THICKNESSES.some(t => t.value === drawThickness) && (
              <option value={drawThickness}>{drawThickness}px</option>
            )}
            {FREEHAND_THICKNESSES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );

  const shapesBtn = (
    <div style={{ position: "relative", height: "100%" }}>
      <RibbonBtn
        icon={Icons.shapes}
        label="Shapes"
        active={isShapeTool(tool) || popover === "shapes"}
        title="Lines, arrows, ovals and rectangles"
        onClick={() => toggle("shapes")}
      />
      {popover === "shapes" && (
        <div className="popover-panel" style={{ minWidth: 210 }}>
          <div className="popover-label">Shape</div>
          <button
            onClick={() => { onToolChange("hand"); setPopover(null); }}
            title="Exit drawing mode — back to the normal pointer"
            style={{
              display: "flex", alignItems: "center", gap: 8,
              width: "100%", padding: "5px 8px", marginBottom: 2,
              background: tool === "hand" ? "rgba(13,98,242,0.12)" : "transparent",
              border: "none", borderRadius: 4,
              color: tool === "hand" ? "#0D62F2" : "#222",
              cursor: "pointer", fontSize: 12, textAlign: "left",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 3.5l12 9.2-5.4.9 3 6-2.5 1.2-3-6L6 18.5z"/>
            </svg>
            Pointer (no tool)
          </button>
          <div style={{ height: 1, background: "rgba(0,0,0,0.08)", margin: "4px 2px 6px" }} />
          {SHAPE_TOOLS.map(st => (
            <button
              key={st.id}
              onClick={() => { onToolChange(st.id); }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                width: "100%", padding: "5px 8px", marginBottom: 2,
                background: tool === st.id ? "rgba(13,98,242,0.12)" : "transparent",
                border: "none", borderRadius: 4,
                color: tool === st.id ? "#0D62F2" : "#222",
                cursor: "pointer", fontSize: 12, textAlign: "left",
              }}
            >
              {st.id === "line" && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="4" y1="20" x2="20" y2="4"/>
                </svg>
              )}
              {st.id === "arrow" && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="20" x2="20" y2="4"/>
                  <polyline points="14 4 20 4 20 10"/>
                </svg>
              )}
              {st.id === "oval" && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <ellipse cx="12" cy="12" rx="10" ry="7"/>
                </svg>
              )}
              {st.id === "rectangle" && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="1"/>
                </svg>
              )}
              {st.label}
            </button>
          ))}
          <div style={{ height: 6 }} />
          <DrawStylePanel
            color={drawColor}
            thickness={drawThickness}
            onColorChange={onDrawColorChange}
            onThicknessChange={onDrawThicknessChange}
          />
          <div style={{ height: 10 }} />
          <label
            style={{
              display: "flex", alignItems: "center", gap: 8,
              color: "#222", fontSize: 12, cursor: "pointer",
              userSelect: "none",
              padding: "6px 4px",
              borderTop: "1px solid rgba(0,0,0,0.08)",
              marginTop: 2,
            }}
            title="Fill rectangle and oval shapes — great for paragraph highlighting"
          >
            <input
              type="checkbox"
              checked={shapeFill}
              onChange={(e) => onShapeFillChange(e.target.checked)}
              style={{ accentColor: "#0D62F2", cursor: "pointer" }}
            />
            <span>Fill shape <span style={{ color: "#666" }}>(rect / oval)</span></span>
          </label>
        </div>
      )}
    </div>
  );

  const eraserBtn = (
    <div style={{ position: "relative", height: "100%" }}>
      <RibbonBtn
        icon={eraserIcon
          ? <img src={eraserIcon} alt="Eraser" style={{ width: 18, height: 18, objectFit: "contain" }} />
          : Icons.eraser}
        label="Eraser"
        active={tool === "eraser"}
        title="Eraser — click annotations to erase. Right-click to upload a custom icon."
        onClick={() => onToolChange(tool === "eraser" ? "hand" : "eraser")}
        onContextMenu={(e) => { e.preventDefault(); eraserUploadRef.current?.click(); }}
        onMouseDown={(e) => { if (e.altKey) { e.preventDefault(); onEraseAll(); } }}
      />
      <input
        ref={eraserUploadRef}
        type="file"
        accept="image/*,.svg"
        style={{ display: "none" }}
        onChange={handleEraserIconUpload}
      />
    </div>
  );

  const eraseAllBtn = (
    <RibbonBtn
      icon={Icons.eraseAll}
      label="Erase All"
      title="Remove every annotation from this document"
      onClick={onEraseAll}
    />
  );

  const readAloudBtn = (
    <RibbonBtn
      icon={isSpeaking ? Icons.stop : Icons.readAloud}
      label={isSpeaking ? "Stop" : "Read Aloud"}
      active={isSpeaking}
      title={isSpeaking ? "Stop reading" : "Read page aloud"}
      onClick={onReadAloud}
    />
  );

  const screenshotBtn = (
    <RibbonBtn
      icon={Icons.screenshot}
      label="Screenshot"
      title="Drag to capture any area of the current page as a PNG image"
      onClick={onScreenshot}
    />
  );

  const compressBtn = (
    <RibbonBtn
      icon={Icons.compress}
      label="Compress"
      title="Reduce file size with compression presets"
      onClick={onOpenCompress}
    />
  );

  const whiteoutBtn = (
    <RibbonBtn
      icon={Icons.whiteout}
      label="Whiteout"
      active={tool === "whiteout"}
      title="Cover any text or area with clean paper-white. Burned into the PDF on save."
      onClick={() => onToolChange(tool === "whiteout" ? "hand" : "whiteout")}
    />
  );

  const watermarkBtn = (
    <div style={{ position: "relative", height: "100%" }}>
      <RibbonBtn
        icon={Icons.watermark}
        label="Watermark"
        active={watermarkActive}
        title={watermarkActive ? "Watermark is on — click to remove it" : "Add a text or image watermark across pages"}
        onClick={() => (watermarkActive ? onClearWatermark() : onOpenWatermark())}
      />
      {watermarkActive && <OnDot />}
    </div>
  );

  const infoBtn = (
    <RibbonBtn
      icon={Icons.info}
      label="Info"
      active={activePanel === "info"}
      title="Document properties and details"
      onClick={() => onOpenPanel("info")}
    />
  );

  /* ── Per-tab ribbon content ─────────────────────────────────────── */

  const ribbonContent: Record<RibbonTab, ReactNode> = {
    home: (
      <>
        <RibbonGroup label="File">
          <RibbonBtn icon={Icons.open} label="Open" title="Open a PDF (Ctrl+O)" onClick={onOpenFile} />
          <RibbonBtn icon={Icons.print} label="Print" onClick={onPrint} />
        </RibbonGroup>
        <RibbonGroup label="Annotate">
          {highlightBtn}
          {textBtn}
          {penBtn}
          {shapesBtn}
          {eraserBtn}
          {eraseAllBtn}
        </RibbonGroup>
        <RibbonGroup label="Navigate">
          <RibbonBtn icon={Icons.thumbnails} label="Thumbnails" active={showContents} title="Page thumbnails" onClick={onToggleContents} />
          <RibbonBtn icon={Icons.search} label="Search" active={searchOpen} title="Find in document (Ctrl+F)" onClick={onToggleSearch} />
          <RibbonBtn icon={Icons.split} label="Two Pages" active={splitView} title="Toggle two-page spread" onClick={onToggleSplit} />
        </RibbonGroup>
        <RibbonGroup label="Assist">
          {readAloudBtn}
          {screenshotBtn}
        </RibbonGroup>
      </>
    ),
    comment: (
      <>
        <RibbonGroup label="Markup">
          {highlightBtn}
          {textBtn}
          {penBtn}
          {shapesBtn}
        </RibbonGroup>
        <RibbonGroup label="Clean Up">
          {eraserBtn}
          {eraseAllBtn}
        </RibbonGroup>
        <RibbonGroup label="Review">
          <RibbonBtn
            icon={Icons.notes}
            label="Notes"
            active={activePanel === "nav"}
            title="Browse annotations and jump between them"
            onClick={() => onOpenPanel("nav")}
          />
        </RibbonGroup>
      </>
    ),
    edit: (
      <>
        <RibbonGroup label="Content">
          <RibbonBtn
            icon={Icons.editText}
            label="Edit Text"
            active={tool === "edittext"}
            title="Click existing PDF text to edit it"
            onClick={() => onToolChange(tool === "edittext" ? "hand" : "edittext")}
          />
          <RibbonBtn icon={Icons.image} label="Add Image" title="Insert PNG, JPG or WEBP onto a page" onClick={onAddImage} />
          {whiteoutBtn}
        </RibbonGroup>
        <RibbonGroup label="Page Marks">
          {watermarkBtn}
          <div style={{ position: "relative", height: "100%" }}>
            <RibbonBtn
              icon={Icons.pageNo}
              label="Page Nos."
              active={pageNoActive}
              title={pageNoActive ? "Page numbers are on — click to remove them" : "Insert page numbers with custom format and position"}
              onClick={() => (pageNoActive ? onClearPageNo() : onOpenPageNo())}
            />
            {pageNoActive && <OnDot />}
          </div>
        </RibbonGroup>
        <RibbonGroup label="Optimize">
          {compressBtn}
        </RibbonGroup>
      </>
    ),
    view: (
      <>
        <RibbonGroup label="Page Theme">
          {THEMES.map((t) => (
            <RibbonBtn
              key={t.key}
              icon={
                <span
                  style={{
                    display: "inline-block", width: 18, height: 18, borderRadius: "50%",
                    background: t.swatch, border: `1px solid ${t.ring}`,
                  }}
                />
              }
              label={t.label}
              active={theme === t.key}
              title={`${t.label} reading theme`}
              onClick={() => onThemeChange(t.key)}
            />
          ))}
        </RibbonGroup>
        <RibbonGroup label="Layout">
          <RibbonBtn icon={Icons.fitWidth} label="Fit Width" onClick={onFitWidth} />
          <RibbonBtn icon={Icons.fitPage} label="Fit Page" onClick={onFitPage} />
          <RibbonBtn
            icon={Icons.fullscreen}
            label={isFullscreen ? "Exit Full" : "Full Screen"}
            active={isFullscreen}
            title={isFullscreen ? "Exit full screen (F11)" : "Full screen (F11)"}
            onClick={onToggleFullscreen}
          />
          <RibbonBtn icon={Icons.split} label="Two Pages" active={splitView} title="Toggle two-page spread" onClick={onToggleSplit} />
          <RibbonBtn icon={Icons.thumbnails} label="Thumbnails" active={showContents} title="Page thumbnails" onClick={onToggleContents} />
        </RibbonGroup>
        <RibbonGroup label="Rotate">
          <RibbonBtn icon={Icons.rotateCw} label="Rotate Right" title="Rotate clockwise (90°)" onClick={onRotateCw} />
          <RibbonBtn icon={Icons.rotateCcw} label="Rotate Left" title="Rotate counter-clockwise (90°)" onClick={onRotateCcw} />
        </RibbonGroup>
        <RibbonGroup label="Capture">
          <RibbonBtn icon={Icons.screenshot} label="Snapshot" title="Capture an area of the page as an image" onClick={onScreenshot} />
        </RibbonGroup>
        <RibbonGroup label="Panels">
          {infoBtn}
          <RibbonBtn
            icon={Icons.nav}
            label="Navigate"
            active={activePanel === "nav"}
            title="Outline, bookmarks and annotations"
            onClick={() => onOpenPanel("nav")}
          />
          <RibbonBtn icon={Icons.settings} label="Settings" title="Reader settings" onClick={onOpenSettings} />
        </RibbonGroup>
      </>
    ),
    protect: (
      <>
        <RibbonGroup label="Conceal">
          <RibbonBtn
            icon={Icons.redact}
            label="Redact"
            active={tool === "redact"}
            title="Permanently hide sensitive text or areas. Burned into the PDF on save."
            onClick={() => onToolChange(tool === "redact" ? "hand" : "redact")}
          />
          {whiteoutBtn}
        </RibbonGroup>
        <RibbonGroup label="Mark Ownership">
          {watermarkBtn}
        </RibbonGroup>
      </>
    ),
    tools: (
      <>
        <RibbonGroup label="Document Tools">
          {showOCR && (
            <RibbonBtn
              icon={Icons.ocr}
              label="OCR"
              active={activePanel === "ocr"}
              title="Recognize text in scanned pages"
              onClick={() => onOpenPanel("ocr")}
            />
          )}
          <RibbonBtn
            icon={Icons.forms}
            label="Forms & Sign"
            active={activePanel === "forms"}
            title="Fill form fields and sign the document"
            onClick={() => onOpenPanel("forms")}
          />
          {compressBtn}
        </RibbonGroup>
        <RibbonGroup label="Capture">
          {screenshotBtn}
          {readAloudBtn}
        </RibbonGroup>
        <RibbonGroup label="Inspect">
          {infoBtn}
        </RibbonGroup>
      </>
    ),
    ai: (
      <>
        <RibbonGroup label="AI Assistant">
          <RibbonBtn
            icon={Icons.ai}
            label="Open AI"
            active={activePanel === "ai"}
            title="Open the AI assistant panel"
            onClick={() => onOpenPanel("ai")}
          />
          <RibbonBtn icon={Icons.summarize} label="Summarize" title="Summarize this document in the AI panel" onClick={() => onOpenPanel("ai")} />
          <RibbonBtn icon={Icons.question} label="Ask PDF" title="Ask questions about this document in the AI panel" onClick={() => onOpenPanel("ai")} />
        </RibbonGroup>
      </>
    ),
  };

  return (
    <div className="luxor-toolbar" ref={popoverRef}>
      {/* ── Row 1: menu strip ─────────────────────────────────── */}
      <div className="luxor-menu-strip">
        <div className="toolbar-brand">
          <span className="toolbar-brand-icon">L</span>
          Luxor PDF
        </div>

        {/* File dropdown */}
        <div style={{ position: "relative" }}>
          <button
            className={`toolbar-menu-word ${popover === "file" ? "active" : ""}`}
            onClick={() => toggle("file")}
            title="File"
          >
            File
            {Icons.chevron}
          </button>

          {popover === "file" && (
            <div
              className="popover-panel edit-menu-panel"
              style={{
                left: 0, transform: "none",
                minWidth: 240, padding: "8px 6px",
                background: "#FFFFFF", color: "#1a1a1a",
                border: "1px solid rgba(0,0,0,0.10)",
                boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
              }}
            >
              {[
                { key: "open",     label: "Open",        shortcut: "Ctrl+O",       icon: Icons.open },
                { key: "saveas",   label: "Save As",     shortcut: "Ctrl+Shift+S", icon: Icons.save },
                { key: "savecopy", label: "Save a Copy", shortcut: "Ctrl+Alt+S",   icon: Icons.saveCopy },
                { key: "print",    label: "Print",       shortcut: "Ctrl+P",       icon: Icons.print },
                { key: "close",    label: "Close",       shortcut: "Ctrl+W",       icon: Icons.close },
              ].map((item, i) => (
                <div key={item.key}>
                  {i === 4 && <div style={{ height: 1, background: "rgba(0,0,0,0.08)", margin: "4px 4px" }} />}
                  <button
                    onClick={() => {
                      setPopover(null);
                      if (item.key === "open") onOpenFile();
                      else if (item.key === "saveas") onFileSaveAs();
                      else if (item.key === "savecopy") onFileSaveCopy();
                      else if (item.key === "print") onPrint();
                      else if (item.key === "close") onFileClose();
                    }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      width: "100%", padding: "7px 10px", marginBottom: 1,
                      background: "transparent",
                      border: "none", borderRadius: 5,
                      color: "#1a1a1a",
                      cursor: "pointer", fontSize: 13, textAlign: "left",
                      fontWeight: 400,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(13,98,242,0.10)"; e.currentTarget.style.color = "#0D62F2"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#1a1a1a"; }}
                  >
                    <span style={{ display: "inline-flex", width: 18, justifyContent: "center" }}>
                      <span style={{ display: "inline-flex", transform: "scale(0.8)" }}>{item.icon}</span>
                    </span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    <span style={{ fontSize: 11, color: "#888", letterSpacing: 0.3 }}>{item.shortcut}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ribbon tab words */}
        {TABS.filter(t => t.show !== false).map((t) => (
          <button
            key={t.key}
            className={`toolbar-menu-word ${ribbonTab === t.key ? "selected" : ""}`}
            onClick={() => selectTab(t.key)}
          >
            {t.label}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        {/* Quick actions, right-aligned */}
        <button
          className={`toolbar-icon-btn ${searchOpen ? "active" : ""}`}
          onClick={onToggleSearch}
          title="Find in document (Ctrl+F)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>
        <button
          className="toolbar-icon-btn"
          onClick={onShare}
          disabled={sharing}
          title={sharing ? "Preparing share link…" : "Share this PDF"}
          style={sharing ? { opacity: 0.5, cursor: "wait" } : undefined}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 15V4"/>
            <path d="M8.5 7.5 12 4l3.5 3.5"/>
            <path d="M5 12v6.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V12"/>
          </svg>
        </button>
        <div style={{ marginLeft: 6, display: "flex", alignItems: "center" }}>
          <AuthMenu
            iconOnly
            variant={theme === "dark" || theme === "night" ? "dark" : "light"}
            onSignIn={beginSignIn}
            onSignUp={beginSignUp}
          />
        </div>
      </div>

      {/* ── Row 2: ribbon ─────────────────────────────────────── */}
      <div className="luxor-ribbon">
        {ribbonContent[showAI ? ribbonTab : (ribbonTab === "ai" ? "home" : ribbonTab)]}
      </div>
    </div>
  );
}
