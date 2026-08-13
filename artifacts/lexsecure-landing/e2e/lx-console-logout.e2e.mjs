// Real-browser e2e verification for the /lx-console Log out flow.
//
// Unlike the jsdom unit tests (admin.test.tsx, admin.no-clerk.test.tsx), this
// drives a real Chromium browser with a REAL Clerk session cookie and asserts:
//   1. A verified developer session unlocks the console at /lx-console.
//   2. Clicking "Log out" immediately drops to the 404 disguise (never the
//      "Session expired" prompt), ends the Clerk session, clears the local
//      unlock (sessionStorage) and the Clerk session cookie.
//   3. A fresh navigation to /lx-console does NOT restore access: the
//      /api/admin/session probe returns 401 and the 404 disguise stays.
//
// Run (dev env, api-server + lexsecure-landing workflows must be up):
//   node artifacts/lexsecure-landing/e2e/lx-console-logout.e2e.mjs
//
// Requires env: CLERK_SECRET_KEY, DATABASE_URL (both present in the Replit
// dev environment). No secrets are printed. The script provisions a
// throwaway Clerk user + dev DB rows and cleans them up afterwards.

import { chromium } from "playwright";
import pg from "pg";
import { randomBytes } from "node:crypto";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:80";
const CLERK_API = "https://api.clerk.com/v1";
const SECRET = process.env.CLERK_SECRET_KEY;
if (!SECRET) throw new Error("CLERK_SECRET_KEY is required");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const suffix = randomBytes(4).toString("hex");
const email = `dev-e2e-${suffix}@example.com`;

