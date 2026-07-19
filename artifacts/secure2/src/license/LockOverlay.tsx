import { useClerk } from "@clerk/react";
import { Link, useLocation } from "wouter";
import {
  AlertTriangle,
  Sparkles,
  KeyRound,
  LogOut,
  RefreshCw,
  LifeBuoy,
  RotateCcw,
  WifiOff,
  Clock,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLicense } from "./LicenseProvider";

import { basePath } from "@/lib/base-path";
const PRICING_URL = `/pricing`; // lexsecure-landing route, served at the suite root.

function planFromStatusName(name: string | null | undefined): string {
  const n = (name ?? "").toLowerCase();
  if (n === "monthly" || n === "quarterly" || n === "yearly" || n === "lifetime") {
    return n;
  }
  return "monthly";
}

export function LockOverlay() {
  const { status, signedIn, refetch, clientLockReason, upgradeOpen, closeUpgrade } =
    useLicense();
  const clerk = useClerk();
  const [location] = useLocation();

  if (!signedIn) return null;

  // Client-side locks (offline grace expired, clock tampered) take
  // precedence — they fire even when no live `status` is available so
  // the desktop app cannot dodge an expired sub by going offline.
  const isOfflineTooLong = clientLockReason === "offline_too_long";
  const isClockTampered = clientLockReason === "clock_tampered";

  // Server-driven blocking reasons.
  const reason = status?.lockReason;
  // Never-paid (free) users are NOT hard-blocked: no pop-up on login. The
  // dismissible prompt opens only on a premium-feature attempt — server-side
  // checks still gate every paid action.
  const isSub = reason === "subscription_expired";
  const isSuspended = reason === "account_suspended";

  const hardBlocking =
    isOfflineTooLong || isClockTampered || isSub || isSuspended;
  // The dismissible "choose a plan" prompt renders whenever it was opened
  // (premium-feature attempt), regardless of the exact lock reason — as long
  // as no hard lock takes precedence.
  const showUpgradePrompt = !hardBlocking && upgradeOpen;
  if (!hardBlocking && !showUpgradePrompt) return null;
  const dismissible = showUpgradePrompt;

  // Don't block the activate-key page itself, or auth pages.
  if (
    location.startsWith("/activate-key") ||
    location.startsWith("/sign-in") ||
    location.startsWith("/sign-up")
  ) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      data-testid="license-lock-overlay"
    >
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
        {dismissible && (
          <button
            type="button"
            onClick={closeUpgrade}
            aria-label="Close"
            className="absolute top-3 right-3 p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            data-testid="lock-action-close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <div className="flex justify-center mb-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${
              isSuspended || isClockTampered
                ? "bg-gradient-to-br from-rose-500 to-red-600"
                : isOfflineTooLong
                  ? "bg-gradient-to-br from-slate-500 to-slate-700"
                  : isSub
                    ? "bg-gradient-to-br from-amber-500 to-orange-600"
                    : "bg-gradient-to-br from-indigo-500 to-violet-600"
            }`}
          >
            {isOfflineTooLong ? (
              <WifiOff className="w-7 h-7 text-white" />
            ) : isClockTampered ? (
              <Clock className="w-7 h-7 text-white" />
            ) : (
              <AlertTriangle className="w-7 h-7 text-white" />
            )}
          </div>
        </div>

        <h2
          className="text-center text-xl font-bold text-slate-900"
          data-testid="lock-title"
        >
          {isClockTampered
            ? "System clock check failed"
            : isOfflineTooLong
              ? "Connect to verify your subscription"
              : isSuspended
                ? "Account suspended"
                : isSub
                  ? "Subscription expired"
                  : "Choose a plan to continue"}
        </h2>
        <p className="text-center text-sm text-slate-600 mt-1.5">
          {isClockTampered
            ? "Your system clock appears to be set in the past. Please correct your date and time, then refresh."
            : isOfflineTooLong
              ? "Luxor PDF Secure couldn't reach the licensing server for over 7 days. Reconnect to the internet to continue using the app."
              : isSuspended
                ? "Your account has been suspended. Please contact support to restore access."
                : isSub
                  ? "Renew your subscription or activate a new product key to keep using Luxor PDF."
                  : "A paid plan is required to use Luxor PDF tools. Choose a plan to get started."}
        </p>

        <div className="mt-5 space-y-2">
          {!isSuspended && !isOfflineTooLong && !isClockTampered && (
            <>
              {isSub ? (
                <a
                  href={`${basePath}/checkout?plan=${planFromStatusName(status?.planName)}`}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-md px-4 py-2.5 shadow-md transition-all"
                  data-testid="lock-action-renew"
                >
                  <Sparkles className="w-4 h-4" />
                  Renew subscription
                </a>
              ) : (
                <a
                  href={`${basePath}/checkout?plan=yearly`}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-md px-4 py-2.5 shadow-md transition-all"
                  data-testid="lock-action-pricing"
                >
                  <Sparkles className="w-4 h-4" />
                  Choose a plan
                </a>
              )}
              <Link
                href="/activate-key"
                className="w-full inline-flex items-center justify-center gap-2 border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700 font-semibold rounded-md px-4 py-2.5 transition-all"
                data-testid="lock-action-activate"
              >
                <KeyRound className="w-4 h-4" />
                {isSub ? "Enter new key" : "I already have a key"}
              </Link>
              <a
                href="mailto:support@luxorpdf.com"
                className="w-full inline-flex items-center justify-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-md px-4 py-2.5 transition-all"
                data-testid="lock-action-support"
              >
                <LifeBuoy className="w-4 h-4" />
                Contact support
              </a>
            </>
          )}

          {isSuspended && (
            <a
              href="mailto:support@luxorpdf.com"
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white font-semibold rounded-md px-4 py-2.5 shadow-md transition-all"
              data-testid="lock-action-support"
            >
              <LifeBuoy className="w-4 h-4" />
              Contact support
            </a>
          )}

          <Button
            variant="outline"
            className="w-full border-slate-200 text-slate-700 hover:bg-slate-50"
            onClick={() => refetch()}
            data-testid="lock-action-refresh"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh license status
          </Button>

          <Button
            variant="ghost"
            className="w-full text-slate-500 hover:text-slate-700"
            onClick={() => clerk.signOut({ redirectUrl: `${basePath}/sign-in` })}
            data-testid="lock-action-signout"
          >
            {isSub ? (
              <>
                <RotateCcw className="w-4 h-4 mr-2" /> Switch account
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4 mr-2" /> Sign out
              </>
            )}
          </Button>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-4">
          Need help?{" "}
          <a
            href="mailto:support@luxorpdf.com"
            className="underline hover:text-slate-600"
          >
            support@luxorpdf.com
          </a>
        </p>
      </div>
    </div>
  );
}
