import { contextBridge, ipcRenderer } from "electron";

// Single, narrow bridge: the renderer never gets `require`, `process`, or
// any other Node API — only `getDeviceId()` and a desktop marker. Mirrors
// the luxor-desktop (PDF Secure) preload for suite-wide consistency.

interface OpenedFile {
  name: string;
  data: Uint8Array;
}

const luxor = {
  /** True whenever the app runs inside the desktop shell. */
  isDesktop: true as const,
  /** Stable per-install device id (UUID v4, persisted in userData). */
  getDeviceId(): Promise<string> {
    return ipcRenderer.invoke("luxor:get-device-id");
  },
  /**
   * One-shot: returns the PDF the app was launched with (double-click /
   * "Open with" via the registered .pdf file association), or null.
   */
  getPendingFile(): Promise<OpenedFile | null> {
    return ipcRenderer.invoke("luxor:get-pending-file");
  },
  /**
   * Fires when the user opens another PDF from Windows while the app is
   * already running (single-instance second launch).
   */
  onOpenFile(callback: (file: OpenedFile) => void): void {
    ipcRenderer.on("luxor:open-file", (_event, file: OpenedFile) => {
      callback(file);
    });
  },
};

contextBridge.exposeInMainWorld("luxor", luxor);

export type LuxorBridge = typeof luxor;
