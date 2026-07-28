/**
 * Shared "your file is ready" overlay for the free online tools.
 *
 * Tools call offerDownload(blob, filename) — or offerDownloadMany([...]) for
 * tools that produce several files — when processing finishes.
 * A card appears with a Download button; clicking it silently saves the
 * file(s) to the browser's Downloads folder (plain <a download>, no Save-As
 * dialog) and the tool resets (full reload) 2 seconds later.
 * The card can also be dismissed (X / Escape) without downloading.
 */
import { useEffect, useRef, useState } from "react";
import { Download, CheckCircle2, X } from "lucide-react";

type OfferFile = { blob: Blob; filename: string };
type Offer = { files: OfferFile[] };

const EVENT = "luxor:download-offer";
const RESET_DELAY_MS = 2000;

export function offerDownload(blob: Blob, filename: string) {
  offerDownloadMany([{ blob, filename }]);
}

export function offerDownloadMany(files: OfferFile[]) {
  if (!files.length) return;
  window.dispatchEvent(new CustomEvent<Offer>(EVENT, { detail: { files } }));
}

function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Give the browser a moment to start the download before revoking.
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// One-shot lock shared by all download entry points so rapid repeated
// clicks can never fire duplicate downloads.
let downloadLock = false;

/**
 * For tools that already show their own Download button (e.g. Compress):
 * immediately save to the Downloads folder and reset the tool 2s later.
 */
export function downloadNowAndReset(blob: Blob, filename: string) {
  if (downloadLock) return;
  downloadLock = true;
  triggerBrowserDownload(blob, filename);
  window.setTimeout(() => window.location.reload(), RESET_DELAY_MS);
}

export function DownloadOfferHost() {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [downloaded, setDownloaded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onOffer = (e: Event) => {
      setOffer((e as CustomEvent<Offer>).detail);
      setDownloaded(false);
    };
    window.addEventListener(EVENT, onOffer);
    return () => window.removeEventListener(EVENT, onOffer);
  }, []);

  // Escape dismisses (only before the download started).
  useEffect(() => {
    if (!offer || downloaded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOffer(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [offer, downloaded]);

  // Keep keyboard focus inside the dialog while it is open.
  useEffect(() => {
    if (!offer) return;
    const card = cardRef.current;
    if (!card) return;
    const onFocusIn = (e: FocusEvent) => {
      if (e.target instanceof Node && !card.contains(e.target)) {
        const first = card.querySelector<HTMLElement>("button");
        first?.focus();
      }
    };
    document.addEventListener("focusin", onFocusIn);
    return () => document.removeEventListener("focusin", onFocusIn);
  }, [offer]);

  if (!offer) return null;

  const many = offer.files.length > 1;
  const label = many ? `${offer.files.length} files` : offer.files[0].filename;

  const handleDownload = () => {
    if (downloadLock) return;
    downloadLock = true;
    // Stagger multi-file downloads slightly so browsers don't drop any.
    offer.files.forEach((f, i) => {
      window.setTimeout(() => triggerBrowserDownload(f.blob, f.filename), i * 250);
    });
    setDownloaded(true);
    const extra = many ? (offer.files.length - 1) * 250 : 0;
    window.setTimeout(() => window.location.reload(), RESET_DELAY_MS + extra);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="File ready to download"
    >
      <div
        ref={cardRef}
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl dark:bg-neutral-900"
      >
        {!downloaded && (
          <button
            onClick={() => setOffer(null)}
            aria-label="Close"
            className="absolute right-3 top-3 rounded-full p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:hover:bg-neutral-800"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" aria-hidden="true" />
        <h2 className="mt-3 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {downloaded ? "Downloading…" : many ? "Your files are ready" : "Your file is ready"}
        </h2>
        <p className="mt-1 break-all text-sm text-neutral-500 dark:text-neutral-400">
          {label}
        </p>
        {downloaded ? (
          <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
            Saved to your Downloads folder. Resetting…
          </p>
        ) : (
          <button
            onClick={handleDownload}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            autoFocus
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {many ? "Download all" : "Download"}
          </button>
        )}
      </div>
    </div>
  );
}
