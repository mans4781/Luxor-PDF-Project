import { LegalDocPage } from "@/components/layout/LegalDocPage";
import { usePageMeta } from "@/hooks/usePageMeta";
import { refundMarkdown } from "@/content/refund-policy";

export default function RefundPage() {
  usePageMeta({
    title: "Refund Policy \u2014 Luxor PDF",
    description: "Read the Luxor PDF refund policy, including eligibility, timelines, and how to request a refund for Luxor PDF Suite purchases and subscriptions.",
    path: "/refund",
  });

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
