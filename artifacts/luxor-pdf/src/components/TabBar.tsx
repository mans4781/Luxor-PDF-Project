import { desktopWindowControl } from "@/lib/desktopBridge";

export interface DocTabInfo {
  id: string;
  name: string;
}

interface TabBarProps {
  tabs: DocTabInfo[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
}

/** Browser-style document tab strip shown above the Reader toolbar
 *  whenever at least one PDF is open. Middle-click also closes a tab. */
export default function TabBar({ tabs, activeId, onSelect, onCloseTab, onNewTab }: TabBarProps) {
  return (
    <div className="doc-tabbar" role="tablist" aria-label="Open documents">
      {tabs.map((t) => (
        <div
          key={t.id}
          role="tab"
          aria-selected={t.id === activeId}
          className={`doc-tab${t.id === activeId ? " active" : ""}`}
          title={t.name}
          onClick={() => onSelect(t.id)}
          onAuxClick={(e) => {
            if (e.button === 1) {
              e.preventDefault();
              onCloseTab(t.id);
            }
          }}
        >
          <svg
            className="doc-tab-icon"
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span className="doc-tab-name">{t.name}</span>
          <button
            className="doc-tab-close"
            title="Close tab"
            aria-label={`Close ${t.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onCloseTab(t.id);
            }}
          >
            <svg
              width="9"
              height="9"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
      <button className="doc-tab-add" title="Open another PDF" aria-label="Open another PDF" onClick={onNewTab}>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* ── Window caption buttons (minimize / maximize / close) ── */}
      <div className="doc-tabbar-winbtns">
        <button
          className="doc-tab-winbtn"
          title="Minimize"
          aria-label="Minimize window"
          onClick={() => desktopWindowControl("minimize")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button
          className="doc-tab-winbtn"
          title="Maximize / Restore"
          aria-label="Maximize or restore window"
          onClick={() => {
            // Desktop shell: toggle the OS window; browser: full screen.
            if (!desktopWindowControl("maximize-toggle")) {
              if (document.fullscreenElement) void document.exitFullscreen();
              else void document.documentElement.requestFullscreen();
            }
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
            <rect x="5" y="5" width="14" height="14" rx="1" />
          </svg>
        </button>
        <button
          className="doc-tab-winbtn doc-tab-winbtn-close"
          title="Close"
          aria-label="Close window"
          onClick={() => {
            // Desktop shell: close the window; browser: close the active tab.
            if (!desktopWindowControl("close") && activeId) onCloseTab(activeId);
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="6" y1="18" x2="18" y2="6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
