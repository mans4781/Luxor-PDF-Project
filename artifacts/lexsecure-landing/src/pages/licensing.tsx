import { LegalDocPage } from "@/components/layout/LegalDocPage";
import { usePageMeta } from "@/hooks/usePageMeta";
import { licensingMarkdown } from "@/content/licensing";

export default function LicensingPage() {
  usePageMeta({
    title: "Licensing \u2014 Luxor PDF",
    description: "Luxor PDF licensing terms: how license keys, activations, and device limits work across individual and team plans for Luxor PDF Suite products.",
    path: "/licensing",
  });

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
