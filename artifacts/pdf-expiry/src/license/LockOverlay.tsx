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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLicense } from "./LicenseProvider";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const PRICING_URL = `/pricing`; // lexsecure-landing route, served at the suite root.

export function LockOverlay() {
  const { status, signedIn, refetch } = useLicense();
  const clerk = useClerk();
  const [location] = useLocation();

  // Only block when actually expired or suspended — daily limit / not-logged-in
  // are surfaced via toasts when the user attempts an action.
  if (!signedIn || !status) return null;
  const reason = status.lockReason;
  const blocking =
    reason === "trial_expired" ||
    reason === "subscription_expired" ||
    reason === "account_suspended";
  if (!blocking) return null;

  // Don't block the activate-key page itself, or auth pages.
  if (
    location.startsWith("/activate-key") ||
    location.startsWith("/sign-in") ||
    location.startsWith("/sign-up")
  ) {
    return null;
  }

  const isTrial = reason === "trial_expired";
  const isSub = reason === "subscription_expired";
  const isSuspended = reason === "account_suspended";

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      data-testid="license-lock-overlay"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
        <div className="flex justify-center mb-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${
              isSuspended
                ? "bg-gradient-to-br from-rose-500 to-red-600"
                : isSub
                  ? "bg-gradient-to-br from-amber-500 to-orange-600"
                  : "bg-gradient-to-br from-indigo-500 to-violet-600"
            }`}
          >
            <AlertTriangle className="w-7 h-7 text-white" />
          </div>
        </div>

        <h2
          className="text-center text-xl font-bold text-slate-900"
          data-testid="lock-title"
        >
          {isSuspended
            ? "Account suspended"
            : isSub
              ? "Subscription expired"
              : "Your free trial has ended"}
        </h2>
        <p className="text-center text-sm text-slate-600 mt-1.5">
          {isSuspended
            ? "Your account has been suspended. Please contact support to restore access."
            : isSub
              ? "Renew your subscription or activate a new product key to keep using Luxor PDF."
              : "Pick a plan or activate a product key to keep using all Luxor PDF tools."}
        </p>

        <div className="mt-5 space-y-2">
          {!isSuspended && (
            <>
              <a
                href={PRICING_URL}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-md px-4 py-2.5 shadow-md transition-all"
                data-testid="lock-action-pricing"
              >
                <Sparkles className="w-4 h-4" />
                {isSub ? "Renew subscription" : "View plans"}
              </a>
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
