import { useState } from "react";
import { useSearch } from "wouter";
import { Layout } from "@/components/layout";
import {
  Wrench,
  FileOutput,
  FileInput,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
  Scissors,
  Trash2,
  FilePlus,
  CalendarClock,
  Ban,
  FileX2,
  Lock,
  Merge,
  FileText,
  Download,
  Calendar,
  ShieldAlert,
  Minimize2,
  Shield,
  Sparkles,
} from "lucide-react";
import { PdfToolContent } from "./pdf-tool";
import { ConvertToolContent } from "./convert-tool";
import { SecurePdfContent } from "./secure-pdf";
import { CompressPdfContent } from "./compress-pdf";
import { UsagePanel } from "@/license/UsageBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ToolKey =
  | "pdf-tool"
  | "convert-from"
  | "convert-to"
  | "secure-pdf"
  | "compress-pdf"
  | "user-guide";

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
    key: "secure-pdf",
    label: "Secure your PDF",
    description: "Expiry, password & print controls",
    icon: ShieldCheck,
    accent: "#2563EB",
    iconBg: "bg-[#1754F4] group-hover:bg-[#1447D0]",
    iconText: "text-white",
    activeRing: "ring-blue-500/40 border-blue-500",
    badge: "Signature",
  },
  {
    key: "pdf-tool",
    label: "Edit Your PDF",
    description: "Merge, split & extract pages",
    icon: Wrench,
    accent: "#DC2626",
    iconBg: "bg-[#E61E3C] group-hover:bg-[#C81934]",
    iconText: "text-white",
    activeRing: "ring-rose-500/40 border-rose-500",
  },
  {
    key: "convert-from",
    label: "Convert from PDF",
    description: "PDF to images or text",
    icon: FileOutput,
    accent: "#EA580C",
    iconBg: "bg-[#F37311] group-hover:bg-[#D4640C]",
    iconText: "text-white",
    activeRing: "ring-orange-500/40 border-orange-500",
  },
  {
    key: "convert-to",
    label: "Convert to PDF",
    description: "Images & files to PDF",
    icon: FileInput,
    accent: "#059669",
    iconBg: "bg-[#32AD71] group-hover:bg-[#2A9460]",
    iconText: "text-white",
    activeRing: "ring-emerald-500/40 border-emerald-500",
  },
  {
    key: "compress-pdf",
    label: "Compress your PDF",
    description: "Shrink to 15, 10, 5 or 1 MB",
    icon: Minimize2,
    accent: "#0F766E",
    iconBg: "bg-[#F37311] group-hover:bg-[#D4640C]",
    iconText: "text-white",
    activeRing: "ring-teal-500/40 border-teal-500",
  },
  {
    key: "user-guide",
    label: "User Guide",
    description: "How to use this app",
    icon: HelpCircle,
    accent: "#B45309",
    iconBg: "bg-[#F4B711] group-hover:bg-[#D49E0E]",
    iconText: "text-amber-900",
    activeRing: "ring-amber-500/40 border-amber-500",
  },
];

// ─── User Guide panel (full right-panel, with visual mockups) ────────────────

