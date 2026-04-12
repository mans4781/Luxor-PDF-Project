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

const DRAW_COLORS = [
  { label: "Black",   value: "#1a1a1a" },
  { label: "Blue",    value: "#0078D4" },
  { label: "Red",     value: "#E81123" },
  { label: "Magenta", value: "#E3008C" },
  { label: "Violet",  value: "#8764B8" },
  { label: "Green",   value: "#00B294" },
  { label: "Orange",  value: "#FF8C00" },
];

const THICKNESS_OPTIONS = [
  { label: "Thin",     value: 1,  size: 3  },
  { label: "Medium",   value: 2,  size: 5  },
  { label: "Thick",    value: 4,  size: 8  },
  { label: "Heavy",    value: 6,  size: 11 },
  { label: "Very Heavy", value: 10, size: 15 },
];

const SHAPE_TOOLS: { id: ToolType; label: string }[] = [
  { id: "freehand",  label: "Freehand" },
  { id: "line",      label: "Straight Line" },
  { id: "arrow",     label: "Line with Arrow" },
  { id: "oval",      label: "Oval (Shift = Circle)" },
  { id: "rectangle", label: "Rectangle (Shift = Square)" },
];

interface ToolbarProps {
  fileName: string;
  tool: ToolType;
  highlightColor: string;
  textColor: string;
  textSize: number;
  drawColor: string;
  drawThickness: number;
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
  onDrawColorChange: (c: string) => void;
  onDrawThicknessChange: (t: number) => void;
  onEraseAll: () => void;
  onReadAloud: () => void;
  onOpenFile: () => void;
  onDownload: () => void;
  onPrint: () => void;
}

type PopoverType = "highlight" | "text" | "tools" | "edit" | null;

const isShapeTool = (t: ToolType) => ["freehand", "line", "arrow", "oval", "rectangle"].includes(t);

