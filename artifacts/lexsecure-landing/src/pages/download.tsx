import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Mail,
  KeyRound,
  ShieldCheck,
  Monitor,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Link } from "wouter";
import { ProductPageLayout } from "@/components/layout/ProductPageLayout";

interface InstallerInfo {
  available: boolean;
  sizeBytes?: number;
  updatedAt?: string | null;
  downloadUrl?: string;
}

const DOWNLOAD_URL = "/api/downloads/luxor-pdf-secure-latest.exe";

function formatSize(bytes?: number): string | null {
  if (!bytes || bytes <= 0) return null;
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export default function DownloadPage() {
  const [info, setInfo] = useState<InstallerInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/downloads/installer-info")
      .then((r) => r.json())
      .then((data: InstallerInfo) => {
        if (!cancelled) setInfo(data);
      })
      .catch(() => {
        if (!cancelled) setInfo({ available: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sizeLabel = formatSize(info?.sizeBytes);

  return (
    <ProductPageLayout>
      <section className="relative pt-32 pb-12 bg-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[60%] h-[60%] bg-[#EAF2FB] rounded-full filter blur-[120px] opacity-80" />
        </div>

        <div className="container mx-auto px-6 relative max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Thanks for your purchase
            </div>
            <h1 className="text-5xl md:text-6xl text-slate-900 mb-5 tracking-[-0.02em] leading-[1.05]">
              Your license is ready.
            </h1>
            <p className="text-lg text-slate-600 max-w-xl mx-auto mb-10">
              We've emailed your license key. Download Luxor PDF Secure for
              Windows below and paste your key to activate.
            </p>

            <motion.a
              href={DOWNLOAD_URL}
              initial={{ scale: 0.98 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              className="inline-flex items-center gap-3 bg-[#312E81] hover:bg-[#3730A3] text-white font-semibold rounded-xl px-7 py-4 text-base shadow-lg shadow-[#312E81]/20 transition-colors"
              data-testid="download-installer-button"
            >
              <Download className="w-5 h-5" />
              Download for Windows
              {sizeLabel && (
                <span className="text-xs font-normal text-white/70 ml-1">
                  · {sizeLabel}
                </span>
              )}
            </motion.a>

            {info && !info.available && (
              <p className="mt-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 inline-block rounded-lg px-3 py-2">
                Installer is being prepared — please refresh in a moment.
              </p>
            )}

            <p className="mt-6 text-xs text-slate-500">
              Windows 10 or 11 · 64-bit · ~120 MB after install
            </p>
          </motion.div>
        </div>
      </section>

      {/* Steps strip */}
      <section className="pb-20 bg-white">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                icon: Mail,
                title: "1. Check your inbox",
                body: "We sent your license key from licenses@luxorpdf.com. Don't see it? Check spam.",
              },
              {
                icon: Download,
                title: "2. Run the installer",
                body: "Open the .exe you just downloaded and follow the setup wizard.",
              },
              {
                icon: KeyRound,
                title: "3. Paste your license key",
                body: "Launch Luxor PDF Secure, paste the key from your email, click Activate.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="bg-white rounded-xl p-6 border border-slate-200"
              >
                <div className="w-10 h-10 rounded-lg bg-[#312E81]/5 border border-[#312E81]/15 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-[#312E81]" strokeWidth={2.2} />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reassurance strip */}
      <section className="py-16 bg-slate-50 border-y border-slate-200">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: ShieldCheck, label: "Code-signed installer" },
              { icon: Monitor, label: "Windows 10 / 11" },
              { icon: CheckCircle2, label: "Activates on 1 device" },
              { icon: KeyRound, label: "Key stored securely" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 bg-white rounded-xl p-4 border border-slate-200"
              >
                <Icon className="w-5 h-5 text-[#312E81]" strokeWidth={2.1} />
                <span className="text-sm font-medium text-slate-700">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Help */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-3xl text-center">
          <h2 className="text-2xl md:text-3xl text-slate-900 mb-3 tracking-[-0.02em]">
            Need help?
          </h2>
          <p className="text-slate-600 mb-8">
            Lost your key, can't activate, or installer won't run? We're happy
            to help.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/contact"
              className="px-6 py-3 rounded-lg bg-[#312E81] text-white font-semibold hover:bg-[#3730A3] transition-colors"
            >
              Contact support
            </Link>
            <a
              href="mailto:support@luxorpdf.com"
              className="px-6 py-3 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
            >
              support@luxorpdf.com
            </a>
          </div>
        </div>
      </section>
    </ProductPageLayout>
  );
}