function UserGuideContent() {
  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4 h-[calc(100vh-180px)] min-h-[520px]">
      {/* Header banner */}
      <div className="bg-gradient-to-br from-[#F4B711] via-[#E5AB10] to-[#D49E0E] rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shadow-inner backdrop-blur-sm">
            <HelpCircle className="w-7 h-7 text-white" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">User Guide</h1>
            <p className="text-white/85 text-sm mt-0.5">
              Step-by-step walkthroughs for the things people ask about most
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="edit" className="flex-1 flex flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-3 gap-1 bg-amber-50 border border-amber-200 p-1 rounded-xl h-auto shrink-0">
          <TabsTrigger
            value="edit"
            className="flex items-center justify-center gap-1.5 text-xs sm:text-sm py-2 rounded-md text-amber-900 data-[state=active]:bg-[#F4B711] data-[state=active]:text-white data-[state=active]:shadow-sm"
            data-testid="guide-tab-edit"
          >
            <Wrench className="w-3.5 h-3.5" />
            Edit pages
          </TabsTrigger>
          <TabsTrigger
            value="expiry"
            className="flex items-center justify-center gap-1.5 text-xs sm:text-sm py-2 rounded-md text-amber-900 data-[state=active]:bg-[#F4B711] data-[state=active]:text-white data-[state=active]:shadow-sm"
            data-testid="guide-tab-expiry"
          >
            <CalendarClock className="w-3.5 h-3.5" />
            Set expiry
          </TabsTrigger>
          <TabsTrigger
            value="revoke"
            className="flex items-center justify-center gap-1.5 text-xs sm:text-sm py-2 rounded-md text-amber-900 data-[state=active]:bg-[#F4B711] data-[state=active]:text-white data-[state=active]:shadow-sm"
            data-testid="guide-tab-revoke"
          >
            <Ban className="w-3.5 h-3.5" />
            Revoke PDF
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-4 flex-1 overflow-y-auto pr-1 data-[state=inactive]:hidden">
      {/* ── 1. Edit Your PDF — Extract / Delete / Insert ─────────────────── */}
      <Card data-testid="guide-section-edit" className="border-indigo-100 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5 text-indigo-700" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg leading-tight">
                Extract, delete &amp; insert pages
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Inside the &ldquo;Edit Your PDF&rdquo; tool
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed mb-4">
            Open <strong>Edit Your PDF</strong> from the left sidebar, then
            drop or pick the PDF you want to work on. You&rsquo;ll see five
            tabs at the top: Merge, Split, Extract, Delete and Insert.
          </p>

          {/* Mock-up of the tabs row */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-2 px-1">
              What it looks like
            </p>
            <div className="grid grid-cols-5 gap-1 bg-violet-50 border border-violet-100 p-1 rounded-lg">
              <div className="flex items-center justify-center gap-1 py-1.5 text-xs text-slate-600 rounded-md">
                <Merge className="w-3 h-3" /> Merge
              </div>
              <div className="flex items-center justify-center gap-1 py-1.5 text-xs text-slate-600 rounded-md">
                <Scissors className="w-3 h-3" /> Split
              </div>
              <div className="flex items-center justify-center gap-1 py-1.5 text-xs font-semibold text-white bg-purple-600 rounded-md shadow-sm">
                <FileOutput className="w-3 h-3" /> Extract
              </div>
              <div className="flex items-center justify-center gap-1 py-1.5 text-xs text-slate-600 rounded-md">
                <Trash2 className="w-3 h-3" /> Delete
              </div>
              <div className="flex items-center justify-center gap-1 py-1.5 text-xs text-slate-600 rounded-md">
                <FilePlus className="w-3 h-3" /> Insert
              </div>
            </div>
            <div className="mt-3 px-1">
              <label className="text-[11px] text-slate-500 block mb-1">
                Pages to extract
              </label>
              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm font-mono text-slate-700">
                  1-3, 5, 8-10
                </div>
                <div className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md shadow-sm">
                  Extract
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <span className="w-7 h-7 rounded-md bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                <FileOutput className="w-3.5 h-3.5 text-purple-700" />
              </span>
              <div>
                <p className="font-semibold text-slate-900 text-sm">Extract pages</p>
                <p className="text-slate-600 text-[13px] leading-relaxed">
                  Pick the <strong>Extract</strong> tab. Type which pages you
                  want to keep — single numbers or ranges separated by commas,
                  e.g. <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[12px]">1-3, 5, 8-10</code>.
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
                <p className="font-semibold text-slate-900 text-sm">Delete pages</p>
                <p className="text-slate-600 text-[13px] leading-relaxed">
                  Pick the <strong>Delete</strong> tab. Use the same
                  page-range syntax (e.g. <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[12px]">2, 4-6</code>)
                  to say which pages should be <em>removed</em>. Click{" "}
                  <strong>Delete</strong> and you&rsquo;ll get back a PDF with
                  everything else still in order.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <span className="w-7 h-7 rounded-md bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <FilePlus className="w-3.5 h-3.5 text-emerald-700" />
              </span>
              <div>
                <p className="font-semibold text-slate-900 text-sm">
                  Insert pages from another PDF
                </p>
                <p className="text-slate-600 text-[13px] leading-relaxed">
                  Pick the <strong>Insert</strong> tab. Drop the second PDF
                  you want to splice in, then choose <em>where</em> to insert
                  it — at the very start, at the very end, or after a specific
                  page number. Click <strong>Insert</strong> to download the
                  merged result.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <span className="w-7 h-7 rounded-md bg-violet-50 border border-violet-100 flex items-center justify-center shrink-0">
                <Scissors className="w-3.5 h-3.5 text-violet-700" />
              </span>
              <div>
                <p className="font-semibold text-slate-900 text-sm">
                  Bonus: Merge &amp; Split
                </p>
                <p className="text-slate-600 text-[13px] leading-relaxed">
                  <strong>Merge</strong> stitches several PDFs into one.{" "}
                  <strong>Split</strong> breaks one PDF into several files
                  (one per page, or per range you specify).
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

        </TabsContent>

        <TabsContent value="expiry" className="mt-4 flex-1 overflow-y-auto pr-1 data-[state=inactive]:hidden">
      {/* ── 2. Set an Expiry Date ────────────────────────────────────────── */}
      <Card data-testid="guide-section-expiry" className="border-amber-100 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
              <CalendarClock className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg leading-tight">
                Set an expiry date for a PDF
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Inside the &ldquo;Secure your PDF&rdquo; tool
              </p>
            </div>
          </div>

          <ol className="list-decimal pl-5 space-y-2 marker:text-slate-400 text-sm text-slate-700 leading-relaxed mb-4">
            <li>Open <strong>Secure your PDF</strong> from the left sidebar.</li>
            <li>Drop or pick the PDF you want to share with an expiry.</li>
            <li>
              Make sure the <strong>Set an expiry date</strong> toggle is on,
              then use the <strong>date &amp; time picker</strong> to choose
              exactly when the file should stop working. The picker goes down
              to the minute — pick anything in the future.
            </li>
            <li>
              (Optional) Add a password and turn print/copy controls on or
              off in the same form.
            </li>
            <li>
              Click <strong>Upload &amp; secure</strong>. A small popup asks{" "}
              <strong>what should happen after the expiry</strong> — see the
              callout below for what to pick.
            </li>
            <li>
              When the upload finishes, you get a shareable download link.
              Anyone visiting that link <em>before</em> the expiry gets the
              real PDF; <em>after</em> the expiry, they see your chosen
              post-expiry behaviour instead.
            </li>
          </ol>

          {/* Mock-up of the expiry datetime field */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-2 px-1">
              What it looks like
            </p>
            <label className="text-[11px] text-slate-600 font-semibold block mb-1 px-1">
              Expires on
            </label>
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-amber-300 rounded-md">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-mono text-slate-700">
                2026-12-31 17:30
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 px-1">
              After this moment, your chosen post-expiry behaviour kicks in.
            </p>
          </div>

          {/* Mock-up of the post-expiry choice popup */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-2 px-1">
              The popup you&rsquo;ll see after clicking &ldquo;Upload &amp; secure&rdquo;
            </p>
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-3">
              <p className="text-sm font-semibold text-slate-900 mb-2">
                What should happen after expiry?
              </p>
              <div className="space-y-2">
                <label className="flex items-start gap-2 p-2 border border-amber-300 bg-amber-50 rounded-md cursor-default">
                  <span className="w-3.5 h-3.5 mt-0.5 rounded-full border-2 border-amber-600 bg-white shrink-0 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                  </span>
                  <span className="flex-1">
                    <span className="flex items-center gap-1.5 text-[13px] font-semibold text-amber-900">
                      <FileX2 className="w-3.5 h-3.5" /> Corrupt the file
                    </span>
                    <span className="block text-[11px] text-amber-800 mt-0.5">
                      Returns scrambled bytes — the link still &ldquo;works&rdquo;
                      but no PDF reader can open it.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-2 p-2 border border-slate-200 rounded-md cursor-default">
                  <span className="w-3.5 h-3.5 mt-0.5 rounded-full border-2 border-slate-400 bg-white shrink-0" />
                  <span className="flex-1">
                    <span className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700">
                      <Ban className="w-3.5 h-3.5" /> Revoke access
                    </span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      Returns a clear &ldquo;file revoked&rdquo; notice to the
                      visitor.
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="font-semibold text-amber-900 text-[13px] mb-2 flex items-center gap-2">
              <CalendarClock className="w-4 h-4" />
              What &ldquo;corrupt&rdquo; vs &ldquo;revoke&rdquo; really means
            </p>
            <ul className="space-y-1.5 text-[13px] text-amber-900">
              <li className="flex gap-2">
                <FileX2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  <strong>Corrupt the file</strong> — good when you want
                  plausible deniability. The link looks like it&rsquo;s
                  working, but the file is unusable.
                </span>
              </li>
              <li className="flex gap-2">
                <Ban className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  <strong>Revoke access</strong> — good when you want
                  recipients to clearly know the file is no longer available.
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

        </TabsContent>

        <TabsContent value="revoke" className="mt-4 flex-1 overflow-y-auto pr-1 data-[state=inactive]:hidden">
      {/* ── 3. Revoke a PDF ──────────────────────────────────────────────── */}
      <Card data-testid="guide-section-revoke" className="border-rose-100 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
              <Ban className="w-5 h-5 text-rose-700" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg leading-tight">
                Revoke a PDF you&rsquo;ve shared
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kill a link before its expiry date arrives
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-700 leading-relaxed mb-4">
            Sometimes you change your mind and need a shared PDF to stop
            working <em>right now</em>, even though its expiry date is still
            in the future. That&rsquo;s what revoke is for.
          </p>

          <ol className="list-decimal pl-5 space-y-2 marker:text-slate-400 text-sm text-slate-700 leading-relaxed mb-4">
            <li>
              Open <strong>Secure your PDF</strong> and scroll down to the{" "}
              <strong>Your secured PDFs</strong> list (or open the{" "}
              <strong>History</strong> page from the top nav).
            </li>
            <li>Find the file you want to kill. Active files have a green <em>Active</em> badge.</li>
            <li>Click the red <strong>Revoke</strong> button on that row.</li>
            <li>
              A confirmation popup appears explaining that the link will stop
              working immediately and that this can&rsquo;t be undone. Click{" "}
              <strong>Revoke now</strong> to confirm.
            </li>
            <li>
              The badge flips to <em>Revoked</em>. Anyone who tries the
              shared link from this point on will see the revoked notice
              instead of the file — even if they had the link bookmarked.
            </li>
          </ol>

          {/* Mock-up of a row in the secured PDFs list */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-2 px-1">
              A row in &ldquo;Your secured PDFs&rdquo;
            </p>
            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-3">
              <div className="w-9 h-9 rounded-md bg-rose-50 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-rose-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  contract-draft-v3.pdf
                </p>
                <p className="text-[11px] text-slate-500">
                  Expires 31 Dec 2026 · 5:30 PM
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                Active
              </span>
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-slate-600">
                  <Download className="w-3.5 h-3.5" />
                </div>
                <div className="px-2.5 py-1.5 rounded-md bg-rose-600 text-white text-xs font-semibold shadow-sm">
                  Revoke
                </div>
              </div>
            </div>
          </div>

          {/* Mock-up of the confirmation popup */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-2 px-1">
              The confirmation popup you&rsquo;ll see
            </p>
            <div className="bg-white border border-slate-200 rounded-lg shadow-md p-4 max-w-sm mx-auto">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Revoke this PDF?
                  </p>
                  <p className="text-[12px] text-slate-500 mt-0.5">
                    The shared link will stop working immediately. This
                    can&rsquo;t be undone.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <div className="px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-md">
                  Cancel
                </div>
                <div className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 rounded-md shadow-sm">
                  Revoke now
                </div>
              </div>
            </div>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 flex gap-3">
            <Lock className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
            <p className="text-[13px] text-rose-900">
              <strong>Heads up:</strong> revoke is permanent. The original
              PDF stays in your account so you can re-upload it with a fresh
              link if you change your mind, but the old link will never work
              again.
            </p>
          </div>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WelcomePanel() {
  return (
    <div className="relative h-full min-h-[560px] flex items-center justify-center bg-white border border-slate-200 rounded-2xl p-12 overflow-hidden">
      {/* ── Background: dot grid pattern ── */}
      <svg
        className="absolute inset-0 w-full h-full text-slate-300/40 pointer-events-none"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="welcome-dots"
            x="0"
            y="0"
            width="22"
            height="22"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1.5" cy="1.5" r="1.5" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#welcome-dots)" />
      </svg>

      {/* ── Background: soft brand-colored gradient orbs (matches sidebar tools) ── */}
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#7254F6]/25 blur-3xl pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#1754F4]/25 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[#2563EB]/25 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-[#F37311]/25 blur-3xl pointer-events-none" />

      {/* ── Background: floating decorative document cards (one per tool color) ── */}
      <div className="absolute top-10 left-8 w-20 h-24 rounded-lg bg-white border border-slate-200 shadow-sm rotate-[-12deg] opacity-70 pointer-events-none">
        <div className="h-1.5 w-10 rounded-full mt-3 ml-3 bg-[#7254F6]/60" />
        <div className="h-1 w-12 bg-slate-200 rounded-full mt-2 ml-3" />
        <div className="h-1 w-8 bg-slate-200 rounded-full mt-1.5 ml-3" />
        <div className="h-1 w-11 bg-slate-200 rounded-full mt-1.5 ml-3" />
      </div>
      <div className="absolute top-16 right-10 w-20 h-24 rounded-lg bg-white border border-slate-200 shadow-sm rotate-[14deg] opacity-70 pointer-events-none">
        <div className="h-1.5 w-10 rounded-full mt-3 ml-3 bg-[#1754F4]/60" />
        <div className="h-1 w-12 bg-slate-200 rounded-full mt-2 ml-3" />
        <div className="h-1 w-9 bg-slate-200 rounded-full mt-1.5 ml-3" />
        <div className="h-1 w-7 bg-slate-200 rounded-full mt-1.5 ml-3" />
      </div>
      <div className="absolute bottom-12 left-12 w-20 h-24 rounded-lg bg-white border border-slate-200 shadow-sm rotate-[10deg] opacity-70 pointer-events-none">
        <div className="h-1.5 w-10 rounded-full mt-3 ml-3 bg-[#2563EB]/60" />
        <div className="h-1 w-12 bg-slate-200 rounded-full mt-2 ml-3" />
        <div className="h-1 w-10 bg-slate-200 rounded-full mt-1.5 ml-3" />
        <div className="h-1 w-7 bg-slate-200 rounded-full mt-1.5 ml-3" />
      </div>
      <div className="absolute bottom-16 right-12 w-20 h-24 rounded-lg bg-white border border-slate-200 shadow-sm rotate-[-9deg] opacity-70 pointer-events-none">
        <div className="h-1.5 w-10 rounded-full mt-3 ml-3 bg-[#F37311]/60" />
        <div className="h-1 w-12 bg-slate-200 rounded-full mt-2 ml-3" />
        <div className="h-1 w-8 bg-slate-200 rounded-full mt-1.5 ml-3" />
        <div className="h-1 w-11 bg-slate-200 rounded-full mt-1.5 ml-3" />
      </div>

      {/* ── Foreground content ── */}
      <div className="relative text-center max-w-md">
        {/* Hero composition: stacked document + shield badge */}
        <div className="relative w-32 h-32 mx-auto mb-6">
          {/* Back document (offset) — Secure red */}
          <div className="absolute top-2 left-1 w-20 h-24 rounded-xl bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] border border-[#1754F4]/30 rotate-[-8deg] shadow-sm" />
          {/* Middle document — User-Guide yellow */}
          <div className="absolute top-1 left-5 w-20 h-24 rounded-xl bg-gradient-to-br from-[#FFF7DC] to-[#FCE7A2] border border-[#F4B711]/40 rotate-[4deg] shadow-sm" />
          {/* Front document — Edit purple accent */}
          <div className="absolute top-3 left-3 w-20 h-24 rounded-xl bg-white border border-slate-200 shadow-md flex flex-col gap-1.5 p-3">
            <FileText className="w-4 h-4 text-[#7254F6]" strokeWidth={2} />
            <div className="h-1 w-12 bg-slate-200 rounded-full" />
            <div className="h-1 w-10 bg-slate-200 rounded-full" />
            <div className="h-1 w-11 bg-slate-200 rounded-full" />
            <div className="h-1 w-8 bg-slate-200 rounded-full" />
          </div>
          {/* Shield badge — full brand gradient */}
          <div className="absolute -bottom-1 -right-1 w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7254F6] via-[#1754F4] to-[#F37311] flex items-center justify-center shadow-lg ring-4 ring-white">
            <ShieldCheck
              className="w-6 h-6 text-white"
              strokeWidth={2}
            />
          </div>
          {/* Lock micro-badge */}
          <div className="absolute -top-1 -left-1 w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-md">
            <Lock className="w-3.5 h-3.5 text-slate-700" strokeWidth={2.25} />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFF7DC] border border-[#F4B711]/50 text-[11px] font-semibold text-[#8A6500] mb-3">
          <Sparkles className="w-3 h-3" />
          Private PDF Suite
        </div>

        <h2 className="text-xl font-bold text-slate-900">
          Choose a tool to get started
        </h2>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          Every action is processed locally in your browser. Your files never
          leave your device.
        </p>

        {/* Brand-color chip row hinting at the tools (exact tool palette) */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#7254F6]/10 border border-[#7254F6]/30 text-[11px] font-medium text-[#5B40D6]">
            <Wrench className="w-3 h-3" /> Edit
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#2563EB]/10 border border-[#2563EB]/30 text-[11px] font-medium text-[#1D4ED8]">
            <FileOutput className="w-3 h-3" /> Convert
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#1754F4]/10 border border-[#1754F4]/30 text-[11px] font-medium text-[#1447D0]">
            <ShieldCheck className="w-3 h-3" /> Secure
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#F37311]/10 border border-[#F37311]/30 text-[11px] font-medium text-[#D4640C]">
            <Minimize2 className="w-3 h-3" /> Compress
          </span>
        </div>
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
          accent="orange"
        />
      )}
      {active === "convert-to" && (
        <ConvertToolContent
          defaultTab="images-to-pdf"
          tabs={["images-to-pdf", "word-to-pdf", "excel-to-pdf"]}
          accent="green"
        />
      )}
      {active === "secure-pdf" && <SecurePdfContent />}
      {active === "compress-pdf" && <CompressPdfContent />}
      {active === "user-guide" && <UserGuideContent />}
    </div>
  );
}

const VALID_TOOL_KEYS: ToolKey[] = [
  "pdf-tool",
  "convert-from",
  "convert-to",
  "secure-pdf",
  "compress-pdf",
  "user-guide",
];

export default function Dashboard() {
  const search = useSearch();
  const initial = (() => {
    const requested = new URLSearchParams(search).get("tool") as ToolKey | null;
    return requested && VALID_TOOL_KEYS.includes(requested)
      ? requested
      : null;
  })();
  const [active, setActive] = useState<ToolKey | null>(initial);

  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const visibleTools = normalizedQuery
    ? TOOLS.filter(
        (t) =>
          t.label.toLowerCase().includes(normalizedQuery) ||
          t.description.toLowerCase().includes(normalizedQuery),
      )
    : TOOLS;

  return (
    <Layout showSearch searchQuery={query} onSearchChange={setQuery}>
      <div className="mb-5">
        <UsagePanel />
      </div>
      {/* Two-column workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-[36.7%_minmax(0,1fr)] xl:grid-cols-[27.5%_minmax(0,1fr)] gap-4">
        {/* ── Left: tool list ── */}
        <aside className="flex flex-col gap-2.5">
          <div className="mb-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Your PDF Toolkit
            </p>
            <p className="mt-1.5 text-[13.2px] text-slate-500 leading-relaxed">
              Edit, convert and secure documents — everything runs locally in
              your browser for complete privacy.
            </p>
          </div>
          {visibleTools.length === 0 && (
            <div className="px-4 py-6 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
              <p className="text-sm text-slate-500">
                No tools match{" "}
                <span className="font-semibold text-slate-700">“{query}”</span>.
              </p>
            </div>
          )}
          {visibleTools.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActive(isActive ? null : item.key)}
                className={`group text-left bg-white rounded-xl border transition-all duration-200 px-3 py-3 ${
                  isActive
                    ? `border-2 ring-4 shadow-md ${item.activeRing}`
                    : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                }`}
                data-testid={`menu-card-${item.label
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${item.iconBg}`}
                  >
                    <Icon
                      className={`w-[18px] h-[18px] ${item.iconText}`}
                      strokeWidth={2}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-[15px] text-slate-900 leading-tight whitespace-nowrap">
                        {item.label}
                      </p>
                      {item.badge && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded leading-none">
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

          {/* Quick tip — privacy reassurance */}
          <div className="mt-2 px-4 py-3.5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-100">
            <div className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1754F4] to-[#1447D0] flex items-center justify-center shadow-sm shrink-0">
                <Shield className="w-4 h-4 text-white" strokeWidth={2.25} />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#1447D0]">
                  Quick tip
                </p>
                <p className="mt-0.5 text-[12px] text-slate-600 leading-relaxed">
                  All tools run locally in your browser. Your files never leave
                  your device.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Right: active tool ── */}
        <section className="min-h-[560px] min-w-0">
          <RightPanel active={active} />
        </section>
      </div>
    </Layout>
  );
}
