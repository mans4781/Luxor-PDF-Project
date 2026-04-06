/**
 * Save a Blob to disk.
 *
 * When the browser supports the File System Access API (Chrome / Edge / Electron)
 * a native "Save As" dialog opens so the user can choose exactly where to save
 * the file — including the same folder they uploaded from.
 *
 * Falls back to a silent <a download> for Firefox / Safari.
 */
export async function saveFile(blob: Blob, suggestedName: string): Promise<void> {
  const ext = suggestedName.split(".").pop()?.toLowerCase() ?? "";
  const mimeMap: Record<string, string> = {
    pdf:  "application/pdf",
    zip:  "application/zip",
    txt:  "text/plain",
    png:  "image/png",
    jpg:  "image/jpeg",
    jpeg: "image/jpeg",
  };
  const mimeType = mimeMap[ext] ?? blob.type ?? "application/octet-stream";

  if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
    try {
      const handle = await (window as Window & typeof globalThis & {
        showSaveFilePicker: (opts?: unknown) => Promise<FileSystemFileHandle>;
      }).showSaveFilePicker({
        suggestedName,
        types: [{ description: suggestedName, accept: { [mimeType]: [`.${ext}`] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = suggestedName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Write a Blob directly into a FileSystemDirectoryHandle (no dialog).
 * Use this when the user has already chosen a destination folder.
 */
export async function saveFileToDir(
  dirHandle: FileSystemDirectoryHandle,
  blob: Blob,
  filename: string
): Promise<void> {
  const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}

/**
 * Ask the user to pick a folder via the File System Access API.
 * Returns null on cancel.
 * Throws an error if the API is blocked or unavailable.
 */
export async function pickDirectory(): Promise<FileSystemDirectoryHandle | null> {
  if (typeof window === "undefined" || !("showDirectoryPicker" in window)) {
    throw new Error("Your browser does not support folder selection.");
  }
  try {
    return await (window as Window & typeof globalThis & {
      showDirectoryPicker: (opts?: unknown) => Promise<FileSystemDirectoryHandle>;
    }).showDirectoryPicker({ mode: "readwrite" });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "AbortError") return null;
    if (err instanceof Error && err.name === "SecurityError") {
      throw new Error("Folder access was blocked by your browser. Try opening the app in its own tab.");
    }
    throw err;
  }
}
