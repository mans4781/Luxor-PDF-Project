// ─────────────────────────────────────────────────────────────────────────────
// Developer-portal password gate (client-side only).
//
// ⚠️  Change DEV_PASSWORD below to set your own developer password.
//     This is a UI-level gate only — it is NOT secure server-side auth.
//     For real production protection, add a server-side check.
// ─────────────────────────────────────────────────────────────────────────────

export const DEV_PASSWORD = "luxor2026";

const STORAGE_KEY = "luxor-dev-auth";

export function isDevAuthed(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setDevAuthed(value: boolean): void {
  try {
    if (value) sessionStorage.setItem(STORAGE_KEY, "1");
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function checkDevPassword(input: string): boolean {
  return input === DEV_PASSWORD;
}
