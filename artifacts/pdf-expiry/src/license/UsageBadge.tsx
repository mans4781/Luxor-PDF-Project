import type { ReactNode } from "react";
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Infinity as InfinityIcon,
} from "lucide-react";
import { useLicense } from "./LicenseProvider";

import { basePath } from "@/lib/base-path";
const PRICING_URL = `/pricing`;

/** Formats an ISO date as e.g. "Jul 3" for compact reset labels. */
function formatResetDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function UsageBadge() {
  const { status, signedIn, isLoading } = useLicense();

  if (!signedIn || isLoading || !status) return null;

  if (status.isPaid && status.subscriptionActive) {
    const plan = status.planName ? status.planName : "Pro";
    const { limit, remaining } = status.monthlyUsage;

    // Unlimited secure pool (Business / Enterprise / unlimited override).
    if (limit === null || remaining === null) {
      return (
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5">
          <Sparkles className="w-3.5 h-3.5" strokeWidth={2.25} />
          <span className="capitalize">{plan} · Unlimited</span>
        </div>
      );
    }

    const low = remaining <= Math.max(1, Math.ceil(limit * 0.2));
    return (
      <div
        className={`hidden md:flex items-center gap-2 text-xs font-semibold rounded-full px-3 py-1.5 border ${
          remaining === 0
            ? "text-rose-700 bg-rose-50 border-rose-200"
            : low
              ? "text-amber-700 bg-amber-50 border-amber-200"
              : "text-emerald-700 bg-emerald-50 border-emerald-200"
        }`}
        title="Secure-feature actions remaining this month"
        data-testid="usage-badge-monthly"
      >
        <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2.25} />
        <span className="capitalize">
          {plan} · {remaining}/{limit} secure left
        </span>
      </div>
    );
  }

  return null;
}

interface CardProps {
  variant: "ok" | "warn" | "bad" | "muted";
  icon: ReactNode;
  label: string;
  primary: ReactNode;
  secondary?: ReactNode;
  testId: string;
  cta?: { label: string; href: string };
}

