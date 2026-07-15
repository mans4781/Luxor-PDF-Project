import { useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  FileBarChart,
  Gift,
  HelpCircle,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PlugZap,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  Tags,
  Users,
  Wallet,
  Webhook,
  Activity as ActivityIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SYSTEM_SERVICES } from "./mock-data";
import { useNotifications, notificationService } from "./services";
import { timeAgo } from "./shared";
import { toast } from "sonner";

export type ConsoleSection =
  | "dashboard"
  | "revenue"
  | "users"
  | "licenses"
  | "offers"
  | "referrals"
  | "products"
  | "analytics"
  | "reports"
  | "integrations"
  | "settings";

export const NAV_ITEMS: { id: ConsoleSection; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "revenue", label: "Revenue", icon: Wallet },
  { id: "users", label: "Users", icon: Users },
  { id: "licenses", label: "Licenses", icon: KeyRound },
  { id: "offers", label: "Offers", icon: Tags },
  { id: "referrals", label: "Referrals", icon: Share2 },
  { id: "products", label: "Products", icon: Package },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "reports", label: "Reports", icon: FileBarChart },
  { id: "integrations", label: "Integrations", icon: PlugZap },
  { id: "settings", label: "Settings", icon: Settings },
];

const SHORTCUTS: { label: string; icon: React.ElementType; target: ConsoleSection }[] = [
  { label: "API Keys", icon: KeyRound, target: "integrations" },
  { label: "Webhooks", icon: Webhook, target: "integrations" },
  { label: "Status Page", icon: ActivityIcon, target: "integrations" },
];

