import { ReaderSettings, KEYBOARD_SHORTCUTS } from "../lib/settings";
import { clearRecents } from "../lib/recentFiles";

interface SettingsModalProps {
  settings: ReaderSettings;
  onChange: (next: ReaderSettings) => void;
  onClose: () => void;
}

/**
 * Reader preferences + keyboard-shortcut reference. Settings persist in
 * localStorage (lib/settings.ts) and apply the next time a document opens
 * (default zoom / view / thumbnails) or immediately (toggles).
 */
export default function SettingsModal({ settings, onChange, onClose }: SettingsModalProps) {
  const set = <K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) =>
    onChange({ ...settings, [key]: value });

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        zIndex: 9250, display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", color: "#1a1a1a",
          width: 560, maxWidth: "94vw", maxHeight: "86vh",
          borderRadius: 12, boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        <div style={{
          padding: "16px 22px 12px", borderBottom: "1px solid rgba(0,0,0,0.08)",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
        }}>
          <div style={{ fontSize: 17, fontWeight: 600 }}>Settings</div>
          <button
            onClick={onClose}
            title="Close"
            style={{ background: "transparent", border: "none", color: "#888", cursor: "pointer", padding: 4, display: "flex" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ overflowY: "auto", padding: "16px 22px 22px" }}>
          <SectionLabel>Viewing</SectionLabel>

          <Row label="Default zoom">
            <select
              value={settings.defaultZoomPct}
              onChange={(e) => set("defaultZoomPct", parseInt(e.target.value, 10))}
              style={selectStyle}
            >
              {[50, 75, 100, 125, 150, 200].map(z => <option key={z} value={z}>{z}%</option>)}
            </select>
          </Row>

          <Row label="Default page layout">
            <select
              value={settings.defaultView}
              onChange={(e) => set("defaultView", e.target.value as ReaderSettings["defaultView"])}
              style={selectStyle}
            >
              <option value="single">Single page</option>
              <option value="double">Two-page spread</option>
            </select>
          </Row>

          <Toggle label="Open thumbnails panel automatically" checked={settings.showThumbnails} onChange={v => set("showThumbnails", v)} />
          <Toggle label="Smooth scrolling when jumping to a page" checked={settings.smoothScroll} onChange={v => set("smoothScroll", v)} />
          <Toggle label="Resume reading at the last page" checked={settings.resumeLastPage} onChange={v => set("resumeLastPage", v)} />

          <SectionLabel>Features</SectionLabel>
          <Toggle label="Show recent files on the home screen" checked={settings.enableRecents} onChange={v => set("enableRecents", v)} />
          <Toggle label="Show AI tools" checked={settings.enableAI} onChange={v => set("enableAI", v)} />
          <Toggle label="Show OCR (text recognition)" checked={settings.enableOCR} onChange={v => set("enableOCR", v)} />

          <SectionLabel>Privacy</SectionLabel>
          <div style={{ fontSize: 12.5, color: "#666", lineHeight: 1.55, marginBottom: 8 }}>
            Documents are processed entirely in your browser and never uploaded. Recent-file history stores names and page counts only — never the files themselves.
          </div>
          <button
            onClick={() => { clearRecents(); }}
            style={{
              background: "#fff", color: "#c0392b",
              border: "1px solid rgba(192,57,43,0.35)", borderRadius: 6,
              padding: "7px 12px", fontSize: 12.5, cursor: "pointer",
            }}
          >
            Clear recent-files history
          </button>

          <SectionLabel>Keyboard shortcuts</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 20px" }}>
            {KEYBOARD_SHORTCUTS.map(s => (
              <div key={s.keys} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "4px 0" }}>
                <span style={{ fontSize: 12.5, color: "#444" }}>{s.action}</span>
                <kbd style={{
                  fontSize: 11, color: "#333", background: "#f2f2f2",
                  border: "1px solid rgba(0,0,0,0.12)", borderBottomWidth: 2,
                  borderRadius: 5, padding: "2px 7px", whiteSpace: "nowrap",
                  fontFamily: "inherit",
                }}>{s.keys}</kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  padding: "6px 10px", border: "1px solid rgba(0,0,0,0.18)", borderRadius: 6,
  background: "#fff", color: "#222", fontSize: 13, cursor: "pointer", outline: "none",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, color: "#888",
      textTransform: "uppercase", letterSpacing: 0.6,
      margin: "18px 0 10px", paddingTop: 4,
    }}>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
      <span style={{ fontSize: 13.5, color: "#333" }}>{label}</span>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10, cursor: "pointer", userSelect: "none" }}>
      <span style={{ fontSize: 13.5, color: "#333" }}>{label}</span>
      <span
        onClick={(e) => { e.preventDefault(); onChange(!checked); }}
        role="switch"
        aria-checked={checked}
        style={{
          width: 38, height: 22, borderRadius: 999, flexShrink: 0,
          background: checked ? "#0D62F2" : "rgba(0,0,0,0.18)",
          position: "relative", transition: "background 0.15s",
        }}
      >
        <span style={{
          position: "absolute", top: 2, left: checked ? 18 : 2,
          width: 18, height: 18, borderRadius: "50%", background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)", transition: "left 0.15s",
        }} />
      </span>
    </label>
  );
}
