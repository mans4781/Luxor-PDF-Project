import { useEffect, useRef, useState } from "react";
import SidePanel from "./SidePanel";

interface OCRPanelProps {
  isScanned: boolean | null;
  totalPages: number;
  onClose: () => void;
}

/**
 * OCR panel — UI-ready MOCK.
 *
 * INTEGRATION POINT: real OCR should run Tesseract.js (client-side)
 * or a server OCR service. Plan:
 *   1. Render each page to a canvas via pdf.js (page.render at ~2x scale).
 *   2. Feed canvas.toDataURL() into Tesseract.recognize(image, lang).
 *   3. Collect { pageNum, text, words[] } results and build a hidden
 *      text layer so search/copy work on scanned pages.
 * The progress UI below already matches that flow (per-page progress).
 */
export default function OCRPanel({ isScanned, totalPages, onClose }: OCRPanelProps) {
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => () => { if (timerRef.current) window.clearInterval(timerRef.current); }, []);

  const start = () => {
    setPhase("running");
    setProgress(0);
    // Mock progress — replace with real Tesseract.js per-page progress events.
    timerRef.current = window.setInterval(() => {
      setProgress(p => {
        const next = p + Math.random() * 9 + 3;
        if (next >= 100) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          setPhase("done");
          return 100;
        }
        return next;
      });
    }, 180);
  };

  return (
    <SidePanel title="OCR — Text Recognition" onClose={onClose}>
      <div style={{ fontSize: 12.5, color: "#bbb", lineHeight: 1.6, marginBottom: 14 }}>
        {isScanned === true
          ? "This document appears to be scanned — its pages are images without selectable text. Run OCR to recognize the text so you can search and copy it."
          : isScanned === false
            ? "This document already contains selectable text. OCR is usually only needed for scanned documents."
            : "Analyzing document…"}
      </div>

      {phase === "idle" && (
        <button
          onClick={start}
          style={{
            width: "100%", padding: "9px 10px",
            background: "#0D62F2", border: "none", borderRadius: 7,
            color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer",
          }}
        >
          Recognize text ({totalPages} {totalPages === 1 ? "page" : "pages"})
        </button>
      )}

      {phase === "running" && (
        <div>
          <div style={{ fontSize: 12, color: "#999", marginBottom: 6 }}>
            Recognizing text… page {Math.max(1, Math.ceil((progress / 100) * totalPages))} of {totalPages}
          </div>
          <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "#0D62F2", borderRadius: 999, transition: "width 0.18s" }} />
          </div>
        </div>
      )}

      {phase === "done" && (
        <div style={{
          fontSize: 12.5, color: "#f5b942", lineHeight: 1.6,
          background: "rgba(245,185,66,0.08)", border: "1px solid rgba(245,185,66,0.25)",
          borderRadius: 8, padding: "10px 12px",
        }}>
          <strong>Preview mode:</strong> the OCR engine isn't connected yet. When enabled, recognized text will become searchable and copyable directly on the pages.
          <button
            onClick={() => { setPhase("idle"); setProgress(0); }}
            style={{
              display: "block", marginTop: 10,
              background: "transparent", border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 6, color: "#ccc", fontSize: 12, padding: "6px 12px", cursor: "pointer",
            }}
          >
            Reset
          </button>
        </div>
      )}

      <div style={{ marginTop: 16, fontSize: 11.5, color: "#777", lineHeight: 1.6 }}>
        OCR runs entirely in your browser — documents are never uploaded.
      </div>
    </SidePanel>
  );
}
