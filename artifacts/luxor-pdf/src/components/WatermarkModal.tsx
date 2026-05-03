import { useState } from "react";
import {
  DEFAULT_WATERMARK,
  type WatermarkConfig,
  type WatermarkPosition,
  type WatermarkPageRange,
} from "@/lib/editTypes";

interface Props {
  initial: WatermarkConfig | null;
  totalPages: number;
  currentPage: number;
  onApply: (cfg: WatermarkConfig) => void;
  onClear: () => void;
  onClose: () => void;
}

const POSITIONS: { v: WatermarkPosition; label: string }[] = [
  { v: "center",       label: "Center" },
  { v: "top-left",     label: "Top left" },
  { v: "top-right",    label: "Top right" },
  { v: "bottom-left",  label: "Bottom left" },
  { v: "bottom-right", label: "Bottom right" },
  { v: "tiled",        label: "Tiled" },
];

export default function WatermarkModal({ initial, totalPages, currentPage, onApply, onClear, onClose }: Props) {
  const [cfg, setCfg] = useState<WatermarkConfig>(initial ?? DEFAULT_WATERMARK);
  const [rangeKind, setRangeKind] = useState<WatermarkPageRange["kind"]>(cfg.pageRange.kind);
  const [rangeStart, setRangeStart] = useState<number>(
    cfg.pageRange.kind === "custom" ? cfg.pageRange.start : 1,
  );
  const [rangeEnd, setRangeEnd] = useState<number>(
    cfg.pageRange.kind === "custom" ? cfg.pageRange.end : totalPages,
  );

  const set = <K extends keyof WatermarkConfig>(k: K, v: WatermarkConfig[K]) =>
    setCfg((c) => ({ ...c, [k]: v }));

  const buildRange = (): WatermarkPageRange => {
    if (rangeKind === "all") return { kind: "all" };
    if (rangeKind === "current") return { kind: "current" };
    return { kind: "custom", start: Math.max(1, Math.min(totalPages, rangeStart)), end: Math.max(rangeStart, Math.min(totalPages, rangeEnd)) };
  };

  const handleApply = () => onApply({ ...cfg, pageRange: buildRange() });

  return (
    <ModalShell title="Add Watermark" onClose={onClose}>
      <Row label="Watermark text">
        <input
          type="text"
          value={cfg.text}
          onChange={(e) => set("text", e.target.value)}
          style={inputStyle}
        />
      </Row>

      <TwoCol>
        <Row label="Font size">
          <input type="number" min={8} max={300} value={cfg.fontSize}
            onChange={(e) => set("fontSize", Math.max(8, Math.min(300, Number(e.target.value) || 0)))}
            style={inputStyle}/>
        </Row>
        <Row label="Color">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="color" value={cfg.color}
              onChange={(e) => set("color", e.target.value)}
              style={{ width: 38, height: 30, border: "1px solid #ccc", borderRadius: 4, padding: 0, background: "none" }}/>
            <input type="text" value={cfg.color}
              onChange={(e) => set("color", e.target.value)}
              style={{ ...inputStyle, width: 90 }}/>
          </div>
        </Row>
      </TwoCol>

      <TwoCol>
        <Row label={`Opacity: ${Math.round(cfg.opacity * 100)}%`}>
          <input type="range" min={5} max={100} value={Math.round(cfg.opacity * 100)}
            onChange={(e) => set("opacity", Number(e.target.value) / 100)}
            style={{ width: "100%" }}/>
        </Row>
        <Row label={`Rotation: ${cfg.rotation}°`}>
          <input type="range" min={-90} max={90} value={cfg.rotation}
            onChange={(e) => set("rotation", Number(e.target.value))}
            style={{ width: "100%" }}/>
        </Row>
      </TwoCol>

      <Row label="Position">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
          {POSITIONS.map((p) => (
            <button key={p.v}
              onClick={() => set("position", p.v)}
              style={chipStyle(cfg.position === p.v)}>
              {p.label}
            </button>
          ))}
        </div>
      </Row>

      <Row label="Apply to">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button onClick={() => setRangeKind("all")}     style={chipStyle(rangeKind === "all")}>All pages</button>
          <button onClick={() => setRangeKind("current")} style={chipStyle(rangeKind === "current")}>Current page only</button>
          <button onClick={() => setRangeKind("custom")}  style={chipStyle(rangeKind === "custom")}>Custom range</button>
        </div>
        {rangeKind === "custom" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: 12, color: "#555" }}>From</span>
            <input type="number" min={1} max={totalPages} value={rangeStart}
              onChange={(e) => setRangeStart(Number(e.target.value) || 1)}
              style={{ ...inputStyle, width: 70 }}/>
            <span style={{ fontSize: 12, color: "#555" }}>to</span>
            <input type="number" min={1} max={totalPages} value={rangeEnd}
              onChange={(e) => setRangeEnd(Number(e.target.value) || totalPages)}
              style={{ ...inputStyle, width: 70 }}/>
            <span style={{ fontSize: 11, color: "#888" }}>(of {totalPages}; current page is {currentPage})</span>
          </div>
        )}
      </Row>

      <PreviewBox>
        <span style={{
          fontSize: Math.max(10, Math.min(28, cfg.fontSize / 4)),
          color: cfg.color,
          opacity: cfg.opacity,
          transform: `rotate(${cfg.rotation}deg)`,
          fontWeight: 700,
          letterSpacing: 1.5,
          whiteSpace: "nowrap",
        }}>
          {cfg.text || "—"}
        </span>
      </PreviewBox>

      <Footer
        onClose={onClose}
        onApply={handleApply}
        onClear={initial ? onClear : undefined}
        applyLabel="Apply Watermark"
      />
    </ModalShell>
  );
}

