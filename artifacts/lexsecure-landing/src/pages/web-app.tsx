import { Link } from "wouter";
import { Shield, ArrowLeft } from "lucide-react";

export default function WebAppPage() {
  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between px-6 h-14 border-b bg-background shrink-0 z-10">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-[#E11D48] p-1.5 rounded-md">
            <Shield className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-base text-primary tracking-tight">Luxor PDF</span>
        </Link>
        <a
          href={import.meta.env.BASE_URL}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </a>
      </header>
      <iframe
        src="/"
        title="Luxor PDF Web App"
        className="flex-1 w-full border-0"
        allow="clipboard-write"
      />
    </div>
  );
}
