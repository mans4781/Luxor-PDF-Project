import { LegalDocPage } from "@/components/layout/LegalDocPage";
import { termsOfUseMarkdown } from "@/content/terms-of-use";

export default function TermsPage() {
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
