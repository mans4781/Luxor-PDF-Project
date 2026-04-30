import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { AppPreview } from "@/components/sections/AppPreview";
import { Features } from "@/components/sections/Features";
import { WorkflowGrid } from "@/components/sections/WorkflowGrid";
import { Security } from "@/components/sections/Security";
import { SecurityMetrics } from "@/components/sections/SecurityMetrics";
import { DesktopApp } from "@/components/sections/DesktopApp";
import { Testimonials } from "@/components/sections/Testimonials";
import { FAQ } from "@/components/sections/FAQ";
import { CTA } from "@/components/sections/CTA";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <AppPreview />
        <Features />
        <WorkflowGrid />
        <Security />
        <SecurityMetrics />
        <DesktopApp />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
