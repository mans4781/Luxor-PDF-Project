import { useEffect, useState } from "react";
import { isDesktopShell } from "@/lib/desktopBridge";

const SPLASH_KEY = "luxor-pdf:introShown";
const SPLASH_MS = 2600;

export function shouldShowBrandSplash(): boolean {
  if (typeof window === "undefined") return false;
  if (!isDesktopShell()) return false;
  try {
    return localStorage.getItem(SPLASH_KEY) !== "1";
  } catch {
    return false;
  }
}

export default function BrandSplash({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(SPLASH_KEY, "1");
    } catch {
      /* ignore */
    }
    const leaveTimer = window.setTimeout(() => setLeaving(true), SPLASH_MS - 450);
    const doneTimer = window.setTimeout(onDone, SPLASH_MS);
    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className={`luxor-splash${leaving ? " luxor-splash--leave" : ""}`}
      role="presentation"
      onClick={onDone}
    >
      <div className="luxor-splash__glow" aria-hidden="true" />
      <div className="luxor-splash__inner">
        <img
          src={`${import.meta.env.BASE_URL}brand/luxor-icon.png`}
          alt=""
          className="luxor-splash__logo"
          draggable={false}
        />
        <div className="luxor-splash__wordmark">
          <span className="luxor-splash__name">LUXOR&nbsp;PDF</span>
          <span className="luxor-splash__tag">Read. Protect. Perfect.</span>
        </div>
      </div>
    </div>
  );
}
