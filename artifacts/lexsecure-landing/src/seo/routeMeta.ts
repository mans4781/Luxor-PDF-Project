/**
 * Single source of truth for per-route page metadata.
 *
 * Pages pass these entries to `usePageMeta` (client-side, for Google which
 * renders JS), and `scripts/prerender.ts` injects the same values into the
 * static HTML at build time so social/chat crawlers (Facebook, X, LinkedIn,
 * WhatsApp, Slack) — which do NOT execute JS — see the right title,
 * description, and og:* tags in the raw response.
 *
 * Keep this file data-only (no imports) so the prerender script can load it
 * without pulling in React or browser code.
 */

export interface RouteMeta {
  /** Full document title, e.g. "Pricing — Luxor PDF Suite" */
  title: string;
  /** Meta description (~150-160 chars) */
  description: string;
  /** Canonical path starting with "/", e.g. "/pricing" */
  path: string;
  /** Mark the page noindex (drafts/duplicates). Not prerendered. */
  noindex?: boolean;
}

export const PAGE_META = {
  "/pricing": {
    title: "Luxor PDF Pricing — Free & Premium Plans",
    description:
      "Compare Luxor PDF Suite plans. Start free, or upgrade for advanced editing, eSign, and secure sharing with expiry and access controls. Simple, transparent pricing.",
    path: "/pricing",
  },
  "/about": {
    title: "About Luxor PDF — Privacy-First PDF Software",
    description:
      "Learn about Luxor PDF, the team building privacy-first PDF tools for reading, editing, eSigning, and secure document sharing on Windows, macOS, and the web.",
    path: "/about",
  },
  "/web-app": {
    title: "Luxor PDF Web App — PDF Tools in Your Browser",
    description:
      "Use Luxor PDF directly in your browser. Read, edit, convert, and manage PDF documents online with privacy-first, client-side processing. No install required.",
    path: "/web-app",
  },
  "/contact": {
    title: "Contact Luxor PDF — Support & Sales",
    description:
      "Get in touch with the Luxor PDF team. Contact support for help with products, licensing, or billing, or reach out with sales and partnership inquiries.",
    path: "/contact",
  },
  "/privacy": {
    title: "Privacy Policy — Luxor PDF",
    description:
      "Read the Luxor PDF privacy policy. Learn what data we collect, how we protect your documents, and your privacy rights when using Luxor PDF products.",
    path: "/privacy",
  },
  "/terms": {
    title: "Terms of Use — Luxor PDF",
    description:
      "Read the Luxor PDF terms of use governing your access to Luxor PDF Suite products, including the desktop apps, web tools, eSign, and secure sharing.",
    path: "/terms",
  },
  "/cookies": {
    title: "Cookie Policy — Luxor PDF",
    description:
      "Learn how Luxor PDF uses cookies and similar technologies across luxorpdf.com and our apps, and how you can manage your cookie preferences.",
    path: "/cookies",
  },
  "/licensing": {
    title: "Licensing — Luxor PDF",
    description:
      "Luxor PDF licensing terms: how license keys, activations, and device limits work across individual and team plans for Luxor PDF Suite products.",
    path: "/licensing",
  },
  "/refund": {
    title: "Refund Policy — Luxor PDF",
    description:
      "Read the Luxor PDF refund policy, including eligibility, timelines, and how to request a refund for Luxor PDF Suite purchases and subscriptions.",
    path: "/refund",
  },
  "/invest": {
    title: "Invest in Luxor PDF — Investment Opportunities",
    description:
      "Explore investment opportunities with Luxor PDF, a privacy-first PDF software company building tools for reading, editing, eSigning, and secure sharing.",
    path: "/invest",
  },
  "/brand": {
    title: "Brand Assets — Luxor PDF Logos & Media Kit",
    description:
      "Download official Luxor PDF brand assets: logos, icons, and media kit resources with usage guidelines for press, partners, and publications.",
    path: "/brand",
  },
  "/download": {
    title: "Download Luxor PDF — Windows Apps & Web Tools",
    description:
      "Download Luxor PDF apps for Windows and access the web tools. Get Luxor PDF Reader and the Luxor PDF Suite — fast, lightweight, and privacy-first.",
    path: "/download",
  },
  "/products/pdf-reader": {
    title: "Luxor PDF Reader – Fast, Lightweight and Secure PDF Reader",
    description:
      "Download Luxor PDF Reader for Windows. Open, view, search, annotate, bookmark, print, and securely read PDF documents with a fast and lightweight desktop experience.",
    path: "/products/pdf-reader",
  },
  "/products/pdf-editor": {
    title: "Luxor PDF Editor — Edit Text, Images & Pages in PDFs",
    description:
      "Edit PDFs with Luxor PDF Editor: change text in-place, manage images, reorder and merge pages, and fill forms. Fast, privacy-first PDF editing.",
    path: "/products/pdf-editor",
  },
  "/products/esign": {
    title: "Luxor eSign — Send, Sign & Track Documents Online",
    description:
      "Send documents for signature with Luxor eSign. Legally binding electronic signatures, templates, reminders, and a full audit trail — simple and secure.",
    path: "/products/esign",
  },
  "/products/pdf-security": {
    title: "Luxor PDF Security — Share PDFs with Expiry & Access Controls",
    description:
      "Protect and share PDFs securely with Luxor PDF Security: set expiry dates, passwords, watermarks, and access controls, and track who views your documents.",
    path: "/products/pdf-security",
  },
} as const satisfies Record<string, RouteMeta>;

/**
 * Extra URL paths that render an existing page under a different address
 * (route aliases). Prerendered with the canonical entry's meta so shared
 * links still show the right title; the canonical URL keeps pointing at the
 * original path.
 */
export const PRERENDER_ALIASES: Record<string, keyof typeof PAGE_META> = {
  "/about-2": "/about",
  "/thank-you": "/download",
};
