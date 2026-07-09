interface HeavyFileBannerProps {
  reasons: string[];
  onDismiss: () => void;
}

/**
 * Non-blocking notice shown once per document when the file is large
 * (size / page count / scanned pages). Rendering stays responsive thanks
 * to page virtualization; this simply sets expectations.
 */
export default function HeavyFileBanner({ reasons, onDismiss }: HeavyFileBannerProps) {
  return (
    <div
      style={{
        position: "fixed",
        top: "calc(var(--toolbar-height) + 10px)",
        left: "50%", transform: "translateX(-50%)",
        zIndex: 500,
        background: "#1e1e1e", color: "#eee",
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: 10, padding: "10px 14px",
        display: "flex", alignItems: "center", gap: 10,
        boxShadow: "0 8px 28px rgba(0,0,0,0.4)",
        maxWidth: "min(560px, 92vw)",
        fontSize: 12.5, lineHeight: 1.45,
      }}
      role="status"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f5b942" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <span>
        This document may load slowly ({reasons.join(", ")}). Pages render as you scroll to keep things smooth.
      </span>
      <button
        onClick={onDismiss}
        title="Dismiss"
        style={{
          background: "transparent", border: "none", color: "#999",
          cursor: "pointer", padding: 4, marginLeft: 2, display: "flex", flexShrink: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  );
}
