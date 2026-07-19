import { useState } from "react";

const MM_TO_PT = 72 / 25.4;

interface Props {
  /** Source PDF (the user's currently-open file). */
  file: File;
  totalPages: number;
  currentPage: number;
  /** Called with the reworked file; the viewer reloads it in place. */
  onApply: (f: File) => void;
  onClose: () => void;
}

/**
 * Crop-pages UI. The user trims a margin (in millimetres) from each side of
 * either the current page or every page. Cropping adjusts the PDF crop box —
 * the hidden area stays in the file and can be restored by re-cropping with
 * zero margins in another tool, which is the standard, non-destructive way
 * PDF cropping works.
 */
export default function CropModal({ file, totalPages, currentPage, onApply, onClose }: Props) {
  const [top, setTop] = useState(10);
  const [bottom, setBottom] = useState(10);
  const [left, setLeft] = useState(10);
  const [right, setRight] = useState(10);
  const [scope, setScope] = useState<"current" | "all">("current");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runCrop = async () => {
    if (running) return;
    setError(null);
    if ([top, bottom, left, right].some((v) => !Number.isFinite(v) || v < 0)) {
      setError("Margins must be zero or a positive number of millimetres.");
      return;
    }
    if (top + bottom + left + right === 0) {
      setError("Set at least one margin to trim.");
      return;
    }
    setRunning(true);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const idxs = scope === "all"
        ? doc.getPageIndices()
        : [Math.min(Math.max(currentPage - 1, 0), doc.getPageCount() - 1)];
      for (const i of idxs) {
        const page = doc.getPage(i);
        const media = page.getMediaBox();
        const l = left * MM_TO_PT, r = right * MM_TO_PT;
        const t = top * MM_TO_PT, b = bottom * MM_TO_PT;
        const newW = media.width - l - r;
        const newH = media.height - t - b;
        if (newW < 36 || newH < 36) {
          throw new Error(
            `The margins are too large for page ${i + 1} — the remaining area would be smaller than half an inch.`,
          );
        }
        page.setCropBox(media.x + l, media.y + b, newW, newH);
      }
      const bytes = await doc.save();
      onApply(new File([bytes as BlobPart], file.name, { type: "application/pdf" }));
    } catch (err: any) {
      console.error("Crop failed:", err);
      setError(err?.message ?? "Sorry — couldn't crop this PDF.");
      setRunning(false);
    }
  };

  const marginField = (label: string, value: number, set: (v: number) => void) => (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "#555" }}>
      {label}
      <input
        type="number" min={0} step={1} value={value}
        onChange={(e) => set(Number(e.target.value))}
        style={{
          width: 90, padding: "7px 9px", fontSize: 13,
          border: "1px solid #d5d5d5", borderRadius: 7, color: "#1a1a1a",
        }}
      />
    </label>
  );

  return (
    <div onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", color: "#1a1a1a",
          width: 460, maxWidth: "94vw", maxHeight: "90vh", overflowY: "auto",
          borderRadius: 12, padding: "20px 22px",
          boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
          fontFamily: "inherit",
        }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ fontSize: 17, fontWeight: 600 }}>Crop pages</div>
          <button onClick={onClose} style={{
            border: "none", background: "transparent", cursor: "pointer",
            color: "#555", padding: 6, borderRadius: 6, display: "flex",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <p style={{ fontSize: 12.5, color: "#666", lineHeight: 1.5, margin: "0 0 14px" }}>
          Trim a margin from each side of the page. The trimmed area is hidden,
          not deleted — the page keeps its content underneath.
        </p>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
          {marginField("Top (mm)", top, setTop)}
          {marginField("Bottom (mm)", bottom, setBottom)}
          {marginField("Left (mm)", left, setLeft)}
          {marginField("Right (mm)", right, setRight)}
        </div>

        <div style={{ display: "flex", gap: 16, marginBottom: 18, fontSize: 13 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input type="radio" checked={scope === "current"} onChange={() => setScope("current")} />
            Current page ({currentPage})
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input type="radio" checked={scope === "all"} onChange={() => setScope("all")} />
            All {totalPages} pages
          </label>
        </div>

        {error && (
          <div style={{
            fontSize: 12.5, color: "#B3261E", background: "rgba(179,38,30,0.07)",
            borderRadius: 7, padding: "8px 10px", marginBottom: 12,
          }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose} disabled={running} style={{
            padding: "8px 16px", fontSize: 13, borderRadius: 8, cursor: "pointer",
            border: "1px solid #d5d5d5", background: "#fff", color: "#333",
          }}>
            Cancel
          </button>
          <button onClick={runCrop} disabled={running} style={{
            padding: "8px 18px", fontSize: 13, fontWeight: 600, borderRadius: 8,
            cursor: running ? "default" : "pointer", border: "none",
            background: "#0D62F2", color: "#fff", opacity: running ? 0.6 : 1,
          }}>
            {running ? "Cropping\u2026" : "Crop"}
          </button>
        </div>
      </div>
    </div>
  );
}
