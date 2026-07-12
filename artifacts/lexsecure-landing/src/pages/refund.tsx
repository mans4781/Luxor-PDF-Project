import { LegalDocPage } from "@/components/layout/LegalDocPage";
import { refundMarkdown } from "@/content/refund-policy";

export default function RefundPage() {
  return (
    <LegalDocPage
      badge="Legal & Refunds"
      titleLead="Refund"
      titleAccent="Policy"
      subtitle="When you can request a refund for a Luxor PDF product, licence, subscription, or online service."
      effectiveDate="11 July 2026"
      lastUpdated="11 July 2026"
      markdown={refundMarkdown}
      footNote="Luxor PDF is a brand of Fairnova Labs."
    />
  );
}
