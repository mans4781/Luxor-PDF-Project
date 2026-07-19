import { useState } from "react";
import {
  DEFAULT_PRINT_OPTIONS, isDefaultPrint, parsePageRange, printComposed,
  type PrintOptions,
} from "@/lib/printPdf";

interface Props {
  /** pdf.js document proxy for the open file. */
  pdfDoc: any;
  totalPages: number;
  currentPage: number;
  /** Native full-quality print of the untouched original file. */
  onNativePrint: () => void;
  onClose: () => void;
}

const label: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: "#555",
  textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6,
};

const selectStyle: React.CSSProperties = {
  width: "100%", padding: "7px 8px", fontSize: 13,
  border: "1px solid #d8dde6", borderRadius: 6, background: "#fff",
  color: "#1a1a1a", cursor: "pointer",
};

/**
 * Print dialog: page range, copies, paper size, orientation, scale,
 * pages per sheet, grayscale and reverse order. Default settings go
 * through the browser's native PDF printing for full vector quality;
 * anything else composes a print document from rendered pages.
 */
export default function PrintModal({ pdfDoc, totalPages, currentPage, onNativePrint, onClose }: Props) {
  const [opts, setOpts] = useState<PrintOptions>({ ...DEFAULT_PRINT_OPTIONS });
  const [scaleMode, setScaleMode] = useState<"fit" | "actual" | "custom">("fit");
  const [customScale, setCustomScale] = useState(100);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<PrintOptions>) => setOpts((o) => ({ ...o, ...patch }));

  const resolvedOpts: PrintOptions = {
    ...opts,
    scale: scaleMode === "custom" ? Math.max(10, Math.min(400, customScale)) : scaleMode,
  };

  const pageList = (): number[] | null => {
    if (resolvedOpts.range === "all") return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (resolvedOpts.range === "current") return [currentPage];
    return parsePageRange(resolvedOpts.customRange, totalPages);
  };

  const pages = pageList();
  const rangeInvalid = resolvedOpts.range === "custom" && pages === null;
  const sheetCount = pages
    ? Math.ceil((pages.length * resolvedOpts.copies) / resolvedOpts.pagesPerSheet)
    : 0;

  const runPrint = async () => {
    if (busy) return;
    setError(null);
    const list = pageList();
    if (!list) {
      setError(`Enter pages between 1 and ${totalPages}, e.g. 1-3, 5, 8-10`);
      return;
    }
    if (isDefaultPrint(resolvedOpts)) {
      onClose();
      onNativePrint();
      return;
    }
    setBusy(true);
    setProgress({ done: 0, total: list.length });
    try {
      await printComposed(pdfDoc, list, resolvedOpts, (done, total) => setProgress({ done, total }));
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Could not prepare the print document.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  return (
    <div onClick={busy ? undefined : onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", color: "#1a1a1a",
          width: 560, maxWidth: "94vw", maxHeight: "90vh", overflowY: "auto",
          borderRadius: 12, padding: "20px 22px",
          boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
          fontFamily: "inherit",
        }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: 17, fontWeight: 600 }}>Print</div>
          <button onClick={onClose} disabled={busy} style={{
            background: "transparent", border: "none", fontSize: 20, lineHeight: 1,
            cursor: busy ? "not-allowed" : "pointer", color: "#888", padding: 4,
          }}>×</button>
        </div>

        {/* Pages */}
        <div style={{ marginBottom: 14 }}>
          <div style={label}>Pages</div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            {([
              ["all", `All (${totalPages})`],
              ["current", `Current page (${currentPage})`],
              ["custom", "Custom"],
            ] as const).map(([k, text]) => (
              <label key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                <input type="radio" name="print-range" checked={opts.range === k}
                  onChange={() => set({ range: k })} style={{ accentColor: "#0D62F2" }} />
                {text}
              </label>
            ))}
            {opts.range === "custom" && (
              <input
                value={opts.customRange}
                onChange={(e) => set({ customRange: e.target.value })}
                placeholder="e.g. 1-3, 5, 8-10"
                style={{
                  flex: 1, minWidth: 140, padding: "6px 8px", fontSize: 13,
                  border: `1px solid ${rangeInvalid && opts.customRange ? "#e08a8a" : "#d8dde6"}`,
                  borderRadius: 6,
                }}
              />
            )}
          </div>
        </div>

        {/* Copies / paper / orientation */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <div style={label}>Copies</div>
            <input type="number" min={1} max={99} value={opts.copies}
              onChange={(e) => set({ copies: Math.max(1, Math.min(99, parseInt(e.target.value || "1", 10))) })}
              style={{ ...selectStyle, cursor: "text" }} />
          </div>
          <div>
            <div style={label}>Paper size</div>
            <select value={opts.paper} onChange={(e) => set({ paper: e.target.value as PrintOptions["paper"] })} style={selectStyle}>
              <option value="auto">Auto</option>
              <option value="a4">A4</option>
              <option value="letter">Letter</option>
              <option value="legal">Legal</option>
              <option value="a3">A3</option>
            </select>
          </div>
          <div>
            <div style={label}>Orientation</div>
            <select value={opts.orientation} onChange={(e) => set({ orientation: e.target.value as PrintOptions["orientation"] })} style={selectStyle}>
              <option value="auto">Auto</option>
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>
        </div>

        {/* Scale / pages per sheet */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
          <div>
            <div style={label}>Scale</div>
            <select value={scaleMode} onChange={(e) => setScaleMode(e.target.value as typeof scaleMode)} style={selectStyle}>
              <option value="fit">Fit to page</option>
              <option value="actual">Actual size</option>
              <option value="custom">Custom %</option>
            </select>
          </div>
          {scaleMode === "custom" ? (
            <div>
              <div style={label}>Percent</div>
              <input type="number" min={10} max={400} value={customScale}
                onChange={(e) => setCustomScale(parseInt(e.target.value || "100", 10))}
                style={{ ...selectStyle, cursor: "text" }} />
            </div>
          ) : <div />}
          <div>
            <div style={label}>Pages per sheet</div>
            <select value={opts.pagesPerSheet}
              onChange={(e) => set({ pagesPerSheet: parseInt(e.target.value, 10) as PrintOptions["pagesPerSheet"] })}
              style={selectStyle}>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={4}>4</option>
            </select>
          </div>
        </div>

        {/* Toggles */}
        <div style={{ display: "flex", gap: 18, marginBottom: 14 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
            <input type="checkbox" checked={opts.grayscale}
              onChange={(e) => set({ grayscale: e.target.checked })} style={{ accentColor: "#0D62F2" }} />
            Print in grayscale
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
            <input type="checkbox" checked={opts.reverseOrder}
              onChange={(e) => set({ reverseOrder: e.target.checked })} style={{ accentColor: "#0D62F2" }} />
            Reverse page order
          </label>
        </div>

        {/* Summary */}
        <div style={{
          background: "#f6f8fb", border: "1px solid #e5eaf2", borderRadius: 8,
          padding: "8px 12px", marginBottom: 14, fontSize: 12.5, color: "#3a4a66",
        }}>
          {pages
            ? <>Will print <strong>{pages.length * resolvedOpts.copies}</strong> page{pages.length * resolvedOpts.copies === 1 ? "" : "s"} on <strong>{sheetCount}</strong> sheet{sheetCount === 1 ? "" : "s"}.</>
            : <>Enter a valid page selection to continue.</>}
          {" "}
          {isDefaultPrint(resolvedOpts)
            ? "Default settings use the browser's full-quality PDF printing."
            : "Custom settings prepare a tailored print layout first."}
        </div>

        {busy && progress && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "#3a4a66", marginBottom: 6 }}>
              Preparing pages… {progress.done}/{progress.total}
            </div>
            <div style={{ height: 8, background: "#e9ecf1", borderRadius: 4, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${progress.total ? Math.round((progress.done / progress.total) * 100) : 0}%`,
                background: "#0D62F2", transition: "width 120ms linear",
              }} />
            </div>
          </div>
        )}

        {error && (
          <div style={{
            fontSize: 13, color: "#a01b1b",
            background: "#fdecec", border: "1px solid #f1c0c0",
            borderRadius: 6, padding: "8px 10px", marginBottom: 14,
          }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", borderTop: "1px solid #eee", paddingTop: 14 }}>
          <button onClick={onClose} disabled={busy} style={{
            background: "#f1f1f1", color: "#333",
            border: "1px solid #ddd", borderRadius: 6,
            padding: "8px 14px", fontSize: 13, fontWeight: 500,
            cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1,
          }}>Cancel</button>
          <button onClick={runPrint} disabled={busy || !pages} style={{
            background: "#0D62F2", color: "#fff",
            border: "none", borderRadius: 6,
            padding: "8px 18px", fontSize: 13, fontWeight: 600,
            cursor: busy ? "wait" : "pointer", opacity: busy || !pages ? 0.7 : 1,
          }}>{busy ? "Preparing…" : "Print"}</button>
        </div>
      </div>
    </div>
  );
}
