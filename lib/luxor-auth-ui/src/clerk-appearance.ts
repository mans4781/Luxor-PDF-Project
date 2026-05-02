import { shadcn } from "@clerk/themes";

export const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
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
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox:
      "bg-white rounded-2xl w-full max-w-[460px] overflow-hidden shadow-2xl shadow-slate-900/10 border border-slate-200/80",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none !px-8 !pt-7 !pb-6",
    footer:
      "!shadow-none !border-0 !bg-slate-50/80 !rounded-none border-t border-slate-200 !py-4 !px-8",
    headerTitle:
      "text-slate-900 font-extrabold text-[22px] tracking-tight text-center",
    headerSubtitle: "text-slate-500 text-[14px] text-center mt-1",
    socialButtons: "flex flex-col gap-2",
    socialButtonsBlockButton:
      "border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all rounded-xl py-2.5 shadow-sm justify-center",
    socialButtonsBlockButtonText: "text-slate-800 font-semibold text-[14px]",
    socialButtonsProviderIcon: "w-5 h-5",
    formFieldLabel: "text-slate-700 font-semibold text-[13px]",
    formFieldInput:
      "border border-slate-300 focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a]/20 rounded-lg py-2.5",
    formButtonPrimary:
      "!bg-gradient-to-r !from-[#1e3a8a] !to-[#312E81] hover:!from-[#1e40af] hover:!to-[#3730a3] text-white font-semibold shadow-md shadow-indigo-900/20 transition-all rounded-xl py-2.5 text-[14px]",
    footerAction: "bg-transparent",
    footerActionLink:
      "text-[#1e3a8a] hover:text-[#DC2626] font-semibold transition-colors",
    footerActionText: "text-slate-600",
    dividerText:
      "text-slate-400 text-[12px] uppercase tracking-wider font-semibold",
    dividerLine: "bg-slate-200",
    identityPreviewEditButton: "text-[#1e3a8a]",
    formFieldSuccessText: "text-emerald-600",
    alert: "border border-rose-200 bg-rose-50 rounded-lg",
    alertText: "text-rose-700",
    otpCodeFieldInput:
      "border border-slate-300 focus:border-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a]/20 rounded-lg",
    formFieldRow: "gap-2",
    main: "gap-4",
    logoBox: "hidden",
    logoImage: "hidden",
  },
};

export const clerkLocalization = {
  signIn: {
    start: {
      title: "Welcome back",
      subtitle: "Sign in to your Luxor PDF Suite account",
    },
  },
  signUp: {
    start: {
      title: "Create your Luxor PDF Suite account",
      subtitle: "Unlock secure PDF tools and account features",
    },
  },
};
