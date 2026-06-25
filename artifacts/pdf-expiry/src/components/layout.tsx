import { ReactNode, useState } from "react";
import { Undo2, Users, Search, Settings, History, KeyRound, Sparkles, HelpCircle } from "lucide-react";
import { AuthMenu } from "@workspace/luxor-auth-ui";
import { PlanBadge, DailyLimitBanner } from "@/license/UsageBadge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Kbd } from "@/components/ui/kbd";
import { basePath } from "@/lib/base-path";

const PRICING_URL = `/pricing`;

export function Layout({
  children,
  showSearch = false,
  searchQuery,
  onSearchChange,
}: {
  children: ReactNode;
  showSearch?: boolean;
  /** Controlled value for the header tool search. When provided together
   *  with `onSearchChange`, the owning page controls the query so it can
   *  filter its own content. Falls back to internal state otherwise. */
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}) {
  const baseUrl = import.meta.env.BASE_URL;
  const [internalQuery, setInternalQuery] = useState("");
  const query = searchQuery ?? internalQuery;
  const setQuery = onSearchChange ?? setInternalQuery;

  return (
    <>
      <div className="min-h-screen flex flex-col bg-slate-50">
        {/* Clean brand header (matches luxorpdf.com) */}
        <header className="bg-white border-b border-slate-200">
          <div className="container mx-auto px-6 h-20 flex items-center justify-between gap-4">
            {/* Brand lockup */}
            <div className="flex items-center gap-3 shrink-0">
              <img
                src={`${baseUrl}brand/luxor-icon.png`}
                alt=""
                aria-hidden="true"
                className="h-[48px] w-[48px] select-none rounded-[15%] border border-[#DC2626]/40 bg-white shadow-sm"
                draggable={false}
              />
              <div className="hidden sm:flex flex-col leading-none">
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

            {/* Centered tool search (only on pages that opt in) */}
            {showSearch && (
              <div className="flex-1 max-w-md mx-auto hidden md:block">
                <label className="relative block">
                  <span className="sr-only">Search PDF tools</span>
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search PDF tools..."
                    className="w-full h-10 pl-10 pr-12 rounded-full bg-slate-50 border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-colors focus:border-[#DC2626]/40 focus:bg-white focus:ring-2 focus:ring-[#DC2626]/15"
                    data-testid="header-tool-search"
                  />
                  <Kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    ⌘K
                  </Kbd>
                </label>
              </div>
            )}

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <PlanBadge />
              <a
                href={`${basePath}/team`}
                title="Team"
                className="inline-flex items-center gap-1.5 h-9 px-3 text-sm font-semibold text-[#312E81] hover:text-[#1E1B4B] bg-[#312E81]/5 hover:bg-[#312E81]/10 border border-[#312E81]/15 rounded-full transition-colors"
                data-testid="header-team-link"
              >
                <Users className="w-4 h-4" strokeWidth={2.2} />
                <span className="hidden sm:inline">Team</span>
              </a>

              {/* Settings / quick-access menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    title="Settings & shortcuts"
                    aria-label="Settings and shortcuts"
                    className="inline-flex items-center justify-center h-9 w-9 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/30"
                    data-testid="header-settings-menu"
                  >
                    <Settings className="w-4 h-4" strokeWidth={2.2} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>Quick access</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href={`${basePath}/history`} data-testid="menu-item-history">
                      <History className="w-4 h-4" /> History
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href={`${basePath}/?tool=user-guide`} data-testid="menu-item-guide">
                      <HelpCircle className="w-4 h-4" /> User guide
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href={`${basePath}/activate-key`} data-testid="menu-item-activate">
                      <KeyRound className="w-4 h-4" /> Activate key
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href={PRICING_URL} data-testid="menu-item-plans">
                      <Sparkles className="w-4 h-4" /> Plans &amp; pricing
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href="/online-tools" data-testid="menu-item-online-tools">
                      <Undo2 className="w-4 h-4" /> Back to online tools
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

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
    </>
  );
}
