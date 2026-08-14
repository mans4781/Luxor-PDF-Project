import { PAGE_META } from "../seo/routeMeta";
import { LegalDocPage } from "@/components/layout/LegalDocPage";
import { usePageMeta } from "@/hooks/usePageMeta";
import { cookiePolicyMarkdown } from "@/content/cookie-policy";

export default function CookiesPage() {
  usePageMeta(PAGE_META["/cookies"]);

  return (
    <LegalDocPage
      badge="Legal & Cookies"
      titleLead="Cookie"
      titleAccent="Policy"
      subtitle="How Luxor PDF — a brand of Fairnova Labs — uses cookies and similar technologies across our website and services."
      effectiveDate="11 July 2026"
      lastUpdated="11 July 2026"
      markdown={cookiePolicyMarkdown}
      footNote="Luxor PDF is a brand of Fairnova Labs."
    />
  );
}
