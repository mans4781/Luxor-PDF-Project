/**
 * Regression tests for the /lx-console access states:
 *
 *  1. Anonymous visitors (no admin token, no developer session) must see the
 *     intruder-disguise 404 — the console must be indistinguishable from a
 *     missing page.
 *  2. A signed-in admin whose session goes stale (401 from /api/admin/stats,
 *     failed re-probe) must get the explicit "Session expired" prompt, NOT
 *     the fake 404 that would look like a broken page.
 *  3. The "Sign in again" button must target the suite sign-in page at
 *     /app/sign-in.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import AdminPage from "./admin";
import { TooltipProvider } from "@/components/ui/tooltip";
import { locationAssignMock } from "../test/setup";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** A fetch that never settles — keeps the console in its loading state. */
const pending = () => new Promise<Response>(() => {});

/** Mock fetch for /api/admin/* endpoints; anything else fails loudly. */
function mockAdminFetch(handlers: {
  session: () => Response | Promise<Response>;
  stats?: () => Response | Promise<Response>;
}) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (url.includes("/api/admin/session")) return handlers.session();
    if (url.includes("/api/admin/stats")) {
      if (!handlers.stats) throw new Error(`Unexpected stats call: ${url}`);
      return handlers.stats();
    }
    throw new Error(`Unexpected fetch in test: ${url}`);
  });
}

/** Open the shell profile dropdown and click "Log out" (Radix opens on Enter in jsdom). */
async function clickLogout() {
  const trigger = await screen.findByLabelText("Profile menu");
  fireEvent.keyDown(trigger, { key: "Enter" });
  const item = await screen.findByText("Log out");
  fireEvent.click(item);
}

