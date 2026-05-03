import { useRef, useState, useCallback, useEffect, type ReactNode } from "react";
import { AuthMenu } from "@workspace/luxor-auth-ui";
import { ToolType } from "@/lib/annotationTypes";
import {
  HIGHLIGHT_COLORS as PALETTE_HIGHLIGHT,
  DRAW_PALETTE as PALETTE_DRAW,
  DRAW_THICKNESS,
} from "@/lib/annotationColors";

// Toolbar swatches are derived from the central palette in
// src/lib/annotationColors.ts. The 30-color DRAW_PALETTE is shared by
// the pen, all shape tools, and the Add-Text color picker so every
// drawing-related surface uses one consistent color system.
const HIGHLIGHT_COLORS = PALETTE_HIGHLIGHT.map((c) => ({ label: c.name, value: c.value }));
const TEXT_COLORS = PALETTE_DRAW.map((c) => ({ label: c.name, value: c.value }));
const DRAW_COLORS = PALETTE_DRAW.map((c) => ({ label: c.name, value: c.value }));

/**
 * 6-column circular color swatch grid. Selected swatch shows a blue
 * ring (matches the spec's premium reference image). Reused by every
 * drawing-related popover (pen, shape tools, add-text).
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
 * share one consistent style panel. `standalone` wraps it in its own
 * popover-panel so the Draw button can drop it in directly.
 */
function DrawStylePanel({
  color, thickness, onColorChange, onThicknessChange, standalone,
}: {
  color: string;
  thickness: number;
  onColorChange: (c: string) => void;
  onThicknessChange: (t: number) => void;
  standalone?: boolean;
}) {
  const previewSize = Math.max(2, Math.min(DRAW_THICKNESS.max, thickness));
  const inner = (
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
  if (!standalone) return inner;
  return (
    <div className="popover-panel" style={{ minWidth: 230 }}>
      {inner}
    </div>
  );
}

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
  onDrawColorChange: (c: string) => void;
  onDrawThicknessChange: (t: number) => void;
  onShapeFillChange: (v: boolean) => void;
  onEraseAll: () => void;
  onReadAloud: () => void;
  onOpenFile: () => void;
  onDownload: () => void;
  onPrint: () => void;
  onOpenWatermark: () => void;
  onOpenPageNo: () => void;
  onAddImage: () => void;
  onOpenCompress: () => void;
  onClearWatermark: () => void;
  onClearPageNo: () => void;
  watermarkActive: boolean;
  pageNoActive: boolean;
}

type PopoverType = "highlight" | "text" | "tools" | "edit" | "draw" | null;

/**
 * Edit menu items. The dropdown UI is shipped now; the feature
 * implementations (true burn-in redaction, native image embedding,
 * watermark/page-number export, in-place text editing, image
 * recompression) are tracked as separate follow-up tasks because each
 * one needs pdf-lib integration and its own dedicated modal/tool.
 * Clicking any item opens a "Coming soon" stub modal.
 */
type EditFeatureKey = "redact" | "image" | "watermark" | "pageno" | "edittext" | "compress";

interface EditFeatureDef {
  key: EditFeatureKey;
  label: string;
  desc: string;
  icon: ReactNode;
}

const EDIT_FEATURES: EditFeatureDef[] = [
  {
    key: "redact",
    label: "Redact",
    desc: "Permanently hide sensitive text or areas. Burned into the PDF on save.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="6" width="18" height="12" rx="1" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    key: "image",
    label: "Add Image",
    desc: "Insert PNG, JPG or WEBP onto a page. Drag, resize, rotate.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="9" cy="9" r="2"/>
        <path d="M21 15l-5-5L5 21"/>
      </svg>
    ),
  },
  {
    key: "watermark",
    label: "Add Watermark",
    desc: "Text or image watermark across pages with rotation, opacity and position.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2.5C12 2.5 5 11 5 15.5a7 7 0 0 0 14 0C19 11 12 2.5 12 2.5z"/>
      </svg>
    ),
  },
  {
    key: "pageno",
    label: "Add Page No.",
    desc: "Insert page numbers with custom format, font and position.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="3" width="16" height="18" rx="2"/>
        <text x="12" y="16" fontSize="9" fontWeight="700" textAnchor="middle" fill="currentColor" stroke="none">#</text>
      </svg>
    ),
  },
  {
    key: "edittext",
    label: "Edit Text",
    desc: "Click existing PDF text to edit it (overlay-based, flattened on save).",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7h12M10 7v12"/>
        <path d="M16.5 14.5l3 3-3 3-3-0 0-3 3-3z"/>
      </svg>
    ),
  },
  {
    key: "compress",
    label: "Compress This PDF",
    desc: "Reduce file size with low / medium / high compression presets.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 9 9 9 9 4"/>
        <polyline points="20 15 15 15 15 20"/>
        <path d="M9 9L3 3"/>
        <path d="M15 15l6 6"/>
      </svg>
    ),
  },
];

