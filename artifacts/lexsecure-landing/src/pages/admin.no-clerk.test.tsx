/**
 * Regression tests for the no-Clerk-key fallback on /lx-console.
 *
 * admin.tsx resolves the Clerk publishable key at module load. When no key is
 * available (e.g. a build without the env var), the page must render WITHOUT
 * a ClerkProvider instead of crashing — useClerk() throws outside a provider,
 * so AdminPageWithClerk must never mount on this path.
 *
 * These mocks force the no-key path deterministically, independent of the
 * test environment's env vars.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { locationAssignMock } from "../test/setup";

vi.mock("@clerk/react/internal", () => ({
  // No key can be derived from the host and no env fallback exists.
  publishableKeyFromHost: () => undefined,
}));

vi.mock("@clerk/react", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    // Prove the Clerk bridge is never mounted on the no-key path: calling
    // useClerk() without a provider would crash the page in production.
    useClerk: () => {
      throw new Error("useClerk() must not be called when no Clerk key is available");
    },
  };
});

// Import AFTER the mocks so admin.tsx evaluates its module-level key with them.
import AdminPage from "./admin";

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("/lx-console without a Clerk publishable key", () => {
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

  it("renders the 404 disguise for anonymous visitors without crashing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/admin/session")) return jsonResponse(401, { error: "Unauthorized" });
        throw new Error(`Unexpected fetch in test: ${url}`);
      }),
    );

    render(<AdminPage />);

    expect(await screen.findByText("404 Page Not Found")).toBeTruthy();
    expect(screen.queryByText("Session expired")).toBeNull();
  });

  it("DEV preview mode (?dev=1) still works with no provider", async () => {
    vi.stubEnv("DEV", true);
    window.location.search = "?dev=1";
    // Preview mode uses sample data — any network call is a bug.
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        throw new Error(`Unexpected fetch in dev preview: ${String(input)}`);
      }),
    );

    render(
      <TooltipProvider>
        <AdminPage />
      </TooltipProvider>,
    );

    expect(await screen.findByText(/Developer preview/)).toBeTruthy();
    expect(sessionStorage.getItem("luxor_admin_dev_preview")).toBe("1");
  });
});
