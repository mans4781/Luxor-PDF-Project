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
  // Build the list of accepted MIME types for the picker
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

  // Try the File System Access API first (Chrome, Edge, Electron)
  if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
    try {
      const handle = await (window as Window & typeof globalThis & {
        showSaveFilePicker: (opts?: unknown) => Promise<FileSystemFileHandle>;
      }).showSaveFilePicker({
        suggestedName,
        types: [
          {
            description: suggestedName,
            accept: { [mimeType]: [`.${ext}`] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (err: unknown) {
      // User cancelled the dialog — don't fall through, just return quietly
      if (err instanceof Error && err.name === "AbortError") return;
      // For any other error fall through to legacy download
    }
  }

  // Legacy fallback: silent download to the browser's default Downloads folder
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = suggestedName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
