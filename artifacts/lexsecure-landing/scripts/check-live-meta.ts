/**
 * Post-deploy check: confirm the live site serves route-specific prerendered
 * meta (title + og:title) in the RAW HTML response — i.e. what social/chat
 * crawlers (which never run JS) actually see.
 *
 * The build-time test (src/seo/prerender.test.ts) proves dist/ is correct,
 * but production hosting could still serve the SPA shell for extensionless
 * URLs (e.g. /pricing) if the static server's `extensions` lookup isn't
 * enabled. This script catches that after every deploy.
 *
 * For each checked route it fetches BOTH URL forms:
 *   - extensionless  /pricing   (what crawlers fetch — resolves to pricing.html)
 *   - trailing slash /pricing/  (resolves to pricing/index.html)
 * and asserts the route-specific <title> and og:title from the routeMeta
 * registry appear in the response body.
 *
 * Coverage includes an alias (/thank-you → /download meta) and a nested
 * route (/products/esign), per the deploy checklist.
 *
 * Run with:  tsx scripts/check-live-meta.ts [origin]
 *   origin defaults to https://luxorpdf.com
 * Exits non-zero on any failure.
 */
import { PAGE_META, PRERENDER_ALIASES } from "../src/seo/routeMeta";

const ORIGIN = (process.argv[2] ?? "https://luxorpdf.com").replace(/\/$/, "");

/** Routes to spot-check on the live site (route → meta registry key). */
const CHECK_ROUTES: Array<[route: string, metaKey: keyof typeof PAGE_META]> = [
  ["/pricing", "/pricing"], // top-level route
  ["/products/esign", "/products/esign"], // nested route
  ["/thank-you", PRERENDER_ALIASES["/thank-you"]], // alias → canonical meta
];

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface Failure {
  url: string;
  problem: string;
}

async function checkUrl(url: string, expectedTitle: string): Promise<Failure[]> {
  const failures: Failure[] = [];
  let body: string;
  let status: number;
  try {
    // No JS execution — exactly what a crawler sees. Follow redirects so
    // /x → /x/ (or vice versa) is fine as long as the final body is right.
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "user-agent": "luxorpdf-meta-check/1.0 (post-deploy)" },
    });
    status = res.status;
    body = await res.text();
  } catch (err) {
    return [{ url, problem: `fetch failed: ${(err as Error).message}` }];
  }
  if (status !== 200) {
    return [{ url, problem: `expected HTTP 200, got ${status}` }];
  }
  const title = escapeHtml(expectedTitle);
  if (!body.includes(`<title>${title}</title>`)) {
    const got = body.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() ?? "(no <title> found)";
    failures.push({
      url,
      problem: `wrong <title>: expected "${expectedTitle}", raw HTML has "${got}" — likely serving the SPA shell`,
    });
  }
  if (!new RegExp(`<meta\\s+property="og:title"\\s+content="${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`).test(body)) {
    failures.push({ url, problem: `og:title missing or wrong (expected "${expectedTitle}")` });
  }
  return failures;
}

async function main(): Promise<void> {
  console.log(`Checking prerendered meta on ${ORIGIN}\n`);
  const allFailures: Failure[] = [];
  for (const [route, metaKey] of CHECK_ROUTES) {
    const expected = PAGE_META[metaKey].title;
    // Both URL forms: extensionless (crawlers) and trailing slash.
    for (const form of [route, `${route}/`]) {
      const url = ORIGIN + form;
      const failures = await checkUrl(url, expected);
      if (failures.length === 0) {
        console.log(`  OK   ${url}  → "${expected}"`);
      } else {
        for (const f of failures) console.error(`  FAIL ${f.url}\n       ${f.problem}`);
        allFailures.push(...failures);
      }
    }
  }
  if (allFailures.length > 0) {
    console.error(
      `\n${allFailures.length} check(s) failed. Shared links for these routes will show the wrong preview.` +
        `\nIf extensionless URLs fail but trailing-slash ones pass, the static server's ` +
        `\`extensions\` (.html) lookup is disabled in production hosting.`,
    );
    process.exit(1);
  }
  console.log(`\nAll ${CHECK_ROUTES.length * 2} live-meta checks passed.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
