import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useUser, useClerk, useSession } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetEsignWaitlistStatus,
  getGetEsignWaitlistStatusQueryKey,
  useJoinEsignWaitlist,
} from "@workspace/api-client-react";
import { useLicense } from "@/license/LicenseProvider";
import { loadLocalHistory } from "@/pages/history";
import { basePath } from "@/lib/base-path";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Bell,
  CircleHelp,
  ChevronDown,
  Box,
  CreditCard,
  UserRound,
  ShieldCheck,
  MonitorSmartphone,
  LogOut,
  FileText,
  Shield,
  PenTool,
  ExternalLink,
  Camera,
  Smile,
  Lock,
  Layers,
  RefreshCcw,
  Clock,
  Laptop,
  Smartphone,
  Split,
  FileBox,
  Crown,
  CalendarDays,
  CheckCircle2,
  Check,
  ArrowUpCircle,
  ChevronRight,
  FileStack,
} from "lucide-react";

const GiftBoxSVG = () => (
  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L20.5 7V17L12 22L3.5 17V7L12 2Z" fill="#FDA4AF" opacity="0.3" />
    <path d="M12 22V12M12 12L20.5 7M12 12L3.5 7" stroke="#FDA4AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CubeSVG = () => (
  <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" fill="#FDA4AF" opacity="0.4" />
    <path d="M12 22V12M12 12L21 7M12 12L3 7" stroke="#F43F5E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Clerk's session-with-activities type, derived from the useUser() hook so
 *  it always matches the installed Clerk SDK — no unsafe casts. */
type ClerkUser = NonNullable<ReturnType<typeof useUser>["user"]>;
type SessionEntry = Awaited<ReturnType<ClerkUser["getSessions"]>>[number];

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(d: Date): string {
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function relativeTime(d: Date): string {
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 5) return "Active now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  return formatDateTime(d);
}

function planLabel(planName: string | null | undefined): string {
  switch (planName) {
    case "monthly":
      return "Monthly Plan";
    case "quarterly":
      return "Quarterly Plan";
    case "yearly":
      return "Annual Plan";
    case "lifetime":
      return "Lifetime";
    default:
      return "—";
  }
}

export default function AccountDashboardPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { session: currentSession } = useSession();
  const clerk = useClerk();
  const { status } = useLicense();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Auth gate ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      const here = `${window.location.origin}${basePath}/dashboard`;
      window.location.replace(
        `${basePath}/sign-in?redirect_url=${encodeURIComponent(here)}`,
      );
    }
  }, [isLoaded, isSignedIn]);

  // Ctrl+K focuses the search box.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Profile data ───────────────────────────────────────────────────────────
  const metadataFullName =
    typeof user?.unsafeMetadata?.["fullName"] === "string"
      ? (user.unsafeMetadata["fullName"] as string).trim()
      : "";
  const fullName = user?.fullName || metadataFullName || "there";
  const firstName = fullName === "there" ? "there" : fullName.split(/\s+/)[0];
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const initials =
    fullName === "there"
      ? (email[0] ?? "U").toUpperCase()
      : fullName
          .split(/\s+/)
          .slice(0, 2)
          .map((p) => p[0]?.toUpperCase() ?? "")
          .join("");
  const memberSince = user?.createdAt ? formatDate(new Date(user.createdAt)) : null;

  // ── Subscription data ──────────────────────────────────────────────────────
  const isPaid = !!status?.subscriptionActive;
  const isTrial = !isPaid && !!status?.trialActive;
  const suiteTitle = isPaid
    ? "Luxor PDF Suite – Pro"
    : isTrial
      ? "Luxor PDF Suite – Free Trial"
      : "Luxor PDF Suite – Free";
  const billingPlan = isPaid
    ? planLabel(status?.planName)
    : isTrial
      ? "Free Trial"
      : "Free";
  const renewalDate =
    isPaid && status?.subscriptionEndDate
      ? formatDate(new Date(status.subscriptionEndDate))
      : isTrial && status?.trialEndDate
        ? formatDate(new Date(status.trialEndDate))
        : null;
  const statusActive = isPaid || isTrial;

  // ── eSign waitlist ─────────────────────────────────────────────────────────
  const waitlistQuery = useGetEsignWaitlistStatus({
    query: {
      queryKey: getGetEsignWaitlistStatusQueryKey(),
      enabled: isLoaded && !!isSignedIn,
    },
  });
  const joined = !!waitlistQuery.data?.joined;
  const joinWaitlist = useJoinEsignWaitlist({
    mutation: {
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: getGetEsignWaitlistStatusQueryKey() });
        toast({
          title: "You're on the list!",
          description: "We'll email you when Luxor PDF eSign is ready.",
        });
      },
      onError: () => {
        toast({
          title: "Couldn't join the waitlist",
          description: "Please try again in a moment.",
          variant: "destructive",
        });
      },
    },
  });

  // ── Recent activity (local secured-file history) ───────────────────────────
  const recentFiles = useMemo(() => loadLocalHistory().slice(0, 4), []);

  // ── Active sessions (Clerk) ────────────────────────────────────────────────
  const [sessions, setSessions] = useState<SessionEntry[] | null>(null);
  const [revoking, setRevoking] = useState(false);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    user
      .getSessions()
      .then((list) => {
        if (!cancelled) setSessions(list);
      })
      .catch(() => {
        if (!cancelled) setSessions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const signOutOtherDevices = async () => {
    if (!sessions || revoking) return;
    setRevoking(true);
    try {
      const others = sessions.filter((s) => s.id !== currentSession?.id);
      await Promise.all(others.map((s) => s.revoke().catch(() => undefined)));
      const list = await user?.getSessions();
      setSessions(list ?? []);
      toast({ title: "Signed out other devices" });
    } finally {
      setRevoking(false);
    }
  };

  const signOut = () => {
    void clerk.signOut({ redirectUrl: "/" });
  };

  const openProfile = () => clerk.openUserProfile();

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLocation("/online-tools");
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center font-['Inter']">
        <div className="text-slate-400 text-sm">Loading your account…</div>
      </div>
    );
  }

  const navItem =
    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors font-medium text-sm text-left";

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] font-['Inter'] text-slate-900 overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-[265px] h-full bg-white border-r border-[#e5e7eb] flex-col shrink-0 hidden lg:flex">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#ef233c] flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-white font-bold text-lg leading-none">L</span>
          </div>
          <span className="font-semibold text-lg tracking-tight">Luxor PDF</span>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          <span className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#fff1f2] text-[#ef233c] font-medium text-sm">
            <Box className="w-5 h-5" />
            Dashboard
          </span>
          <a href="#products" className={navItem}>
            <Layers className="w-5 h-5" />
            My Products
          </a>
          <Link href="/checkout" className={navItem}>
            <CreditCard className="w-5 h-5" />
            Subscription & Billing
          </Link>
          <button onClick={openProfile} className={navItem} data-testid="button-nav-profile">
            <UserRound className="w-5 h-5" />
            Profile
          </button>
          <button onClick={openProfile} className={navItem} data-testid="button-nav-security">
            <ShieldCheck className="w-5 h-5" />
            Security
          </button>
          <a href="#sessions" className={navItem}>
            <MonitorSmartphone className="w-5 h-5" />
            Devices & Sessions
          </a>
          <a href="mailto:support@luxorpdf.com" className={navItem}>
            <CircleHelp className="w-5 h-5" />
            Help & Support
          </a>

          <div className="my-4 border-t border-slate-100"></div>

          <button onClick={signOut} className={navItem} data-testid="button-sign-out">
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </nav>

        {!isPaid && (
          <div className="p-4">
            <div className="bg-[#fff1f2] rounded-2xl p-5 border border-[#ef233c]/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#ef233c]/10 to-transparent rounded-bl-full pointer-events-none"></div>
              <div className="absolute -right-6 -bottom-6 opacity-80 pointer-events-none">
                <GiftBoxSVG />
              </div>
              <h4 className="font-semibold text-slate-900 text-sm mb-1 relative z-10">
                Unlock more with Luxor PDF Suite – Pro
              </h4>
              <p className="text-xs text-slate-600 mb-4 relative z-10">
                Advanced tools. Maximum productivity.
              </p>
              <Link
                href="/checkout"
                className="block text-center w-full bg-[#ef233c] hover:bg-[#dc1f36] text-white text-sm font-medium py-2 rounded-lg transition-colors relative z-10 shadow-sm"
                data-testid="link-sidebar-upgrade"
              >
                Upgrade Plan
              </Link>
            </div>
          </div>
        )}
      </aside>

      {/* MAIN AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* HEADER */}
        <header className="px-8 py-5 flex items-center justify-between shrink-0 bg-[#f8fafc]/80 backdrop-blur-md sticky top-0 z-20 gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1 truncate" data-testid="text-welcome">
              Welcome back, {firstName} 👋
            </h1>
            <p className="text-sm text-slate-500">Here's what's happening with your account today.</p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <form onSubmit={onSearch} className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search tools, files, help..."
                className="w-[280px] pl-9 pr-16 py-2 bg-white border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#ef233c]/20 focus:border-[#ef233c]/50 transition-all shadow-sm"
                data-testid="input-search"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded">
                  Ctrl + K
                </kbd>
              </div>
            </form>

            <a
              href="mailto:support@luxorpdf.com"
              className="w-10 h-10 rounded-full bg-white border border-[#e5e7eb] flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <CircleHelp className="w-5 h-5" />
            </a>

            <div className="h-6 w-px bg-slate-200 mx-1"></div>

            <a
              href="#products"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white border border-[#e5e7eb] rounded-full hover:bg-slate-50 transition-colors shadow-sm"
            >
              <span className="text-sm font-medium text-slate-700">Luxor PDF Suite</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </a>

            <button onClick={openProfile} className="relative cursor-pointer" data-testid="button-avatar">
              {user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={fullName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm border-2 border-white shadow-md">
                  {initials}
                </div>
              )}
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#22c55e] rounded-full ring-2 ring-white"></span>
            </button>
          </div>
        </header>

        <div className="p-8 pt-2 space-y-6">
          {/* SUBSCRIPTION BANNER */}
          <div className="w-full bg-white rounded-[20px] border border-[#e5e7eb] p-6 flex flex-col md:flex-row items-start justify-between gap-6 shadow-sm relative overflow-hidden">
            <div className="absolute right-64 top-1/2 -translate-y-1/2 pointer-events-none z-0 hidden xl:block">
              <CubeSVG />
            </div>

            <div className="flex gap-6 relative z-10 min-w-0">
              <div className="w-16 h-16 rounded-[18px] bg-gradient-to-br from-[#ef233c] to-[#b91c1c] flex items-center justify-center shrink-0 shadow-md">
                <Crown className="w-8 h-8 text-white fill-white/20" />
              </div>

              <div className="min-w-0">
                <div className="text-[11px] font-bold text-[#ef233c] uppercase tracking-wider mb-1">
                  Your Subscription
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4" data-testid="text-plan-title">
                  {suiteTitle}
                </h2>

                <div className="h-px w-full bg-slate-100 mb-4"></div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Billing Plan</div>
                    <div className="text-sm font-semibold text-slate-900" data-testid="text-billing-plan">
                      {billingPlan}
                    </div>
                  </div>
                  <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">
                      {isTrial ? "Trial Ends" : "Renewal Date"}
                    </div>
                    <div className="text-sm font-semibold text-slate-900 flex items-center gap-1.5" data-testid="text-renewal-date">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-400" /> {renewalDate ?? "—"}
                    </div>
                  </div>
                  <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Status</div>
                    {statusActive ? (
                      <div className="text-sm font-semibold text-[#22c55e] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#22c55e]"></span> Active
                      </div>
                    ) : (
                      <div className="text-sm font-semibold text-slate-500 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-400"></span> Free
                      </div>
                    )}
                  </div>
                  <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Included Products</div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded bg-[#fff1f2] flex items-center justify-center border border-[#ef233c]/20" title="Luxor PDF Reader">
                        <FileText className="w-3.5 h-3.5 text-[#ef233c]" />
                      </div>
                      <div className="w-6 h-6 rounded bg-blue-50 flex items-center justify-center border border-[#2563eb]/20" title="Luxor PDF Secure">
                        <Shield className="w-3.5 h-3.5 text-[#2563eb]" />
                      </div>
                      <div className="w-6 h-6 rounded bg-green-50 flex items-center justify-center border border-[#16a34a]/20" title="Luxor PDF eSign (coming soon)">
                        <Check className="w-3.5 h-3.5 text-[#16a34a]" strokeWidth={3} />
                      </div>
                      <div className="text-xs font-medium text-slate-500 ml-1">+ More</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 relative z-10 shrink-0 w-full md:w-48">
              <Link
                href="/checkout"
                className="w-full px-4 py-2.5 bg-[#ef233c] hover:bg-[#dc1f36] text-white text-sm font-medium rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                data-testid="link-upgrade-plan"
              >
                <ArrowUpCircle className="w-4 h-4" /> Upgrade Plan
              </Link>
              <Link
                href="/checkout"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                data-testid="link-manage-billing"
              >
                <CreditCard className="w-4 h-4 text-slate-500" /> Manage Billing
              </Link>
            </div>
          </div>

          {/* PRODUCT ROW */}
          <div id="products" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 scroll-mt-24">
            {/* Reader */}
            <div className="bg-[#fff1f2] rounded-[20px] border border-[#ef233c]/20 p-6 flex flex-col relative overflow-hidden">
              <div className="w-12 h-12 rounded-[14px] bg-[#ef233c] flex items-center justify-center shadow-md mb-3">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-base font-bold text-[#ef233c] mb-2">Luxor PDF Reader</h3>
              <p className="text-sm text-slate-600 mb-4 flex-1 leading-relaxed">
                View, annotate and organize PDFs with ease.
              </p>
              <div className="flex items-center gap-2 mb-5">
                <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                <span className="text-xs font-semibold text-slate-700">Full Access</span>
              </div>
              <a
                href="/luxor-pdf/"
                className="w-full py-2.5 bg-white border border-[#ef233c]/30 hover:border-[#ef233c] text-[#ef233c] text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                data-testid="link-open-reader"
              >
                Open App <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Secure */}
            <div className="bg-[#eff6ff] rounded-[20px] border border-[#2563eb]/20 p-6 flex flex-col relative overflow-hidden">
              <div className="absolute right-2 top-10 opacity-5 pointer-events-none">
                <Lock className="w-32 h-32 text-[#2563eb]" />
              </div>
              <div className="w-12 h-12 rounded-[14px] bg-[#2563eb] flex items-center justify-center shadow-md mb-3 relative z-10">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-base font-bold text-[#2563eb] mb-2 relative z-10">Luxor PDF Secure</h3>
              <p className="text-sm text-slate-600 mb-4 flex-1 leading-relaxed relative z-10">
                Protect your PDFs and sensitive documents.
              </p>
              <div className="flex items-center gap-2 mb-5 relative z-10">
                <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                <span className="text-xs font-semibold text-slate-700">Full Access</span>
              </div>
              <Link
                href="/secure-pdf"
                className="w-full py-2.5 bg-white border border-[#2563eb]/30 hover:border-[#2563eb] text-[#2563eb] text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm relative z-10"
                data-testid="link-open-secure"
              >
                Open App <ExternalLink className="w-4 h-4" />
              </Link>
            </div>

            {/* eSign */}
            <div className="bg-[#f0fdf4] rounded-[20px] border border-[#16a34a]/20 p-6 flex flex-col relative overflow-hidden">
              <div className="absolute top-4 right-4 z-10">
                <span className="bg-[#16a34a] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
                  Coming Soon
                </span>
              </div>
              <div className="w-12 h-12 rounded-[14px] bg-[#16a34a] flex items-center justify-center shadow-md mb-3 relative z-10">
                <PenTool className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-base font-bold text-[#16a34a] mb-2 relative z-10">Luxor PDF eSign</h3>
              <p className="text-sm text-slate-600 mb-4 flex-1 leading-relaxed relative z-10">
                eSign documents anywhere, anytime.
              </p>
              <div className="mb-5 relative z-10">
                <span className="inline-flex items-center justify-center bg-[#16a34a]/10 text-[#16a34a] text-xs font-semibold px-2.5 py-1 rounded-md">
                  Early Access
                </span>
              </div>
              <button
                onClick={() => !joined && joinWaitlist.mutate()}
                disabled={joined || joinWaitlist.isPending}
                className="w-full py-2.5 bg-white border border-[#16a34a]/30 hover:border-[#16a34a] text-[#16a34a] text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm relative z-10 disabled:opacity-80 disabled:cursor-default"
                data-testid="button-join-waitlist"
              >
                {joined ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> On the Waitlist
                  </>
                ) : joinWaitlist.isPending ? (
                  "Joining…"
                ) : (
                  <>
                    Join Waitlist <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Profile */}
            <div className="bg-white rounded-[20px] border border-[#e5e7eb] p-6 shadow-sm flex flex-col">
              <div className="flex flex-col items-center text-center mb-6 mt-2">
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={fullName}
                    className="w-16 h-16 rounded-full object-cover border border-slate-200 shadow-sm mb-3"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xl border border-slate-200 shadow-sm mb-3">
                    {initials}
                  </div>
                )}
                <div className="font-bold text-slate-900 text-base" data-testid="text-profile-name">
                  {fullName === "there" ? email : fullName}
                </div>
                <div className="text-sm text-slate-500 mb-1" data-testid="text-profile-email">
                  {email}
                </div>
                {memberSince && (
                  <div className="text-xs font-medium text-slate-400">Member since {memberSince}</div>
                )}
              </div>

              <div className="mt-auto flex justify-between px-2">
                {[
                  { icon: Camera, label: "Upload Photo" },
                  { icon: Smile, label: "Choose Avatar" },
                  { icon: Lock, label: "Change Password" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5">
                    <button
                      onClick={openProfile}
                      className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
                      data-testid={`button-${label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                    <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BOTTOM ROW */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            {/* Recent Activity */}
            <div className="bg-white rounded-[20px] border border-[#e5e7eb] p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-bold text-slate-900">Recent Activity</h3>
                <Link href="/history" className="text-sm font-medium text-[#ef233c] hover:underline" data-testid="link-view-history">
                  View All
                </Link>
              </div>

              {recentFiles.length === 0 ? (
                <div className="text-sm text-slate-500 py-8 text-center">
                  No activity yet. Secure your first PDF to see it here.
                </div>
              ) : (
                <div className="space-y-5">
                  {recentFiles.map((f) => (
                    <div className="flex gap-4" key={f.id}>
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                        <Shield className="w-4 h-4 text-[#2563eb]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          Secured File <span className="font-bold">"{f.originalName}"</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {f.isExpired
                            ? "Expired"
                            : `Expires ${formatDateTime(new Date(f.expiryDate))}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-[20px] border border-[#e5e7eb] p-6 shadow-sm flex flex-col">
              <h3 className="text-base font-bold text-slate-900 mb-6">Quick Actions</h3>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <a
                  href="/luxor-pdf/"
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-[#ef233c]/30 hover:bg-[#fff1f2]/50 transition-colors group"
                  data-testid="link-action-open-pdf"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#ef233c]/10 flex items-center justify-center">
                      <FileBox className="w-3.5 h-3.5 text-[#ef233c]" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Open PDF</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#ef233c] transition-colors" />
                </a>

                <Link
                  href="/secure-pdf"
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-[#2563eb]/30 hover:bg-blue-50/50 transition-colors group"
                  data-testid="link-action-secure-pdf"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#2563eb]/10 flex items-center justify-center">
                      <Shield className="w-3.5 h-3.5 text-[#2563eb]" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Secure PDF</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#2563eb] transition-colors" />
                </Link>

                <Link
                  href="/tools/merge-pdf"
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-[#8b5cf6]/30 hover:bg-purple-50/50 transition-colors group"
                  data-testid="link-action-merge-pdfs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center">
                      <Split className="w-3.5 h-3.5 text-[#8b5cf6]" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Merge PDFs</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#8b5cf6] transition-colors" />
                </Link>

                <Link
                  href="/convert"
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-[#f97316]/30 hover:bg-orange-50/50 transition-colors group"
                  data-testid="link-action-convert-pdf"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#f97316]/10 flex items-center justify-center">
                      <FileStack className="w-3.5 h-3.5 text-[#f97316]" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Convert PDF</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#f97316] transition-colors" />
                </Link>
              </div>

              <Link
                href="/checkout"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-[#ef233c]/30 hover:bg-[#fff1f2]/50 transition-colors group"
                data-testid="link-action-manage-subscription"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-pink-100 flex items-center justify-center">
                    <RefreshCcw className="w-3.5 h-3.5 text-pink-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                    Manage Subscription
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#ef233c] transition-colors" />
              </Link>
            </div>

            {/* Active Sessions */}
            <div id="sessions" className="bg-white rounded-[20px] border border-[#e5e7eb] p-6 shadow-sm flex flex-col scroll-mt-24">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-bold text-slate-900">Active Sessions</h3>
              </div>

              {sessions === null ? (
                <div className="text-sm text-slate-400 py-6 text-center">Loading sessions…</div>
              ) : sessions.length === 0 ? (
                <div className="text-sm text-slate-500 py-6 text-center">No active sessions found.</div>
              ) : (
                <div className="space-y-3 flex-1">
                  {sessions.slice(0, 4).map((s) => {
                    const isThis = s.id === currentSession?.id;
                    const act = s.latestActivity;
                    const device = act?.isMobile ? Smartphone : Laptop;
                    const DeviceIcon = device;
                    const title = [
                      act?.deviceType || (act?.isMobile ? "Mobile" : "Computer"),
                      act?.browserName,
                    ]
                      .filter(Boolean)
                      .join(" • ");
                    const place = [act?.city, act?.country].filter(Boolean).join(", ");
                    const lastActive = new Date(s.lastActiveAt);
                    return (
                      <div
                        key={s.id}
                        className={`rounded-xl border p-4 ${isThis ? "border-[#22c55e]/30 bg-green-50/40" : "border-slate-200"}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            <DeviceIcon className="w-4 h-4 text-slate-600" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-slate-900">{title || "Unknown device"}</span>
                              {isThis && (
                                <span className="text-[10px] font-bold text-white bg-[#2563eb] px-1.5 py-0.5 rounded">
                                  This Device
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {place ? `${place} • ` : ""}
                              <span className={relativeTime(lastActive) === "Active now" ? "text-[#22c55e] font-medium" : ""}>
                                {relativeTime(lastActive)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {sessions !== null && sessions.length > 1 && (
                <button
                  onClick={signOutOtherDevices}
                  disabled={revoking}
                  className="mt-4 w-full py-2.5 border border-[#ef233c]/40 hover:bg-[#fff1f2] text-[#ef233c] text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  data-testid="button-sign-out-all"
                >
                  <LogOut className="w-4 h-4" />
                  {revoking ? "Signing out…" : "Sign out other devices"}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