function SidebarBody({
  active,
  onSelect,
  onQuickAction,
}: {
  active: ConsoleSection;
  onSelect: (s: ConsoleSection) => void;
  onQuickAction: (action: string) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#2563EB] to-[#6D5DFB] text-sm font-extrabold text-white">
          L
        </div>
        <div>
          <div className="text-sm font-bold leading-tight text-slate-900">Luxor PDF Admin</div>
          <div className="text-[11px] text-slate-500">Developer Console</div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-2">
        <nav aria-label="Console sections" className="space-y-0.5 pb-2">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onSelect(id)}
              aria-current={active === id ? "page" : undefined}
              className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
                active === id
                  ? "bg-gradient-to-r from-blue-50 to-violet-50 text-[#2563EB]"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className={`h-4 w-4 ${active === id ? "text-[#6D5DFB]" : "text-slate-400"}`} />
              {label}
            </button>
          ))}
        </nav>

        <div className="mt-3 border-t border-slate-100 pt-3">
          <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Shortcuts
          </div>
          {SHORTCUTS.map(({ label, icon: Icon, target }) => (
            <button
              key={label}
              onClick={() => onSelect(target)}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px] text-slate-600 hover:bg-slate-100"
            >
              <Icon className="h-3.5 w-3.5 text-slate-400" />
              {label}
            </button>
          ))}
        </div>

        <div className="mx-2 mt-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <ShieldCheck className="h-3.5 w-3.5" />
            All Systems Operational
          </div>
          <div className="mt-2 space-y-1">
            {SYSTEM_SERVICES.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">{s.name}</span>
                <span className="flex items-center gap-1 text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Operational
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-2 py-4">
          <div className="px-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Quick Actions
          </div>
          <div className="space-y-1.5">
            {[
              "Create License Key",
              "Launch Offer",
              "Add User",
              "Export Revenue Report",
            ].map((a) => (
              <Button
                key={a}
                variant="outline"
                size="sm"
                className="h-8 w-full justify-start border-slate-200 text-xs font-medium text-slate-700"
                onClick={() => onQuickAction(a)}
              >
                {a}
              </Button>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

export function ConsoleShell({
  active,
  onSelect,
  onLogout,
  onQuickAction,
  searchIndex,
  children,
}: {
  active: ConsoleSection;
  onSelect: (s: ConsoleSection) => void;
  onLogout: () => void;
  onQuickAction: (action: string) => void;
  searchIndex: { group: string; label: string; target: ConsoleSection }[];
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const notifications = useNotifications();
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const select = (s: ConsoleSection) => {
    onSelect(s);
    setDrawerOpen(false);
  };

  const activeLabel = NAV_ITEMS.find((n) => n.id === active)?.label ?? "";

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC] text-slate-900">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white lg:block">
        <SidebarBody active={active} onSelect={select} onQuickAction={onQuickAction} />
      </aside>

      {/* Mobile drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarBody active={active} onSelect={select} onQuickAction={onQuickAction} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 sm:px-5">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open navigation"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <button
            onClick={() => setSearchOpen(true)}
            className="flex h-9 w-full max-w-md items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-left text-[13px] text-slate-400 hover:border-slate-300"
            aria-label="Open global search"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden truncate sm:inline">
              Search users, licenses, offers, revenue, metrics...
            </span>
            <span className="sm:hidden">Search…</span>
            <kbd className="ml-auto hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 md:inline">
              ⌘K
            </kbd>
          </button>

          <div className="ml-auto flex items-center gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                  <Bell className="h-5 w-5 text-slate-500" />
                  {unread > 0 && (
                    <Badge className="absolute -right-0.5 -top-0.5 h-4 min-w-4 justify-center rounded-full bg-[#2563EB] px-1 text-[10px]">
                      {unread}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                  <span className="text-sm font-semibold">Notifications</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-slate-500"
                    onClick={() => notificationService.markAllRead()}
                  >
                    Mark all read
                  </Button>
                </div>
                <ScrollArea className="max-h-80">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => notificationService.markRead(n.id)}
                      className={`flex w-full flex-col gap-0.5 border-b border-slate-50 px-3 py-2.5 text-left hover:bg-slate-50 ${n.read ? "opacity-60" : ""}`}
                    >
                      <span className="flex items-center gap-1.5 text-[13px] font-medium text-slate-800">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            n.kind === "success"
                              ? "bg-emerald-500"
                              : n.kind === "warning"
                                ? "bg-amber-500"
                                : n.kind === "error"
                                  ? "bg-red-500"
                                  : "bg-blue-500"
                          }`}
                        />
                        {n.title}
                      </span>
                      <span className="pl-3 text-xs text-slate-500">{n.detail}</span>
                      <span className="pl-3 text-[10px] text-slate-400">{timeAgo(n.time)}</span>
                    </button>
                  ))}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Help"
              onClick={() =>
                toast.info("Console guide", {
                  description: "Use ⌘K to search. Data marked “sample” is illustrative until its backend ships.",
                })
              }
            >
              <HelpCircle className="h-5 w-5 text-slate-500" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="ml-1 flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-slate-100"
                  aria-label="Profile menu"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#6D5DFB] text-xs font-bold text-white">
                    A
                  </div>
                  <div className="hidden text-left md:block">
                    <div className="text-[13px] font-semibold leading-tight text-slate-800">
                      Admin
                    </div>
                    <div className="text-[10px] leading-tight text-slate-400">Administrator</div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className="text-xs">Signed in as Admin</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onSelect("settings")}>
                  <Settings className="mr-2 h-3.5 w-3.5" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onLogout} className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-3.5 w-3.5" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Breadcrumb strip */}
        <div className="flex h-9 shrink-0 items-center gap-1.5 border-b border-slate-100 bg-white/60 px-5 text-xs text-slate-400">
          <span>Console</span>
          <span>›</span>
          <span className="font-semibold text-slate-700">{activeLabel}</span>
          <span className="ml-auto hidden sm:inline">
            {new Date().toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Content */}
        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>

      {/* Global search */}
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Search users, licenses, offers, revenue, metrics..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {Array.from(new Set(searchIndex.map((s) => s.group))).map((group) => (
            <CommandGroup key={group} heading={group}>
              {searchIndex
                .filter((s) => s.group === group)
                .map((s, i) => (
                  <CommandItem
                    key={`${group}-${i}-${s.label}`}
                    value={`${group} ${s.label}`}
                    onSelect={() => {
                      onSelect(s.target);
                      setSearchOpen(false);
                    }}
                  >
                    {s.label}
                  </CommandItem>
                ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </div>
  );
}
