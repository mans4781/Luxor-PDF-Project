import { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Clean brand header (matches luxorpdf.com) */}
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <a href={baseUrl} className="group flex items-center gap-3 select-none">
            <img
              src={`${baseUrl}brand/luxor-logo.svg`}
              alt="Luxor"
              className="h-11 w-auto transition-transform duration-300 group-hover:scale-[1.03]"
              draggable={false}
            />
            <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 border-l border-slate-200 pl-3">
              Secure PDF Suite
            </span>
          </a>

          <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
            <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2.25} />
            <span>Processed in your browser · Private by design</span>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-8">
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="container mx-auto px-6 py-4 text-xs text-slate-500 flex items-center justify-between">
          <p>© {new Date().getFullYear()} Luxor PDF. Part of the Luxor Suite.</p>
          <p className="font-mono text-[11px] text-slate-400">v1.0</p>
        </div>
      </footer>
    </div>
  );
}
