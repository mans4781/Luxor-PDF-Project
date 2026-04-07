import { useRef, useState, useCallback, useEffect } from "react";
import { ToolType } from "@/lib/annotationTypes";

const HIGHLIGHT_COLORS = [
  { label: "Yellow",     value: "#FFE566" },
  { label: "Light Blue", value: "#93C5FD" },
  { label: "Green",      value: "#86EFAC" },
  { label: "Pink",       value: "#F9A8D4" },
  { label: "Light Red",  value: "#FCA5A5" },
];

const TEXT_COLORS = [
  { label: "Black", value: "#1a1a1a" },
  { label: "Blue",  value: "#1d4ed8" },
  { label: "Green", value: "#15803d" },
  { label: "Red",   value: "#dc2626" },
];

const ZOOM_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0];

interface ToolbarProps {
  fileName: string;
  currentPage: number;
  totalPages: number;
  zoom: number;
  tool: ToolType;
  highlightColor: string;
  textColor: string;
  textSize: number;
  isSpeaking: boolean;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
  onToolChange: (tool: ToolType) => void;
  onHighlightColorChange: (c: string) => void;
  onTextColorChange: (c: string) => void;
  onTextSizeChange: (s: number) => void;
  onEraseAll: () => void;
  onReadAloud: () => void;
  onOpenFile: () => void;
  onDownload: () => void;
  onPrint: () => void;
}

type PopoverType = "highlight" | "text" | null;

