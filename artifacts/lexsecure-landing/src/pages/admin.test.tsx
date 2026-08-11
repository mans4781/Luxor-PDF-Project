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
import { locationAssignMock } from "../test/setup";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Mock fetch for /api/admin/* endpoints; anything else fails loudly. */
function mockAdminFetch(handlers: {
  session: () => Response;
  stats?: () => Response;
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

    expect(locationAssignMock).toHaveBeenCalledWith("/app/sign-in");
  });
});