let failures = 0;
function check(name, ok, detail = "") {
  const mark = ok ? "PASS" : "FAIL";
  console.log(`[${mark}] ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
}

async function clerk(method, path, body) {
  const res = await fetch(`${CLERK_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${SECRET}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Clerk ${method} ${path} → ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

let userId = null;
let browser = null;
try {
  // ── 1. Provision throwaway Clerk developer user ──────────────────────────
  // bypass_client_trust: Client Trust would otherwise demand an email code on
  // the new browser context (see .agents/memory/clerk-dev-test-login.md).
  const user = await clerk("POST", "/users", {
    email_address: [email],
    password: `E2e-${randomBytes(12).toString("hex")}!`,
    skip_password_checks: true,
  });
  userId = user.id;
  const emailId = user.email_addresses[0].id;
  await clerk("PATCH", `/email_addresses/${emailId}`, { verified: true });
  await clerk("PATCH", `/users/${userId}`, { bypass_client_trust: true });
  console.log(`Provisioned Clerk user ${userId} (${email})`);

  // Register as developer BEFORE any API lookup so the server's 30s negative
  // membership cache never gets populated for this user.
  await db.query("INSERT INTO developers (email) VALUES ($1) ON CONFLICT DO NOTHING", [email]);

  // Sign-in token → programmatic browser login without touching Clerk's UI.
  const { token: ticket } = await clerk("POST", "/sign_in_tokens", { user_id: userId });

  // ── 2. Real browser: sign in and capture the session ─────────────────────
  browser = await chromium.launch({ args: ["--no-sandbox"] });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${BASE}/lx-console`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.Clerk?.loaded, null, { timeout: 30000 });

  const sessionId = await page.evaluate(async (t) => {
    const res = await window.Clerk.client.signIn.create({ strategy: "ticket", ticket: t });
    if (res.status !== "complete") throw new Error(`sign-in status: ${res.status}`);
    await window.Clerk.setActive({ session: res.createdSessionId });
    return res.createdSessionId;
  }, ticket);
  check("Clerk programmatic sign-in", Boolean(sessionId), `session ${sessionId}`);

  // Mark the session passphrase-verified (the passphrase values are secrets;
  // the gate's own correctness is covered elsewhere — here we seed the row it
  // would create, exactly what /account/dev-verify does).
  await db.query(
    "INSERT INTO developer_verifications (session_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
    [sessionId, userId],
  );

  // ── 3. Console unlocks for the verified session ───────────────────────────
  await page.goto(`${BASE}/lx-console`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('text=Luxor PDF Admin', { timeout: 30000 });
  check("Console renders before logout", true);
  const probeBefore = await page.evaluate(() =>
    fetch("/api/admin/session", { credentials: "include" }).then((r) => r.status));
  check("Probe /api/admin/session returns 200 pre-logout", probeBefore === 200, `status ${probeBefore}`);
  const cookiesBefore = await context.cookies();
  check("__session Clerk cookie present pre-logout",
    cookiesBefore.some((c) => c.name === "__session" && c.value));

  // ── 4. Log out via the profile menu ──────────────────────────────────────
  await page.click('button[aria-label="Profile menu"]');
  await page.click('text=Log out');

  // Console must vanish immediately; must NOT show "Session expired".
  await page.waitForFunction(
    () => !document.body.innerText.includes("Luxor PDF Admin"),
    null, { timeout: 15000 },
  );
  const bodyAfter = await page.evaluate(() => document.body.innerText);
  check("Console gone right after Log out", !bodyAfter.includes("Luxor PDF Admin"));
  check("No 'Session expired' prompt after manual Log out", !bodyAfter.includes("Session expired"));
  check("404 disguise or post-signout redirect shown",
    bodyAfter.includes("404 Page Not Found") || new URL(page.url()).pathname === "/",
    `url=${page.url()}`);

  // Clerk signOut completes: session object cleared in the browser.
  await page.waitForFunction(() => !window.Clerk?.session, null, { timeout: 15000 });
  check("Clerk session ended in browser (Clerk.session null)", true);

  // Local unlock + Clerk session cookie cleared.
  const storage = await page.evaluate(() => ({
    token: sessionStorage.getItem("luxor_admin_token"),
    preview: sessionStorage.getItem("luxor_admin_dev_preview"),
  }));
  check("sessionStorage unlock cleared", storage.token === null && storage.preview === null);
  // Clerk revokes the session server-side on signOut; the __session cookie is
  // usually cleared shortly after. Poll for the clear, and if a cookie value
  // lingers, verify it is dead: a request carrying it must get 401.
  let sess = null;
  for (let i = 0; i < 20; i++) {
    sess = (await context.cookies()).find((c) => c.name === "__session");
    if (!sess || !sess.value) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!sess || !sess.value) {
    check("__session Clerk cookie cleared after logout", true,
      sess ? "cookie emptied" : "cookie removed");
  } else {
    const lingering = await page.evaluate(() =>
      fetch("/api/admin/session", { credentials: "include" }).then((r) => r.status));
    check("lingering __session cookie is revoked (server rejects it)",
      lingering === 401, `probe status ${lingering}`);
  }

  // ── 5. Reload must NOT restore access ─────────────────────────────────────
  await page.goto(`${BASE}/lx-console`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("text=404 Page Not Found", { timeout: 30000 });
  const reloadBody = await page.evaluate(() => document.body.innerText);
  check("Reload shows 404 disguise, not console", !reloadBody.includes("Luxor PDF Admin"));
  check("Reload shows no 'Session expired' prompt", !reloadBody.includes("Session expired"));
  const probeAfter = await page.evaluate(() =>
    fetch("/api/admin/session", { credentials: "include" }).then((r) => r.status));
  check("Probe /api/admin/session returns 401 post-logout", probeAfter === 401, `status ${probeAfter}`);
} finally {
  // ── Cleanup ────────────────────────────────────────────────────────────────
  try { await browser?.close(); } catch {}
  try {
    await db.query("DELETE FROM developer_verifications WHERE user_id = $1", [userId]);
    await db.query("DELETE FROM developers WHERE email = $1", [email]);
  } catch (e) { console.warn("DB cleanup failed:", e.message); }
  try { if (userId) await clerk("DELETE", `/users/${userId}`); } catch (e) { console.warn("Clerk cleanup failed:", e.message); }
  await db.end();
}

if (failures > 0) {
  console.error(`\n${failures} assertion(s) FAILED`);
  process.exit(1);
}
console.log("\nAll assertions passed — /lx-console Log out verified end-to-end in a real browser.");