export default function Toolbar({
  fileName, currentPage, totalPages, zoom, tool,
  highlightColor, textColor, textSize, isSpeaking,
  onPageChange, onZoomChange, onToolChange,
  onHighlightColorChange, onTextColorChange, onTextSizeChange,
  onEraseAll, onReadAloud, onOpenFile, onDownload, onPrint,
}: ToolbarProps) {
  const pageInputRef = useRef<HTMLInputElement>(null);
  const [popover, setPopover] = useState<PopoverType>(null);
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

  // Close popover on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopover(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handlePageInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const val = parseInt((e.target as HTMLInputElement).value, 10);
      if (!isNaN(val) && val >= 1 && val <= totalPages) onPageChange(val);
      else (e.target as HTMLInputElement).value = String(currentPage);
    }
  };

  return (
    <div className="luxor-toolbar" ref={popoverRef}>
      {/* Brand */}
      <div className="toolbar-brand">
        <div className="toolbar-brand-icon">L</div>
      </div>

      <button className="toolbar-btn" onClick={onOpenFile} title="Open PDF">
        <span className="toolbar-tip">Open PDF</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
      </button>

      <div className="toolbar-sep" />

      {/* Page navigation */}
      {totalPages > 0 && (
        <>
          <button className="toolbar-btn" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}>
            <span className="toolbar-tip">Previous</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
          </button>
          <input
            ref={pageInputRef}
            type="number"
            className="toolbar-input"
            defaultValue={currentPage}
            key={currentPage}
            onKeyDown={handlePageInput}
            style={{ width: 40 }}
          />
          <span className="toolbar-label">/ {totalPages}</span>
          <button className="toolbar-btn" onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages}>
            <span className="toolbar-tip">Next</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
          </button>
          <div className="toolbar-sep" />
        </>
      )}

      {/* Zoom */}
      <button className="toolbar-btn" onClick={() => onZoomChange(Math.max(0.25, zoom - 0.15))}>
        <span className="toolbar-tip">Zoom out</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
      </button>
      <select
        className="toolbar-select"
        value={ZOOM_PRESETS.includes(zoom) ? zoom : "custom"}
        onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) onZoomChange(v); }}
      >
        {ZOOM_PRESETS.map(z => <option key={z} value={z}>{Math.round(z * 100)}%</option>)}
        {!ZOOM_PRESETS.includes(zoom) && <option value="custom">{Math.round(zoom * 100)}%</option>}
      </select>
      <button className="toolbar-btn" onClick={() => onZoomChange(Math.min(5, zoom + 0.15))}>
        <span className="toolbar-tip">Zoom in</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
      </button>

      <div className="toolbar-sep" />

      {/* ── Feature 1: Highlight ────────────────────────────────────────── */}
      <div style={{ position: "relative" }}>
        <button
          className={`toolbar-btn ${tool === "highlight" ? "active" : ""}`}
          onClick={() => { onToolChange(tool === "highlight" ? "hand" : "highlight"); toggle("highlight"); }}
          title="Highlight text"
          style={{ gap: 0, width: 38 }}
        >
          <span className="toolbar-tip">Highlight</span>
          {/* Highlighter icon — realistic marker pen */}
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            {/* Cap */}
            <rect x="7" y="1" width="10" height="5" rx="2"/>
            {/* Body */}
            <rect x="7" y="6" width="10" height="11" rx="1"/>
            {/* Window stripe on body */}
            <line x1="9" y1="9" x2="15" y2="9" strokeWidth="2.5" strokeOpacity="0.45"/>
            {/* Chisel tip */}
            <path d="M9 17 L8 22 L16 22 L15 17"/>
          </svg>
          {/* Color dot */}
          <div style={{
            position: "absolute", bottom: 3, right: 3,
            width: 7, height: 7, borderRadius: "50%",
            background: highlightColor, border: "1px solid rgba(255,255,255,0.4)"
          }} />
        </button>

        {popover === "highlight" && (
          <div className="popover-panel">
            <div className="popover-label">Highlight Color</div>
            <div style={{ display: "flex", gap: 7 }}>
              {HIGHLIGHT_COLORS.map(c => (
                <button
                  key={c.value}
                  className={`color-dot ${highlightColor === c.value ? "sel" : ""}`}
                  style={{ background: c.value }}
                  title={c.label}
                  onClick={() => { onHighlightColorChange(c.value); }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Feature 2: Eraser ──────────────────────────────────────────── */}
      <div style={{ position: "relative" }}>
        <button
          className="toolbar-btn"
          onClick={onEraseAll}
          title="Erase all highlights — right-click to upload custom icon"
          onContextMenu={e => { e.preventDefault(); eraserUploadRef.current?.click(); }}
          style={{ position: "relative", overflow: "visible" }}
        >
          <span className="toolbar-tip">Erase Highlights (right-click to change icon)</span>
          {eraserIcon ? (
            <img src={eraserIcon} alt="Eraser" style={{ width: 18, height: 18, objectFit: "contain" }} />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="eg" x1="1" y1="1" x2="0" y2="0" gradientUnits="objectBoundingBox">
                  <stop offset="0%" stopColor="#00cfff"/>
                  <stop offset="100%" stopColor="#3a50f0"/>
                </linearGradient>
              </defs>
              {/* Main eraser body — rounded rect tilted ~42° */}
              <g transform="rotate(-42, 12, 11)">
                {/* Upper body (label area) */}
                <rect x="6" y="2" width="12" height="13" rx="3" fill="url(#eg)"/>
                {/* Lower tip (rubber section) */}
                <rect x="6" y="15" width="12" height="5" rx="1.5" fill="#00cfff" fillOpacity="0.75"/>
                {/* Divider stripe */}
                <line x1="6" y1="15" x2="18" y2="15" stroke="white" strokeWidth="1.2" strokeOpacity="0.6"/>
              </g>
              {/* Baseline / erasing surface */}
              <line x1="3" y1="22" x2="15" y2="22" stroke="url(#eg)" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          )}
          {/* Upload badge */}
          <div style={{
            position: "absolute", top: 1, right: 1,
            width: 9, height: 9, borderRadius: "50%",
            background: "#4f8ef7", display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: 7, color: "#fff", fontWeight: 700,
            lineHeight: 1, cursor: "pointer",
          }} title="Right-click to upload icon">↑</div>
        </button>
        <input
          ref={eraserUploadRef}
          type="file"
          accept="image/*,.svg"
          style={{ display: "none" }}
          onChange={handleEraserIconUpload}
        />
      </div>

      {/* ── Feature 3: Text Box ────────────────────────────────────────── */}
      <div style={{ position: "relative" }}>
        <button
          className={`toolbar-btn ${tool === "text" ? "active" : ""}`}
          onClick={() => { onToolChange(tool === "text" ? "hand" : "text"); toggle("text"); }}
          title="Add text box"
          style={{ width: 38 }}
        >
          <span className="toolbar-tip">Text Box</span>
          {/* Text cursor / I-beam icon */}
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" strokeLinecap="round" strokeLinejoin="round">
            {/* Top serif bar */}
            <rect x="5" y="2" width="14" height="2.5" rx="1.2"/>
            {/* Left stem going down from top serif */}
            <rect x="8.5" y="4.5" width="3" height="6" rx="0.8"/>
            {/* Right stem going down from top serif */}
            <rect x="12.5" y="4.5" width="3" height="6" rx="0.8"/>
            {/* Middle connector */}
            <rect x="5" y="10.8" width="14" height="2.5" rx="1.2"/>
            {/* Left stem going down to bottom serif */}
            <rect x="8.5" y="13.5" width="3" height="6" rx="0.8"/>
            {/* Right stem going down to bottom serif */}
            <rect x="12.5" y="13.5" width="3" height="6" rx="0.8"/>
            {/* Bottom serif bar */}
            <rect x="5" y="19.5" width="14" height="2.5" rx="1.2"/>
          </svg>
        </button>

        {popover === "text" && (
          <div className="popover-panel" style={{ minWidth: 170 }}>
            <div className="popover-label">Font Size</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <button
                style={{ background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", borderRadius: 4, width: 22, height: 22, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
                onClick={() => onTextSizeChange(Math.max(8, textSize - 2))}
              >−</button>
              <span style={{ color: "#ccc", fontSize: 12, minWidth: 28, textAlign: "center" }}>{textSize}px</span>
              <button
                style={{ background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", borderRadius: 4, width: 22, height: 22, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
                onClick={() => onTextSizeChange(Math.min(72, textSize + 2))}
              >+</button>
            </div>
            <div className="popover-label">Text Color</div>
            <div style={{ display: "flex", gap: 7 }}>
              {TEXT_COLORS.map(c => (
                <button
                  key={c.value}
                  className={`color-dot ${textColor === c.value ? "sel" : ""}`}
                  style={{ background: c.value }}
                  title={c.label}
                  onClick={() => onTextColorChange(c.value)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Feature 4: Read Aloud ─────────────────────────────────────── */}
      <button
        className={`toolbar-btn ${isSpeaking ? "active" : ""}`}
        onClick={onReadAloud}
        title={isSpeaking ? "Stop reading" : "Read page aloud"}
      >
        <span className="toolbar-tip">{isSpeaking ? "Stop" : "Read Aloud"}</span>
        {isSpeaking ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
          </svg>
        )}
      </button>

      <div style={{ flex: 1 }} />

      {/* File name */}
      {fileName && (
        <span className="toolbar-label" style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={fileName}>
          {fileName}
        </span>
      )}

      <div className="toolbar-sep" />

      <button className="toolbar-btn" onClick={onPrint} title="Print">
        <span className="toolbar-tip">Print</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
        </svg>
      </button>
      <button className="toolbar-btn" onClick={onDownload} title="Download">
        <span className="toolbar-tip">Download</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </button>
    </div>
  );
}
