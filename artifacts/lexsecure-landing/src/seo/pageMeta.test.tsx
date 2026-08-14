/**
 * SEO regression guard: every routed landing page must ship with a unique,
 * non-default Google title, a meta description, and a canonical link that
 * matches its route (via usePageMeta).
 *
 * The route inventory is parsed from App.tsx SOURCE, so adding a new
 * <Route path="..." component={...} /> automatically pulls the new page into
 * this suite. A new page that forgets usePageMeta fails here — it will render
 * with the default (homepage) title, no unique description, and a stale
 * canonical.
 *
 * Routes that intentionally carry no SEO meta (homepage uses index.html
 * defaults + prerender; admin/developer are unlisted, auth-gated pages) must
 * be listed in NO_META_ROUTES below with a reason.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { ComponentType } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
// Raw App.tsx source — the single source of truth for the route table.
import appSource from "../App.tsx?raw";
import { PAGE_META, PRERENDER_ALIASES } from "./routeMeta";

const SITE_ORIGIN = "https://luxorpdf.com";

/* ------------------------- route-table extraction ------------------------- */

/** Drop JSX/JS comments so commented-out routes/imports are not parsed. */
function stripComments(source: string): string {
  return source
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

/** component identifier -> "@/pages/..." module specifier */
function parseComponentImports(source: string): Map<string, string> {
  const map = new Map<string, string>();
  // Lazy pages: const Foo = lazy(() => import("@/pages/foo"));
  for (const m of source.matchAll(
    /const\s+(\w+)\s*=\s*lazy\(\(\)\s*=>\s*import\("@\/pages\/([^"]+)"\)\)/g,
  )) {
    map.set(m[1], m[2]);
  }
  // Eager pages: import Foo from "@/pages/foo";
  for (const m of source.matchAll(/import\s+(\w+)\s+from\s+"@\/pages\/([^"]+)"/g)) {
    map.set(m[1], m[2]);
  }
  return map;
}

/** [routePath, componentIdentifier] for every pathed <Route>. */
function parseRoutes(source: string): Array<[string, string]> {
  return [...source.matchAll(/<Route\s+path="([^"]+)"\s+component=\{(\w+)\}/g)].map(
    (m) => [m[1], m[2]],
  );
}

const activeSource = stripComments(appSource);
const componentImports = parseComponentImports(activeSource);
const routes = parseRoutes(activeSource);

// import.meta.glob gives us the page modules without a static import per page.
const pageModules = import.meta.glob("../pages/**/*.tsx") as Record<
  string,
  () => Promise<{ default: ComponentType }>
>;

function moduleLoaderFor(spec: string) {
  const key = `../pages/${spec}.tsx`;
  const loader = pageModules[key];
  if (!loader) throw new Error(`Route component module not found: ${key}`);
  return loader;
}

/* ------------------------------- exemptions ------------------------------- */

/**
 * Routes that intentionally do NOT call usePageMeta. Every entry needs a
 * reason; anything not listed here must pass the full SEO checks.
 */
const NO_META_ROUTES: Record<string, string> = {
  "/": "homepage — title/description/canonical come from index.html defaults",
  "/home-3": "alias of the homepage component (same defaults)",
  "/lx-console": "unlisted admin console disguised as a 404 — must not be indexed or titled",
  "/developer": "internal developer login — unlisted, no SEO surface",
  "/developer/login": "internal developer login — unlisted, no SEO surface",
  "/developer/dashboard": "internal developer dashboard — auth-gated, no SEO surface",
};

/**
 * Draft/duplicate routes: they call usePageMeta but are noindex, and their
 * canonical deliberately points at the preferred original.
 */
const NOINDEX_ROUTES: Record<string, string> = {
  "/home-2": "/", // homepage draft — canonical points at "/"
};

/** Aliases whose canonical points at the original (from the SEO registry). */
function expectedCanonicalPath(route: string): string {
  if (route in NOINDEX_ROUTES) return NOINDEX_ROUTES[route];
  return (PRERENDER_ALIASES as Record<string, string>)[route] ?? route;
}

/* ------------------------------ default meta ------------------------------ */

const indexHtml = readFileSync(
  path.resolve(__dirname, "..", "..", "index.html"),
  "utf8",
);
const DEFAULT_TITLE = /<title>([^<]+)<\/title>/.exec(indexHtml)?.[1]
  ?.replace(/&amp;/g, "&")
  .trim();
const DEFAULT_DESCRIPTION = /name="description"\s+content="([^"]+)"/.exec(
  indexHtml.replace(/\n\s*/g, " "),
)?.[1];

/* --------------------------------- helpers -------------------------------- */

function resetHead() {
  document.title = "";
  for (const sel of [
    'meta[name="description"]',
    'meta[name="robots"]',
    'meta[name="googlebot"]',
    'link[rel="canonical"]',
  ]) {
    document.head.querySelectorAll(sel).forEach((el) => el.remove());
  }
}

