import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/react";
import { MonitorCheck, ShieldAlert, Loader2 } from "lucide-react";
import { basePath } from "@/lib/base-path";

type Status = "working" | "done" | "error" | "bad-state";

/**
 * Landing page for the desktop browser sign-in handoff.
 *
 * The desktop app opens the system browser at the suite sign-in page with
 * redirect_url pointing here (?state=...). Once Clerk reports the browser
 * session, this page posts the state to the API, which mints a one-time
 * ticket the desktop app is polling for. The user can then close the tab.
 */
export default function DesktopLinkPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [status, setStatus] = useState<Status>("working");
  const postedRef = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;

    const state = new URLSearchParams(window.location.search).get("state");
    if (!state || !/^[a-f0-9]{64}$/.test(state)) {
      setStatus("bad-state");
      return;
    }

    if (!isSignedIn) {
      const here = window.location.href;
      window.location.replace(
        `${basePath}/sign-in?redirect_url=${encodeURIComponent(here)}`,
      );
      return;
    }

    if (postedRef.current) return;
    postedRef.current = true;

    fetch("/api/desktop-auth/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ state }),
    })
      .then((r) => {
        setStatus(r.ok ? "done" : "error");
      })
      .catch(() => setStatus("error"));
  }, [isLoaded, isSignedIn]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
        {status === "working" && (
          <>
            <Loader2 className="w-10 h-10 text-indigo-600 mx-auto mb-4 animate-spin" />
            <h1 className="text-xl font-bold text-slate-900 mb-2">
              Linking your desktop app…
            </h1>
            <p className="text-sm text-slate-500">
              Hang tight — this only takes a moment.
            </p>
          </>
        )}
        {status === "done" && (
          <>
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <MonitorCheck className="w-7 h-7 text-emerald-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">
              You're signed in!
            </h1>
            <p className="text-sm text-slate-500">
              Head back to the Luxor PDF app on your computer — it will finish
              signing you in automatically. You can close this tab.
            </p>
          </>
        )}
        {(status === "error" || status === "bad-state") && (
          <>
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-7 h-7 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">
              {status === "bad-state"
                ? "This link isn't valid"
                : "Something went wrong"}
            </h1>
            <p className="text-sm text-slate-500">
              {status === "bad-state"
                ? "Please start the sign-in again from the Luxor PDF desktop app."
                : "Please go back to the Luxor PDF desktop app and try signing in again."}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
