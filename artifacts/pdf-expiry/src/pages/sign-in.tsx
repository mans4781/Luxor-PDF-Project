import { FormEvent, useEffect, useRef, useState } from "react";
import { HandleSSOCallback, useAuth, useSignIn } from "@clerk/react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Headphones,
  Lock,
  Mail,
  PenLine,
  PenSquare,
  RefreshCw,
  Repeat,
  ShieldCheck,
  Users,
} from "lucide-react";

import { basePath } from "@/lib/base-path";
import { authRedirectTarget } from "@/lib/auth-redirect";

const baseUrl = import.meta.env.BASE_URL;

/* ─── Left panel illustration (original Luxor art) ───────────────────── */

function DocIllustration() {
  return (
    <div className="relative w-[240px] h-[210px] mx-auto" aria-hidden="true">
      {/* soft blob */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[170px] h-[170px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(252,165,165,0.55) 0%, rgba(254,226,226,0.35) 55%, transparent 75%)",
        }}
      />
      {/* document card */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[110px] h-[140px] bg-white rounded-xl shadow-xl shadow-rose-200/50 border border-slate-100 p-3">
        <div className="inline-flex items-center rounded-md bg-[#DC2626] px-2 py-1 text-[10px] font-extrabold text-white tracking-wide">
          PDF
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-[5px] rounded-full bg-rose-200/80 w-full" />
          <div className="h-[5px] rounded-full bg-slate-200 w-5/6" />
          <div className="h-[5px] rounded-full bg-slate-200 w-full" />
          <div className="h-[5px] rounded-full bg-rose-200/80 w-4/6" />
          <div className="h-[5px] rounded-full bg-slate-200 w-5/6" />
        </div>
      </div>
      {/* floating chips */}
      <div className="absolute left-1 top-4 w-10 h-10 rounded-xl bg-white shadow-lg shadow-rose-200/40 border border-slate-100 flex items-center justify-center">
        <PenSquare className="w-[18px] h-[18px] text-[#DC2626]" strokeWidth={2} />
      </div>
      <div className="absolute right-2 top-6 w-10 h-10 rounded-xl bg-white shadow-lg shadow-rose-200/40 border border-slate-100 flex items-center justify-center">
        <ShieldCheck className="w-[18px] h-[18px] text-[#DC2626]" strokeWidth={2} />
      </div>
      <div className="absolute left-2 bottom-4 w-10 h-10 rounded-xl bg-white shadow-lg shadow-rose-200/40 border border-slate-100 flex items-center justify-center">
        <PenLine className="w-[18px] h-[18px] text-[#DC2626]" strokeWidth={2} />
      </div>
      <div className="absolute right-4 bottom-2 w-10 h-10 rounded-xl bg-[#DC2626] shadow-lg shadow-rose-300/50 flex items-center justify-center">
        <Lock className="w-[18px] h-[18px] text-white" strokeWidth={2} />
      </div>
    </div>
  );
}

/* ─── Decorative dot grid ────────────────────────────────────────────── */

