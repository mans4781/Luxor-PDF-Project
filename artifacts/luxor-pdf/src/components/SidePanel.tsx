import { ReactNode } from "react";

interface SidePanelProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}

/**
 * Shared right-hand slide-in panel shell (Document Info, Outline,
 * Annotations, OCR, AI Tools, Forms). Slides in below the toolbar,
 * matching the dark thumbnail-panel styling.
 */
export default function SidePanel({ title, onClose, children, width = 320 }: SidePanelProps) {
  return (
    <div
      style={{
        position: "fixed",
        top: "calc(var(--tabbar-height, 0px) + var(--toolbar-height))", bottom: 0, right: 0,
        width, maxWidth: "calc(100vw - 48px)",
        background: "#1e1e1e",
        borderLeft: "1px solid rgba(255,255,255,0.07)",
        display: "flex", flexDirection: "column",
        zIndex: 86,
        boxShadow: "-2px 0 8px rgba(0,0,0,0.35)",
        color: "#ddd",
      }}
    >
      <div
        style={{
          padding: "10px 12px 8px",
          fontSize: 11, fontWeight: 600, color: "#888",
          letterSpacing: "0.06em", textTransform: "uppercase",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <span>{title}</span>
        <button
          onClick={onClose}
          title="Close panel"
          style={{
            background: "transparent", border: "none", color: "#888",
            cursor: "pointer", padding: 2, display: "flex",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "12px 14px 20px", scrollbarWidth: "thin" }}>
        {children}
      </div>
    </div>
  );
}

/** Small label/value row used by info-style panels. */
export function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10.5, color: "#777", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: "#ddd", wordBreak: "break-word", lineHeight: 1.45 }}>{value ?? "—"}</div>
    </div>
  );
}

/** Green/red status chip for security rows. */
export function StatusChip({ ok, okLabel, badLabel }: { ok: boolean; okLabel: string; badLabel: string }) {
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        fontSize: 11.5, fontWeight: 500,
        padding: "3px 9px", borderRadius: 999,
        background: ok ? "rgba(46,164,79,0.15)" : "rgba(231,76,60,0.15)",
        color: ok ? "#4cc271" : "#e74c3c",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
      {ok ? okLabel : badLabel}
    </span>
  );
}
