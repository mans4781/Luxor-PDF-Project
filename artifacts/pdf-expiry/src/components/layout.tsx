import { ReactNode } from "react";
import { LayoutDashboard } from "lucide-react";
import { AuthMenu } from "@workspace/luxor-auth-ui";
import { UsageBadge, DailyLimitBanner } from "@/license/UsageBadge";
import { basePath } from "@/lib/base-path";

export function Layout({ children }: { children: ReactNode }) {
  const baseUrl = import.meta.env.BASE_URL;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Clean brand header (matches luxorpdf.com) */}
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          {/* Brand lockup */}
          <div className="flex items-center gap-3">
            <img
              src={`${baseUrl}brand/luxor-icon.png`}
              alt=""
              aria-hidden="true"
              className="h-[48px] w-[48px] select-none rounded-[15%] border border-[#DC2626]/40 bg-white shadow-sm"
              draggable={false}
            />
            <div className="flex flex-col leading-none">
              <span className="text-[22px] font-extrabold tracking-tight">
                <span className="text-[#1e3a8a]">Luxor</span>{" "}
                <span className="text-[#DC2626]">PDF</span>{" "}
                <span className="bg-gradient-to-r from-amber-500 to-amber-700 bg-clip-text text-transparent">
                  Secure
                </span>
              </span>
              <span className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Private PDF Suite
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/online-tools"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#312E81] hover:text-[#1E1B4B] bg-[#312E81]/5 hover:bg-[#312E81]/10 border border-[#312E81]/15 rounded-lg px-3 py-1.5 transition-colors"
              aria-label="Back to Online Tools"
              data-testid="header-online-tools-link"
            >
              <LayoutDashboard className="w-4 h-4" strokeWidth={2.2} />
              <span className="hidden sm:inline">Online Tools</span>
            </a>
            <UsageBadge />
            <AuthMenu
              signInUrl={`${basePath}/sign-in`}
              signUpUrl={`${basePath}/sign-up`}
              redirectBackOnAuth={false}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-8">
        <DailyLimitBanner />
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="container mx-auto px-6 py-4 text-xs text-slate-500 relative flex items-center justify-center">
          <p className="text-center">
            © {new Date().getFullYear()} Luxor PDF Secure. Part of the Luxor PDF Suite.
          </p>
          <p className="font-mono text-[11px] text-slate-400 absolute right-6">
            v1.0
          </p>
        </div>
      </footer>
    </div>
  );
}
