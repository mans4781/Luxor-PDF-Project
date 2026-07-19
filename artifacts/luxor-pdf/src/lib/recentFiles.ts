/**
 * Recent-files list persisted in localStorage (metadata), plus an
 * IndexedDB byte cache so recent files can actually be reopened from
 * the File menu without re-picking them from disk.
 *
 * Files larger than BLOB_CAP_BYTES are listed but not cached; opening
 * those falls back to the file picker.
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

/* ── IndexedDB byte cache for reopening recents ─────────────── */

const DB_NAME = "luxor-pdf-recents";
const STORE = "files";
const BLOB_CAP_BYTES = 25 * 1024 * 1024; // don't cache PDFs over 25 MB

export function recentKey(e: Pick<RecentFileEntry, "name" | "size" | "lastModified">): string {
  return `${e.name}|${e.size}|${e.lastModified}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Cache the file bytes so this recent entry can be reopened later.
 *  Also prunes cached entries that fell off the recents list. */
export async function saveRecentBlob(file: File): Promise<void> {
  if (file.size > BLOB_CAP_BYTES) return;
  try {
    const db = await openDb();
    const keep = new Set(loadRecents().map(recentKey));
    keep.add(recentKey(file));
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      store.put(file, recentKey(file));
      const listReq = store.getAllKeys();
      listReq.onsuccess = () => {
        for (const k of listReq.result) {
          if (typeof k === "string" && !keep.has(k)) store.delete(k);
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    /* private mode / quota — recents stay metadata-only */
  }
}

/** Load the cached bytes for a recent entry, or null if not cached. */
export async function loadRecentBlob(
  e: Pick<RecentFileEntry, "name" | "size" | "lastModified">,
): Promise<File | null> {
  try {
    const db = await openDb();
    const result = await new Promise<unknown>((resolve, reject) => {
      const req = db.transaction(STORE, "readonly").objectStore(STORE).get(recentKey(e));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (result instanceof File) return result;
    if (result instanceof Blob) {
      return new File([result], e.name, { type: "application/pdf", lastModified: e.lastModified });
    }
    return null;
  } catch {
    return null;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