export default function Toolbar({
  fileName, tool,
  highlightColor, textColor, textSize, drawColor, drawThickness, isSpeaking,
  showContents, searchOpen, splitView,
  onToggleContents, onToggleSearch, onToggleSplit,
  onToolChange,
  onHighlightColorChange, onTextColorChange, onTextSizeChange, onDrawColorChange, onDrawThicknessChange,
  onEraseAll, onReadAloud, onOpenFile, onDownload, onPrint,
}: ToolbarProps) {
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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopover(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="luxor-toolbar" ref={popoverRef}>
      {/* ── 1. Thumbnails icon (fixed left) ─────────────────── */}
      <button
        className={`toolbar-btn ${showContents ? "active" : ""}`}
        onClick={onToggleContents}
        title="Page thumbnails"
      >
        <span className="toolbar-tip">Page Contents</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1"/>
          <rect x="3" y="15" width="7" height="6" rx="1"/>
          <line x1="14" y1="5" x2="21" y2="5"/>
          <line x1="14" y1="9" x2="21" y2="9"/>
          <line x1="14" y1="16" x2="21" y2="16"/>
          <line x1="14" y1="20" x2="21" y2="20"/>
        </svg>
      </button>

      <div className="toolbar-sep" />

      {/* ── 2. Edit menu (text word) ────────────────────────── */}
      <div style={{ position: "relative" }}>
        <button
          className={`toolbar-menu-word ${popover === "edit" ? "active" : ""}`}
          onClick={() => toggle("edit")}
          title="Edit"
        >
          Edit
          <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor" style={{ marginLeft: 2, opacity: 0.6 }}>
            <path d="M5 8l5 5 5-5z"/>
          </svg>
        </button>

        {popover === "edit" && (
          <div className="popover-panel" style={{ minWidth: 160, left: 0 }}>
            <div className="popover-label" style={{ color: "#888", fontSize: 11 }}>Coming soon</div>
          </div>
        )}
      </div>

      {/* ── 3. Tools menu (text word) ───────────────────────── */}
      <div style={{ position: "relative" }}>
        <button
          className={`toolbar-menu-word ${popover === "tools" || isShapeTool(tool) ? "active" : ""}`}
          onClick={() => toggle("tools")}
          title="Drawing tools"
        >
          Tools
          <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor" style={{ marginLeft: 2, opacity: 0.6 }}>
            <path d="M5 8l5 5 5-5z"/>
          </svg>
        </button>

        {popover === "tools" && (
          <div className="popover-panel" style={{ minWidth: 200, left: 0 }}>
            <div className="popover-label">Drawing Tool</div>
            {SHAPE_TOOLS.map(st => (
              <button
                key={st.id}
                onClick={() => { onToolChange(st.id); }}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  width: "100%", padding: "5px 8px", marginBottom: 2,
                  background: tool === st.id ? "rgba(255,255,255,0.15)" : "transparent",
                  border: "none", borderRadius: 4,
                  color: tool === st.id ? "#fff" : "#ccc",
                  cursor: "pointer", fontSize: 12, textAlign: "left",
                }}
              >
                {st.id === "freehand" && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M3 17c3-4 6-12 9-12s3 8 6 8 3-4 3-4"/>
                  </svg>
                )}
                {st.id === "line" && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="4" y1="20" x2="20" y2="4"/>
                  </svg>
                )}
                {st.id === "arrow" && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="20" x2="20" y2="4"/>
                    <polyline points="14 4 20 4 20 10"/>
                  </svg>
                )}
                {st.id === "oval" && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <ellipse cx="12" cy="12" rx="10" ry="7"/>
                  </svg>
                )}
                {st.id === "rectangle" && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="1"/>
                  </svg>
                )}
                {st.label}
              </button>
            ))}
            <div style={{ height: 6 }} />
            <div className="popover-label">Color</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {DRAW_COLORS.map(c => (
                <button
                  key={c.value}
                  className={`color-dot ${drawColor === c.value ? "sel" : ""}`}
                  style={{ background: c.value }}
                  title={c.label}
                  onClick={() => onDrawColorChange(c.value)}
                />
              ))}
            </div>
            <div style={{ height: 8 }} />
            <div className="popover-label">Thickness</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {THICKNESS_OPTIONS.map(t => (
                <button
                  key={t.value}
                  title={t.label}
                  onClick={() => onDrawThicknessChange(t.value)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 24, height: 24, border: "none", borderRadius: 4,
                    background: drawThickness === t.value ? "rgba(255,255,255,0.2)" : "transparent",
                    cursor: "pointer", padding: 0,
                  }}
                >
                  <div style={{
                    width: t.size, height: t.size,
                    borderRadius: "50%",
                    background: drawColor,
                    border: drawThickness === t.value ? "1.5px solid #fff" : "1px solid rgba(255,255,255,0.3)",
                  }} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="toolbar-sep" />

      {/* ── 4. Highlighter icon ─────────────────────────────── */}
      <div style={{ position: "relative" }}>
        <button
          className={`toolbar-btn ${tool === "highlight" ? "active" : ""}`}
          onClick={() => { onToolChange(tool === "highlight" ? "hand" : "highlight"); toggle("highlight"); }}
          title="Highlight text"
          style={{ gap: 0, width: 38 }}
        >
          <span className="toolbar-tip">Highlight</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <defs>
              <linearGradient id="hlg" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
                <stop offset="0%" stopColor="#FFD700"/>
                <stop offset="100%" stopColor="#FFA500"/>
              </linearGradient>
            </defs>
            <g transform="rotate(-45, 12, 12)">
              <rect x="9.5" y="1" width="5" height="3.5" rx="1.5" fill="#e69500" stroke="#cc8400" strokeWidth="0.4"/>
              <rect x="9.5" y="4.5" width="5" height="12" rx="0.8" fill="url(#hlg)" stroke="#e69500" strokeWidth="0.3"/>
              <rect x="10.8" y="6" width="1.4" height="8" rx="0.7" fill="white" fillOpacity="0.4"/>
              <path d="M9.5 16.5 L10.8 20.5 L13.2 20.5 L14.5 16.5 Z" fill="#FFA500"/>
              <path d="M10.8 20.5 L12 22.5 L13.2 20.5 Z" fill="#e69500"/>
            </g>
          </svg>
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

      {/* ── 5. Eraser icon ──────────────────────────────────── */}
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="erg" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
                  <stop offset="0%" stopColor="#7B8CDE"/>
                  <stop offset="100%" stopColor="#4A5AC7"/>
                </linearGradient>
              </defs>
              <g transform="rotate(-30, 12, 12)">
                <rect x="7" y="2" width="10" height="13" rx="2" fill="url(#erg)" stroke="#3d4db3" strokeWidth="0.5"/>
                <rect x="8.5" y="4" width="2" height="8" rx="1" fill="white" fillOpacity="0.25"/>
                <rect x="7" y="15" width="10" height="5" rx="1.5" fill="#E8E8E8" stroke="#ccc" strokeWidth="0.4"/>
                <line x1="7" y1="15" x2="17" y2="15" stroke="#bbb" strokeWidth="0.8"/>
              </g>
              <line x1="4" y1="22" x2="20" y2="22" stroke="#999" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          )}
        </button>
        <input
          ref={eraserUploadRef}
          type="file"
          accept="image/*,.svg"
          style={{ display: "none" }}
          onChange={handleEraserIconUpload}
        />
      </div>

      <div className="toolbar-sep" />

      {/* ── Open File ───────────────────────────────────────── */}
      <button className="toolbar-btn" onClick={onOpenFile} title="Open PDF">
        <span className="toolbar-tip">Open PDF</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
      </button>

      {/* ── Text Box ────────────────────────────────────────── */}
      <div style={{ position: "relative" }}>
        <button
          className={`toolbar-btn ${tool === "text" ? "active" : ""}`}
          onClick={() => { onToolChange(tool === "text" ? "hand" : "text"); toggle("text"); }}
          title="Add text box"
          style={{ width: 38 }}
        >
          <span className="toolbar-tip">Text Box</span>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
            <rect x="1" y="1" width="22" height="22" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeDasharray="3 2"/>
            <text x="12" y="20" textAnchor="middle" fontFamily="'Times New Roman', Times, serif" fontSize="20" fontWeight="normal" fill="currentColor">T</text>
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

      {/* ── Read Aloud ─────────────────────────────────────── */}
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

      {fileName && (
        <span className="toolbar-label" style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={fileName}>
          {fileName}
        </span>
      )}

      <div className="toolbar-sep" />

      <button
        className={`toolbar-btn ${splitView ? "active" : ""}`}
        onClick={onToggleSplit}
        title="Toggle two-page spread"
      >
        <span className="toolbar-tip">Two-page view</span>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="10" height="18" rx="1.5"/>
          <rect x="13" y="3" width="10" height="18" rx="1.5"/>
        </svg>
      </button>

      <button
        className={`toolbar-btn ${searchOpen ? "active" : ""}`}
        onClick={onToggleSearch}
        title="Find in document (Ctrl+F)"
      >
        <span className="toolbar-tip">Find (Ctrl+F)</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </button>

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
