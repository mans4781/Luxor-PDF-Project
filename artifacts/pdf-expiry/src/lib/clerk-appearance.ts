import { shadcn } from "@clerk/themes";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${typeof window !== "undefined" ? window.location.origin : ""}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#1e3a8a",
    colorForeground: "#0f172a",
    colorMutedForeground: "#64748b",
    colorDanger: "#DC2626",
    colorBackground: "#ffffff",
    colorInput: "#ffffff",
    colorInputForeground: "#0f172a",
    colorNeutral: "#cbd5e1",
    fontFamily: "Inter, system-ui, sans-serif",
    borderRadius: "0.625rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox:
      "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-slate-200",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer:
      "!shadow-none !border-0 !bg-slate-50 !rounded-none border-t border-slate-200",
    headerTitle: "text-slate-900 font-extrabold",
    headerSubtitle: "text-slate-600",
    socialButtonsBlockButton:
      "border border-slate-300 hover:bg-slate-50 transition-colors",
    socialButtonsBlockButtonText: "text-slate-800 font-semibold",
    formFieldLabel: "text-slate-700 font-semibold",
    formFieldInput:
      "border border-slate-300 focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a]/20",
    formButtonPrimary:
      "bg-[#1e3a8a] hover:bg-[#312E81] text-white font-semibold shadow-sm",
    footerAction: "bg-transparent",
    footerActionLink: "text-[#1e3a8a] hover:text-[#312E81] font-semibold",
    footerActionText: "text-slate-600",
    dividerText: "text-slate-500",
    dividerLine: "bg-slate-200",
    identityPreviewEditButton: "text-[#1e3a8a]",
    formFieldSuccessText: "text-emerald-600",
    alert: "border border-rose-200 bg-rose-50",
    alertText: "text-rose-700",
    otpCodeFieldInput: "border border-slate-300",
    formFieldRow: "gap-2",
    main: "gap-4",
    logoBox: "flex justify-center mb-2",
    logoImage: "h-10 w-auto",
  },
};

export const clerkLocalization = {
  signIn: {
    start: {
      title: "Welcome back",
      subtitle: "Sign in to your Luxor PDF account",
    },
  },
  signUp: {
    start: {
      title: "Create your Luxor PDF account",
      subtitle: "Unlock secure PDF tools and account features",
    },
  },
};
