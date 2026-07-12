import { LegalDocPage } from "@/components/layout/LegalDocPage";
import { privacyPolicyMarkdown } from "@/content/privacy-policy";

export default function PrivacyPage() {
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
