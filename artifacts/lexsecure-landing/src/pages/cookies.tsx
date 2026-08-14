import { LegalDocPage } from "@/components/layout/LegalDocPage";
import { usePageMeta } from "@/hooks/usePageMeta";
import { cookiePolicyMarkdown } from "@/content/cookie-policy";

export default function CookiesPage() {
  usePageMeta({
    title: "Cookie Policy \u2014 Luxor PDF",
    description: "Learn how Luxor PDF uses cookies and similar technologies across luxorpdf.com and our apps, and how you can manage your cookie preferences.",
    path: "/cookies",
  });

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
