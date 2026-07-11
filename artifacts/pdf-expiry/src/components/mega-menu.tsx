import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { ChevronDown, Grid3x3, LayoutGrid } from "lucide-react";
import { TOOL_CATEGORIES } from "@/lib/tools-registry";

export function MegaMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        data-testid="button-mega-menu"
        className={`inline-flex items-center gap-1.5 h-10 px-3 sm:px-4 rounded-full text-sm font-semibold transition-colors ${
          open
            ? "bg-[#1754F4] text-white"
            : "text-slate-700 hover:bg-slate-100"
        }`}
      >
        <LayoutGrid className="w-4 h-4" />
        <span className="hidden sm:inline">Online Tools</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 z-40 bg-slate-900/20 md:hidden"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />

          <div
            role="menu"
            data-testid="mega-menu-panel"
            className="absolute right-0 mt-2 z-50 w-[min(92vw,880px)] max-h-[80vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl p-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {TOOL_CATEGORIES.map((cat) => (
                <div key={cat.key}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-2.5 px-2">
                    {cat.label}
                  </p>
                  <ul className="space-y-0.5">
                    {cat.tools.map((tool) => {
                      const Icon = tool.icon;
                      return (
                        <li key={tool.slug}>
                          <Link
                            href={`/tools/${tool.slug}`}
                            onClick={() => setOpen(false)}
                            data-testid={`mega-link-${tool.slug}`}
                            className="group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                          >
                            <span className="flex w-7 h-7 items-center justify-center rounded-md bg-slate-100 text-slate-500 group-hover:bg-[#1754F4]/10 group-hover:text-[#1754F4] transition-colors shrink-0">
                              <Icon className="w-3.5 h-3.5" />
                            </span>
                            <span className="leading-tight">{tool.title}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <Link
                href="/online-tools"
                onClick={() => setOpen(false)}
                data-testid="mega-link-all-tools"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1754F4] hover:underline"
              >
                <Grid3x3 className="w-4 h-4" />
                Browse all tools
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
