import { FormEvent, useState } from "react";
import { HandleSSOCallback, useSignIn } from "@clerk/react";
import { Link, useLocation } from "wouter";
import {
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
  Undo2,
  Users,
} from "lucide-react";

import { basePath } from "@/lib/base-path";

const baseUrl = import.meta.env.BASE_URL;

/* ─── Small brand SVGs for the social buttons ────────────────────────── */

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v2.98h3.87c2.26-2.09 3.55-5.17 3.55-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.94-2.93l-3.87-2.98c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.07A11.99 11.99 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29A7.19 7.19 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.64H1.29a11.97 11.97 0 0 0 0 10.72l3.98-3.07z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.64l3.98 3.07C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" aria-hidden="true">
      <rect x="1" y="1" width="10.5" height="10.5" fill="#F25022" />
      <rect x="12.5" y="1" width="10.5" height="10.5" fill="#7FBA00" />
      <rect x="1" y="12.5" width="10.5" height="10.5" fill="#00A4EF" />
      <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" aria-hidden="true">
      <path
        fill="#111111"
        d="M17.05 12.54c-.03-2.89 2.36-4.27 2.47-4.34-1.35-1.97-3.44-2.24-4.18-2.27-1.78-.18-3.47 1.05-4.37 1.05-.9 0-2.29-1.02-3.77-1-1.94.03-3.72 1.13-4.72 2.86-2.01 3.49-.51 8.66 1.45 11.49.96 1.39 2.1 2.94 3.6 2.88 1.44-.06 1.99-.93 3.73-.93s2.23.93 3.76.9c1.55-.03 2.53-1.41 3.48-2.8 1.1-1.61 1.55-3.17 1.58-3.25-.04-.02-3.02-1.16-3.03-4.59zM14.16 4.06c.8-.97 1.33-2.31 1.19-3.65-1.15.05-2.53.76-3.36 1.73-.73.85-1.38 2.22-1.2 3.53 1.27.1 2.58-.65 3.37-1.61z"
      />
    </svg>
  );
}

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

type Tab = "email" | "otp";
type View = "login" | "forgot-code" | "forgot-password";

const inputBase =
  "w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-[14px] text-slate-800 placeholder:text-slate-400 outline-none transition-colors focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/15";

