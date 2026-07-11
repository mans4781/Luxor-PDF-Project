import { ReactNode, useState } from "react";
import { Undo2, Search, History, KeyRound, Sparkles, HelpCircle } from "lucide-react";
import { AuthMenu } from "@workspace/luxor-auth-ui";
import { PlanBadge, DailyLimitBanner } from "@/license/UsageBadge";
import { Kbd } from "@/components/ui/kbd";
import { MegaMenu } from "@/components/mega-menu";
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
            <a
              href={baseUrl}
              aria-label="Luxor PDF Secure — home"
              className="flex items-center gap-3 shrink-0 rounded-lg transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754F4]/40"
            >
              <img
                src={`${baseUrl}brand/luxor-secure-icon.png?v=20260711`}
                alt=""
                aria-hidden="true"
                className="h-[52px] w-[52px] select-none drop-shadow-sm"
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
            </a>

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
                    className="w-full h-10 pl-10 pr-12 rounded-full bg-slate-50 border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-colors focus:border-[#1754F4]/40 focus:bg-white focus:ring-2 focus:ring-[#1754F4]/15"
                    data-testid="header-tool-search"
                  />
                  <Kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    ⌘K
                  </Kbd>
                </label>
              </div>
            )}

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <MegaMenu />
              <PlanBadge />

              <AuthMenu
                signInUrl={`${basePath}/sign-in`}
                signUpUrl={`${basePath}/sign-up`}
                redirectBackOnAuth={false}
                iconOnly
                menuLinks={[
                  {
                    label: "History",
                    href: `${basePath}/history`,
                    icon: <History />,
                    testId: "menu-item-history",
                  },
                  {
                    label: "User guide",
                    href: `${basePath}/?tool=user-guide`,
                    icon: <HelpCircle />,
                    testId: "menu-item-guide",
                  },
                  {
                    label: "Activate key",
                    href: `${basePath}/activate-key`,
                    icon: <KeyRound />,
                    testId: "menu-item-activate",
                  },
                  {
                    label: "Plans & pricing",
                    href: PRICING_URL,
                    icon: <Sparkles />,
                    testId: "menu-item-plans",
                  },
                  {
                    label: "Back to online tools",
                    href: "/online-tools",
                    icon: <Undo2 />,
                    testId: "menu-item-online-tools",
                  },
                ]}
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
