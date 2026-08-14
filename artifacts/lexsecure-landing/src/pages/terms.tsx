import { LegalDocPage } from "@/components/layout/LegalDocPage";
import { usePageMeta } from "@/hooks/usePageMeta";
import { termsOfUseMarkdown } from "@/content/terms-of-use";

export default function TermsPage() {
  usePageMeta({
    title: "Terms of Use \u2014 Luxor PDF",
    description: "Read the Luxor PDF terms of use governing your access to Luxor PDF Suite products, including the desktop apps, web tools, eSign, and secure sharing.",
    path: "/terms",
  });

  return (
    <LegalDocPage
      badge="Legal & Terms"
      titleLead="Terms of"
      titleAccent="Use"
      subtitle="The agreement that governs your access to and use of Luxor PDF products, software, and services."
      effectiveDate="11 July 2026"
      lastUpdated="11 July 2026"
      markdown={termsOfUseMarkdown}
      footNote="Luxor PDF is a brand of Fairnova Labs."
    />
  );
}
