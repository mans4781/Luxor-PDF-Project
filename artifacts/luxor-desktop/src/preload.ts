import { contextBridge, ipcRenderer } from "electron";

// Single, narrow bridge: the renderer never gets `require`, `process`, or
// any other Node API — only the methods listed below.

const luxor = {
  /** Stable per-install device id (UUID v4, persisted in userData). */
  getDeviceId(): Promise<string> {
    return ipcRenderer.invoke("luxor:get-device-id");
  },
  /** Identifies this build to the renderer (productName, version, etc.). */
  getAppInfo(): Promise<{
    productName: string;
    version: string;
    platform: NodeJS.Platform;
    loadMode: "remote" | "bundled";
  }> {
    return ipcRenderer.invoke("luxor:get-app-info");
  },
  /** Marks `window.luxor` as the desktop shell so the web app can branch. */
  isDesktop: true as const,
};

contextBridge.exposeInMainWorld("luxor", luxor);

export type LuxorBridge = typeof luxor;