/* ------- shared modal primitives (also used by PageNumberModal) ------- */

export function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", color: "#1a1a1a",
          width: 520, maxWidth: "94vw", maxHeight: "90vh", overflowY: "auto",
          borderRadius: 12, padding: "20px 22px",
          boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
          fontFamily: "inherit",
        }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: 17, fontWeight: 600 }}>{title}</div>
          <button onClick={onClose} style={{
            background: "transparent", border: "none", fontSize: 20, lineHeight: 1, cursor: "pointer", color: "#888", padding: 4,
          }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  );
}

export function TwoCol({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>;
}

export function PreviewBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      marginTop: 8, marginBottom: 16,
      background: "#fafafa",
      border: "1px dashed #ddd", borderRadius: 8,
      height: 110,
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden",
    }}>
      {children}
    </div>
  );
}

export function Footer({ onClose, onApply, onClear, applyLabel }: { onClose: () => void; onApply: () => void; onClear?: () => void; applyLabel: string }) {
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", borderTop: "1px solid #eee", paddingTop: 14 }}>
      {onClear && (
        <button onClick={onClear} style={{
          background: "transparent", color: "#c0392b",
          border: "1px solid #e0b3ad", borderRadius: 6,
          padding: "8px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer", marginRight: "auto",
        }}>Remove</button>
      )}
      <button onClick={onClose} style={{
        background: "#f1f1f1", color: "#333",
        border: "1px solid #ddd", borderRadius: 6,
        padding: "8px 14px", fontSize: 13, fontWeight: 500, cursor: "pointer",
      }}>Cancel</button>
      <button onClick={onApply} style={{
        background: "#0D62F2", color: "#fff",
        border: "none", borderRadius: 6,
        padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
      }}>{applyLabel}</button>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "6px 9px",
  border: "1px solid #ccc", borderRadius: 5,
  fontSize: 13, color: "#1a1a1a",
  background: "#fff", boxSizing: "border-box",
};

const chipStyle = (active: boolean): React.CSSProperties => ({
  padding: "6px 10px",
  border: active ? "1px solid #0D62F2" : "1px solid #ccc",
  borderRadius: 5,
  background: active ? "rgba(13,98,242,0.10)" : "#fff",
  color: active ? "#0D62F2" : "#333",
  fontSize: 12, fontWeight: 500, cursor: "pointer",
  whiteSpace: "nowrap",
});
