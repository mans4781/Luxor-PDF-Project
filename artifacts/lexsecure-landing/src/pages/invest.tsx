import { LegalDocPage } from "@/components/layout/LegalDocPage";
import { investmentMarkdown } from "@/content/investment";

export default function InvestPage() {
  return (
    <LegalDocPage
      badge="Investment"
      titleLead="Building a Smarter Future for"
      titleAccent="Digital Documents"
      subtitle="Luxor PDF is bootstrapped, growing with purpose, and open to conversations with investors and strategic partners who believe in our vision."
      effectiveDate="12 July 2026"
      lastUpdated="12 July 2026"
      markdown={investmentMarkdown}
      footNote="Luxor PDF is a brand of Fairnova Labs."
    />
  );
}
