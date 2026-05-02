import { contextBridge, ipcRenderer } from "electron";

// Single, narrow bridge: the renderer never gets `require`, `process`, or
// any other Node API — only `getDeviceId()`. Per spec, the preload exposes
// the stable per-install device id and nothing else.

const luxor = {
  /** Stable per-install device id (UUID v4, persisted in userData). */
  getDeviceId(): Promise<string> {
    return ipcRenderer.invoke("luxor:get-device-id");
  },
};

contextBridge.exposeInMainWorld("luxor", luxor);

export type LuxorBridge = typeof luxor;
