/**
 * CloudPicker — "add file from cloud drive" button for the free-tool upload
 * boxes. Renders a small cloud icon pinned to the right side of the dropzone;
 * clicking it expands a menu downward listing the supported drives
 * (Google Drive, Dropbox, OneDrive, Zoho WorkDrive). Picking a file uses each
 * provider's official picker popup — the user signs in there if needed — and
 * the chosen file is downloaded straight into the browser and handed to the
 * tool via `onFiles`, exactly like a local upload. Nothing touches our
 * servers.
 *
 * Each provider needs a client-side key (safe to expose) supplied via Vite
 * env vars:
 *   - VITE_GOOGLE_PICKER_API_KEY + VITE_GOOGLE_OAUTH_CLIENT_ID
 *   - VITE_DROPBOX_APP_KEY
 *   - VITE_ONEDRIVE_CLIENT_ID
 *   - VITE_ZOHO_CLIENT_ID (WorkDrive — custom flow, not yet wired)
 * A provider without its key still shows in the menu but explains that the
 * connection isn't set up yet instead of opening a picker.
 */
import { ReactNode, useEffect, useRef, useState } from "react";
import { CloudUpload, Loader2 } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    gapi?: any;
    google?: any;
    Dropbox?: any;
    OneDrive?: any;
  }
}

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_PICKER_API_KEY as string | undefined;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID as string | undefined;
const DROPBOX_APP_KEY = import.meta.env.VITE_DROPBOX_APP_KEY as string | undefined;
const ONEDRIVE_CLIENT_ID = import.meta.env.VITE_ONEDRIVE_CLIENT_ID as string | undefined;
const ZOHO_CLIENT_ID = import.meta.env.VITE_ZOHO_CLIENT_ID as string | undefined;

// ── script loader (each SDK loads lazily, once) ──────────────────────────────
const scriptPromises = new Map<string, Promise<void>>();
function loadScript(src: string, attrs?: Record<string, string>): Promise<void> {
  const existing = scriptPromises.get(src);
  if (existing) return existing;
  const p = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    if (attrs) for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v);
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromises.delete(src);
      reject(new Error(`Failed to load ${src}`));
    };
    document.head.appendChild(s);
  });
  scriptPromises.set(src, p);
  return p;
}

function extMatches(name: string, accept: string): boolean {
  const wanted = accept
    .split(",")
    .map((a) => a.trim().toLowerCase())
    .filter((a) => a.startsWith("."));
  if (wanted.length === 0) return true; // MIME-style accept — let the tool validate
  const lower = name.toLowerCase();
  return wanted.some((w) => lower.endsWith(w));
}

async function downloadToFile(url: string, name: string, headers?: Record<string, string>): Promise<File> {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const blob = await res.blob();
  return new File([blob], name, { type: blob.type || "application/octet-stream" });
}

// ── Google Drive (official Picker + token client) ────────────────────────────
// Least-privilege scope: drive.file only grants access to files the user
// explicitly opens through the Picker (no account-wide read access). The
// token is cached with its expiry so re-picks in the same session skip the
// consent popup; expired/rejected tokens fall back to an interactive prompt.
let googleToken: { token: string; expiresAt: number } | null = null;

async function requestGoogleToken(interactive: boolean): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const tc = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "https://www.googleapis.com/auth/drive.file",
      callback: (resp: any) => {
        if (resp.access_token) {
          googleToken = {
            token: resp.access_token,
            expiresAt: Date.now() + (Number(resp.expires_in) || 3600) * 1000 - 60_000,
          };
          resolve(resp.access_token);
        } else reject(new Error(resp.error || "No access token"));
      },
      error_callback: (err: any) => reject(new Error(err?.message || "Google sign-in was closed")),
    });
    tc.requestAccessToken(interactive ? {} : { prompt: "" });
  });
}

async function getGoogleToken(): Promise<string> {
  if (googleToken && googleToken.expiresAt > Date.now()) return googleToken.token;
  const hadToken = googleToken !== null;
  googleToken = null;
  if (hadToken) {
    // Session previously consented — try a silent refresh, fall back to a prompt.
    try {
      return await requestGoogleToken(false);
    } catch {
      /* fall through to interactive */
    }
  }
  return requestGoogleToken(true);
}

