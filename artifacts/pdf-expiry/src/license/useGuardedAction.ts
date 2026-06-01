import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCheckUsage,
  useRecordUsage,
  getGetLicenseStatusQueryKey,
  type PdfActionType,
  type LicenseLockReason,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useLicense } from "./LicenseProvider";

function reasonMessage(
  reason: LicenseLockReason,
  dailyLimit?: number,
): {
  title: string;
  description: string;
} {
  switch (reason) {
    case "not_logged_in":
      return {
        title: "Sign in required",
        description: "Please sign in to use Luxor PDF tools.",
      };
    case "trial_expired":
      return {
        title: "Subscription required",
        description:
          "A paid plan is required to use Luxor PDF. Choose a plan to get started.",
      };
    case "subscription_required":
      return {
        title: "Subscription required",
        description:
          "A paid plan is required to use Luxor PDF tools. Choose a plan to get started.",
      };
    case "premium_feature":
      return {
        title: "Paid feature",
        description:
          "Password protection and expiry require a paid plan. Choose a plan to use them.",
      };
    case "subscription_expired":
      return {
        title: "Subscription expired",
        description:
          "Your subscription has expired. Renew or activate a new key to keep using Luxor PDF.",
      };
    case "monthly_limit_reached":
      return {
        title: "Monthly limit reached",
        description:
          "You've used all your secure-feature actions for this month. Upgrade your plan for a higher limit, or wait until your quota resets.",
      };
    case "daily_limit_reached":
      return {
        title: "Daily limit reached",
        description: `You've used all ${dailyLimit ?? 0} actions for today. Upgrade your plan for unlimited usage or come back tomorrow.`,
      };
    case "account_suspended":
      return {
        title: "Account suspended",
        description: "Please contact support to restore access.",
      };
    default:
      return { title: "Action blocked", description: "Please try again." };
  }
}

export type ActionFn<T> = () => Promise<T> | T;

export interface GuardedRunOptions {
  /** Optional: skip recording on success (rare). */
  skipRecord?: boolean;
}

/**
 * Hook that returns a function which gates a PDF action behind the licensing
 * check / record cycle:
 *   1. POST /api/usage/check  → server says yes/no
 *   2. run the action
 *   3. POST /api/usage/record → atomically increments today's count
 *   4. invalidate /api/license/status so the dashboard refreshes
 *
 * Returns the action's resolved value, or `undefined` when the action was
 * blocked (a toast is shown automatically).
 */
export function useGuardedAction() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { signedIn, offline, status, clientLockReason } = useLicense();
  const checkMut = useCheckUsage();
  const recordMut = useRecordUsage();

  const run = useCallback(
    async <T,>(
      actionType: PdfActionType,
      fn: ActionFn<T>,
      opts: GuardedRunOptions = {},
    ): Promise<T | undefined> => {
      if (!signedIn) {
        toast({
          title: "Sign in required",
          description: "Please sign in to use Luxor PDF tools.",
          variant: "destructive",
        });
        return undefined;
      }
      // Block actions when the client-side lock is active (offline-grace
      // expired, clock tampered, or the cached subscription end date has
      // passed). These come from `LicenseProvider`'s offline cache and
      // exist precisely so the desktop app cannot bypass an expired sub
      // by being offline.
      if (clientLockReason === "offline_too_long") {
        toast({
          title: "Offline too long",
          description:
            "Reconnect to the internet to verify your subscription, then try again.",
          variant: "destructive",
        });
        return undefined;
      }
      if (clientLockReason === "clock_tampered") {
        toast({
          title: "System clock check failed",
          description:
            "Your system clock appears to be in the past. Fix the date/time and try again.",
          variant: "destructive",
        });
        return undefined;
      }
      const cachedReason = status?.lockReason;
      if (
        cachedReason === "subscription_expired" ||
        cachedReason === "subscription_required" ||
        cachedReason === "trial_expired" ||
        cachedReason === "account_suspended"
      ) {
        toast({ ...reasonMessage(cachedReason), variant: "destructive" });
        return undefined;
      }
      if (offline) {
        toast({
          title: "License check failed",
          description:
            "Cannot verify your license right now. Please check your connection and try again.",
          variant: "destructive",
        });
        return undefined;
      }

      // 1. Server-side pre-check
      let check;
      try {
        check = await checkMut.mutateAsync({ data: { actionType } });
      } catch {
        toast({
          title: "License check failed",
          description:
            "Cannot verify your license right now. Please check your connection and try again.",
          variant: "destructive",
        });
        return undefined;
      }
      if (!check.allowed) {
        const msg = reasonMessage(check.lockReason, check.dailyLimit);
        toast({ ...msg, variant: "destructive" });
        // Refresh status so any expiry / lock UI appears immediately.
        void qc.invalidateQueries({ queryKey: getGetLicenseStatusQueryKey() });
        return undefined;
      }

      // 2. Run the action
      let result: T;
      try {
        result = await fn();
      } catch (err) {
        // Don't record usage on action failure.
        throw err;
      }

      // 3. Record usage (best-effort; do not block UI on failure).
      // Some actions (e.g. set_expiry via /pdfs/upload) are recorded
      // authoritatively server-side during the action itself; those pass
      // skipRecord so we don't double-count the shared monthly pool.
      if (!opts.skipRecord) {
        try {
          await recordMut.mutateAsync({ data: { actionType } });
        } catch {
          // Surface the error softly: the action already happened.
          toast({
            title: "Usage not recorded",
            description:
              "Your action completed, but we couldn't update your daily count.",
            variant: "destructive",
          });
        }
      }

      // 4. Refresh status so the usage badge / monthly pool updates, whether
      // the count was recorded here or server-side during the action.
      void qc.invalidateQueries({ queryKey: getGetLicenseStatusQueryKey() });

      return result;
    },
    [
      signedIn,
      offline,
      status,
      clientLockReason,
      checkMut,
      recordMut,
      qc,
      toast,
    ],
  );

  return run;
}
