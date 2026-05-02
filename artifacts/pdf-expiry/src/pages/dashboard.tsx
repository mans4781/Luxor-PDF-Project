import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  Wrench,
  FileOutput,
  FileInput,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Scissors,
  Trash2,
  FilePlus,
  CalendarClock,
  Ban,
  FileX2,
  Lock,
} from "lucide-react";
import { PdfToolContent } from "./pdf-tool";
import { ConvertToolContent } from "./convert-tool";
import { SecurePdfContent } from "./secure-pdf";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type ToolKey = "pdf-tool" | "convert-from" | "convert-to" | "secure-pdf";

type ToolItem = {
  key: ToolKey;
  label: string;
  description: string;
  icon: React.ElementType;
  accent: string;
  iconBg: string;
  iconText: string;
  activeRing: string;
  badge?: string;
};

const TOOLS: ToolItem[] = [
  {
    key: "pdf-tool",
    label: "Edit Your PDF",
    description: "Merge, split & extract pages",
    icon: Wrench,
    accent: "#312E81",
    iconBg: "bg-indigo-50 group-hover:bg-indigo-100",
    iconText: "text-indigo-700",
    activeRing: "ring-indigo-500/40 border-indigo-500",
  },
  {
    key: "convert-from",
    label: "Convert from PDF",
    description: "PDF to images or text",
    icon: FileOutput,
    accent: "#2563EB",
    iconBg: "bg-blue-50 group-hover:bg-blue-100",
    iconText: "text-blue-700",
    activeRing: "ring-blue-500/40 border-blue-500",
  },
  {
    key: "convert-to",
    label: "Convert to PDF",
    description: "Images & files to PDF",
    icon: FileInput,
    accent: "#059669",
    iconBg: "bg-emerald-50 group-hover:bg-emerald-100",
    iconText: "text-emerald-700",
    activeRing: "ring-emerald-500/40 border-emerald-500",
  },
  {
    key: "secure-pdf",
    label: "Secure your PDF",
    description: "Expiry, password & print controls",
    icon: ShieldCheck,
    accent: "#DC2626",
    iconBg: "bg-rose-50 group-hover:bg-rose-100",
    iconText: "text-rose-700",
    activeRing: "ring-rose-500/40 border-rose-500",
    badge: "Signature",
  },
];

// ─── How-to-use help dialog ───────────────────────────────────────────────────

function HelpDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          data-testid="button-help"
          aria-label="How to use this app"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-indigo-400 hover:text-indigo-700 hover:shadow-sm transition-all text-sm font-medium shrink-0"
        >
          <HelpCircle className="w-4 h-4" strokeWidth={2} />
          <span>How to use</span>
        </button>
      </DialogTrigger>
      <DialogContent
        className="max-w-2xl max-h-[85vh] overflow-y-auto"
        data-testid="dialog-help"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <HelpCircle className="w-5 h-5 text-indigo-600" strokeWidth={2} />
            How to use Luxor PDF
          </DialogTitle>
          <DialogDescription>
            Quick guides for the things people ask about most. Every action
            runs locally in your browser — your files never leave your device.
          </DialogDescription>
        </DialogHeader>

        <Accordion
          type="single"
          collapsible
          defaultValue="edit"
          className="mt-2"
        >
          {/* ── 1. Edit Your PDF — Extract / Delete / Insert ───────────── */}
          <AccordionItem value="edit" data-testid="help-section-edit">
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                  <Wrench className="w-4 h-4 text-indigo-700" />
                </span>
                <span>
                  <span className="block font-semibold text-slate-900">
                    Extract, delete &amp; insert pages
                  </span>
                  <span className="block text-xs text-slate-500 font-normal">
                    Inside the &ldquo;Edit Your PDF&rdquo; tool
                  </span>
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-slate-700 leading-relaxed pl-12">
              <p className="mb-3">
                Open <strong>Edit Your PDF</strong> from the left sidebar, then
                drop or pick the PDF you want to work on. You&rsquo;ll see five
                tabs at the top: Merge, Split, Extract, Delete and Insert.
              </p>

              <div className="space-y-3 mt-4">
                <div className="flex gap-3 items-start">
                  <span className="w-7 h-7 rounded-md bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                    <FileOutput className="w-3.5 h-3.5 text-purple-700" />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">
                      Extract pages
                    </p>
                    <p className="text-slate-600 text-[13px]">
                      Pick the <strong>Extract</strong> tab. Type which pages
                      you want to keep — single numbers or ranges separated by
                      commas, e.g. <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[12px]">1-3, 5, 8-10</code>.
                      Click <strong>Extract</strong> and a brand-new PDF
                      containing only those pages is downloaded to your device.
                      The original file is left untouched.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="w-7 h-7 rounded-md bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                    <Trash2 className="w-3.5 h-3.5 text-rose-700" />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">
                      Delete pages
                    </p>
                    <p className="text-slate-600 text-[13px]">
                      Pick the <strong>Delete</strong> tab. Use the same
                      page-range syntax (e.g. <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[12px]">2, 4-6</code>)
                      to say which pages should be <em>removed</em>. Click{" "}
                      <strong>Delete</strong> and you&rsquo;ll get back a PDF
                      with everything else still in order.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="w-7 h-7 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                    <FilePlus className="w-3.5 h-3.5 text-emerald-700" />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">
                      Insert pages from another PDF
                    </p>
                    <p className="text-slate-600 text-[13px]">
                      Pick the <strong>Insert</strong> tab. Drop the second
                      PDF you want to splice in, then choose <em>where</em>{" "}
                      to insert it — at the very start, at the very end, or
                      after a specific page number. Click <strong>Insert</strong>{" "}
                      to download the merged result.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <span className="w-7 h-7 rounded-md bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                    <Scissors className="w-3.5 h-3.5 text-violet-700" />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900">
                      Bonus: Merge &amp; Split
                    </p>
                    <p className="text-slate-600 text-[13px]">
                      <strong>Merge</strong> stitches several PDFs into one.{" "}
                      <strong>Split</strong> breaks one PDF into several files
                      (one per page, or per range you specify).
                    </p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ── 2. Set an Expiry Date ──────────────────────────────────── */}
          <AccordionItem value="expiry" data-testid="help-section-expiry">
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                  <CalendarClock className="w-4 h-4 text-amber-700" />
                </span>
                <span>
                  <span className="block font-semibold text-slate-900">
                    Set an expiry date for a PDF
                  </span>
                  <span className="block text-xs text-slate-500 font-normal">
                    Inside the &ldquo;Secure your PDF&rdquo; tool
                  </span>
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-slate-700 leading-relaxed pl-12">
              <ol className="list-decimal pl-4 space-y-2 marker:text-slate-400">
                <li>
                  Open <strong>Secure your PDF</strong> from the left sidebar.
                </li>
                <li>
                  Drop or pick the PDF you want to share with an expiry.
                </li>
                <li>
                  Make sure the <strong>Set an expiry date</strong> toggle is
                  on, then use the <strong>date &amp; time picker</strong> to
                  choose exactly when the file should stop working. The picker
                  goes down to the minute — pick anything in the future.
                </li>
                <li>
                  (Optional) Add a password and turn print/copy controls on or
                  off in the same form.
                </li>
                <li>
                  Click <strong>Upload &amp; secure</strong>. A small popup
                  asks <strong>what should happen after the expiry</strong> —
                  see the next section for what to pick.
                </li>
                <li>
                  When the upload finishes, you get a shareable download
                  link. Anyone visiting that link <em>before</em> the expiry
                  gets the real PDF; <em>after</em> the expiry, they see your
                  chosen post-expiry behaviour instead.
                </li>
              </ol>

              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="font-semibold text-amber-900 text-[13px] mb-2 flex items-center gap-2">
                  <CalendarClock className="w-4 h-4" />
                  What &ldquo;corrupt&rdquo; vs &ldquo;revoke&rdquo; means
                </p>
                <ul className="space-y-1.5 text-[13px] text-amber-900">
                  <li className="flex gap-2">
                    <FileX2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>
                      <strong>Corrupt the file</strong> — after the deadline
                      the link still &ldquo;downloads&rdquo;, but the bytes
                      are scrambled so no PDF reader can open it. Good when
                      you want plausible deniability.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <Ban className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>
                      <strong>Revoke access</strong> — after the deadline the
                      link returns a clear &ldquo;this file has been
                      revoked&rdquo; notice instead of a download. Good when
                      you want recipients to know the file is no longer
                      available.
                    </span>
                  </li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* ── 3. Revoke a PDF ────────────────────────────────────────── */}
          <AccordionItem value="revoke" data-testid="help-section-revoke">
            <AccordionTrigger className="text-left hover:no-underline">
              <span className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                  <Ban className="w-4 h-4 text-rose-700" />
                </span>
                <span>
                  <span className="block font-semibold text-slate-900">
                    Revoke a PDF you&rsquo;ve shared
                  </span>
                  <span className="block text-xs text-slate-500 font-normal">
                    Kill a link before its expiry date arrives
                  </span>
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-slate-700 leading-relaxed pl-12">
              <p className="mb-3">
                Sometimes you change your mind and need a shared PDF to stop
                working <em>right now</em>, even though its expiry date is
                still in the future. That&rsquo;s what revoke is for.
              </p>

              <ol className="list-decimal pl-4 space-y-2 marker:text-slate-400">
                <li>
                  Open <strong>Secure your PDF</strong> and scroll down to the{" "}
                  <strong>Your secured PDFs</strong> list (or open the{" "}
                  <strong>History</strong> page from the top nav).
                </li>
                <li>
                  Find the file you want to kill. Active files have a green{" "}
                  <em>Active</em> badge.
                </li>
                <li>
                  Click the red <strong>Revoke</strong> button on that row.
                </li>
                <li>
                  A confirmation popup appears explaining that the link will
                  stop working immediately and that this can&rsquo;t be
                  undone. Click <strong>Revoke now</strong> to confirm.
                </li>
                <li>
                  The badge flips to <em>Revoked</em>. Anyone who tries the
                  shared link from this point on will see the revoked notice
                  instead of the file — even if they had the link bookmarked.
                </li>
              </ol>

              <div className="mt-4 bg-rose-50 border border-rose-200 rounded-lg p-3 flex gap-3">
                <Lock className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                <p className="text-[13px] text-rose-900">
                  <strong>Heads up:</strong> revoke is permanent. The original
                  PDF stays in your account so you can re-upload it with a
                  fresh link if you change your mind, but the old link will
                  never work again.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DialogContent>
    </Dialog>
  );
}

