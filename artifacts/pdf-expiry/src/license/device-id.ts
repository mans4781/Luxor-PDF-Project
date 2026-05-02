const KEY = "luxor.deviceId";
const NAME_KEY = "luxor.deviceName";

/**
 * Electron preload bridge exposed by `artifacts/luxor-desktop`.
 * In a plain browser this is `undefined`. The presence of the bridge
 * itself is the desktop-vs-browser signal — no separate flag needed.
 */
interface LuxorBridge {
  getDeviceId(): Promise<string>;
}
declare global {
  interface Window {
    luxor?: LuxorBridge;
  }
}

/**
 * Called once at app startup. When running inside the Electron desktop
 * wrapper, replaces the localStorage device id with the stable per-install
 * UUID exposed by the preload bridge so every later sync call to
 * `getOrCreateDeviceId()` returns the desktop-bound id.
 */
export async function initDeviceIdFromBridge(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const bridge = window.luxor;
  if (!bridge?.getDeviceId) return null;
  try {
    const id = await bridge.getDeviceId();
    if (id) {
      window.localStorage.setItem(KEY, id);
      return id;
    }
  } catch {
    // ignore — falls back to localStorage uuid
  }
  return null;
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id = uuid();
    window.localStorage.setItem(KEY, id);
  }
  return id;
}

export function getDeviceName(): string {
  if (typeof window === "undefined") return "Browser";
  const stored = window.localStorage.getItem(NAME_KEY);
  if (stored) return stored;
  const ua = navigator.userAgent;
  let name = "Browser";
  if (/Windows/.test(ua)) name = "Windows PC";
  else if (/Mac OS X/.test(ua)) name = "Mac";
  else if (/Linux/.test(ua)) name = "Linux";
  else if (/Android/.test(ua)) name = "Android";
  else if (/iPhone|iPad/.test(ua)) name = "iOS";
  return name;
}

export function detectOs(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/Windows NT/.test(ua)) return "Windows";
  if (/Mac OS X/.test(ua)) return "macOS";
  if (/Android/.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
  if (/Linux/.test(ua)) return "Linux";
  return "Web";
}
