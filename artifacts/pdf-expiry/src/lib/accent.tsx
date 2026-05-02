import { createContext, useContext, type ReactNode } from "react";

export type AccentMode =
  | "purple"
  | "blue"
  | "green"
  | "red"
  | "orange"
  | "yellow"
  | "default";

export const AccentContext = createContext<AccentMode>("default");

type AccentPalette = {
  btnClass: string;
  innerBanner: {
    wrap: string;
    iconWrap: string;
    titleClass: string;
    descClass: string;
    trigger: string;
    tabsListBg: string;
  };
  drop: {
    drag: string;
    idle: string;
    iconBg: string;
    label: string;
    hint: string;
  };
};

const PALETTES: Record<Exclude<AccentMode, "default">, AccentPalette> = {
  purple: {
    btnClass:
      "from-[#7254F6] to-[#5E43D4] hover:from-[#6549E0] hover:to-[#4F36C2]",
    innerBanner: {
      wrap: "bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100",
      iconWrap: "bg-gradient-to-br from-[#7254F6] to-[#5E43D4]",
      titleClass: "text-[#5E43D4]",
      descClass: "text-[#7254F6]",
      trigger: "data-[state=active]:bg-[#7254F6]",
      tabsListBg: "bg-violet-50 border border-violet-100",
    },
    drop: {
      drag: "border-[#7254F6] bg-violet-50 scale-[1.01]",
      idle: "border-violet-200 hover:border-[#7254F6] hover:bg-violet-50/60 bg-gradient-to-br from-violet-50/50 to-indigo-50/30",
      iconBg: "bg-gradient-to-br from-[#7254F6] to-[#5E43D4]",
      label: "text-[#5E43D4]",
      hint: "text-[#7254F6]",
    },
  },
  blue: {
    btnClass:
      "from-[#1754F4] to-[#1447D0] hover:from-[#154EE2] hover:to-[#103EB8]",
    innerBanner: {
      wrap: "bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100",
      iconWrap: "bg-gradient-to-br from-[#1754F4] to-[#1447D0]",
      titleClass: "text-[#1447D0]",
      descClass: "text-[#1754F4]",
      trigger: "data-[state=active]:bg-[#1754F4]",
      tabsListBg: "bg-blue-50 border border-blue-100",
    },
    drop: {
      drag: "border-[#1754F4] bg-blue-50 scale-[1.01]",
      idle: "border-blue-200 hover:border-[#1754F4] hover:bg-blue-50/60 bg-gradient-to-br from-blue-50/50 to-indigo-50/30",
      iconBg: "bg-gradient-to-br from-[#1754F4] to-[#1447D0]",
      label: "text-[#1447D0]",
      hint: "text-[#1754F4]",
    },
  },
  green: {
    btnClass:
      "from-[#32AD71] to-[#2A9460] hover:from-[#2EA068] hover:to-[#258052]",
    innerBanner: {
      wrap: "bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100",
      iconWrap: "bg-gradient-to-br from-[#32AD71] to-[#2A9460]",
      titleClass: "text-[#2A9460]",
      descClass: "text-[#32AD71]",
      trigger: "data-[state=active]:bg-[#32AD71]",
      tabsListBg: "bg-emerald-50 border border-emerald-100",
    },
    drop: {
      drag: "border-[#32AD71] bg-emerald-50 scale-[1.01]",
      idle: "border-emerald-200 hover:border-[#32AD71] hover:bg-emerald-50/60 bg-gradient-to-br from-emerald-50/50 to-green-50/30",
      iconBg: "bg-gradient-to-br from-[#32AD71] to-[#2A9460]",
      label: "text-[#2A9460]",
      hint: "text-[#32AD71]",
    },
  },
  red: {
    btnClass:
      "from-[#E61E3C] to-[#C81934] hover:from-[#D71B37] hover:to-[#B0142D]",
    innerBanner: {
      wrap: "bg-gradient-to-r from-rose-50 to-red-50 border border-rose-100",
      iconWrap: "bg-gradient-to-br from-[#E61E3C] to-[#C81934]",
      titleClass: "text-[#C81934]",
      descClass: "text-[#E61E3C]",
      trigger: "data-[state=active]:bg-[#E61E3C]",
      tabsListBg: "bg-rose-50 border border-rose-100",
    },
    drop: {
      drag: "border-[#E61E3C] bg-rose-50 scale-[1.01]",
      idle: "border-rose-200 hover:border-[#E61E3C] hover:bg-rose-50/60 bg-gradient-to-br from-rose-50/50 to-red-50/30",
      iconBg: "bg-gradient-to-br from-[#E61E3C] to-[#C81934]",
      label: "text-[#C81934]",
      hint: "text-[#E61E3C]",
    },
  },
  orange: {
    btnClass:
      "from-[#F37311] to-[#D4640C] hover:from-[#E26A0F] hover:to-[#B5560B]",
    innerBanner: {
      wrap: "bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100",
      iconWrap: "bg-gradient-to-br from-[#F37311] to-[#D4640C]",
      titleClass: "text-[#D4640C]",
      descClass: "text-[#F37311]",
      trigger: "data-[state=active]:bg-[#F37311]",
      tabsListBg: "bg-orange-50 border border-orange-100",
    },
    drop: {
      drag: "border-[#F37311] bg-orange-50 scale-[1.01]",
      idle: "border-orange-200 hover:border-[#F37311] hover:bg-orange-50/60 bg-gradient-to-br from-orange-50/50 to-amber-50/30",
      iconBg: "bg-gradient-to-br from-[#F37311] to-[#D4640C]",
      label: "text-[#D4640C]",
      hint: "text-[#F37311]",
    },
  },
  yellow: {
    btnClass:
      "from-[#F4B711] to-[#D49E0E] hover:from-[#E5AB10] hover:to-[#B8870C]",
    innerBanner: {
      wrap: "bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-100",
      iconWrap: "bg-gradient-to-br from-[#F4B711] to-[#D49E0E]",
      titleClass: "text-[#D49E0E]",
      descClass: "text-[#F4B711]",
      trigger: "data-[state=active]:bg-[#F4B711]",
      tabsListBg: "bg-yellow-50 border border-yellow-100",
    },
    drop: {
      drag: "border-[#F4B711] bg-yellow-50 scale-[1.01]",
      idle: "border-yellow-200 hover:border-[#F4B711] hover:bg-yellow-50/60 bg-gradient-to-br from-yellow-50/50 to-amber-50/30",
      iconBg: "bg-gradient-to-br from-[#F4B711] to-[#D49E0E]",
      label: "text-[#D49E0E]",
      hint: "text-[#F4B711]",
    },
  },
};

export function useAccent(): AccentMode {
  return useContext(AccentContext);
}

export function useAccentBtn(fallback: string): string {
  const accent = useContext(AccentContext);
  if (accent === "default") return fallback;
  return PALETTES[accent].btnClass;
}

export function useAccentInnerBanner() {
  const accent = useContext(AccentContext);
  if (accent === "default") return null;
  return PALETTES[accent].innerBanner;
}

export function useAccentDrop() {
  const accent = useContext(AccentContext);
  if (accent === "default") return null;
  return PALETTES[accent].drop;
}

export function AccentProvider({
  value,
  children,
}: {
  value: AccentMode;
  children: ReactNode;
}) {
  return (
    <AccentContext.Provider value={value}>{children}</AccentContext.Provider>
  );
}
