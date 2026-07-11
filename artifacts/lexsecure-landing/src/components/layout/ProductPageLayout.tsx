import { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

interface ProductPageLayoutProps {
  children: ReactNode;
}

export function ProductPageLayout({ children }: ProductPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="pt-20 flex-1">
        <div className="container mx-auto px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
        </div>
        {children}
      </div>
      <Footer />
    </div>
  );
}
