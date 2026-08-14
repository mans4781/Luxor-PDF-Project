import { LegalDocPage } from "@/components/layout/LegalDocPage";
import { usePageMeta } from "@/hooks/usePageMeta";
import { privacyPolicyMarkdown } from "@/content/privacy-policy";

export default function PrivacyPage() {
  usePageMeta({
    title: "Privacy Policy \u2014 Luxor PDF",
    description: "Read the Luxor PDF privacy policy. Learn what data we collect, how we protect your documents, and your privacy rights when using Luxor PDF products.",
    path: "/privacy",
  });

  return (
    <LegalDocPage
      badge="Legal & Privacy"
      titleLead="Privacy"
      titleAccent="Policy"
      subtitle="How Fairnova Labs — owner and operator of the Luxor PDF brand — collects, uses, and protects your information."
      effectiveDate="11 July 2026"
      lastUpdated="11 July 2026"
      markdown={privacyPolicyMarkdown}
      footNote="Luxor PDF is a brand of Fairnova Labs."
    />
  );
}
