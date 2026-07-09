import { contextBridge, ipcRenderer } from "electron";

// Single, narrow bridge: the renderer never gets `require`, `process`, or
// any other Node API — only `getDeviceId()` and a desktop marker. Mirrors
// the luxor-desktop (PDF Secure) preload for suite-wide consistency.

const luxor = {
  /** True whenever the app runs inside the desktop shell. */
  isDesktop: true as const,
  /** Stable per-install device id (UUID v4, persisted in userData). */
  getDeviceId(): Promise<string> {
    return ipcRenderer.invoke("luxor:get-device-id");
  },
};

contextBridge.exposeInMainWorld("luxor", luxor);

export type LuxorBridge = typeof luxor;
