/**
 * Build-time prerender of per-route head tags.
 *
 * Social/chat crawlers (Facebook, X, LinkedIn, WhatsApp, Slack) do not
 * execute JavaScript, so the client-side usePageMeta hook is invisible to
 * them. This script runs after `vite build` and, for every route in
 * PAGE_META (plus PRERENDER_ALIASES), writes dist/public/<route>/index.html
 * with the route-specific <title>, meta description, canonical URL, and
 * og:* / twitter:* tags injected into the built homepage HTML.
 *
 * Static servers (vite preview / typical static hosting) resolve
 * `/pricing` to `pricing/index.html`, so raw HTML responses carry the
 * right tags without any runtime server logic.
 *
 * Run with: tsx scripts/prerender.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PAGE_META, PRERENDER_ALIASES, type RouteMeta } from "../src/seo/routeMeta";

const SITE_ORIGIN = "https://luxorpdf.com";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "dist", "public");
const template = readFileSync(path.join(outDir, "index.html"), "utf8");

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function replaceOnce(html: string, pattern: RegExp, replacement: string, what: string, route: string): string {
  if (!pattern.test(html)) {
    throw new Error(`prerender: could not find ${what} in index.html while rendering ${route}`);
  }
  return html.replace(pattern, replacement);
}

function renderRoute(route: string, meta: RouteMeta): string {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const canonical = SITE_ORIGIN + meta.path;
  let html = template;
  html = replaceOnce(html, /<title>[\s\S]*?<\/title>/, `<title>${title}</title>`, "<title>", route);
  html = replaceOnce(
    html,
    /<meta\s+name="description"\s+content="[\s\S]*?"\s*\/>/,
    `<meta name="description" content="${description}" />`,
    "meta description",
    route,
  );
  html = replaceOnce(
    html,
    /<link rel="canonical" href="[^"]*" \/>/,
    `<link rel="canonical" href="${canonical}" />`,
    "canonical link",
    route,
  );
  const og: Array<[string, string]> = [
    ["og:title", title],
    ["og:description", description],
    ["og:url", canonical],
  ];
  for (const [prop, content] of og) {
    html = replaceOnce(
      html,
      new RegExp(`<meta\\s+property="${prop}"\\s+content="[\\s\\S]*?"\\s*/>`),
      `<meta property="${prop}" content="${content}" />`,
      prop,
      route,
    );
  }
  for (const name of ["twitter:title", "twitter:description"] as const) {
    const content = name === "twitter:title" ? title : description;
    html = replaceOnce(
      html,
      new RegExp(`<meta\\s+name="${name}"\\s+content="[\\s\\S]*?"\\s*/>`),
      `<meta name="${name}" content="${content}" />`,
      name,
      route,
    );
  }
  return html;
}

const routes: Array<[string, RouteMeta]> = [
  ...Object.entries(PAGE_META).filter(([, m]) => !("noindex" in m && m.noindex)),
  ...Object.entries(PRERENDER_ALIASES).map(
    ([alias, canonicalRoute]): [string, RouteMeta] => [alias, PAGE_META[canonicalRoute]],
  ),
];

for (const [route, meta] of routes) {
  const html = renderRoute(route, meta);
  const segments = route.split("/").filter(Boolean);
  // "/pricing/" style requests resolve to pricing/index.html …
  const dir = path.join(outDir, ...segments);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "index.html"), html);
  // … while extensionless "/pricing" requests resolve to pricing.html
  // (sirv/vite-preview `extensions` lookup — and what crawlers actually hit).
  const flat = path.join(outDir, ...segments.slice(0, -1), `${segments[segments.length - 1]}.html`);
  writeFileSync(flat, html);
  console.log(`prerendered ${route}`);
}

console.log(`prerender: wrote ${routes.length} routes`);
