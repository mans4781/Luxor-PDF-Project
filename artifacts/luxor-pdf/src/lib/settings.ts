/**
 * User settings for Luxor PDF Reader, persisted in localStorage.
 * Only lightweight preferences live here — never document bytes.
 */

export interface ReaderSettings {
  /** Default zoom as a percentage of the 100% baseline (ZOOM_BASE). */
  defaultZoomPct: number;
  /** Default page layout when opening a document. */
  defaultView: "single" | "double";
  /** Auto-open the page-thumbnails panel when a document opens. */
  showThumbnails: boolean;
  /** Track and show the recent-files list on the home screen. */
  enableRecents: boolean;
  /** Show the AI Tools entry in the View menu. */
  enableAI: boolean;
  /** Show the OCR entry in the View menu. */
  enableOCR: boolean;
  /** Use smooth scrolling when jumping between pages. */
  smoothScroll: boolean;
  /** Resume reading at the last-viewed page when reopening a document. */
  resumeLastPage: boolean;
}

export const DEFAULT_SETTINGS: ReaderSettings = {
  defaultZoomPct: 100,
  defaultView: "single",
  showThumbnails: true,
  enableRecents: true,
  enableAI: true,
  enableOCR: true,
  smoothScroll: true,
  resumeLastPage: true,
};

const SETTINGS_KEY = "luxor-pdf:settings";

function sanitize(parsed: unknown): ReaderSettings {
  const s = { ...DEFAULT_SETTINGS };
  if (!parsed || typeof parsed !== "object") return s;
  const p = parsed as Record<string, unknown>;
  if (typeof p.defaultZoomPct === "number" && Number.isFinite(p.defaultZoomPct)) {
    s.defaultZoomPct = Math.min(500, Math.max(25, Math.round(p.defaultZoomPct)));
  }
  if (p.defaultView === "single" || p.defaultView === "double") {
    s.defaultView = p.defaultView;
  }
  for (const key of [
    "showThumbnails",
    "enableRecents",
    "enableAI",
    "enableOCR",
    "smoothScroll",
    "resumeLastPage",
  ] as const) {
    if (typeof p[key] === "boolean") s[key] = p[key] as boolean;
  }
  return s;
}

export function loadSettings(): ReaderSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return sanitize(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: ReaderSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    /* ignore quota */
  }
}

/** Keyboard shortcuts shown in the Settings modal. Kept in one place so
 *  the list can't drift from the actual handlers in Viewer.tsx. */
export const KEYBOARD_SHORTCUTS: { keys: string; action: string }[] = [
  { keys: "Ctrl + O", action: "Open PDF" },
  { keys: "Ctrl + F", action: "Search in document" },
  { keys: "Ctrl + P", action: "Print" },
  { keys: "Ctrl + W", action: "Close file" },
  { keys: "Ctrl + Shift + S", action: "Save As" },
  { keys: "Ctrl + Alt + S", action: "Save a Copy" },
  { keys: "Ctrl + Z", action: "Undo annotation" },
  { keys: "+ / −", action: "Zoom in / out" },
  { keys: "Ctrl + Scroll", action: "Zoom in / out" },
  { keys: "→ / ↓", action: "Next page" },
  { keys: "← / ↑", action: "Previous page" },
  { keys: "F11", action: "Toggle full screen" },
  { keys: "Esc", action: "Exit search / tool / full screen" },
];