function DotGrid({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute w-28 h-28 opacity-40 ${className ?? ""}`}
      style={{
        backgroundImage: "radial-gradient(#fca5a5 1.5px, transparent 1.5px)",
        backgroundSize: "14px 14px",
      }}
    />
  );
}

const FEATURES = [
  { icon: Eye, label: "Read and annotate PDFs" },
  { icon: PenSquare, label: "Edit text, images, and pages" },
  { icon: Repeat, label: "Convert PDFs to multiple formats" },
  { icon: ShieldCheck, label: "Protect and secure your documents" },
  { icon: PenLine, label: "eSign and request signatures" },
];

const TRUST_ITEMS = [
  { icon: Users, top: "Trusted by", bottom: "Millions of Users" },
  { icon: ShieldCheck, top: "Secure &", bottom: "Reliable" },
  { icon: RefreshCw, top: "Regular", bottom: "Updates" },
  { icon: Headphones, top: "24/7", bottom: "Support" },
];

type View = "login" | "mfa-code" | "forgot-code" | "forgot-password";

const inputBase =
  "w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-[14px] text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/15";

export default function SignInPage() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  const isSsoCallback =
    typeof window !== "undefined" &&
    window.location.pathname.includes("/sign-in/sso-callback");

  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  // Developer passphrase gate: developer accounts must enter the passphrase
  // once per login session before being redirected into the apps.
  const [devGateTarget, setDevGateTarget] = useState<string | null>(null);
  const [devPassphrase1, setDevPassphrase1] = useState("");
  const [devPassphrase2, setDevPassphrase2] = useState("");
  const [devError, setDevError] = useState<string | null>(null);
  const [devBusy, setDevBusy] = useState(false);
  const [statusCheckFailed, setStatusCheckFailed] = useState<string | null>(null);
  const [statusRetrying, setStatusRetrying] = useState(false);
  const routedOnLoad = useRef(false);

  /**
   * After the session is active, either redirect normally or — for
   * developer accounts that haven't verified this session — show the
   * passphrase step. Fails closed: if the status check cannot be completed
   * (server error / timeout) a retry screen is shown instead of redirecting,
   * so the developer gate can't be skipped by a network hiccup. The server
   * additionally enforces the gate on every API call.
   */
  const routeAfterAuth = async (target: string) => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch("/api/account/dev-status", {
          credentials: "include",
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok) {
          const data = (await res.json()) as { isDeveloper: boolean; verified: boolean };
          if (data.isDeveloper && !data.verified) {
            setDevGateTarget(target);
          } else {
            window.location.href = target;
          }
          return;
        }
      } catch {
        // Retry once, then fall through to the retry screen.
      }
    }
    setStatusCheckFailed(target);
  };

  // Already signed in in this browser (e.g. the desktop-app handoff opened
  // this page in a session that has an account) — skip the form and go
  // straight to the redirect target so the flow can complete.
  useEffect(() => {
    if (isSsoCallback) return;
    if (authLoaded && isSignedIn && !routedOnLoad.current) {
      routedOnLoad.current = true;
      void routeAfterAuth(authRedirectTarget());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoaded, isSignedIn, isSsoCallback]);

  const busy = fetchStatus === "fetching";

  const finishSignIn = async () => {
    await signIn.finalize({
      navigate: async ({ decorateUrl }) => {
        await routeAfterAuth(decorateUrl(authRedirectTarget()));
      },
    });
  };

  const handleDevVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (!devGateTarget || devBusy) return;
    setDevError(null);
    setDevBusy(true);
    try {
      const res = await fetch("/api/account/dev-verify", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passphrase1: devPassphrase1,
          passphrase2: devPassphrase2,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (res.status === 429) {
        setDevError("Too many attempts. Please wait 15 minutes and try again.");
        return;
      }
      const data = (await res.json()) as { verified?: boolean };
      if (data.verified) {
        window.location.href = devGateTarget;
        return;
      }
      setDevError("One or both passphrases are incorrect. Please try again.");
    } catch {
      setDevError("Something went wrong. Please try again.");
    } finally {
      setDevBusy(false);
    }
  };

  const handlePasswordLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const { error } = await signIn.password({ emailAddress: email, password });
    if (error) return;
    if (signIn.status === "complete") {
      await finishSignIn();
    } else if (signIn.status === "needs_second_factor") {
      // Clerk asks for an emailed verification code (e.g. signing in from a
      // new device/browser). Send the code and show the code-entry step.
      const { error: sendError } = await signIn.mfa.sendEmailCode();
      if (sendError) {
        setLocalError("We couldn't send a verification code. Please try again.");
        return;
      }
      setCode("");
      setView("mfa-code");
    } else {
      setLocalError("Additional verification is required for this account.");
    }
  };

  const handleVerifyMfaCode = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const { error } = await signIn.mfa.verifyEmailCode({ code });
    if (error) return;
    if (signIn.status === "complete") {
      await finishSignIn();
    } else {
      setLocalError("Verification didn't complete. Please try again.");
    }
  };

  const resendMfaCode = async () => {
    setLocalError(null);
    const { error } = await signIn.mfa.sendEmailCode();
    if (error) {
      setLocalError("We couldn't resend the code. Please try again in a moment.");
    }
  };

  const startForgotPassword = async () => {
    setLocalError(null);
    if (!email) {
      setLocalError("Enter your email address first, then tap Forgot Password.");
      return;
    }
    const { error } = await signIn.create({ identifier: email });
    if (error) return;
    const { error: sendError } = await signIn.resetPasswordEmailCode.sendCode();
    if (!sendError) {
      setCode("");
      setView("forgot-code");
    }
  };

  const handleVerifyResetCode = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const { error } = await signIn.resetPasswordEmailCode.verifyCode({ code });
    if (!error) setView("forgot-password");
  };

  const handleSubmitNewPassword = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const { error } = await signIn.resetPasswordEmailCode.submitPassword({
      password: newPassword,
    });
    if (error) return;
    if (signIn.status === "complete") {
      await finishSignIn();
    }
  };

  // Post-login status check failed — offer a retry instead of silently
  // letting the session through (keeps the developer gate fail-closed).
  if (statusCheckFailed) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#eef0f4] px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 shadow-xl p-7 text-center">
          <h1 className="text-[19px] font-bold text-slate-900">Almost there</h1>
          <p className="mt-1.5 text-[13px] text-slate-500">
            You're signed in, but we couldn't finish checking your account.
            Please try again.
          </p>
          <button
            type="button"
            disabled={statusRetrying}
            onClick={async () => {
              const target = statusCheckFailed;
              setStatusRetrying(true);
              setStatusCheckFailed(null);
              await routeAfterAuth(target);
              setStatusRetrying(false);
            }}
            className="mt-4 w-full rounded-lg bg-[#DC2626] py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#b91c1c] disabled:opacity-60"
            data-testid="button-retry-status"
          >
            {statusRetrying ? "Checking…" : "Try again"}
          </button>
        </div>
      </div>
    );
  }

  // Developer passphrase step — shown after login for developer accounts
  // only. Rendered before the SSO-callback branch so it covers both the
  // password flow and the Google/SSO flow.
  if (devGateTarget) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#eef0f4] px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 shadow-xl p-7">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#DC2626]/10 mx-auto">
            <ShieldCheck className="h-5.5 w-5.5 text-[#DC2626]" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-center text-[19px] font-bold text-slate-900">
            Developer verification
          </h1>
          <p className="mt-1.5 text-center text-[13px] text-slate-500">
            This account has developer access. Enter both passphrases to continue.
          </p>
          <form onSubmit={handleDevVerify} className="mt-5">
            <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
              Passphrase 1
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                autoComplete="off"
                autoFocus
                required
                value={devPassphrase1}
                onChange={(e) => setDevPassphrase1(e.target.value)}
                placeholder="Enter passphrase 1"
                className={inputBase}
                data-testid="input-dev-passphrase-1"
              />
            </div>
            <label className="mt-4 block text-[13px] font-semibold text-slate-700 mb-1.5">
              Passphrase 2
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="password"
                autoComplete="off"
                required
                value={devPassphrase2}
                onChange={(e) => setDevPassphrase2(e.target.value)}
                placeholder="Enter passphrase 2"
                className={inputBase}
                data-testid="input-dev-passphrase-2"
              />
            </div>
            {devError && (
              <p className="mt-2.5 text-[13px] text-[#DC2626]" data-testid="text-dev-error">
                {devError}
              </p>
            )}
            <button
              type="submit"
              disabled={devBusy || devPassphrase1.length === 0 || devPassphrase2.length === 0}
              className="mt-4 w-full rounded-lg bg-[#DC2626] py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#b91c1c] disabled:opacity-60"
              data-testid="button-dev-verify"
            >
              {devBusy ? "Verifying…" : "Continue"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isSsoCallback) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#eef0f4]">
        <HandleSSOCallback
          navigateToApp={async ({ decorateUrl }) => {
            await routeAfterAuth(decorateUrl(authRedirectTarget()));
          }}
          navigateToSignIn={() => setLocation("/sign-in")}
          navigateToSignUp={() => setLocation("/sign-up")}
        />
        <p className="text-sm text-slate-500">Completing sign-in…</p>
      </div>
    );
  }

  const globalError =
    localError ??
    errors.global?.[0]?.message ??
    null;

  const fieldError = (key: "identifier" | "password" | "code") =>
    errors.fields[key]?.message ?? null;

  return (
    <div className="min-h-[100dvh] bg-[#fafafc]">
      {/* ── Main panel ─────────────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden">
        <DotGrid className="top-6 right-8" />
        <DotGrid className="bottom-8 left-6" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-1/3 w-[340px] h-[340px] rounded-full opacity-50 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(252,165,165,0.5) 0%, transparent 70%)",
          }}
        />

        <div className="relative grid lg:grid-cols-[1fr_1.15fr] gap-10 px-8 sm:px-12 py-10 lg:py-0 lg:pr-0 lg:min-h-[100dvh]">
          {/* ── Left: brand pitch ─────────────────────────────────────── */}
          <div className="lg:py-12">
            <a
              href="/"
              className="inline-flex items-center gap-3"
              aria-label="Luxor PDF — home"
              data-testid="link-logo-home"
            >
              <img
                src={`${baseUrl}brand/luxor-icon-nav.webp`}
                alt=""
                className="h-[53px] w-auto select-none"
                draggable={false}
              />
              <span>
                <span className="block text-[26px] font-black tracking-tight leading-none">
                  <span className="text-[#1e3a8a]">Luxor</span>{" "}
                  <span className="text-[#DC2626]">PDF</span>
                </span>
                <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500">
                  Secure PDF Suite
                </span>
              </span>
            </a>

            <h1 className="mt-10 text-[34px] leading-[1.15] font-extrabold tracking-tight text-slate-900">
              Welcome to
              <br />
              Luxor <span className="text-[#DC2626]">PDF</span>
            </h1>
            <p className="mt-4 max-w-[300px] text-[14px] leading-relaxed text-slate-500">
              Your all-in-one PDF solution to read, edit, convert, secure, and
              eSign documents with ease.
            </p>

            <div className="mt-8 mb-8">
              <DocIllustration />
            </div>

            <ul className="space-y-3.5">
              {FEATURES.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 border border-rose-100">
                    <Icon className="h-3.5 w-3.5 text-[#DC2626]" strokeWidth={2.2} />
                  </span>
                  <span className="text-[13px] font-medium text-slate-700">
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Right: login card ─────────────────────────────────────── */}
          <div className="relative rounded-3xl lg:rounded-none bg-white border border-slate-100 shadow-xl shadow-slate-200/60 px-7 sm:px-10 py-9 w-full flex flex-col justify-center">
            <a
              href="/"
              className="absolute top-5 left-6 sm:left-8 inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-red-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Back to Home
            </a>
            <h2 className="text-center text-[22px] font-extrabold tracking-tight text-slate-900">
              Log in to your account
            </h2>
            <p className="mt-2 text-center text-[13px] text-slate-500">
              New to Luxor PDF?{" "}
              <Link
                href="/sign-up"
                className="font-semibold text-[#DC2626] hover:text-[#B91C1C] transition-colors"
                data-testid="link-create-account"
              >
                Create Account
              </Link>
            </p>

            {globalError && (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
                {globalError}
              </div>
            )}

            {/* ── Email + password ── */}
            {view === "login" && (
              <form onSubmit={handlePasswordLogin} className="mt-6">
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className={inputBase}
                    data-testid="input-email"
                  />
                </div>
                {fieldError("identifier") && (
                  <p className="mt-1.5 text-[12px] text-rose-600">
                    {fieldError("identifier")}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between mb-1.5">
                  <label className="text-[13px] font-semibold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={startForgotPassword}
                    className="text-[12px] font-semibold text-[#DC2626] hover:text-[#B91C1C] transition-colors"
                    data-testid="link-forgot-password"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={inputBase}
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {fieldError("password") && (
                  <p className="mt-1.5 text-[12px] text-rose-600">
                    {fieldError("password")}
                  </p>
                )}

                <label className="mt-4 flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 accent-[#DC2626]"
                    data-testid="checkbox-remember-me"
                  />
                  <span className="text-[13px] font-semibold text-slate-700">
                    Remember me
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={busy}
                  className="relative mt-6 w-full rounded-xl bg-gradient-to-r from-[#EF4444] to-[#B91C1C] py-3 text-[15px] font-bold text-white shadow-lg shadow-rose-300/50 transition-all hover:from-[#DC2626] hover:to-[#991B1B] disabled:opacity-60"
                  data-testid="button-log-in"
                >
                  Log In
                  <ArrowRight className="absolute right-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2" />
                </button>
              </form>
            )}

            {/* ── Sign-in verification: emailed code step ── */}
            {view === "mfa-code" && (
              <form onSubmit={handleVerifyMfaCode} className="mt-6">
                <p className="text-[13px] text-slate-500">
                  To keep your account safe, we sent a verification code to{" "}
                  <span className="font-semibold text-slate-700">{email}</span>.
                  Enter it below to finish logging in.
                </p>
                <label className="mt-4 block text-[13px] font-semibold text-slate-700 mb-1.5">
                  Verification Code
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    inputMode="numeric"
                    autoFocus
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter the code from your email"
                    className={inputBase}
                    data-testid="input-signin-code"
                  />
                </div>
                {fieldError("code") && (
                  <p className="mt-1.5 text-[12px] text-rose-600">
                    {fieldError("code")}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={busy}
                  className="mt-6 w-full rounded-xl bg-gradient-to-r from-[#EF4444] to-[#B91C1C] py-3 text-[15px] font-bold text-white shadow-lg shadow-rose-300/50 transition-all hover:from-[#DC2626] hover:to-[#991B1B] disabled:opacity-60"
                  data-testid="button-verify-signin-code"
                >
                  Verify &amp; Log In
                </button>
                <div className="mt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setView("login");
                      setCode("");
                      void signIn.reset();
                    }}
                    className="text-[13px] font-semibold text-slate-500 hover:text-slate-700"
                    data-testid="button-back-to-login"
                  >
                    Back to login
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void resendMfaCode()}
                    className="text-[13px] font-semibold text-[#DC2626] hover:text-[#B91C1C] transition-colors disabled:opacity-60"
                    data-testid="button-resend-signin-code"
                  >
                    Resend code
                  </button>
                </div>
              </form>
            )}

            {/* ── Forgot password: code step ── */}
            {view === "forgot-code" && (
              <form onSubmit={handleVerifyResetCode} className="mt-6">
                <p className="text-[13px] text-slate-500">
                  We sent a reset code to{" "}
                  <span className="font-semibold text-slate-700">{email}</span>.
                </p>
                <label className="mt-4 block text-[13px] font-semibold text-slate-700 mb-1.5">
                  Reset Code
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    inputMode="numeric"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter the code from your email"
                    className={inputBase}
                    data-testid="input-reset-code"
                  />
                </div>
                {fieldError("code") && (
                  <p className="mt-1.5 text-[12px] text-rose-600">
                    {fieldError("code")}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={busy}
                  className="mt-6 w-full rounded-xl bg-gradient-to-r from-[#EF4444] to-[#B91C1C] py-3 text-[15px] font-bold text-white shadow-lg shadow-rose-300/50 transition-all hover:from-[#DC2626] hover:to-[#991B1B] disabled:opacity-60"
                  data-testid="button-verify-reset-code"
                >
                  Verify Code
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setView("login");
                    setCode("");
                    void signIn.reset();
                  }}
                  className="mt-3 w-full text-center text-[13px] font-semibold text-slate-500 hover:text-slate-700"
                >
                  Back to login
                </button>
              </form>
            )}

            {/* ── Forgot password: new password step ── */}
            {view === "forgot-password" && (
              <form onSubmit={handleSubmitNewPassword} className="mt-6">
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Choose a new password"
                    className={inputBase}
                    data-testid="input-new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {fieldError("password") && (
                  <p className="mt-1.5 text-[12px] text-rose-600">
                    {fieldError("password")}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={busy}
                  className="mt-6 w-full rounded-xl bg-gradient-to-r from-[#EF4444] to-[#B91C1C] py-3 text-[15px] font-bold text-white shadow-lg shadow-rose-300/50 transition-all hover:from-[#DC2626] hover:to-[#991B1B] disabled:opacity-60"
                  data-testid="button-save-new-password"
                >
                  Save Password &amp; Log In
                </button>
              </form>
            )}

            {/* Security note */}
            <p className="mt-7 flex items-center justify-center gap-2 text-[12px] text-slate-500">
              <ShieldCheck className="h-4 w-4 text-slate-400" strokeWidth={2} />
              Your data is secure with end-to-end encryption
            </p>
          </div>
        </div>
      </div>

      {/* ── Trust bar ──────────────────────────────────────────────────── */}
      <div className="w-full mt-6 border-t border-slate-200 pt-8">
        <div className="grid grid-cols-2 sm:grid-cols-4">
          {TRUST_ITEMS.map(({ icon: Icon, top, bottom }, i) => (
            <div
              key={top + bottom}
              className={`flex items-center justify-center gap-3 py-2 ${
                i > 0 ? "sm:border-l sm:border-slate-300/70" : ""
              }`}
            >
              <Icon className="h-6 w-6 text-slate-600" strokeWidth={1.8} />
              <div className="text-[12px] leading-tight text-slate-600 font-medium">
                {top}
                <br />
                {bottom}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Copyright ──────────────────────────────────────────────────── */}
      <p className="mt-8 pb-4 text-center text-[12px] text-slate-500">
        Copyright © {new Date().getFullYear()}.{" "}
        <span className="font-semibold text-[#DC2626]">Luxor PDF.</span>{" "}
        All rights reserved
      </p>
    </div>
  );
}