function StatCard({ variant, icon, label, primary, secondary, testId, cta }: CardProps) {
  const palette = {
    ok: {
      border: "border-emerald-200",
      bg: "bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50",
      iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
      label: "text-emerald-700",
      primary: "text-emerald-900",
      secondary: "text-emerald-700",
    },
    warn: {
      border: "border-amber-200",
      bg: "bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50",
      iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
      label: "text-amber-700",
      primary: "text-amber-900",
      secondary: "text-amber-800",
    },
    bad: {
      border: "border-rose-200",
      bg: "bg-gradient-to-br from-rose-50 via-red-50 to-rose-50",
      iconBg: "bg-gradient-to-br from-rose-500 to-red-600",
      label: "text-rose-700",
      primary: "text-rose-900",
      secondary: "text-rose-700",
    },
    muted: {
      border: "border-slate-200",
      bg: "bg-white",
      iconBg: "bg-gradient-to-br from-slate-400 to-slate-500",
      label: "text-slate-600",
      primary: "text-slate-900",
      secondary: "text-slate-500",
    },
  }[variant];

  return (
    <div
      className={`rounded-2xl border ${palette.border} ${palette.bg} px-4 py-3.5 flex items-center gap-3`}
      data-testid={testId}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow shrink-0 ${palette.iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-[11px] uppercase tracking-wide font-bold ${palette.label}`}>{label}</p>
        <p className={`text-sm font-bold ${palette.primary} truncate`}>{primary}</p>
        {secondary && <p className={`text-xs ${palette.secondary} truncate`}>{secondary}</p>}
      </div>
      {cta && (
        <a
          href={cta.href}
          className="text-[11px] font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-full px-2.5 py-1 whitespace-nowrap"
          data-testid={`${testId}-cta`}
        >
          {cta.label}
        </a>
      )}
    </div>
  );
}

/**
 * Three top status cards on the dashboard:
 *   1. Monthly secure quota   2. Today's usage   3. Subscription status
 */
export function UsagePanel() {
  const { status, signedIn, isLoading } = useLicense();

  if (!signedIn || isLoading || !status) return null;

  const isPaid = status.isPaid && status.subscriptionActive;
  const used = status.todayUsage;
  const reset = formatResetDate(status.monthlyUsage.periodEnd);

  // ── Card 1: Monthly secure quota ────────────────────────────────
  let secureCard: CardProps;
  if (isPaid) {
    const { limit, remaining, used: mUsed } = status.monthlyUsage;
    if (limit === null || remaining === null) {
      secureCard = {
        variant: "ok",
        icon: <InfinityIcon className="w-5 h-5 text-white" />,
        label: "Secure features",
        primary: "Unlimited",
        secondary: `${mUsed} used this month`,
        testId: "usage-card-secure",
      };
    } else {
      const low = remaining <= Math.max(1, Math.ceil(limit * 0.2));
      secureCard = {
        variant: remaining === 0 ? "bad" : low ? "warn" : "ok",
        icon: <ShieldCheck className="w-5 h-5 text-white" />,
        label: "Secure features",
        primary: `${remaining} / ${limit} left`,
        secondary:
          remaining === 0
            ? reset
              ? `Monthly limit reached. Resets ${reset}.`
              : "Monthly limit reached."
            : reset
              ? `${mUsed} used · resets ${reset}`
              : `${mUsed} used this month`,
        testId: "usage-card-secure",
        cta: remaining === 0 ? { label: "Upgrade", href: PRICING_URL } : undefined,
      };
    }
  } else {
    secureCard = {
      variant: "muted",
      icon: <ShieldCheck className="w-5 h-5 text-white" />,
      label: "Secure features",
      primary: "No active plan",
      secondary: "Choose a plan to use secure tools.",
      testId: "usage-card-secure",
      cta: { label: "Plans", href: PRICING_URL },
    };
  }

  // ── Card 2: Today's usage ───────────────────────────────────────
  let usageCard: CardProps;
  if (isPaid) {
    usageCard = {
      variant: "ok",
      icon: <InfinityIcon className="w-5 h-5 text-white" />,
      label: "Today",
      primary: "Unlimited",
      secondary: `${used} action${used === 1 ? "" : "s"} used today`,
      testId: "usage-card-today",
    };
  } else {
    usageCard = {
      variant: "muted",
      icon: <AlertTriangle className="w-5 h-5 text-white" />,
      label: "Today",
      primary: "Locked",
      secondary: "A paid plan is required.",
      testId: "usage-card-today",
      cta: { label: "Plans", href: PRICING_URL },
    };
  }

  // ── Card 3: Subscription ────────────────────────────────────────
  let subCard: CardProps;
  if (isPaid) {
    const days = status.subscriptionDaysRemaining;
    const isLifetime = status.planName === "lifetime" || days == null;
    subCard = {
      variant: !isLifetime && days != null && days <= 7 ? "warn" : "ok",
      icon: <Sparkles className="w-5 h-5 text-white" />,
      label: "Subscription",
      primary: isLifetime
        ? "Lifetime"
        : `${status.planName ?? "Pro"} · ${days} day${days === 1 ? "" : "s"} left`,
      secondary: isLifetime
        ? "Yours forever. Thank you!"
        : days != null && days <= 7
          ? "Renews soon — top up to avoid lockout."
          : "All tools unlocked.",
      testId: "usage-card-subscription",
      cta:
        !isLifetime && days != null && days <= 7
          ? { label: "Renew", href: PRICING_URL }
          : undefined,
    };
  } else {
    subCard = {
      variant: "muted",
      icon: <Sparkles className="w-5 h-5 text-white" />,
      label: "Subscription",
      primary: "No active plan",
      secondary: "Upgrade for unlimited PDFs.",
      testId: "usage-card-subscription",
      cta: { label: "Plans", href: PRICING_URL },
    };
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-3 gap-3"
      data-testid="usage-panel"
    >
      <StatCard {...secureCard} />
      <StatCard {...usageCard} />
      <StatCard {...subCard} />
    </div>
  );
}

/**
 * Inline banner that appears on every tool page when the shared monthly
 * secure-feature quota is exhausted (paid users on a finite tier). General
 * tools keep working; only the secure features are capped.
 */
export function DailyLimitBanner() {
  const { status, signedIn, isLoading } = useLicense();
  if (!signedIn || isLoading || !status) return null;
  const isPaid = status.isPaid && status.subscriptionActive;
  if (!isPaid) return null;
  const { limit, remaining } = status.monthlyUsage;
  if (limit === null || remaining === null || remaining > 0) return null;

  const reset = formatResetDate(status.monthlyUsage.periodEnd);

  return (
    <div
      className="mb-4 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 via-orange-50 to-rose-50 px-4 py-3 flex flex-wrap items-center gap-3 shadow-sm"
      role="alert"
      data-testid="monthly-limit-banner"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow shrink-0">
        <AlertTriangle className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-rose-900">
          You've used all {limit} secure-feature actions this month.
        </p>
        <p className="text-xs text-rose-700">
          {reset
            ? `Your quota resets on ${reset}. Upgrade your plan for a higher monthly limit.`
            : "Upgrade your plan for a higher monthly limit."}
        </p>
      </div>
      <a
        href={PRICING_URL}
        className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-sm font-semibold rounded-md px-4 py-2 shadow"
        data-testid="monthly-limit-upgrade"
      >
        <Sparkles className="w-4 h-4" /> Upgrade
      </a>
    </div>
  );
}
