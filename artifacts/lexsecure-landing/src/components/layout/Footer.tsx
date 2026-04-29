import { Link } from "wouter";
import { useVisitorCount } from "@/hooks/useVisitorCount";

export function Footer() {
  const visitorCount = useVisitorCount();

  return (
    <footer className="bg-foreground text-background py-20">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="inline-flex items-center mb-6 bg-white/95 rounded-lg px-3 py-2 shadow-sm">
              <img
                src={`${import.meta.env.BASE_URL}brand/luxor-logo.png?v=1777494202`}
                alt="Luxor PDF"
                className="h-9 w-auto select-none"
                draggable={false}
              />
            </Link>
            <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
              The professional PDF suite that respects your privacy. Built for law firms, businesses, and professionals who demand uncompromising document control.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-white">Product</h4>
            <ul className="space-y-3">
              <li><a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a></li>
              <li><a href="#security" className="text-sm text-gray-400 hover:text-white transition-colors">Security Model</a></li>
              <li><a href="#desktop" className="text-sm text-gray-400 hover:text-white transition-colors">Desktop App</a></li>
              <li><Link href="/web-app" className="text-sm text-gray-400 hover:text-white transition-colors">Web App</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-white">Legal</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Security Whitepaper</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} Luxor PDF. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="text-sm text-gray-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
              All systems operational
            </span>
            <span className="text-sm text-gray-600 tabular-nums">
              {visitorCount === null
                ? "· · ·"
                : `${visitorCount.toLocaleString()} visitors`}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
