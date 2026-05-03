import { useState } from "react";
import {
  DEFAULT_PAGENO,
  formatPageLabel,
  type PageNoConfig,
  type PageNoPosition,
} from "@/lib/editTypes";
import { ModalShell, Row, TwoCol, PreviewBox, Footer } from "./WatermarkModal";

interface Props {
  initial: PageNoConfig | null;
  totalPages: number;
  onApply: (cfg: PageNoConfig) => void;
  onClear: () => void;
  onClose: () => void;
}

const POSITIONS: { v: PageNoPosition; label: string }[] = [
  { v: "top-left",      label: "Top left" },
  { v: "top-center",    label: "Top center" },
  { v: "top-right",     label: "Top right" },
  { v: "bottom-left",   label: "Bottom left" },
  { v: "bottom-center", label: "Bottom center" },
  { v: "bottom-right",  label: "Bottom right" },
];

const FORMAT_PRESETS = [
  "Page {page} of {total}",
  "{page} of {total}",
  "Page {page}",
  "{page}",
  "- {page} -",
];

export default function PageNumberModal({ initial, totalPages, onApply, onClear, onClose }: Props) {
  const [cfg, setCfg] = useState<PageNoConfig>(
    initial ?? { ...DEFAULT_PAGENO, pageTo: totalPages },
  );

  const set = <K extends keyof PageNoConfig>(k: K, v: PageNoConfig[K]) =>
    setCfg((c) => ({ ...c, [k]: v }));

  const previewLabel = formatPageLabel(cfg, cfg.pageFrom, totalPages);

  return (
    <ModalShell title="Add Page Numbers" onClose={onClose}>
      <Row label="Format">
        <input type="text" value={cfg.format}
          onChange={(e) => set("format", e.target.value)}
          style={inputStyle}/>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>
          {FORMAT_PRESETS.map((p) => (
            <button key={p} onClick={() => set("format", p)} style={chipStyle(cfg.format === p)}>
              {p}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "#888", marginTop: 6 }}>
          Use <code>{"{page}"}</code> for the page number and <code>{"{total}"}</code> for total pages.
        </div>
      </Row>

      <Row label="Position">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
          {POSITIONS.map((p) => (
            <button key={p.v} onClick={() => set("position", p.v)} style={chipStyle(cfg.position === p.v)}>
              {p.label}
            </button>
          ))}
        </div>
      </Row>

      <TwoCol>
        <Row label="Font size">
          <input type="number" min={6} max={48} value={cfg.fontSize}
            onChange={(e) => set("fontSize", Math.max(6, Math.min(48, Number(e.target.value) || 0)))}
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
        <Row label="Start number">
          <input type="number" min={0} value={cfg.startNumber}
            onChange={(e) => set("startNumber", Number(e.target.value) || 0)}
            style={inputStyle}/>
        </Row>
        <Row label="Page range">
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="number" min={1} max={totalPages} value={cfg.pageFrom}
              onChange={(e) => set("pageFrom", Math.max(1, Math.min(totalPages, Number(e.target.value) || 1)))}
              style={{ ...inputStyle, width: 70 }}/>
            <span style={{ fontSize: 12, color: "#555" }}>to</span>
            <input type="number" min={1} max={totalPages} value={cfg.pageTo}
              onChange={(e) => set("pageTo", Math.max(cfg.pageFrom, Math.min(totalPages, Number(e.target.value) || totalPages)))}
              style={{ ...inputStyle, width: 70 }}/>
            <span style={{ fontSize: 11, color: "#888" }}>of {totalPages}</span>
          </div>
        </Row>
      </TwoCol>

      <PreviewBox>
        <span style={{ fontSize: Math.max(10, cfg.fontSize), color: cfg.color, fontWeight: 500 }}>
          {previewLabel}
        </span>
      </PreviewBox>

      <Footer
        onClose={onClose}
        onApply={() => onApply(cfg)}
        onClear={initial ? onClear : undefined}
        applyLabel="Apply Page Numbers"
      />
    </ModalShell>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "6px 9px",
  border: "1px solid #ccc", borderRadius: 5,
  fontSize: 13, color: "#1a1a1a",
  background: "#fff", boxSizing: "border-box",
};

const chipStyle = (active: boolean): React.CSSProperties => ({
  padding: "5px 9px",
  border: active ? "1px solid #0D62F2" : "1px solid #ccc",
  borderRadius: 5,
  background: active ? "rgba(13,98,242,0.10)" : "#fff",
  color: active ? "#0D62F2" : "#333",
  fontSize: 12, fontWeight: 500, cursor: "pointer",
  whiteSpace: "nowrap",
});
