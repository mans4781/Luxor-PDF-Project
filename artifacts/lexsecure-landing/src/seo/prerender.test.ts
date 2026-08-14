/**
 * Prerender regression guard: social/chat crawlers (Facebook, X, Slack,
 * WhatsApp) never run JavaScript — they only see the static HTML that
 * scripts/prerender.ts writes at build time. This suite runs the real
 * prerender against a temp directory and asserts that every registered
 * route in PAGE_META (plus every PRERENDER_ALIASES entry) emits BOTH file
 * forms — `x/index.html` AND `x.html` (extensionless-URL lookup) — with the
 * correct title, description, og:title/description/url, twitter tags, and
 * canonical. A route added to PAGE_META that the prerender misses, or an
 * output form that goes missing (the extensionless fallback bug seen
 * before), fails here.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  SITE_ORIGIN,
  outputFilesFor,
  prerender,
  prerenderRoutes,
} from "../../scripts/prerender";
import { PAGE_META, PRERENDER_ALIASES, type RouteMeta } from "./routeMeta";

// The source index.html carries the same head tags the built template does;
// the prerender's replaceOnce() throws if any expected tag is missing, so
// running against it also guards the tag patterns themselves.
const template = readFileSync(
  path.resolve(__dirname, "..", "..", "index.html"),
  "utf8",
);

let outDir: string;
let routeCount: number;

beforeAll(() => {
  outDir = mkdtempSync(path.join(tmpdir(), "prerender-test-"));
  routeCount = prerender(outDir, template);
});

afterAll(() => {
  rmSync(outDir, { recursive: true, force: true });
});

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Every route the prerender is contractually required to emit. */
const expectedRoutes: Array<[route: string, meta: RouteMeta]> = [
  ...Object.entries(PAGE_META).filter(
    ([, m]) => !("noindex" in m && (m as RouteMeta).noindex),
  ),
  ...Object.entries(PRERENDER_ALIASES).map(
    ([alias, canonical]): [string, RouteMeta] => [alias, PAGE_META[canonical]],
  ),
];

function assertMetaInHtml(html: string, route: string, meta: RouteMeta) {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const canonical = SITE_ORIGIN + meta.path;

  expect(html, `${route}: wrong <title>`).toContain(`<title>${title}</title>`);
  expect(html, `${route}: wrong meta description`).toContain(
    `<meta name="description" content="${description}" />`,
  );
  expect(html, `${route}: wrong canonical`).toContain(
    `<link rel="canonical" href="${canonical}" />`,
  );
  expect(html, `${route}: wrong og:title`).toContain(
    `<meta property="og:title" content="${title}" />`,
  );
  expect(html, `${route}: wrong og:description`).toContain(
    `<meta property="og:description" content="${description}" />`,
  );
  expect(html, `${route}: wrong og:url`).toContain(
    `<meta property="og:url" content="${canonical}" />`,
  );
  expect(html, `${route}: wrong twitter:title`).toContain(
    `<meta name="twitter:title" content="${title}" />`,
  );
  expect(html, `${route}: wrong twitter:description`).toContain(
    `<meta name="twitter:description" content="${description}" />`,
  );

  // The homepage defaults must be fully replaced — no leftover default
  // title/og:title means a crawler can never see the homepage preview on a
  // subpage URL.
  const defaultTitle = /<title>([\s\S]*?)<\/title>/.exec(template)![1];
  if (title !== defaultTitle) {
    expect(html, `${route}: default homepage title leaked into output`).not.toContain(
      `>${defaultTitle}<`,
    );
  }
}

describe("prerender route inventory", () => {
  it("prerenders exactly the non-noindex PAGE_META routes plus all aliases", () => {
    const emitted = prerenderRoutes().map(([r]) => r);
    const expected = expectedRoutes.map(([r]) => r);
    expect(emitted.sort()).toEqual(expected.sort());
    expect(routeCount).toBe(expected.length);
  });

  it("covers a sane number of routes (guards the guard)", () => {
    expect(expectedRoutes.length).toBeGreaterThanOrEqual(15);
  });

  it("every alias points at a real PAGE_META entry", () => {
    for (const [alias, canonical] of Object.entries(PRERENDER_ALIASES)) {
      expect(PAGE_META[canonical], `alias ${alias} → missing route ${canonical}`).toBeTruthy();
    }
  });
});

describe("every route emits both file forms with correct social meta", () => {
  it.each(expectedRoutes)("%s", (route, meta) => {
    const [dirForm, flatForm] = outputFilesFor(route);
    for (const rel of [dirForm, flatForm]) {
      const file = path.join(outDir, rel);
      expect(
        existsSync(file),
        `${route}: missing output file ${rel} — crawlers hitting the ` +
          `${rel.endsWith(`${path.sep}index.html`) ? "trailing-slash" : "extensionless"} ` +
          `URL form would get the homepage preview`,
      ).toBe(true);
      assertMetaInHtml(readFileSync(file, "utf8"), `${route} (${rel})`, meta);
    }
    // Both forms must be byte-identical.
    expect(readFileSync(path.join(outDir, dirForm), "utf8")).toBe(
      readFileSync(path.join(outDir, flatForm), "utf8"),
    );
  });

  it("aliases carry the canonical route's URL, not their own", () => {
    for (const [alias, canonicalRoute] of Object.entries(PRERENDER_ALIASES)) {
      const [dirForm] = outputFilesFor(alias);
      const html = readFileSync(path.join(outDir, dirForm), "utf8");
      expect(html, `${alias}: canonical must point at ${canonicalRoute}`).toContain(
        `<link rel="canonical" href="${SITE_ORIGIN}${canonicalRoute}" />`,
      );
      expect(html, `${alias}: og:url must point at ${canonicalRoute}`).toContain(
        `<meta property="og:url" content="${SITE_ORIGIN}${canonicalRoute}" />`,
      );
    }
  });
});
