/**
 * Stable per-install device identity for license activation.
 *
 * Inside the desktop shell the Electron preload exposes a per-install UUID;
 * in the browser we mint one and keep it in localStorage. Uses the same
 * storage keys as pdf-expiry so both apps agree on the device.
 */
const KEY = "luxor.deviceId";

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

export async function getDeviceId(): Promise<string> {
  const bridge = window.luxor;
  if (bridge?.isDesktop && bridge.getDeviceId) {
    try {
      const id = await bridge.getDeviceId();
      if (id) {
        window.localStorage.setItem(KEY, id);
        return id;
      }
    } catch {
      // fall through to localStorage uuid
    }
  }
  let id = window.localStorage.getItem(KEY);
  if (!id) {
    id = uuid();
    window.localStorage.setItem(KEY, id);
  }
  return id;
}

export function getDeviceName(): string {
  const ua = navigator.userAgent;
  if (/Windows/.test(ua)) return "Windows PC";
  if (/Mac OS X/.test(ua)) return "Mac";
  if (/Android/.test(ua)) return "Android";
  if (/iPhone|iPad/.test(ua)) return "iOS";
  if (/Linux/.test(ua)) return "Linux";
  return "Browser";
}

export function detectOs(): string {
  const ua = navigator.userAgent;
  if (/Windows NT/.test(ua)) return "Windows";
  if (/Mac OS X/.test(ua)) return "macOS";
  if (/Android/.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
  if (/Linux/.test(ua)) return "Linux";
  return "Web";
}
