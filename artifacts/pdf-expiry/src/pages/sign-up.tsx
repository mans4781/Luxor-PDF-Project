import { FormEvent, useEffect, useState } from "react";
import { HandleSSOCallback, useAuth, useSignUp } from "@clerk/react";
import { Link, useLocation } from "wouter";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  PenLine,
  PenSquare,
  Repeat,
  ShieldCheck,
  User,
} from "lucide-react";

import { basePath } from "@/lib/base-path";
import { authRedirectTarget } from "@/lib/auth-redirect";
import {
  AppleIcon,
  AuthFooter,
  DocIllustration,
  DotGrid,
  GoogleIcon,
  LuxorLogoLockup,
  MicrosoftIcon,
  authButtonClass,
  authInputClass,
  socialButtonClass,
} from "@/components/auth-visuals";

const FEATURES = [
  { icon: Eye, label: "Read and annotate PDFs" },
  { icon: PenSquare, label: "Edit text, images, and pages" },
  { icon: Repeat, label: "Convert PDFs to multiple formats" },
  { icon: ShieldCheck, label: "Protect and secure your documents" },
  { icon: PenLine, label: "eSign and manage signatures" },
];

function splitFullName(fullName: string): { firstName: string; lastName?: string } {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ") || undefined;
  return { firstName, lastName };
}

