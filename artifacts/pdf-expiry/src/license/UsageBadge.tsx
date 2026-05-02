import { Sparkles, Zap, Clock, ShieldCheck, AlertTriangle, Infinity as InfinityIcon } from "lucide-react";
import { useLicense } from "./LicenseProvider";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const PRICING_URL = `/pricing`;

export function UsageBadge() {
  const { status, signedIn, isLoading } = useLicense();

  if (!signedIn || isLoading || !status) return null;

  if (status.isPaid && status.subscriptionActive) {
    const plan = status.planName ? status.planName : "Pro";
    return (
      <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5">
        <Sparkles className="w-3.5 h-3.5" strokeWidth={2.25} />
        <span className="capitalize">{plan} · Unlimited</span>
      </div>
    );
  }

  if (status.trialActive) {
    const used = status.todayUsage;
    const limit = status.dailyLimit;
    const days = status.trialDaysRemaining;
    const lowOnDaily = used >= limit;
    return (
      <div className="hidden md:flex items-center gap-2 text-xs font-semibold">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 border ${
            lowOnDaily
              ? "text-rose-700 bg-rose-50 border-rose-200"
              : "text-emerald-700 bg-emerald-50 border-emerald-200"
          }`}
          title="Today's actions"
          data-testid="usage-badge-daily"
        >
          <Zap className="w-3.5 h-3.5" strokeWidth={2.25} />
          {used}/{limit} today
        </span>
        <span
          className="inline-flex items-center gap-1.5 text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full px-3 py-1.5"
          title="Days left in trial"
          data-testid="usage-badge-trial"
        >
          <Clock className="w-3.5 h-3.5" strokeWidth={2.25} />
          {days} day{days === 1 ? "" : "s"} trial left
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

import type { ReactNode } from "react";

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
 *   1. Trial status   2. Today's usage   3. Subscription status
 */
export function UsagePanel() {
  const { status, signedIn, isLoading } = useLicense();

  if (!signedIn || isLoading || !status) return null;

  const isPaid = status.isPaid && status.subscriptionActive;
  const used = status.todayUsage;
  const limit = status.dailyLimit;
  const limitReached = !isPaid && used >= limit;

  // ── Card 1: Trial ───────────────────────────────────────────────
  let trialCard: CardProps;
  if (isPaid) {
    trialCard = {
      variant: "muted",
      icon: <ShieldCheck className="w-5 h-5 text-white" />,
      label: "Trial",
      primary: "Not on trial",
      secondary: "You're on a paid plan",
      testId: "usage-card-trial",
    };
  } else if (status.trialActive) {
    const days = status.trialDaysRemaining;
    trialCard = {
      variant: days <= 3 ? "warn" : "ok",
      icon: <ShieldCheck className="w-5 h-5 text-white" />,
      label: "Free trial",
      primary: `${days} day${days === 1 ? "" : "s"} left`,
      secondary:
        days <= 3 ? "Trial ends soon — secure a plan." : "Full access during your trial.",
      testId: "usage-card-trial",
      cta: { label: "Plans", href: PRICING_URL },
    };
  } else {
    trialCard = {
      variant: "bad",
      icon: <AlertTriangle className="w-5 h-5 text-white" />,
      label: "Trial",
      primary: "Trial ended",
      secondary: "Activate a key or pick a plan to continue.",
      testId: "usage-card-trial",
      cta: { label: "Activate", href: `${basePath}/activate-key` },
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
      variant: limitReached ? "bad" : used >= Math.max(1, limit - 1) ? "warn" : "ok",
      icon: <Zap className="w-5 h-5 text-white" />,
      label: "Today",
      primary: `${used} / ${limit} actions`,
      secondary: limitReached
        ? "Daily limit reached. Resets at midnight UTC."
        : `${limit - used} action${limit - used === 1 ? "" : "s"} left · resets at midnight UTC`,
      testId: "usage-card-today",
      cta: limitReached ? { label: "Upgrade", href: PRICING_URL } : undefined,
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
      <StatCard {...trialCard} />
      <StatCard {...usageCard} />
      <StatCard {...subCard} />
    </div>
  );
}

/**
 * Inline banner that appears on every tool page when the daily cap is hit
 * (free trial users only). Includes UTC reset language and an Upgrade CTA.
 */
export function DailyLimitBanner() {
  const { status, signedIn, isLoading } = useLicense();
  if (!signedIn || isLoading || !status) return null;
  const isPaid = status.isPaid && status.subscriptionActive;
  if (isPaid) return null;
  if (status.todayUsage < status.dailyLimit) return null;

  return (
    <div
      className="mb-4 rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 via-orange-50 to-rose-50 px-4 py-3 flex flex-wrap items-center gap-3 shadow-sm"
      role="alert"
      data-testid="daily-limit-banner"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow shrink-0">
        <AlertTriangle className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-rose-900">
          You've used all {status.dailyLimit} free actions for today.
        </p>
        <p className="text-xs text-rose-700">
          Your daily limit resets at midnight UTC. Upgrade for unlimited PDFs and remove the cap.
        </p>
      </div>
      <a
        href={PRICING_URL}
        className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-sm font-semibold rounded-md px-4 py-2 shadow"
        data-testid="daily-limit-upgrade"
      >
        <Sparkles className="w-4 h-4" /> Upgrade
      </a>
      <a
        href={`${basePath}/activate-key`}
        className="text-sm font-semibold text-indigo-700 hover:text-indigo-900 underline"
        data-testid="daily-limit-activate"
      >
        I have a key
      </a>
    </div>
  );
}