const isShapeTool = (t: ToolType) => ["freehand", "line", "arrow", "oval", "rectangle"].includes(t);

export default function Toolbar({
  fileName, tool,
  highlightColor, textColor, textSize, drawColor, drawThickness, shapeFill, isSpeaking,
  showContents, searchOpen, splitView,
  onToggleContents, onToggleSearch, onToggleSplit,
  onToolChange,
  onHighlightColorChange, onTextColorChange, onTextSizeChange, onDrawColorChange, onDrawThicknessChange, onShapeFillChange,
  onEraseAll, onReadAloud, onOpenFile, onDownload, onPrint,
  onOpenWatermark, onOpenPageNo, onAddImage, onOpenCompress,
  onClearWatermark, onClearPageNo,
  watermarkActive, pageNoActive,
}: ToolbarProps) {
  const [popover, setPopover] = useState<PopoverType>(null);
  // Which Edit-menu feature modal is currently open (null = none).
  // Each value matches one of the 6 Edit menu items. The actual
  // feature implementations are tracked as separate follow-up tasks;
  // this dialog is the user-facing stub for now.
  const [editStub, setEditStub] = useState<EditFeatureKey | null>(null);
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
          <div
            className="popover-panel edit-menu-panel"
            style={{ minWidth: 230, left: 0, transform: "none", padding: "6px 6px" }}
          >
            {EDIT_FEATURES.map((f) => {
              const isLive = f.key === "watermark" || f.key === "pageno" || f.key === "redact" || f.key === "image" || f.key === "edittext" || f.key === "compress";
              const isActive =
                (f.key === "watermark" && watermarkActive) ||
                (f.key === "pageno" && pageNoActive) ||
                (f.key === "redact" && tool === "redact") ||
                (f.key === "edittext" && tool === "edittext");
              return (
              <button
                key={f.key}
                title={f.desc}
                onClick={() => {
                  setPopover(null);
                  // Toggle pattern: first click enables / opens, second click disables / clears.
                  if (f.key === "watermark") (watermarkActive ? onClearWatermark() : onOpenWatermark());
                  else if (f.key === "pageno") (pageNoActive ? onClearPageNo() : onOpenPageNo());
                  else if (f.key === "redact") onToolChange(tool === "redact" ? "hand" : "redact");
                  else if (f.key === "image") onAddImage();
                  else if (f.key === "edittext") onToolChange(tool === "edittext" ? "hand" : "edittext");
                  else if (f.key === "compress") onOpenCompress();
                  else setEditStub(f.key);
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
                <span style={{ display: "inline-flex", width: 18, justifyContent: "center" }}>{f.icon}</span>
                <span style={{ flex: 1 }}>{f.label}</span>
                {isActive && (
                  <span style={{
                    fontSize: 9, fontWeight: 500, letterSpacing: 0.5,
                    padding: "2px 6px", borderRadius: 999,
                    background: "#0D62F2",
                    color: "#fff",
                  }}>ON</span>
                )}
              </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Edit feature stub modal ─────────────────────────── */}
      {editStub && (() => {
        const f = EDIT_FEATURES.find(x => x.key === editStub)!;
        return (
          <div
            onClick={() => setEditStub(null)}
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
              zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#FFFFFF", color: "#1a1a1a",
                width: 420, maxWidth: "92vw",
                borderRadius: 12, padding: "22px 22px 18px",
                boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
                fontFamily: "inherit",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 8,
                  background: "rgba(13,98,242,0.12)", color: "#0D62F2",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 600 }}>{f.label}</div>
                  <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 0.6, marginTop: 2 }}>Coming soon</div>
                </div>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: "#444", marginBottom: 18 }}>
                {f.desc}
                <br /><br />
                This feature is being implemented as a dedicated follow-up task so it can be built properly with native PDF burn-in via pdf-lib, rather than a temporary on-screen overlay. The Edit menu and dropdown are live now so the workflow is in place.
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button
                  onClick={() => setEditStub(null)}
                  style={{
                    background: "#0D62F2", color: "#fff",
                    border: "none", borderRadius: 6,
                    padding: "8px 18px", fontSize: 13, fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
                  background: tool === st.id ? "rgba(13,98,242,0.12)" : "transparent",
                  border: "none", borderRadius: 4,
                  color: tool === st.id ? "#0D62F2" : "#222",
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

      <div className="toolbar-sep" />

      {/* ── 4. Highlighter icon ─────────────────────────────── */}
      <div style={{ position: "relative" }}>
        <button
          className={`toolbar-btn annot-btn ${tool === "highlight" ? "active" : ""}`}
          onClick={() => { onToolChange(tool === "highlight" ? "hand" : "highlight"); toggle("highlight"); }}
          title="Highlight"
        >
          <span className="toolbar-tip">Highlight</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l-6 6v4h4l6-6"/>
            <path d="M22 12.5l-3-3a1.5 1.5 0 0 0-2.12 0L8 18.38l5.12 5.12 8.88-8.88a1.5 1.5 0 0 0 0-2.12z" transform="translate(-1 -3.5)"/>
            <line x1="14" y1="6" x2="20" y2="12"/>
          </svg>
          <span
            className="annot-color-swatch"
            style={{ background: highlightColor }}
          />
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

      {/* ── 4b. Draw / Pen icon ─────────────────────────────── */}
      <div style={{ position: "relative" }}>
        <button
          className={`toolbar-btn annot-btn ${tool === "freehand" ? "active" : ""}`}
          onClick={() => { onToolChange(tool === "freehand" ? "hand" : "freehand"); toggle("draw"); }}
          title="Draw"
        >
          <span className="toolbar-tip">Draw</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19l7-7 3 3-7 7-3-3z"/>
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
            <path d="M2 2l7.586 7.586"/>
            <circle cx="11" cy="11" r="1.6" fill="currentColor"/>
          </svg>
          <span
            className="annot-color-swatch"
            style={{ background: drawColor }}
          />
        </button>

        {popover === "draw" && (
          <DrawStylePanel
            color={drawColor}
            thickness={drawThickness}
            onColorChange={onDrawColorChange}
            onThicknessChange={onDrawThicknessChange}
            standalone
          />
        )}
      </div>

      {/* ── 5. Eraser icon ──────────────────────────────────── */}
      <div style={{ position: "relative" }}>
        <button
          className={`toolbar-btn annot-btn ${tool === "eraser" ? "active" : ""}`}
          onClick={() => onToolChange(tool === "eraser" ? "hand" : "eraser")}
          title="Eraser — click annotations to erase. Alt+click = clear all highlights. Right-click to upload a custom icon."
          onContextMenu={e => { e.preventDefault(); eraserUploadRef.current?.click(); }}
          onAuxClick={e => { if (e.altKey) onEraseAll(); }}
          onMouseDown={e => { if (e.altKey) { e.preventDefault(); onEraseAll(); } }}
          style={{ position: "relative", overflow: "visible" }}
        >
          <span className="toolbar-tip">Eraser</span>
          {eraserIcon ? (
            <img src={eraserIcon} alt="Eraser" style={{ width: 18, height: 18, objectFit: "contain" }} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 20H8l-5.3-5.3a1.6 1.6 0 0 1 0-2.27L12.3 2.83a1.6 1.6 0 0 1 2.27 0l6.6 6.6a1.6 1.6 0 0 1 0 2.27L13 20"/>
              <line x1="18" y1="13" x2="9" y2="4"/>
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

      <div style={{ marginLeft: 8, display: "flex", alignItems: "center" }}>
        <AuthMenu variant="dark" />
      </div>
    </div>
  );
}
