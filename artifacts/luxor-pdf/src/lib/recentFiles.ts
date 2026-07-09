/**
 * Recent-files list persisted in localStorage — METADATA ONLY.
 *
 * Browsers cannot reopen a local file without the user re-picking it
 * (security model), so we never store PDF bytes here. The Home screen
 * shows the list and clicking an entry re-opens the file picker.
 */

export interface RecentFileEntry {
  /** Same identity triple used by docKey elsewhere in the app. */
  name: string;
  size: number;
  lastModified: number;
  pages: number;
  /** Epoch ms when the file was last opened in the reader. */
  openedAt: number;
}

const RECENTS_KEY = "luxor-pdf:recents";
const MAX_RECENTS = 10;

export function loadRecents(): RecentFileEntry[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? (list as RecentFileEntry[]) : [];
  } catch {
    return [];
  }
}

export function addRecent(entry: Omit<RecentFileEntry, "openedAt">) {
  try {
    const list = loadRecents().filter(
      (r) => !(r.name === entry.name && r.size === entry.size && r.lastModified === entry.lastModified),
    );
    list.unshift({ ...entry, openedAt: Date.now() });
    localStorage.setItem(RECENTS_KEY, JSON.stringify(list.slice(0, MAX_RECENTS)));
  } catch {
    /* ignore quota */
  }
}

export function clearRecents() {
  try {
    localStorage.removeItem(RECENTS_KEY);
  } catch {
    /* ignore */
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
