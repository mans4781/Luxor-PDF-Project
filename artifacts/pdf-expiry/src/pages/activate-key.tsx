import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  useActivateLicense,
  useVerifyProductKey,
  getGetLicenseStatusQueryKey,
  type VerifyProductKeyResult,
} from "@workspace/api-client-react";
import {
  getOrCreateDeviceId,
  getDeviceName,
  detectOs,
} from "@/license/device-id";

import { basePath } from "@/lib/base-path";
const PRICING_URL = `/pricing`;

const KEY_REGEX = /^LUXOR(-[A-Z0-9]{4}){4}$/;

function formatKey(input: string): string {
  // Strip all non-alphanumerics, uppercase, regroup as LUXOR-XXXX-XXXX-XXXX-XXXX.
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  // Optional leading "LUXOR" prefix (5 chars), then up to 16 chars in 4-char chunks.
  let body = raw.startsWith("LUXOR") ? raw.slice(5) : raw;
  body = body.slice(0, 16);
  const groups = body.match(/.{1,4}/g) ?? [];
  return ["LUXOR", ...groups].join("-").replace(/-$/, "");
}

function reasonText(r: VerifyProductKeyResult["reason"]): string {
  switch (r) {
    case "malformed":
      return "That key doesn't look right. Double-check the format.";
    case "not_found":
      return "We couldn't find that key. Please check it and try again.";
    case "revoked":
      return "This key has been revoked. Please contact support.";
    case "expired":
      return "This key has expired. You'll need a new one.";
    case "max_activations_reached":
      return "This key has reached its activation limit.";
    default:
      return "This key isn't valid.";
  }
}

export default function ActivateKeyPage() {
  return (
    <Layout>
      <ActivateKeyContent />
    </Layout>
  );
}

function ActivateKeyContent() {
  const { isSignedIn, isLoaded } = useUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [keyInput, setKeyInput] = useState("");
  const [verify, setVerify] = useState<VerifyProductKeyResult | null>(null);
  const [done, setDone] = useState<{
    plan: string;
    endDate: string;
  } | null>(null);

  const verifyMut = useVerifyProductKey();
  const activateMut = useActivateLicense();

  // Redirect to sign-in if not authenticated.
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      setLocation("/sign-in");
    }
  }, [isLoaded, isSignedIn, setLocation]);

  // After successful activation, return to the dashboard in 3 seconds.
  const [secondsLeft, setSecondsLeft] = useState(3);
  useEffect(() => {
    if (!done) return;
    setSecondsLeft(3);
    const tick = setInterval(
      () => setSecondsLeft((s) => Math.max(0, s - 1)),
      1000,
    );
    const redirect = setTimeout(() => setLocation("/"), 3000);
    return () => {
      clearInterval(tick);
      clearTimeout(redirect);
    };
  }, [done, setLocation]);

  const wellFormed = KEY_REGEX.test(keyInput);

  async function handleBlur() {
    if (!wellFormed || verifyMut.isPending) return;
    try {
      const r = await verifyMut.mutateAsync({ data: { productKey: keyInput } });
      setVerify(r);
    } catch {
      setVerify(null);
    }
  }

  async function handleActivate() {
    if (!wellFormed) return;
    try {
      const result = await activateMut.mutateAsync({
        data: {
          productKey: keyInput,
          deviceId: getOrCreateDeviceId(),
          deviceName: getDeviceName(),
          os: detectOs(),
        },
      });
      setDone({ plan: result.planName, endDate: result.subscriptionEndDate });
      void qc.invalidateQueries({ queryKey: getGetLicenseStatusQueryKey() });
      toast({
        title: "Activation successful!",
        description: `Your ${result.planName} plan is now active.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not activate this key.";
      toast({
        title: "Activation failed",
        description: msg,
        variant: "destructive",
      });
    }
  }

  if (done) {
    return (
      <div className="max-w-xl mx-auto">
        <Card className="border-emerald-200 shadow-md">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow">
              <CheckCircle2 className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Activation successful!
            </h1>
            <p className="text-sm text-slate-600 mt-2">
              Your <span className="font-semibold capitalize">{done.plan}</span>{" "}
              plan is active until{" "}
              <span className="font-semibold">
                {new Date(done.endDate).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              .
            </p>
            <Button
              className="mt-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white border-0 shadow-md font-semibold"
              onClick={() => setLocation("/")}
              data-testid="activate-success-continue"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Open Luxor PDF
            </Button>
            <p
              className="text-xs text-slate-400 mt-3"
              data-testid="activate-redirect-countdown"
            >
              Returning to the dashboard in {secondsLeft}s…
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
      </Link>

      {/* Header banner */}
      <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner backdrop-blur-sm">
            <KeyRound className="w-7 h-7 text-white" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Activate product key</h1>
            <p className="text-white/85 text-sm mt-0.5">
              Enter the LUXOR-XXXX-XXXX-XXXX-XXXX key from your purchase.
            </p>
          </div>
        </div>
      </div>

      <Card className="border-indigo-100 shadow-sm">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="product-key"
              className="text-indigo-700 font-semibold text-sm flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" /> Product key
            </Label>
            <Input
              id="product-key"
              data-testid="input-product-key"
              value={keyInput}
              onChange={(e) => {
                setKeyInput(formatKey(e.target.value));
                setVerify(null);
              }}
              onBlur={handleBlur}
              placeholder="LUXOR-XXXX-XXXX-XXXX-XXXX"
              autoComplete="off"
              spellCheck={false}
              className="font-mono tracking-widest text-center uppercase border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400/20"
              maxLength={26}
            />
            <p className="text-xs text-indigo-400">
              Pasting works — extra spaces and dashes are cleaned up automatically.
            </p>
          </div>

          {verifyMut.isPending && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Checking key…
            </div>
          )}

          {verify && verify.valid && (
            <div
              className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3"
              data-testid="key-verified"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-900 capitalize">
                  Valid {verify.planName ?? ""} key
                </p>
                <p className="text-xs text-emerald-700">
                  {verify.durationDays
                    ? `${verify.durationDays} day${verify.durationDays === 1 ? "" : "s"} of access`
                    : "Lifetime access"}
                  {verify.slotsAvailable != null
                    ? ` · ${verify.slotsAvailable} activation slot${verify.slotsAvailable === 1 ? "" : "s"} left`
                    : ""}
                </p>
              </div>
            </div>
          )}

          {verify && !verify.valid && (
            <div
              className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3"
              data-testid="key-invalid"
            >
              <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-rose-900">
                  Key not accepted
                </p>
                <p className="text-xs text-rose-700">{reasonText(verify.reason)}</p>
              </div>
            </div>
          )}

          <Button
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white border-0 shadow-md font-semibold disabled:opacity-60"
            disabled={
              !wellFormed ||
              activateMut.isPending ||
              (verify !== null && !verify.valid)
            }
            onClick={handleActivate}
            data-testid="button-activate-key"
          >
            {activateMut.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Activating…
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 mr-2" />
                Activate this key
              </>
            )}
          </Button>

          <div className="border-t border-slate-100 pt-3 text-center">
            <p className="text-xs text-slate-500">
              Don't have a key yet?{" "}
              <a
                href={PRICING_URL}
                className="text-indigo-600 hover:underline font-semibold"
              >
                See plans & pricing
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
