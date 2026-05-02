import { useEffect, useRef, useState } from "react";
import { useRoute } from "wouter";
import {
  Loader2,
  ShieldOff,
  AlertTriangle,
  Clock,
  FileText,
  ShieldCheck,
} from "lucide-react";

type ViewerState =
  | { kind: "loading" }
  | { kind: "active"; blobUrl: string; expiryMs: number; name: string }
  | { kind: "expired"; name: string | null }
  | { kind: "notfound" }
  | { kind: "forbidden" }
  | { kind: "error"; message: string };

const POLL_INTERVAL_MS = 30_000;

function formatRemaining(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86_400);
  const hours = Math.floor((totalSec % 86_400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${String(mins).padStart(2, "0")}m`;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function PdfViewer() {
  const [, params] = useRoute("/v/:id");
  const idRaw = params?.id;
  const id = idRaw ? parseInt(idRaw, 10) : NaN;
  const token =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("token") ?? ""
      : "";

  const [state, setState] = useState<ViewerState>({ kind: "loading" });
  const [now, setNow] = useState(() => Date.now());
  const blobUrlRef = useRef<string | null>(null);

  // ── Initial load: fetch metadata, then the PDF blob ─────────────────────────
  useEffect(() => {
    let cancelled = false;

    if (Number.isNaN(id) || !token) {
      setState({ kind: "error", message: "Missing or invalid share link." });
      return;
    }

    (async () => {
      try {
        const metaRes = await fetch(
          `/api/pdfs/${id}?shareToken=${encodeURIComponent(token)}`,
        );
        if (cancelled) return;

        if (metaRes.status === 404) {
          setState({ kind: "notfound" });
          return;
        }
        if (metaRes.status === 403) {
          setState({ kind: "forbidden" });
          return;
        }
        if (!metaRes.ok) {
          setState({
            kind: "error",
            message: `Server returned ${metaRes.status}.`,
          });
          return;
        }

        const meta = (await metaRes.json()) as {
          originalName: string;
          expiryDate: string;
          isExpired: boolean;
        };
        const expiryMs = new Date(meta.expiryDate).getTime();

        if (meta.isExpired || expiryMs <= Date.now()) {
          setState({ kind: "expired", name: meta.originalName });
          return;
        }

        const fileRes = await fetch(
          `/api/pdfs/${id}/download?shareToken=${encodeURIComponent(token)}`,
        );
        if (cancelled) return;

        if (fileRes.status === 410) {
          setState({ kind: "expired", name: meta.originalName });
          return;
        }
        if (!fileRes.ok) {
          setState({
            kind: "error",
            message: `Could not load PDF (${fileRes.status}).`,
          });
          return;
        }

        const blob = await fileRes.blob();
        if (cancelled) return;

        // The blob fetch can take a few seconds; re-check expiry so we never
        // briefly show a PDF whose timer crossed zero while it was loading.
        if (Date.now() >= expiryMs) {
          setState({ kind: "expired", name: meta.originalName });
          return;
        }

        const url = URL.createObjectURL(blob);
        blobUrlRef.current = url;
        setState({
          kind: "active",
          blobUrl: url,
          expiryMs,
          name: meta.originalName,
        });
      } catch {
        if (!cancelled) {
          setState({
            kind: "error",
            message: "Network error while loading the PDF.",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, token]);

  // ── Always revoke the blob URL on unmount ───────────────────────────────────
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  // ── Tick once per second to drive the countdown and expiry trigger ──────────
  useEffect(() => {
    if (state.kind !== "active") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [state.kind]);

  // ── When the timer crosses the expiry, blank the viewer ─────────────────────
  useEffect(() => {
    if (state.kind === "active" && now >= state.expiryMs) {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      setState({ kind: "expired", name: state.name });
    }
  }, [now, state]);

  // ── Periodically re-check the server in case the file was revoked early ─────
  useEffect(() => {
    if (state.kind !== "active") return;
    const handle = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/pdfs/${id}?shareToken=${encodeURIComponent(token)}`,
        );
        if (!res.ok) return;
        const meta = (await res.json()) as { isExpired: boolean };
        if (meta.isExpired) {
          if (blobUrlRef.current) {
            URL.revokeObjectURL(blobUrlRef.current);
            blobUrlRef.current = null;
          }
          setState((prev) =>
            prev.kind === "active"
              ? { kind: "expired", name: prev.name }
              : prev,
          );
        }
      } catch {
        // network blip — ignore, the local timer still enforces expiry.
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(handle);
  }, [state.kind, id, token]);

  // ── Render ──────────────────────────────────────────────────────────────────
  if (state.kind === "loading") {
    return (
      <CenteredCard
        icon={<Loader2 className="w-8 h-8 text-slate-500 animate-spin" />}
        title="Loading secured PDF…"
        subtitle="Verifying the share link with LexSecure."
      />
    );
  }

  if (state.kind === "notfound") {
    return (
      <CenteredCard
        icon={<AlertTriangle className="w-8 h-8 text-amber-500" />}
        title="Link not found"
        subtitle="This share link does not exist or has been deleted."
      />
    );
  }

  if (state.kind === "forbidden") {
    return (
      <CenteredCard
        icon={<ShieldOff className="w-8 h-8 text-rose-500" />}
        title="Access denied"
        subtitle="This share link is invalid for the requested document."
      />
    );
  }

  if (state.kind === "error") {
    return (
      <CenteredCard
        icon={<AlertTriangle className="w-8 h-8 text-rose-500" />}
        title="Couldn't open this PDF"
        subtitle={state.message}
      />
    );
  }

  if (state.kind === "expired") {
    return (
      <CenteredCard
        icon={<ShieldOff className="w-8 h-8 text-white" />}
        iconWrap="bg-gradient-to-br from-red-500 to-rose-600 shadow-lg"
        title="This PDF has expired"
        subtitle={
          state.name
            ? `Access to “${state.name}” was revoked by its owner.`
            : "Access to this document has been revoked by its owner."
        }
        accent="rose"
      />
    );
  }

  // active
  const remainingMs = state.expiryMs - now;
  const isUrgent = remainingMs < 60_000;
  return (
    <div className="fixed inset-0 flex flex-col bg-slate-100">
      <header className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-800 truncate">
              {state.name}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-1">
              <FileText className="w-3 h-3" /> Secured by LexSecure
            </div>
          </div>
        </div>
        <div
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${
            isUrgent
              ? "bg-red-50 border-red-200 text-red-700 animate-pulse"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
          title="Time left until this document self-locks"
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{formatRemaining(remainingMs)}</span>
        </div>
      </header>
      <iframe
        title={state.name}
        src={state.blobUrl}
        className="flex-1 w-full bg-white"
      />
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function CenteredCard({
  icon,
  title,
  subtitle,
  iconWrap = "bg-slate-100",
  accent = "slate",
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  iconWrap?: string;
  accent?: "slate" | "rose";
}) {
  const card =
    accent === "rose"
      ? "bg-white border border-rose-200 shadow-xl"
      : "bg-white border border-slate-200 shadow-md";
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4">
      <div className={`max-w-sm w-full rounded-3xl p-8 text-center ${card}`}>
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${iconWrap}`}
        >
          {icon}
        </div>
        <h1 className="text-lg font-bold text-slate-900 mb-1.5">{title}</h1>
        <p className="text-sm text-slate-600 leading-relaxed">{subtitle}</p>
        <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400">
          Powered by LexSecure
        </div>
      </div>
    </div>
  );
}
