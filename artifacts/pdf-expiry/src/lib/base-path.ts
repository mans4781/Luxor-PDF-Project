const raw = import.meta.env.BASE_URL;

// Legacy URLs: the app used to live under "/pdf-expiry". Anyone landing on an
// old link is transparently forwarded to the same page under the new base.
if (
  typeof window !== "undefined" &&
  (window.location.pathname === "/pdf-expiry" ||
    window.location.pathname.startsWith("/pdf-expiry/"))
) {
  const newBase = typeof raw === "string" ? raw.replace(/\/$/, "") : "";
  window.location.replace(
    window.location.pathname.replace(/^\/pdf-expiry/, newBase || "") +
      window.location.search +
      window.location.hash,
  );
}

/**
 * The app's static base path (e.g. "/pdf-expiry"). Used for auth links,
 * account/menu navigation, asset URLs, and Clerk path stripping — these always
 * live under the prefixed address so the shared proxy, the suite SSO host, and
 * the desktop wrapper keep working exactly as before.
 */
export const basePath =
  typeof raw === "string" && raw.startsWith("/")
    ? raw.replace(/\/$/, "")
    : "";

/**
 * The free Online Tools pages are ALSO served at the root of luxorpdf.com
 * (no "/pdf-expiry" prefix) through extra proxy routes. When the page is
 * loaded at one of those clean addresses we run the wouter router with an
 * empty base so the same route table matches. Every other entry point
 * (dashboard, history, sign-in, checkout, desktop) keeps the static base
 * above, so nothing else changes.
 */
function isCleanToolPath(pathname: string): boolean {
  return (
    pathname === "/online-tools" ||
    pathname.startsWith("/online-tools/") ||
    pathname === "/tools" ||
    pathname.startsWith("/tools/")
  );
}

export const routerBase =
  typeof window !== "undefined" && isCleanToolPath(window.location.pathname)
    ? ""
    : basePath;
