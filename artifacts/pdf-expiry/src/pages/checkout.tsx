import { useEffect, useState } from "react";
import { useUser } from "@clerk/react";
import { Loader2, AlertTriangle } from "lucide-react";
import { useCreateCheckoutSession } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const VALID_PLANS = ["monthly", "quarterly", "yearly", "lifetime"] as const;
type Plan = (typeof VALID_PLANS)[number];

function isPlan(v: string | null): v is Plan {
  return !!v && (VALID_PLANS as readonly string[]).includes(v);
}

export default function CheckoutPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [error, setError] = useState<string | null>(null);
  const checkout = useCreateCheckoutSession();

  const params =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  const planParam = params.get("plan");
  const plan: Plan = isPlan(planParam) ? planParam : "monthly";

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      const here = `${basePath}/checkout?plan=${plan}`;
      const signInUrl = `${basePath}/sign-in?redirect_url=${encodeURIComponent(here)}`;
      window.location.replace(signInUrl);
      return;
    }

    if (checkout.isPending || checkout.isSuccess) return;

    const origin = window.location.origin;
    checkout.mutate(
      {
        data: {
          plan,
          provider: "stripe",
          successUrl: `${origin}${basePath}/?checkout_success=1`,
          cancelUrl: `${origin}${basePath}/?checkout_cancelled=1`,
        },
      },
      {
        onSuccess: (data) => {
          if (data?.url) {
            window.location.replace(data.url);
          } else {
            setError("Checkout session did not return a URL.");
          }
        },
        onError: (err: unknown) => {
          const msg =
            err instanceof Error ? err.message : "Failed to start checkout.";
          setError(msg);
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, plan]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-8 text-center">
        {error ? (
          <>
            <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-rose-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">
              Couldn't start checkout
            </h1>
            <p className="text-sm text-slate-600 mb-6">{error}</p>
            <Button
              onClick={() => {
                window.location.assign(`${basePath}/`);
              }}
              variant="outline"
              className="w-full"
              data-testid="checkout-back-home"
            >
              Back to dashboard
            </Button>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
            </div>
            <h1
              className="text-xl font-bold text-slate-900 mb-2"
              data-testid="checkout-loading-title"
            >
              Redirecting to secure checkout…
            </h1>
            <p className="text-sm text-slate-600">
              Plan: <span className="font-semibold capitalize">{plan}</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
