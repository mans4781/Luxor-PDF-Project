import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Shield, LayoutDashboard, List, Wrench, ArrowLeftRight } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

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
            <Link 
              href="/" 
              className={`text-sm font-medium transition-colors hover:text-primary ${location === '/' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </div>
            </Link>
            <Link 
              href="/history" 
              className={`text-sm font-medium transition-colors hover:text-primary ${location === '/history' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <div className="flex items-center gap-2">
                <List className="w-4 h-4" />
                History
              </div>
            </Link>
            <Link 
              href="/pdf-tool" 
              className={`text-sm font-medium transition-colors hover:text-primary ${location === '/pdf-tool' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4" />
                PDF Tool
              </div>
            </Link>
            <Link 
              href="/convert" 
              className={`text-sm font-medium transition-colors hover:text-primary ${location === '/convert' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4" />
                Convert
              </div>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
