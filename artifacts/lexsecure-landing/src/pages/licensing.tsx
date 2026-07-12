import { LegalDocPage } from "@/components/layout/LegalDocPage";
import { licensingMarkdown } from "@/content/licensing";

export default function LicensingPage() {
  return (
    <LegalDocPage
      badge="Licensing"
      titleLead="Luxor PDF"
      titleAccent="Licensing"
      subtitle="Simple, secure, and flexible licensing for individuals, professionals, teams, and businesses."
      effectiveDate="11 July 2026"
      lastUpdated="11 July 2026"
      markdown={licensingMarkdown}
      footNote="Luxor PDF is a brand of Fairnova Labs."
    />
  );
}