async function renderPageAndCollectMeta(spec: string) {
  const { default: Page } = await moduleLoaderFor(spec)();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const view = render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Page />
      </TooltipProvider>
    </QueryClientProvider>,
  );
  // usePageMeta runs in an effect — wait for the title to land.
  await waitFor(() => {
    if (!document.title) throw new Error(`page ${spec} never set document.title`);
  });
  const meta = {
    title: document.title,
    description: document.head
      .querySelector('meta[name="description"]')
      ?.getAttribute("content"),
    canonical: document.head
      .querySelector('link[rel="canonical"]')
      ?.getAttribute("href"),
    robots: document.head
      .querySelector('meta[name="robots"]')
      ?.getAttribute("content"),
  };
  view.unmount();
  return meta;
}

/* ---------------------------------- tests ---------------------------------- */

beforeEach(() => {
  resetHead();
  // Pages must not need the network to set their meta; anything they do fetch
  // (pricing, contact, download stats…) simply stays pending.
  vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => {})));
  if (!("IntersectionObserver" in globalThis)) {
    class IO {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    }
    vi.stubGlobal("IntersectionObserver", IO);
  }
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  resetHead();
});

describe("route table extraction (guards the guard)", () => {
  it("finds the route table and its components in App.tsx", () => {
    // If App.tsx is refactored so parsing breaks, fail loudly instead of
    // silently testing zero pages.
    expect(routes.length).toBeGreaterThanOrEqual(15);
    for (const [routePath, componentId] of routes) {
      expect(
        componentImports.has(componentId),
        `route ${routePath} uses ${componentId} with no recognizable import`,
      ).toBe(true);
    }
  });

  it("reads the default title/description from index.html", () => {
    expect(DEFAULT_TITLE).toBeTruthy();
    expect(DEFAULT_DESCRIPTION).toBeTruthy();
  });

  it("has no stale exemptions — every exempt route still exists in App.tsx", () => {
    const routePaths = new Set(routes.map(([p]) => p));
    for (const exempt of [
      ...Object.keys(NO_META_ROUTES),
      ...Object.keys(NOINDEX_ROUTES),
    ]) {
      expect(routePaths.has(exempt), `stale exemption: ${exempt}`).toBe(true);
    }
  });
});

describe("every routed page ships unique Google meta", () => {
  const checkedRoutes = routes.filter(
    ([routePath]) => !(routePath in NO_META_ROUTES),
  );

  // canonical path -> { title, routes } to assert cross-page uniqueness after
  // all pages have rendered.
  const titlesByCanonical = new Map<string, { title: string; routes: string[] }>();

  it.each(checkedRoutes)("%s sets title/description/canonical", async (routePath, componentId) => {
    const spec = componentImports.get(componentId)!;
    const meta = await renderPageAndCollectMeta(spec);
    const isNoindexDraft = routePath in NOINDEX_ROUTES;

    // Title: present and NOT the index.html default (a page that forgets
    // usePageMeta leaves the default in place — in jsdom, an empty title).
    // Noindex drafts may duplicate the original's title on purpose.
    expect(meta.title, `${routePath}: no document.title set — missing usePageMeta?`).toBeTruthy();
    if (!isNoindexDraft) {
      expect(
        meta.title,
        `${routePath}: title equals the homepage default — missing usePageMeta?`,
      ).not.toBe(DEFAULT_TITLE);
    }

    // Description: present, non-default.
    expect(
      meta.description,
      `${routePath}: no meta description set — missing usePageMeta?`,
    ).toBeTruthy();
    if (!isNoindexDraft) {
      expect(
        meta.description,
        `${routePath}: meta description equals the homepage default`,
      ).not.toBe(DEFAULT_DESCRIPTION);
    }

    // Canonical: matches the route (or the preferred original for aliases and
    // noindex drafts).
    const expectedPath = expectedCanonicalPath(routePath);
    expect(
      meta.canonical,
      `${routePath}: canonical must be ${SITE_ORIGIN}${expectedPath}`,
    ).toBe(SITE_ORIGIN + expectedPath);

    // Noindex drafts must actually carry the robots noindex tag.
    if (routePath in NOINDEX_ROUTES) {
      expect(
        meta.robots,
        `${routePath}: draft route must set robots noindex`,
      ).toContain("noindex");
    }

    // Noindex drafts stay out of the uniqueness check — Google never sees them.
    if (isNoindexDraft) return;

    // Record for the cross-page uniqueness check. Aliases of the same
    // canonical page may (must) share a title; distinct canonicals must not.
    const existing = titlesByCanonical.get(expectedPath);
    if (existing) {
      expect(
        meta.title,
        `${routePath}: title differs from other routes canonicalized to ${expectedPath}`,
      ).toBe(existing.title);
      existing.routes.push(routePath);
    } else {
      titlesByCanonical.set(expectedPath, { title: meta.title, routes: [routePath] });
    }
  });

  it("titles are unique across distinct canonical pages", () => {
    // Runs after the per-route tests above (same file, declared later).
    expect(titlesByCanonical.size).toBeGreaterThanOrEqual(10);
    const seen = new Map<string, string>(); // title -> canonical path
    for (const [canonicalPath, { title }] of titlesByCanonical) {
      const clash = seen.get(title);
      expect(
        clash,
        `duplicate Google title "${title}" on ${canonicalPath} and ${clash}`,
      ).toBeUndefined();
      seen.set(title, canonicalPath);
    }
    // And none of them reuse the homepage default.
    expect(seen.has(DEFAULT_TITLE!)).toBe(false);
  });
});
