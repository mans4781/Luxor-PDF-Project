import { PAGE_META } from "../seo/routeMeta";
import { LegalDocPage } from "@/components/layout/LegalDocPage";
import { usePageMeta } from "@/hooks/usePageMeta";
import { privacyPolicyMarkdown } from "@/content/privacy-policy";

export default function PrivacyPage() {
  usePageMeta(PAGE_META["/privacy"]);

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