describe("/lx-console access states", () => {
  beforeEach(() => {
    sessionStorage.clear();
    locationAssignMock.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders the 404 disguise for anonymous visitors", async () => {
    vi.stubGlobal(
      "fetch",
      mockAdminFetch({ session: () => jsonResponse(401, { error: "Unauthorized" }) }),
    );

    render(<AdminPage />);

    // Probe is in flight first, then falls through to the disguise.
    expect(await screen.findByText("404 Page Not Found")).toBeTruthy();
    expect(screen.queryByText("Session expired")).toBeNull();
  });

  it("shows the session-expired prompt (not the 404) when a stale token gets a 401 from /api/admin/stats", async () => {
    sessionStorage.setItem("luxor_admin_token", "stale-token");
    vi.stubGlobal(
      "fetch",
      mockAdminFetch({
        // Console opens with the stale token, stats 401s, the page re-probes
        // the session and that fails too → session-expired prompt.
        stats: () => jsonResponse(401, { error: "Unauthorized" }),
        session: () => jsonResponse(401, { error: "Unauthorized" }),
      }),
    );

    render(<AdminPage />);

    expect(await screen.findByText("Session expired")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign in again" })).toBeTruthy();
    // Never the intruder disguise for a proven admin.
    expect(screen.queryByText("404 Page Not Found")).toBeNull();
  });

  it("'Sign in again' navigates to /app/sign-in", async () => {
    sessionStorage.setItem("luxor_admin_token", "stale-token");
    vi.stubGlobal(
      "fetch",
      mockAdminFetch({
        stats: () => jsonResponse(401, { error: "Unauthorized" }),
        session: () => jsonResponse(401, { error: "Unauthorized" }),
      }),
    );

    render(<AdminPage />);

    const button = await screen.findByRole("button", { name: "Sign in again" });
    fireEvent.click(button);

    expect(locationAssignMock).toHaveBeenCalledWith(
      "/app/sign-in?redirect_url=%2Flx-console",
    );
  });

  it("manual sign-out falls back to the 404 disguise, never the session-expired prompt", async () => {
    sessionStorage.setItem("luxor_admin_token", "valid-token");
    vi.stubGlobal(
      "fetch",
      mockAdminFetch({
        // Stats stays pending: the console shell renders with its loading body.
        stats: pending,
        // After sign-out the re-probe finds no developer session.
        session: () => jsonResponse(401, { error: "Unauthorized" }),
      }),
    );

    render(<AdminPage />);

    await clickLogout();

    expect(await screen.findByText("404 Page Not Found")).toBeTruthy();
    expect(screen.queryByText("Session expired")).toBeNull();
    expect(sessionStorage.getItem("luxor_admin_token")).toBeNull();
  });

  it("an in-flight stats request that 401s AFTER Log out keeps the 404 disguise (never 'Session expired')", async () => {
    sessionStorage.setItem("luxor_admin_token", "valid-token");
    // Stats stays in flight until we release it manually — after logout.
    let releaseStats!: (res: Response) => void;
    vi.stubGlobal(
      "fetch",
      mockAdminFetch({
        stats: () => new Promise<Response>((resolve) => { releaseStats = resolve; }),
        session: () => jsonResponse(401, { error: "Unauthorized" }),
      }),
    );

    render(<AdminPage />);

    await clickLogout();
    expect(await screen.findByText("404 Page Not Found")).toBeTruthy();

    // The stale request now lands with a 401 — it must NOT resurrect the
    // "Session expired" prompt; the user chose to leave.
    releaseStats(jsonResponse(401, { error: "Unauthorized" }));
    // Flush the microtask queue so the rejection is fully processed.
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));

    expect(screen.queryByText("Session expired")).toBeNull();
    expect(screen.getByText("404 Page Not Found")).toBeTruthy();
  });

  it("silently re-unlocks the console when a 401 was transient but the developer session is still valid", async () => {
    sessionStorage.setItem("luxor_admin_token", "valid-token");
    let statsCalls = 0;
    vi.stubGlobal(
      "fetch",
      mockAdminFetch({
        // First stats call 401s (transient); after the re-unlock the retry
        // stays pending so the console shows its loading state.
        stats: () => (++statsCalls === 1 ? jsonResponse(401, { error: "Unauthorized" }) : pending()),
        // The developer session is still valid → probe succeeds.
        session: () => jsonResponse(200, { ok: true }),
      }),
    );

    render(<AdminPage />);

    // The console must come back on its own — no prompt, no disguise.
    await waitFor(() => expect(statsCalls).toBeGreaterThanOrEqual(2));
    expect(await screen.findByLabelText("Profile menu")).toBeTruthy();
    expect(screen.queryByText("Session expired")).toBeNull();
    expect(screen.queryByText("404 Page Not Found")).toBeNull();
  });
});

describe("/lx-console dev-preview gating", () => {
  beforeEach(() => {
    sessionStorage.clear();
    locationAssignMock.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    window.location.search = "";
  });

  it("?dev=1 unlocks the sample-data preview in dev builds", async () => {
    vi.stubEnv("DEV", true);
    window.location.search = "?dev=1";
    // Preview mode uses sample data — any network call is a bug.
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        throw new Error(`Unexpected fetch in dev preview: ${String(input)}`);
      }),
    );

    // The app wraps routes in TooltipProvider (App.tsx); the dashboard needs it.
    render(
      <TooltipProvider>
        <AdminPage />
      </TooltipProvider>,
    );

    expect(await screen.findByText(/Developer preview/)).toBeTruthy();
    expect(sessionStorage.getItem("luxor_admin_dev_preview")).toBe("1");
  });

  it("?dev=1 is inert in production builds — anonymous visitors still get the 404", async () => {
    vi.stubEnv("DEV", false);
    window.location.search = "?dev=1";
    vi.stubGlobal(
      "fetch",
      mockAdminFetch({ session: () => jsonResponse(401, { error: "Unauthorized" }) }),
    );

    render(<AdminPage />);

    expect(await screen.findByText("404 Page Not Found")).toBeTruthy();
    expect(screen.queryByText(/Developer preview/)).toBeNull();
    // The preview flag must never be persisted in production builds.
    expect(sessionStorage.getItem("luxor_admin_dev_preview")).toBeNull();
  });
});
