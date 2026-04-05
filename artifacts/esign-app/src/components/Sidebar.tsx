import { useLocation } from "wouter";
import {
  LayoutDashboard, FileText, PenLine, Clock, FolderOpen,
  Settings, ChevronRight, Zap
} from "lucide-react";

const NAV = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Documents", icon: FileText, href: "/documents" },
  { label: "Sign a Document", icon: PenLine, href: "/sign" },
  { label: "Pending", icon: Clock, href: "/pending" },
  { label: "Templates", icon: FolderOpen, href: "/templates" },
];

const BOTTOM_NAV = [
  { label: "Settings", icon: Settings, href: "/settings" },
];

export function Sidebar() {
  const [location, navigate] = useLocation();

  return (
    <aside className="w-[230px] min-h-screen bg-sidebar flex flex-col border-r border-sidebar-border fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
          <PenLine className="w-4 h-4 text-white" strokeWidth={2.5} />
        </div>
        <span className="text-white font-semibold text-lg tracking-tight">LuxorSign</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {NAV.map(({ label, icon: Icon, href }) => {
          const active = location === href || (href !== "/" && location.startsWith(href));
          return (
            <button
              key={href}
              onClick={() => navigate(href)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                active
                  ? "bg-indigo-600 text-white"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
              {active && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
            </button>
          );
        })}
      </nav>

      {/* Upgrade CTA */}
      <div className="mx-3 mb-3 p-3 rounded-xl bg-indigo-600/20 border border-indigo-500/20">
        <div className="flex items-center gap-2 mb-1.5">
          <Zap className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-semibold text-indigo-300">Upgrade to Pro</span>
        </div>
        <p className="text-xs text-indigo-300/70 leading-relaxed">Unlimited signatures, bulk send & advanced audit</p>
        <button className="mt-2.5 w-full py-1.5 text-xs font-semibold bg-indigo-500 hover:bg-indigo-400 text-white rounded-md transition-colors">
          Upgrade now
        </button>
      </div>

      {/* Bottom */}
      <div className="border-t border-sidebar-border py-3 px-3 space-y-0.5">
        {BOTTOM_NAV.map(({ label, icon: Icon, href }) => (
          <button
            key={href}
            onClick={() => navigate(href)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-white transition-colors cursor-pointer"
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}

        <div className="flex items-center gap-3 px-3 py-2.5 mt-1 rounded-lg cursor-pointer hover:bg-sidebar-accent transition-colors">
          <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            Y
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-white truncate">You</p>
            <p className="text-[10px] text-sidebar-foreground/60 truncate">Free Plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
