import { useEffect } from "react";

const SITE_ORIGIN = "https://luxorpdf.com";

export interface PageMeta {
  /** Full document title, e.g. "Pricing — Luxor PDF Suite" */
  title: string;
  /** Meta description (~150-160 chars) */
  description: string;
  /** Canonical path starting with "/", e.g. "/pricing" */
  path: string;
  /**
   * Mark the page noindex (e.g. draft/duplicate pages). The canonical still
   * points at `path` (or the preferred original for duplicates).
   */
  noindex?: boolean;
}

/**
 * Sets the document title, meta description, canonical URL, and
 * Open Graph / Twitter tags for a landing page. Restores the homepage
 * defaults (from index.html) on unmount so client-side navigation back
 * to "/" keeps the original metadata.
 */
export function usePageMeta({ title, description, path, noindex }: PageMeta) {
  useEffect(() => {
    const canonicalUrl =
      SITE_ORIGIN + (path.startsWith("/") ? path : `/${path}`);

    const setNamed = (name: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      const prev = el.getAttribute("content");
      el.setAttribute("content", content);
      return () => {
        if (prev !== null) el!.setAttribute("content", prev);
      };
    };

    const setOg = (property: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(
        `meta[property="${property}"]`,
      );
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", property);
        document.head.appendChild(el);
      }
      const prev = el.getAttribute("content");
      el.setAttribute("content", content);
      return () => {
        if (prev !== null) el!.setAttribute("content", prev);
      };
    };

    const prevTitle = document.title;
    document.title = title;

    const restorers = [
      setNamed("description", description),
      setNamed("twitter:title", title),
      setNamed("twitter:description", description),
      setOg("og:title", title),
      setOg("og:description", description),
      setOg("og:url", canonicalUrl),
    ];
    if (noindex) {
      restorers.push(setNamed("robots", "noindex, follow"));
      restorers.push(setNamed("googlebot", "noindex, follow"));
    }

    let canonical = document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    let prevCanonical: string | null = null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    } else {
      prevCanonical = canonical.getAttribute("href");
    }
    canonical.setAttribute("href", canonicalUrl);

    return () => {
      document.title = prevTitle;
      restorers.forEach((restore) => restore());
      if (prevCanonical !== null) {
        canonical!.setAttribute("href", prevCanonical);
      }
    };
  }, [title, description, path, noindex]);
}