export default function SignInPage() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const [, setLocation] = useLocation();
  const isSsoCallback =
    typeof window !== "undefined" &&
    window.location.pathname.includes("/sign-in/sso-callback");

  const [tab, setTab] = useState<Tab>("email");
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const busy = fetchStatus === "fetching";

  const finishSignIn = async () => {
    await signIn.finalize({
      navigate: ({ decorateUrl }) => {
        window.location.href = decorateUrl(basePath || "/");
      },
    });
  };

  const switchTab = (next: Tab) => {
    if (next === tab) return;
    setTab(next);
    setView("login");
    setCode("");
    setOtpSent(false);
    setLocalError(null);
    void signIn.reset();
  };

  const handlePasswordLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const { error } = await signIn.password({ emailAddress: email, password });
    if (error) return;
    if (signIn.status === "complete") {
      await finishSignIn();
    } else {
      setLocalError("Additional verification is required for this account.");
    }
  };

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const { error } = await signIn.emailCode.sendCode({ emailAddress: email });
    if (!error) setOtpSent(true);
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const { error } = await signIn.emailCode.verifyCode({ code });
    if (error) return;
    if (signIn.status === "complete") {
      await finishSignIn();
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

  const handleSocial = async (
    strategy: "oauth_google" | "oauth_microsoft" | "oauth_apple",
  ) => {
    setLocalError(null);
    const { error } = await signIn.sso({
      strategy,
      redirectUrl: `${window.location.origin}${basePath || "/"}`,
      redirectCallbackUrl: `${window.location.origin}${basePath}/sign-in/sso-callback`,
    });
    if (error) {
      setLocalError(
        "This sign-in provider isn't available right now. Please try another option.",
      );
    }
  };

  if (isSsoCallback) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#eef0f4]">
        <HandleSSOCallback
          navigateToApp={({ decorateUrl }) => {
            window.location.href = decorateUrl(basePath || "/");
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
    <div className="min-h-[100dvh] bg-[#eef0f4] px-4 py-6 sm:px-8">
      {/* Back to home */}
      <div className="mx-auto max-w-[1080px] mb-3">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-[#DC2626] transition-colors"
          data-testid="link-back-home"
        >
          <Undo2 className="w-4 h-4" strokeWidth={2.2} />
          Back to Home
        </a>
      </div>

      {/* ── Main rounded panel ─────────────────────────────────────────── */}
      <div className="relative mx-auto max-w-[1080px] overflow-hidden rounded-[28px] bg-[#fafafc] shadow-xl shadow-slate-300/40 border border-white">
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

        <div className="relative grid lg:grid-cols-[1fr_1.15fr] gap-10 px-8 sm:px-12 py-10 lg:py-12">
          {/* ── Left: brand pitch ─────────────────────────────────────── */}
          <div>
            <div className="flex items-center gap-2.5">
              <img
                src={`${baseUrl}brand/luxor-icon.png?v=20260712`}
                alt="Luxor PDF"
                width={44}
                height={44}
                draggable={false}
                className="h-11 w-11 rounded-xl select-none"
              />
              <div className="leading-none">
                <div className="text-[22px] font-extrabold tracking-tight text-slate-900">
                  LUXOR
                </div>
                <div className="mt-0.5 text-[12px] font-extrabold tracking-[0.22em] text-[#DC2626] border-b-2 border-[#DC2626] pb-0.5 inline-block">
                  PDF
                </div>
              </div>
            </div>

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
          <div className="rounded-3xl bg-white border border-slate-100 shadow-xl shadow-slate-200/60 px-7 sm:px-10 py-9 self-start w-full">
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

            {/* Tabs */}
            <div className="mt-6 grid grid-cols-2 text-center text-[14px] font-semibold">
              <button
                type="button"
                onClick={() => switchTab("email")}
                className={`pb-2.5 border-b-2 transition-colors ${
                  tab === "email"
                    ? "border-[#DC2626] text-[#DC2626]"
                    : "border-slate-200 text-slate-500 hover:text-slate-700"
                }`}
                data-testid="tab-email-login"
              >
                Email Login
              </button>
              <button
                type="button"
                onClick={() => switchTab("otp")}
                className={`pb-2.5 border-b-2 transition-colors ${
                  tab === "otp"
                    ? "border-[#DC2626] text-[#DC2626]"
                    : "border-slate-200 text-slate-500 hover:text-slate-700"
                }`}
                data-testid="tab-otp-login"
              >
                OTP Login
              </button>
            </div>

            {globalError && (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
                {globalError}
              </div>
            )}

            {/* ── Email + password ── */}
            {tab === "email" && view === "login" && (
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

            {/* ── Forgot password: code step ── */}
            {tab === "email" && view === "forgot-code" && (
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
            {tab === "email" && view === "forgot-password" && (
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

            {/* ── OTP login ── */}
            {tab === "otp" && !otpSent && (
              <form onSubmit={handleSendOtp} className="mt-6">
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
                    data-testid="input-otp-email"
                  />
                </div>
                {fieldError("identifier") && (
                  <p className="mt-1.5 text-[12px] text-rose-600">
                    {fieldError("identifier")}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={busy}
                  className="relative mt-6 w-full rounded-xl bg-gradient-to-r from-[#EF4444] to-[#B91C1C] py-3 text-[15px] font-bold text-white shadow-lg shadow-rose-300/50 transition-all hover:from-[#DC2626] hover:to-[#991B1B] disabled:opacity-60"
                  data-testid="button-send-otp"
                >
                  Send One-Time Code
                  <ArrowRight className="absolute right-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2" />
                </button>
              </form>
            )}

            {tab === "otp" && otpSent && (
              <form onSubmit={handleVerifyOtp} className="mt-6">
                <p className="text-[13px] text-slate-500">
                  We sent a one-time code to{" "}
                  <span className="font-semibold text-slate-700">{email}</span>.
                </p>
                <label className="mt-4 block text-[13px] font-semibold text-slate-700 mb-1.5">
                  One-Time Code
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    inputMode="numeric"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter the 6-digit code"
                    className={inputBase}
                    data-testid="input-otp-code"
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
                  className="relative mt-6 w-full rounded-xl bg-gradient-to-r from-[#EF4444] to-[#B91C1C] py-3 text-[15px] font-bold text-white shadow-lg shadow-rose-300/50 transition-all hover:from-[#DC2626] hover:to-[#991B1B] disabled:opacity-60"
                  data-testid="button-verify-otp"
                >
                  Log In
                  <ArrowRight className="absolute right-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2" />
                </button>
                <div className="mt-3 flex items-center justify-between text-[13px] font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setCode("");
                      void signIn.reset();
                    }}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    Use a different email
                  </button>
                  <button
                    type="button"
                    onClick={() => void signIn.emailCode.sendCode({ emailAddress: email })}
                    className="text-[#DC2626] hover:text-[#B91C1C]"
                    data-testid="button-resend-otp"
                  >
                    Resend code
                  </button>
                </div>
              </form>
            )}

            {/* Divider */}
            <div className="mt-7 flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-[12px] text-slate-400">or continue with</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Social buttons */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleSocial("oauth_google")}
                disabled={busy}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-[13px] font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:border-slate-300 disabled:opacity-60"
                data-testid="button-google-login"
              >
                <GoogleIcon />
                Google
              </button>
              <button
                type="button"
                onClick={() => handleSocial("oauth_microsoft")}
                disabled={busy}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-[13px] font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:border-slate-300 disabled:opacity-60"
                data-testid="button-microsoft-login"
              >
                <MicrosoftIcon />
                Microsoft
              </button>
              <button
                type="button"
                onClick={() => handleSocial("oauth_apple")}
                disabled={busy}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-[13px] font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:border-slate-300 disabled:opacity-60"
                data-testid="button-apple-login"
              >
                <AppleIcon />
                Apple
              </button>
            </div>

            {/* Security note */}
            <p className="mt-7 flex items-center justify-center gap-2 text-[12px] text-slate-500">
              <ShieldCheck className="h-4 w-4 text-slate-400" strokeWidth={2} />
              Your data is secure with end-to-end encryption
            </p>
          </div>
        </div>
      </div>

      {/* ── Trust bar ──────────────────────────────────────────────────── */}
      <div className="mx-auto mt-8 max-w-[900px]">
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
        © {new Date().getFullYear()}{" "}
        <span className="font-semibold text-[#DC2626]">
          Fairnova Labs Private Limited.
        </span>{" "}
        All rights reserved.
      </p>
    </div>
  );
}
