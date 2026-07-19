import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useAcceptOrgInvite,
  getGetLicenseStatusQueryKey,
  getGetOrgQueryKey,
} from "@workspace/api-client-react";
import { basePath } from "@/lib/base-path";

type State =
  | { kind: "loading" }
  | { kind: "no-token" }
  | { kind: "accepting" }
  | { kind: "success"; orgName: string }
  | { kind: "error"; message: string };

function errorMessage(code: string): string {
  switch (code) {
    case "invalid_token":
      return "This invitation link is not valid. Ask your admin to resend it.";
    case "expired":
      return "This invitation has expired. Ask your admin to send a new one.";
    case "revoked":
      return "This invitation is no longer active.";
    case "email_mismatch":
      return "This invite was sent to a different email address. Sign in with the email that received the invite.";
    case "org_inactive":
      return "This team's subscription is not active. Contact your team admin.";
    case "seats_full":
      return "This team has no available seats. Contact your team admin.";
    default:
      return "We couldn't accept this invitation. Please try again.";
  }
}

export default function AcceptInvitePage() {
  const { isLoaded, isSignedIn } = useUser();
  const [, setLocation] = useLocation();
  const qc = useQueryClient();
  const acceptMut = useAcceptOrgInvite();
  const [state, setState] = useState<State>({ kind: "loading" });

  const token =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("token")
      : null;

  // Redirect to sign-in (preserving this URL) if not authenticated.
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      const here = `${basePath}/accept-invite${token ? `?token=${encodeURIComponent(token)}` : ""}`;
      window.location.replace(
        `${basePath}/sign-in?redirect_url=${encodeURIComponent(here)}`,
      );
    }
  }, [isLoaded, isSignedIn, token]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (!token) {
      setState({ kind: "no-token" });
      return;
    }
    if (acceptMut.isPending || acceptMut.isSuccess || acceptMut.isError) return;

    setState({ kind: "accepting" });
    acceptMut.mutate(
      { data: { token } },
      {
        onSuccess: (data) => {
          setState({ kind: "success", orgName: data.orgName });
          void qc.invalidateQueries({
            queryKey: getGetLicenseStatusQueryKey(),
          });
          void qc.invalidateQueries({ queryKey: getGetOrgQueryKey() });
        },
        onError: (err: unknown) => {
          const msg =
            err instanceof Error ? err.message : "could not accept invite";
          setState({ kind: "error", message: errorMessage(msg) });
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <Card className="max-w-md w-full border-slate-200 shadow-xl">
        <CardContent className="pt-8 pb-6 text-center">
          {(state.kind === "loading" || state.kind === "accepting") && (
            <>
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">
                Accepting your invitation…
              </h1>
            </>
          )}

          {state.kind === "no-token" && (
            <>
              <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-7 h-7 text-rose-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 mb-2">
                Missing invitation link
              </h1>
              <p className="text-sm text-slate-600">
                Open the link from your invitation email to join your team.
              </p>
            </>
          )}

          {state.kind === "error" && (
            <>
              <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-7 h-7 text-rose-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 mb-2">
                Couldn't join the team
              </h1>
              <p className="text-sm text-slate-600 mb-6">{state.message}</p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation("/")}
                data-testid="accept-back-home"
              >
                Back to dashboard
              </Button>
            </>
          )}

          {state.kind === "success" && (
            <>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow">
                <CheckCircle2 className="w-9 h-9 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                Welcome to the team!
              </h1>
              <p className="text-sm text-slate-600 mt-2">
                You've joined{" "}
                <span className="font-semibold inline-flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {state.orgName}
                </span>
                . The full PDF toolkit is now unlocked on this account.
              </p>
              <Button
                className="mt-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white border-0 shadow-md font-semibold"
                onClick={() => setLocation("/")}
                data-testid="accept-success-continue"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Open Luxor PDF
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
