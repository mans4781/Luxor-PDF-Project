import { useRef, useState, useCallback } from "react";
import { ToolType } from "@/lib/annotationTypes";
import { HIGHLIGHT_COLORS, PEN_COLORS } from "@/lib/colors";

interface ToolbarProps {
  fileName: string;
  currentPage: number;
  totalPages: number;
  zoom: number;
  tool: ToolType;
  sidebarOpen: boolean;
  penColor: string;
  penSize: number;
  highlightColor: string;
  eraserSize: number;
  textColor: string;
  textSize: number;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
  onToolChange: (tool: ToolType) => void;
  onSidebarToggle: () => void;
  onOpenFile: () => void;
  onPenColorChange: (c: string) => void;
  onPenSizeChange: (s: number) => void;
  onHighlightColorChange: (c: string) => void;
  onEraserSizeChange: (s: number) => void;
  onTextColorChange: (c: string) => void;
  onTextSizeChange: (s: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onDownload: () => void;
  onPrint: () => void;
}

type PopoverType = "highlight-color" | "pen-color" | "pen-size" | "eraser-size" | "text-opts" | "zoom" | null;

const ZOOM_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0];

export default function Toolbar({
  fileName, currentPage, totalPages, zoom, tool, sidebarOpen,
  penColor, penSize, highlightColor, eraserSize, textColor, textSize,
  onPageChange, onZoomChange, onToolChange, onSidebarToggle, onOpenFile,
  onPenColorChange, onPenSizeChange, onHighlightColorChange, onEraserSizeChange,
  onTextColorChange, onTextSizeChange, onUndo, onRedo, canUndo, canRedo,
  onDownload, onPrint,
}: ToolbarProps) {
  const [popover, setPopover] = useState<PopoverType>(null);
  const pageInputRef = useRef<HTMLInputElement>(null);

  const toggle = useCallback((p: PopoverType) => {
    setPopover(prev => prev === p ? null : p);
  }, []);

  const handlePageInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const val = parseInt((e.target as HTMLInputElement).value, 10);
      if (!isNaN(val) && val >= 1 && val <= totalPages) onPageChange(val);
      else (e.target as HTMLInputElement).value = String(currentPage);
    }
  };

  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="luxor-toolbar">
      {/* Brand */}
      <div className="toolbar-brand">
        <div className="toolbar-brand-icon">L</div>
        <span style={{ display: "none" }} className="sm:inline">Luxor</span>
      </div>

      {/* Sidebar toggle */}
      <button className={`toolbar-btn ${sidebarOpen ? "active" : ""}`} onClick={onSidebarToggle} title="Toggle sidebar">
        <span className="toolbar-tip">Sidebar</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1" y="2" width="5" height="12" rx="1" opacity="0.5"/>
          <rect x="8" y="2" width="7" height="2" rx="1"/>
          <rect x="8" y="7" width="7" height="2" rx="1"/>
          <rect x="8" y="12" width="7" height="2" rx="1"/>
        </svg>
      </button>

      <button className="toolbar-btn" onClick={onOpenFile}>
        <span className="toolbar-tip">Open PDF</span>
        📁
      </button>

      <div className="toolbar-sep" />

      {/* Undo/Redo */}
      <button className="toolbar-btn" onClick={onUndo} disabled={!canUndo}>
        <span className="toolbar-tip">Undo</span>↩
      </button>
      <button className="toolbar-btn" onClick={onRedo} disabled={!canRedo}>
        <span className="toolbar-tip">Redo</span>↪
      </button>

      <div className="toolbar-sep" />

      {/* Tools */}
      <button
        className={`toolbar-btn ${tool === "hand" ? "active" : ""}`}
        onClick={() => onToolChange("hand")}
      >
        <span className="toolbar-tip">Pan (H)</span>✋
      </button>

      <button
        className={`toolbar-btn ${tool === "select" ? "active" : ""}`}
        onClick={() => onToolChange("select")}
      >
        <span className="toolbar-tip">Select (S)</span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <path d="M2 2l4 10 2-4 4-2L2 2z"/>
        </svg>
      </button>

      {/* Highlight */}
      <div style={{ position: "relative" }}>
        <button
          className={`toolbar-btn ${tool === "highlight" ? "active" : ""}`}
          onClick={() => { onToolChange("highlight"); toggle("highlight-color"); }}
          style={{ gap: 0 }}
        >
          <span className="toolbar-tip">Highlight (H)</span>
          <span style={{ fontSize: 14 }}>🖊</span>
          <div style={{ position: "absolute", bottom: 3, right: 3, width: 8, height: 8, borderRadius: "50%", background: highlightColor, border: "1px solid rgba(255,255,255,0.3)" }} />
        </button>
        {popover === "highlight-color" && (
          <div className="popover-panel">
            <div className="popover-label">Highlight Color</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {HIGHLIGHT_COLORS.map(c => (
                <div
                  key={c.value}
                  className={`color-dot ${highlightColor === c.value ? "sel" : ""}`}
                  style={{ background: c.value }}
                  title={c.label}
                  onClick={() => { onHighlightColorChange(c.value); setPopover(null); }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pencil */}
      <div style={{ position: "relative" }}>
        <button
          className={`toolbar-btn ${tool === "pencil" ? "active" : ""}`}
          onClick={() => { onToolChange("pencil"); toggle("pen-color"); }}
        >
          <span className="toolbar-tip">Draw (P)</span>
          <span style={{ fontSize: 14 }}>✏️</span>
          <div style={{ position: "absolute", bottom: 3, right: 3, width: 8, height: 8, borderRadius: "50%", background: penColor, border: "1px solid rgba(255,255,255,0.3)" }} />
        </button>
        {popover === "pen-color" && (
          <div className="popover-panel">
            <div className="popover-label">Pen Color</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {PEN_COLORS.map(c => (
                <div
                  key={c.value}
                  className={`color-dot ${penColor === c.value ? "sel" : ""}`}
                  style={{ background: c.value }}
                  title={c.label}
                  onClick={() => { onPenColorChange(c.value); }}
                />
              ))}
            </div>
            <div className="popover-label">Size</div>
            <input
              type="range" min={1} max={20} value={penSize}
              className="size-slider"
              onChange={e => onPenSizeChange(Number(e.target.value))}
            />
            <span style={{ color: "#aaa", fontSize: 11 }}> {penSize}px</span>
          </div>
        )}
      </div>

      {/* Eraser */}
      <div style={{ position: "relative" }}>
        <button
          className={`toolbar-btn ${tool === "eraser" ? "active" : ""}`}
          onClick={() => { onToolChange("eraser"); toggle("eraser-size"); }}
        >
          <span className="toolbar-tip">Eraser (E)</span>🧹
        </button>
        {popover === "eraser-size" && (
          <div className="popover-panel">
            <div className="popover-label">Eraser Size</div>
            <input
              type="range" min={8} max={60} value={eraserSize}
              className="size-slider"
              onChange={e => onEraserSizeChange(Number(e.target.value))}
            />
            <span style={{ color: "#aaa", fontSize: 11 }}> {eraserSize}px</span>
          </div>
        )}
      </div>

      {/* Text */}
      <div style={{ position: "relative" }}>
        <button
          className={`toolbar-btn ${tool === "text" ? "active" : ""}`}
          onClick={() => { onToolChange("text"); toggle("text-opts"); }}
        >
          <span className="toolbar-tip">Add Text (T)</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: tool === "text" ? "#4f8ef7" : "inherit" }}>T</span>
        </button>
        {popover === "text-opts" && (
          <div className="popover-panel" style={{ minWidth: 160 }}>
            <div className="popover-label">Text Color</div>
            <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
              {["#1a1a1a","#1d4ed8","#dc2626","#15803d","#6d28d9"].map(c => (
                <div key={c} className={`color-dot ${textColor === c ? "sel" : ""}`} style={{ background: c }} onClick={() => onTextColorChange(c)} />
              ))}
            </div>
            <div className="popover-label">Font Size</div>
            <input
              type="range" min={8} max={48} value={textSize}
              className="size-slider"
              onChange={e => onTextSizeChange(Number(e.target.value))}
            />
            <span style={{ color: "#aaa", fontSize: 11 }}> {textSize}px</span>
          </div>
        )}
      </div>

      {/* Rectangle */}
      <button
        className={`toolbar-btn ${tool === "rectangle" ? "active" : ""}`}
        onClick={() => onToolChange("rectangle")}
      >
        <span className="toolbar-tip">Rectangle (R)</span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="2" width="10" height="10" rx="1"/>
        </svg>
      </button>

      {/* Comment */}
      <button
        className={`toolbar-btn ${tool === "comment" ? "active" : ""}`}
        onClick={() => onToolChange("comment")}
      >
        <span className="toolbar-tip">Comment (C)</span>💬
      </button>

      <div className="toolbar-sep" />

      {/* Page navigation */}
      {totalPages > 0 && (
        <>
          <button className="toolbar-btn" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}>
            <span className="toolbar-tip">Previous page</span>‹
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
            <span className="toolbar-tip">Next page</span>›
          </button>
          <div className="toolbar-sep" />
        </>
      )}

      {/* Zoom controls */}
      <button className="toolbar-btn" onClick={() => onZoomChange(Math.max(0.25, zoom - 0.15))}>
        <span className="toolbar-tip">Zoom out</span>－
      </button>
      <select
        className="toolbar-select"
        value={ZOOM_PRESETS.includes(zoom) ? zoom : "custom"}
        onChange={e => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onZoomChange(v);
        }}
      >
        {ZOOM_PRESETS.map(z => (
          <option key={z} value={z}>{Math.round(z * 100)}%</option>
        ))}
        {!ZOOM_PRESETS.includes(zoom) && <option value="custom">{zoomPercent}%</option>}
      </select>
      <button className="toolbar-btn" onClick={() => onZoomChange(Math.min(5, zoom + 0.15))}>
        <span className="toolbar-tip">Zoom in</span>＋
      </button>

      <div style={{ flex: 1 }} />

      {/* File name */}
      {fileName && (
        <span className="toolbar-label" style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={fileName}>
          {fileName}
        </span>
      )}

      <div className="toolbar-sep" />

      <button className="toolbar-btn" onClick={onPrint}>
        <span className="toolbar-tip">Print</span>🖨️
      </button>
      <button className="toolbar-btn" onClick={onDownload}>
        <span className="toolbar-tip">Download</span>⬇️
      </button>
    </div>
  );
}
