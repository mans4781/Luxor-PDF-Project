import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  KeyRound,
  CreditCard,
  ChevronRight,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
  X,
  ArrowLeft,
} from "lucide-react";
import {
  useActivateLicense,
  getGetLicenseStatusQueryKey,
} from "@workspace/api-client-react";
import {
  getOrCreateDeviceId,
  getDeviceName,
  detectOs,
} from "@/license/device-id";

const KEY_REGEX = /^LUXOR(-[A-Z0-9]{4}){4}$/;

function formatKey(input: string): string {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  let body = raw.startsWith("LUXOR") ? raw.slice(5) : raw;
  body = body.slice(0, 16);
  const groups = body.match(/.{1,4}/g) ?? [];
  return ["LUXOR", ...groups].join("-").replace(/-$/, "");
}

type Step = "choose" | "key" | "activated" | "welcome";

/**
 * Chooser shown before checkout: users who already own a license key can
 * activate it right here instead of being pushed into the payment flow.
 */
export function UpgradeChoiceModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const activateMut = useActivateLicense();

  const [step, setStep] = useState<Step>("choose");
  const [keyInput, setKeyInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const timersRef = useRef<number[]>([]);

  // Reset on every open/close and drop any pending popup timers.
  useEffect(() => {
    setStep("choose");
    setKeyInput("");
    setError(null);
    return () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current = [];
    };
  }, [open]);

  if (!open) return null;

  const wellFormed = KEY_REGEX.test(keyInput);

  async function handleActivate() {
    if (!wellFormed || activateMut.isPending) return;
    setError(null);
    try {
      await activateMut.mutateAsync({
        data: {
          productKey: keyInput,
          deviceId: getOrCreateDeviceId(),
          deviceName: getDeviceName(),
          os: detectOs(),
        },
      });
      void qc.invalidateQueries({ queryKey: getGetLicenseStatusQueryKey() });
      // Two sequential confirmation popups, ~2s each.
      setStep("activated");
      timersRef.current.push(
        window.setTimeout(() => setStep("welcome"), 2000),
        window.setTimeout(() => onClose(), 4000),
      );
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      const friendly: Array<[string, string]> = [
        ["not_found", "That key wasn't recognized. Check it and try again."],
        ["already_activated", "This key is already active on this account."],
        ["max_activations_reached", "This key has no device slots left. Deactivate a device first."],
        ["revoked", "This key has been revoked. Please contact support."],
        ["expired", "This key's subscription has expired."],
      ];
      const match = friendly.find(([code]) => raw.includes(code));
      setError(match ? match[1] : "Couldn't activate that key. Check it and try again.");
    }
  }

  const popup = (icon: React.ReactNode, title: string, subtitle: string, testId: string) => (
    <div className="text-center py-8 px-6" data-testid={testId}>
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-md">
        {icon}
      </div>
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-600 mt-1">{subtitle}</p>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && step !== "activated" && step !== "welcome") onClose();
      }}
      data-testid="upgrade-choice-modal"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {step === "activated" &&
          popup(
            <CheckCircle2 className="w-9 h-9 text-white" />,
            "License activated",
            "Your license key was accepted.",
            "popup-license-activated",
          )}
        {step === "welcome" &&
          popup(
            <Sparkles className="w-9 h-9 text-white" />,
            "Welcome to Luxor PDF",
            "All premium features are now unlocked.",
            "popup-welcome",
          )}

        {(step === "choose" || step === "key") && (
          <>
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {step === "key" && (
                  <button
                    onClick={() => { setStep("choose"); setError(null); }}
                    className="text-slate-400 hover:text-slate-600 -ml-1"
                    aria-label="Back"
                    data-testid="button-modal-back"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <h2 className="text-base font-bold text-slate-900">
                  {step === "choose" ? "Upgrade to Pro" : "Enter your license key"}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close"
                data-testid="button-modal-close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {step === "choose" && (
              <div className="p-5 space-y-3">
                <button
                  onClick={() => setStep("key")}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors group text-left"
                  data-testid="button-choice-license"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                      <KeyRound className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Enter your license key</div>
                      <div className="text-xs text-slate-500">Already purchased? Activate it here.</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                </button>

                <button
                  onClick={() => { onClose(); setLocation("/checkout"); }}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-[#ef233c]/40 hover:bg-[#fff1f2]/60 transition-colors group text-left"
                  data-testid="button-choice-checkout"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#fff1f2] flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-[#ef233c]" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Buy a plan</div>
                      <div className="text-xs text-slate-500">Continue to secure checkout.</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#ef233c]" />
                </button>
              </div>
            )}

            {step === "key" && (
              <form
                className="p-5 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleActivate();
                }}
              >
                <input
                  value={keyInput}
                  onChange={(e) => { setKeyInput(formatKey(e.target.value)); setError(null); }}
                  placeholder="LUXOR-XXXX-XXXX-XXXX-XXXX"
                  autoComplete="off"
                  spellCheck={false}
                  autoFocus
                  maxLength={26}
                  className="w-full font-mono tracking-widest text-center uppercase text-sm rounded-xl border border-indigo-200 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 px-3 py-2.5"
                  data-testid="input-modal-product-key"
                />
                {error && (
                  <p className="text-xs text-rose-600" data-testid="text-modal-key-error">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={!wellFormed || activateMut.isPending}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-semibold py-2.5 rounded-xl shadow-md disabled:opacity-60 transition-colors"
                  data-testid="button-modal-activate"
                >
                  {activateMut.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Activating…</>
                  ) : (
                    <><ShieldCheck className="w-4 h-4" /> Activate this key</>
                  )}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
