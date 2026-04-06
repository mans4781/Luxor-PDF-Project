import { ReactNode } from "react";
import { useLocation } from "wouter";
import { Shield } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const [, navigate] = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded" style={{ backgroundColor: "#FF0000" }}>
              <Shield className="w-5 h-5" style={{ color: "#ffffff" }} />
            </div>
            <span className="font-semibold tracking-tight text-lg" style={{ color: "#0000FF", fontFamily: "Century, 'Century Gothic', Georgia, serif" }}>LuxorSecure PDF</span>
          </div>
          <nav className="flex items-center gap-6">
            <button
              onClick={() => navigate("/")}
              className="text-sm font-semibold hover:underline cursor-pointer bg-transparent border-0 p-0"
              style={{ color: "#0000FF", fontFamily: "Century, 'Century Gothic', Georgia, serif" }}
            >
              Dashboard
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
