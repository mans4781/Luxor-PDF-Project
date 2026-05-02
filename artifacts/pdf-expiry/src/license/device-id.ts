const KEY = "luxor.deviceId";
const NAME_KEY = "luxor.deviceName";

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
