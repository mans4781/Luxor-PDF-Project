/**
 * Lightweight page-view beacon. Reports the current pathname to the API on
 * initial load and on every client-side navigation (pushState / replaceState /
 * back-forward). Fire-and-forget; never throws. Dev traffic is skipped so the
 * analytics only reflect real visitors.
 */
let lastReported: string | null = null;

function report(): void {
  const path = window.location.pathname || "/";
  if (path === lastReported) return;
  lastReported = path;
  if (import.meta.env.DEV) return;
  try {
    const body = JSON.stringify({ path });
    fetch("/api/visitors/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore
  }
}

export function initPageTracking(): void {
  if (typeof window === "undefined") return;
  report();
  const wrap = (fn: typeof history.pushState) =>
    function (this: History, ...args: Parameters<typeof history.pushState>) {
      const out = fn.apply(this, args);
      report();
      return out;
    };
  history.pushState = wrap(history.pushState.bind(history));
  history.replaceState = wrap(history.replaceState.bind(history));
  window.addEventListener("popstate", report);
}