export default function SignUpPage() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  const isSsoCallback =
    typeof window !== "undefined" &&
    window.location.pathname.includes("/sign-up/sso-callback");

  // Already signed in in this browser (e.g. the desktop-app handoff opened
  // this page in a session that has an account) — skip the form and go
  // straight to the redirect target so the flow can complete.
  useEffect(() => {
    if (isSsoCallback) return;
    if (authLoaded && isSignedIn) {
      window.location.replace(authRedirectTarget());
    }
  }, [authLoaded, isSignedIn, isSsoCallback]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [productUpdates, setProductUpdates] = useState(false);
  const [code, setCode] = useState("");
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const busy = fetchStatus === "fetching";

  const finishSignUp = async () => {
    await signUp.finalize({
      navigate: ({ decorateUrl }) => {
        window.location.href = decorateUrl(authRedirectTarget());
      },
    });
  };

  const validateCommon = (): boolean => {
    if (!agreeTerms) {
      setLocalError("Please agree to the Terms of Use and Privacy Policy to continue.");
      return false;
    }
    return true;
  };

  const afterCreateOrPassword = async () => {
    if (signUp.status === "complete") {
      await finishSignUp();
      return;
    }
    const { error } = await signUp.verifications.sendEmailCode();
    if (!error) {
      setCode("");
      setAwaitingCode(true);
    }
  };

  const handleEmailSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!validateCommon()) return;
    if (password !== confirmPassword) {
      setLocalError("Passwords don't match. Please re-enter them.");
      return;
    }
    const { firstName, lastName } = splitFullName(fullName);
    const { error } = await signUp.password({
      emailAddress: email,
      password,
      firstName,
      lastName,
      legalAccepted: true,
      unsafeMetadata: { productUpdates },
    });
    if (error) return;
    await afterCreateOrPassword();
  };

  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const { error } = await signUp.verifications.verifyEmailCode({ code });
    if (error) return;
    if (signUp.status === "complete") {
      await finishSignUp();
    }
  };

  const handleSocial = async (
    strategy: "oauth_google" | "oauth_microsoft" | "oauth_apple",
  ) => {
    setLocalError(null);
    const target = authRedirectTarget();
    const { error } = await signUp.sso({
      strategy,
      redirectUrl: `${window.location.origin}${target}`,
      redirectCallbackUrl: `${window.location.origin}${basePath}/sign-up/sso-callback?redirect_url=${encodeURIComponent(target)}`,
    });
    if (error) {
      setLocalError(
        "This sign-up provider isn't available right now. Please try another option.",
      );
    }
  };

  if (isSsoCallback) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#fafafc]">
        <HandleSSOCallback
          navigateToApp={({ decorateUrl }) => {
            window.location.href = decorateUrl(authRedirectTarget());
          }}
          navigateToSignIn={() => setLocation("/sign-in")}
          navigateToSignUp={() => setLocation("/sign-up")}
        />
        <p className="text-sm text-slate-500">Completing sign-up…</p>
      </div>
    );
  }

  const globalError =
    localError ?? errors.global?.[0]?.message ?? errors.fields.captcha?.message ?? null;

  const fieldError = (
    key: "firstName" | "lastName" | "emailAddress" | "password" | "code" | "legalAccepted",
  ) => errors.fields[key]?.message ?? null;

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

        <div className="relative grid lg:grid-cols-[1fr_1.15fr] gap-10 px-8 sm:px-12 py-10 lg:py-12">
          {/* ── Left: brand pitch ─────────────────────────────────────── */}
          <div>
            <LuxorLogoLockup />

            <h1 className="mt-10 text-[34px] leading-[1.15] font-extrabold tracking-tight text-slate-900">
              Create your
              <br />
              Luxor <span className="text-[#DC2626]">PDF</span>
            </h1>
            <p className="mt-4 max-w-[300px] text-[14px] leading-relaxed text-slate-500">
              Create an account to read, edit, convert, protect, and eSign your
              PDFs with ease.
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

          {/* ── Right: sign-up card ───────────────────────────────────── */}
          <div className="rounded-3xl bg-white border border-slate-100 shadow-xl shadow-slate-200/60 px-7 sm:px-10 py-9 self-start w-full">
            <h2 className="text-center text-[22px] font-extrabold tracking-tight text-slate-900">
              Create your account
            </h2>
            <p className="mt-2 text-center text-[13px] text-slate-500">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="font-semibold text-[#DC2626] hover:text-[#B91C1C] transition-colors"
                data-testid="link-log-in"
              >
                Log In
              </Link>
            </p>

            {globalError && (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-700">
                {globalError}
              </div>
            )}

            {/* ── Verification code step (both tabs) ── */}
            {awaitingCode ? (
              <form onSubmit={handleVerifyCode} className="mt-6">
                <p className="text-[13px] text-slate-500">
                  We sent a verification code to{" "}
                  <span className="font-semibold text-slate-700">{email}</span>.
                </p>
                <label className="mt-4 block text-[13px] font-semibold text-slate-700 mb-1.5">
                  Verification Code
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    inputMode="numeric"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter the 6-digit code"
                    className={authInputClass}
                    data-testid="input-verify-code"
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
                  className={authButtonClass}
                  data-testid="button-verify-code"
                >
                  Verify &amp; Create Account
                  <ArrowRight className="absolute right-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2" />
                </button>
                <div className="mt-3 flex items-center justify-between text-[13px] font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setAwaitingCode(false);
                      setCode("");
                    }}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    Go back
                  </button>
                  <button
                    type="button"
                    onClick={() => void signUp.verifications.sendEmailCode()}
                    className="text-[#DC2626] hover:text-[#B91C1C]"
                    data-testid="button-resend-code"
                  >
                    Resend code
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleEmailSignUp} className="mt-6">
                <label className="block text-[13px] font-semibold text-slate-700 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    autoComplete="name"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className={authInputClass}
                    data-testid="input-full-name"
                  />
                </div>
                {(fieldError("firstName") ?? fieldError("lastName")) && (
                  <p className="mt-1.5 text-[12px] text-rose-600">
                    {fieldError("firstName") ?? fieldError("lastName")}
                  </p>
                )}

                <label className="mt-4 block text-[13px] font-semibold text-slate-700 mb-1.5">
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
                    className={authInputClass}
                    data-testid="input-email"
                  />
                </div>
                {fieldError("emailAddress") && (
                  <p className="mt-1.5 text-[12px] text-rose-600">
                    {fieldError("emailAddress")}
                  </p>
                )}

                <label className="mt-4 block text-[13px] font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className={authInputClass}
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

                <label className="mt-4 block text-[13px] font-semibold text-slate-700 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className={authInputClass}
                    data-testid="input-confirm-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <label className="mt-5 flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#DC2626]"
                    data-testid="checkbox-terms"
                  />
                  <span className="text-[13px] font-medium text-slate-700">
                    I agree to the{" "}
                    <a
                      href="/terms"
                      className="font-semibold text-[#DC2626] hover:text-[#B91C1C]"
                    >
                      Terms of Use
                    </a>{" "}
                    and{" "}
                    <a
                      href="/privacy"
                      className="font-semibold text-[#DC2626] hover:text-[#B91C1C]"
                    >
                      Privacy Policy
                    </a>
                  </span>
                </label>
                <label className="mt-3 flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={productUpdates}
                    onChange={(e) => setProductUpdates(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#DC2626]"
                    data-testid="checkbox-updates"
                  />
                  <span className="text-[13px] font-medium text-slate-700">
                    Send me product updates and offers
                  </span>
                </label>

                {/* Clerk smart CAPTCHA mounts here when required */}
                <div id="clerk-captcha" className="mt-4 empty:mt-0" />

                <button
                  type="submit"
                  disabled={busy}
                  className={authButtonClass}
                  data-testid="button-create-account"
                >
                  Create Account
                  <ArrowRight className="absolute right-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2" />
                </button>
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
                className={socialButtonClass}
                data-testid="button-google-signup"
              >
                <GoogleIcon />
                Google
              </button>
              <button
                type="button"
                onClick={() => handleSocial("oauth_microsoft")}
                disabled={busy}
                className={socialButtonClass}
                data-testid="button-microsoft-signup"
              >
                <MicrosoftIcon />
                Microsoft
              </button>
              <button
                type="button"
                onClick={() => handleSocial("oauth_apple")}
                disabled={busy}
                className={socialButtonClass}
                data-testid="button-apple-signup"
              >
                <AppleIcon />
                Apple
              </button>
            </div>

            <p
              className="mt-3 text-center text-[12px] text-slate-400"
              data-testid="text-social-coming-soon"
            >
              Social sign-up is coming soon — please use email for now.
            </p>

            {/* Security note */}
            <p className="mt-7 flex items-center justify-center gap-2 text-[12px] text-slate-500">
              <ShieldCheck className="h-4 w-4 text-slate-400" strokeWidth={2} />
              Your data is protected with secure encryption
            </p>
          </div>
        </div>
      </div>

      <AuthFooter trustFirst={{ top: "Trusted by", bottom: "professionals" }} />
    </div>
  );
}
