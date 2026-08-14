import { PAGE_META } from "../seo/routeMeta";
import { LegalDocPage } from "@/components/layout/LegalDocPage";
import { usePageMeta } from "@/hooks/usePageMeta";
import { licensingMarkdown } from "@/content/licensing";

export default function LicensingPage() {
  usePageMeta(PAGE_META["/licensing"]);

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
