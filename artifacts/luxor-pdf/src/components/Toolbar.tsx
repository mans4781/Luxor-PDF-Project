import { useRef } from "react";

interface ToolbarProps {
  fileName: string;
  currentPage: number;
  totalPages: number;
  zoom: number;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
  onOpenFile: () => void;
  onDownload: () => void;
  onPrint: () => void;
}

const ZOOM_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0];

export default function Toolbar({
  fileName, currentPage, totalPages, zoom,
  onPageChange, onZoomChange, onOpenFile, onDownload, onPrint,
}: ToolbarProps) {
  const pageInputRef = useRef<HTMLInputElement>(null);

  const handlePageInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const val = parseInt((e.target as HTMLInputElement).value, 10);
      if (!isNaN(val) && val >= 1 && val <= totalPages) onPageChange(val);
      else (e.target as HTMLInputElement).value = String(currentPage);
    }
  };

  return (
    <div className="luxor-toolbar">
      <div className="toolbar-brand">
        <div className="toolbar-brand-icon">L</div>
      </div>

      <button className="toolbar-btn" onClick={onOpenFile}>
        <span className="toolbar-tip">Open PDF</span>
        📁
      </button>

      <div className="toolbar-sep" />

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
        {!ZOOM_PRESETS.includes(zoom) && <option value="custom">{Math.round(zoom * 100)}%</option>}
      </select>
      <button className="toolbar-btn" onClick={() => onZoomChange(Math.min(5, zoom + 0.15))}>
        <span className="toolbar-tip">Zoom in</span>＋
      </button>

      <div style={{ flex: 1 }} />

      {fileName && (
        <span className="toolbar-label" style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={fileName}>
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