function WelcomePanel() {
  return (
    <div className="h-full flex items-center justify-center bg-white border border-slate-200 rounded-2xl p-12">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-rose-50 border border-slate-200 flex items-center justify-center mx-auto mb-5">
          <ShieldCheck className="w-8 h-8 text-[#DC2626]" strokeWidth={1.75} />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          Choose a tool to get started
        </h2>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          Every action is processed locally in your browser. Your files never
          leave your device.
        </p>
      </div>
    </div>
  );
}

function RightPanel({ active }: { active: ToolKey | null }) {
  if (!active) return <WelcomePanel />;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 overflow-y-auto">
      {active === "pdf-tool" && <PdfToolContent />}
      {active === "convert-from" && (
        <ConvertToolContent
          defaultTab="pdf-to-images"
          tabs={["pdf-to-images", "pdf-to-word", "pdf-to-excel"]}
        />
      )}
      {active === "convert-to" && (
        <ConvertToolContent
          defaultTab="images-to-pdf"
          tabs={["images-to-pdf", "word-to-pdf", "excel-to-pdf"]}
        />
      )}
      {active === "secure-pdf" && <SecurePdfContent />}
    </div>
  );
}

export default function Dashboard() {
  const [active, setActive] = useState<ToolKey | null>("pdf-tool");

  return (
    <Layout>
      {/* Hero / page title — echoes landing page hero */}
      <div className="mb-7 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1e3a8a] bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 mb-3">
            <Sparkles className="w-3 h-3 text-[#DC2626]" strokeWidth={2.5} />
            Luxor PDF · Workspace
          </div>
          <h1 className="text-[34px] leading-tight font-extrabold tracking-tight text-slate-900">
            Your{" "}
            <span className="bg-gradient-to-r from-[#1e3a8a] to-[#DC2626] bg-clip-text text-transparent">
              secure
            </span>{" "}
            PDF toolkit.
          </h1>
          <p className="text-[15px] text-slate-500 mt-2 max-w-xl leading-relaxed">
            Edit, convert and secure documents — everything runs locally in
            your browser for complete privacy.
          </p>
        </div>
        <HelpDialog />
      </div>

      {/* Two-column workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ── Left: tool list ── */}
        <aside className="lg:col-span-4 xl:col-span-3 flex flex-col gap-2.5">
          {TOOLS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActive(isActive ? null : item.key)}
                className={`group text-left bg-white rounded-xl border transition-all duration-200 px-4 py-4 ${
                  isActive
                    ? `border-2 ring-4 shadow-md ${item.activeRing}`
                    : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                }`}
                data-testid={`menu-card-${item.label
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 transition-colors ${item.iconBg}`}
                  >
                    <Icon
                      className={`w-5 h-5 ${item.iconText}`}
                      strokeWidth={2}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-[15px] text-slate-900 leading-tight whitespace-nowrap">
                        {item.label}
                      </p>
                      {item.badge && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded leading-none">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-snug">
                      {item.description}
                    </p>
                  </div>
                  <ArrowRight
                    className={`w-4 h-4 shrink-0 transition-all ${
                      isActive
                        ? "rotate-90 text-slate-700"
                        : "text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5"
                    }`}
                  />
                </div>
              </button>
            );
          })}

          {/* Footer note in sidebar */}
          <div className="mt-2 px-4 py-3 rounded-xl bg-slate-100/70 border border-slate-200">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-700">Tip:</span> Click an
              active tool again to collapse it back to this overview.
            </p>
          </div>
        </aside>

        {/* ── Right: active tool ── */}
        <section className="lg:col-span-8 xl:col-span-9 min-h-[560px]">
          <RightPanel active={active} />
        </section>
      </div>
    </Layout>
  );
}
