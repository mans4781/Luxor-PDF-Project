import { Sparkles, Zap, Clock, ShieldCheck } from "lucide-react";
import { useLicense } from "./LicenseProvider";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

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

export function UsagePanel() {
  const { status, signedIn, isLoading, offline } = useLicense();

  if (!signedIn || isLoading || !status) return null;

  if (status.isPaid && status.subscriptionActive) {
    const days = status.subscriptionDaysRemaining;
    return (
      <div
        className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 px-5 py-4 flex items-center gap-4"
        data-testid="usage-panel-paid"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-amber-900 capitalize">
            {status.planName ?? "Pro"} plan · Unlimited PDFs
          </p>
          <p className="text-xs text-amber-800">
            {days != null
              ? `${days} day${days === 1 ? "" : "s"} of access remaining`
              : "Lifetime license"}
            {" · "}
            {status.todayUsage} action{status.todayUsage === 1 ? "" : "s"} today
          </p>
        </div>
      </div>
    );
  }

  if (status.trialActive) {
    const used = status.todayUsage;
    const limit = status.dailyLimit;
    const days = status.trialDaysRemaining;
    const pct = Math.min(100, (used / Math.max(1, limit)) * 100);
    return (
      <div
        className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50 px-5 py-4 space-y-3"
        data-testid="usage-panel-trial"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-emerald-900">
              Free trial · {days} day{days === 1 ? "" : "s"} left
            </p>
            <p className="text-xs text-emerald-800">
              {used}/{limit} PDF actions used today
              {offline ? " · offline (limits paused)" : ""}
            </p>
          </div>
          <a
            href={`${basePath}/activate-key`}
            className="text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-full px-3 py-1.5"
            data-testid="link-activate-from-panel"
          >
            Activate Key
          </a>
        </div>
        <div className="h-1.5 rounded-full bg-emerald-100 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  return null;
}