async function pickFromGoogleDrive(accept: string, multiple: boolean): Promise<File[]> {
  await Promise.all([
    loadScript("https://apis.google.com/js/api.js"),
    loadScript("https://accounts.google.com/gsi/client"),
  ]);
  await new Promise<void>((resolve) => window.gapi.load("picker", () => resolve()));
  const token = await getGoogleToken();

  const docs = await new Promise<any[]>((resolve) => {
    // Files only — no folders, and native Google Docs/Sheets/Slides are
    // excluded because they have no binary download (they'd need export).
    const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS);
    view.setIncludeFolders(false);
    view.setSelectFolderEnabled(false);
    const builder = new window.google.picker.PickerBuilder()
      .setDeveloperKey(GOOGLE_API_KEY)
      .setOAuthToken(token)
      .addView(view)
      .setCallback((data: any) => {
        if (data.action === window.google.picker.Action.PICKED) resolve(data.docs ?? []);
        else if (data.action === window.google.picker.Action.CANCEL) resolve([]);
      });
    if (multiple) builder.enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED);
    builder.build().setVisible(true);
  });
  if (docs.length === 0) return [];

  const isNativeDoc = (d: any) =>
    typeof d.mimeType === "string" && d.mimeType.startsWith("application/vnd.google-apps");
  const isFolder = (d: any) => d.mimeType === "application/vnd.google-apps.folder";
  if (docs.some(isFolder)) throw new Error("Folders can't be uploaded — please pick a file.");
  if (docs.some(isNativeDoc))
    throw new Error(
      "Google Docs/Sheets/Slides can't be used directly — download them as a regular file first.",
    );
  const chosen = docs.filter((d) => extMatches(d.name ?? "", accept));
  if (chosen.length === 0) throw new Error(`Please pick a ${accept} file.`);

  const download = (tok: string, d: any) =>
    downloadToFile(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(d.id)}?alt=media`,
      d.name ?? "file",
      { Authorization: `Bearer ${tok}` },
    );
  try {
    return await Promise.all(chosen.map((d) => download(token, d)));
  } catch (err) {
    // Token may have just expired — one interactive retry, then give up.
    if (err instanceof Error && /\(40[13]\)/.test(err.message)) {
      googleToken = null;
      const fresh = await getGoogleToken();
      return Promise.all(chosen.map((d) => download(fresh, d)));
    }
    throw err;
  }
}

// ── Dropbox (official Chooser) ────────────────────────────────────────────────
async function pickFromDropbox(accept: string, multiple: boolean): Promise<File[]> {
  await loadScript("https://www.dropbox.com/static/api/2/dropins.js", {
    id: "dropboxjs",
    "data-app-key": DROPBOX_APP_KEY!,
  });
  const extensions = accept
    .split(",")
    .map((a) => a.trim())
    .filter((a) => a.startsWith("."));
  const picked = await new Promise<any[]>((resolve) => {
    window.Dropbox.choose({
      linkType: "direct",
      multiselect: multiple,
      extensions: extensions.length > 0 ? extensions : undefined,
      success: (files: any[]) => resolve(files),
      cancel: () => resolve([]),
    });
  });
  return Promise.all(picked.map((f) => downloadToFile(f.link, f.name)));
}

// ── OneDrive (official File Picker v7.2) ─────────────────────────────────────
async function pickFromOneDrive(accept: string, multiple: boolean): Promise<File[]> {
  await loadScript("https://js.live.net/v7.2/OneDrive.js");
  const picked = await new Promise<any[]>((resolve, reject) => {
    window.OneDrive.open({
      clientId: ONEDRIVE_CLIENT_ID,
      action: "download",
      multiSelect: multiple,
      advanced: { redirectUri: window.location.origin, filter: accept || undefined },
      success: (resp: any) => resolve(resp?.value ?? []),
      cancel: () => resolve([]),
      error: (e: any) => reject(new Error(e?.message || "OneDrive picker failed")),
    });
  });
  const chosen = picked.filter((f) => extMatches(f.name ?? "", accept));
  if (picked.length > 0 && chosen.length === 0) throw new Error(`Please pick a ${accept} file.`);
  return Promise.all(
    chosen.map((f) => downloadToFile(f["@microsoft.graph.downloadUrl"], f.name ?? "file")),
  );
}

// ── Provider registry ─────────────────────────────────────────────────────────
interface Provider {
  id: string;
  name: string;
  configured: boolean;
  icon: ReactNode;
  pick?: (accept: string, multiple: boolean) => Promise<File[]>;
}

const PROVIDERS: Provider[] = [
  {
    id: "google-drive",
    name: "Google Drive",
    configured: !!(GOOGLE_API_KEY && GOOGLE_CLIENT_ID),
    pick: pickFromGoogleDrive,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path fill="#0F9D58" d="M8.6 3.5 1.2 16.3l3.7 6.2 7.4-12.8z" />
        <path fill="#4285F4" d="m15.4 3.5 7.4 12.8h-7.4L8 3.5z" />
        <path fill="#FFCD40" d="M4.9 22.5h14.8l3.1-6.2H8z" />
      </svg>
    ),
  },
  {
    id: "dropbox",
    name: "Dropbox",
    configured: !!DROPBOX_APP_KEY,
    pick: pickFromDropbox,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#0061FF" aria-hidden="true">
        <path d="M6 2 0 5.9l6 3.9 6-3.9zm12 0-6 3.9 6 3.9 6-3.9zM0 13.7l6 3.9 6-3.9-6-3.9zm18-3.9-6 3.9 6 3.9 6-3.9zM6.1 18.9l6 3.9 6-3.9-6-3.9z" />
      </svg>
    ),
  },
  {
    id: "onedrive",
    name: "OneDrive",
    configured: !!ONEDRIVE_CLIENT_ID,
    pick: pickFromOneDrive,
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          fill="#0364B8"
          d="M14.5 15.5h5.8a3.7 3.7 0 0 0 .5-7.4 5.6 5.6 0 0 0-10.7-2A4.6 4.6 0 0 0 5 15.5z"
        />
        <path fill="#28A8EA" d="M9.2 8.4a4.6 4.6 0 0 1 4 2.3l1.3 4.8H5a4.6 4.6 0 0 1 4.2-7.1z" />
      </svg>
    ),
  },
  {
    id: "zoho",
    name: "Zoho WorkDrive",
    configured: false, // custom OAuth flow — wired once a Zoho client ID is set up
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <rect x="2" y="5" width="20" height="14" rx="3" fill="#E42527" />
        <path d="M7.2 9h9.6v1.6l-6.9 4.4h7V16H7v-1.6l6.9-4.4H7.2z" fill="#fff" />
      </svg>
    ),
  },
];

// ── Component ────────────────────────────────────────────────────────────────
export interface CloudPickerProps {
  onFiles: (files: File[]) => void;
  accept: string;
  multiple?: boolean;
  /** Tailwind classes for the trigger icon button, to match the page color. */
  buttonClass?: string;
}

export function CloudPicker({ onFiles, accept, multiple = false, buttonClass }: CloudPickerProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setNotice(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setNotice(null);
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = async (p: Provider) => {
    setNotice(null);
    if (!p.configured || !p.pick) {
      setNotice(`${p.name} isn't connected yet — this option is coming soon.`);
      return;
    }
    setBusy(p.id);
    try {
      const files = await p.pick(accept, multiple);
      if (files.length > 0) {
        if (mountedRef.current) setOpen(false);
        onFiles(multiple ? files : files.slice(0, 1));
      }
    } catch (err) {
      if (mountedRef.current) {
        setNotice(err instanceof Error ? err.message : `Couldn't get the file from ${p.name}.`);
      }
    } finally {
      if (mountedRef.current) setBusy(null);
    }
  };

  return (
    <div
      ref={rootRef}
      className="absolute left-full top-1/2 z-10 ml-8 flex w-28 -translate-y-1/2 flex-col items-center"
      onClick={(e) => e.stopPropagation()}
      onDragOver={(e) => e.stopPropagation()}
      onDrop={(e) => e.stopPropagation()}
    >
      <div className="relative">
      <button
        type="button"
        aria-label="Add file from cloud drive"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Add from Google Drive, Dropbox, OneDrive or Zoho"
        data-testid="button-cloud-picker"
        onClick={() => {
          setOpen((o) => !o);
          setNotice(null);
        }}
        className={
          buttonClass ??
          "flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-violet-600 shadow-sm transition-all hover:scale-105 hover:bg-violet-200 hover:shadow"
        }
      >
        <CloudUpload className="h-6 w-6" strokeWidth={2} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Cloud drives"
          className="absolute left-full top-0 ml-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 text-left shadow-xl shadow-slate-900/10"
        >
          <p className="px-3 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Add from cloud
          </p>
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="menuitem"
              data-testid={`cloud-provider-${p.id}`}
              disabled={busy !== null}
              onClick={() => void choose(p)}
              className={
                "flex w-full items-center gap-2.5 px-3 py-2 text-[13px] font-medium transition-colors " +
                (p.configured
                  ? "text-slate-700 hover:bg-slate-50"
                  : "text-slate-400 hover:bg-slate-50")
              }
            >
              <span className={p.configured ? "" : "opacity-45 grayscale"}>{p.icon}</span>
              <span className="flex-1 text-left">{p.name}</span>
              {busy === p.id ? (
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              ) : !p.configured ? (
                <span className="text-[10px] text-slate-400">Soon</span>
              ) : null}
            </button>
          ))}
          {notice && (
            <p className="border-t border-slate-100 px-3 py-2 text-[11px] leading-snug text-amber-700">
              {notice}
            </p>
          )}
        </div>
      )}
      </div>
      <p className="mt-2 text-center text-sm font-medium leading-tight text-slate-600">
        Add files from Drive
      </p>
    </div>
  );
}

/** True when the Zoho picker is still unconfigured (referenced for docs). */
export const zohoConfigured = !!ZOHO_CLIENT_ID;
