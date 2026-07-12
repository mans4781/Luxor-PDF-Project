import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight,
  Shield,
  ShieldCheck,
  Rocket,
  BadgeCheck,
  Users,
  Download,
  Globe,
  FileText,
  Type,
  Image as ImageIcon,
  Link2,
  Crop,
  Droplets,
  Hash,
  MessageSquare,
  CheckCircle2,
  Lock,
  PenLine,
  FileCheck2,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
};

const NAVY = "#1E1B4B";

function CheckItem({ text, color }: { text: string; color: string }) {
  return (
    <li className="flex items-start gap-3">
      <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" style={{ color }} />
      <span className="text-[15px] text-slate-700">{text}</span>
    </li>
  );
}

function AppIcon({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="w-16 h-16 rounded-2xl shadow-lg bg-white ring-1 ring-slate-900/5 overflow-hidden shrink-0 flex items-center justify-center">
      <img
        src={`${import.meta.env.BASE_URL}brand/${src}`}
        alt={alt}
        className="w-full h-full object-contain"
      />
    </div>
  );
}

/* ------------------------------- Laptop shell ------------------------------ */

function Laptop({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="rounded-t-xl border-[8px] border-slate-800 bg-white overflow-hidden shadow-2xl">
        {children}
      </div>
      <div className="h-3.5 bg-slate-300 rounded-b-xl shadow-md mx-[-4%] flex justify-center">
        <div className="w-20 h-1.5 bg-slate-400/60 rounded-b" />
      </div>
    </div>
  );
}

/* --------------------------------- Page ----------------------------------- */

export default function Home2Page() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Navbar />

      <main className="pt-20">
        {/* ================================ HERO ================================ */}
        <section className="relative overflow-hidden bg-white">
          <div
            className="absolute top-0 right-0 w-72 h-72 opacity-60 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(rgba(220,38,38,0.25) 1.5px, transparent 1.5px)",
              backgroundSize: "16px 16px",
              maskImage: "radial-gradient(circle at top right, black, transparent 70%)",
              WebkitMaskImage: "radial-gradient(circle at top right, black, transparent 70%)",
            }}
          />
          <div className="container mx-auto max-w-6xl px-6 pt-12 lg:pt-16 pb-16">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left copy */}
              <motion.div {...fadeUp}>
                <div className="text-xs font-extrabold tracking-[0.2em] text-[#DC2626] uppercase mb-4">
                  About Us
                </div>
                <h1
                  className="text-4xl lg:text-[44px] font-extrabold leading-[1.15] mb-6"
                  style={{ color: NAVY }}
                >
                  Powerful PDF Solutions,
                  <br />
                  Built for Everyone
                </h1>
                <p className="text-[15px] text-slate-600 leading-relaxed max-w-md">
                  At LuxorPDF, we believe PDFs should be simple, secure, and seamless. That&apos;s
                  why we build smart, reliable tools that help individuals and businesses work with
                  PDFs more efficiently — every day.
                </p>
              </motion.div>

              {/* Right: laptop with editing tools */}
              <motion.div {...fadeUp} className="relative">
                <Laptop className="max-w-lg mx-auto">
                  <div className="aspect-[16/10] bg-slate-100 relative">
                    {/* window chrome */}
                    <div className="h-7 bg-white border-b border-slate-200 flex items-center px-3 gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-400" />
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      <div className="ml-3 flex-1 max-w-[200px] h-3.5 bg-slate-100 rounded-full" />
                    </div>
                    <div className="absolute inset-x-0 top-7 bottom-0 flex">
                      {/* thumbnails rail */}
                      <div className="w-12 bg-white border-r border-slate-200 p-1.5 space-y-1.5 hidden sm:block">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="h-10 bg-slate-100 rounded border border-slate-200" />
                        ))}
                      </div>
                      {/* document */}
                      <div className="flex-1 p-4 overflow-hidden">
                        <div className="bg-white rounded-lg shadow-md h-full p-5">
                          <div className="text-[13px] font-extrabold mb-2" style={{ color: NAVY }}>
                            About <span className="text-[#DC2626]">LuxorPDF</span>
                          </div>
                          <div className="flex gap-3">
                            <p className="flex-1 text-[7px] leading-[1.6] text-slate-500 pt-0.5">
                              LuxorPDF was founded with a single goal — to make working with
                              documents effortless for everyone. From reading and annotating to
                              securing and signing, our tools are designed to keep your workflow
                              simple, fast, and safe. Today, teams in over 120 countries rely on
                              LuxorPDF to move their most important documents forward with
                              confidence.
                            </p>
                            {/* red building photo */}
                            <img
                              src={`${import.meta.env.BASE_URL}brand/home2-building.png`}
                              alt="LuxorPDF headquarters building"
                              className="w-20 h-24 rounded-md object-cover shrink-0"
                            />
                          </div>
                          <p className="mt-2.5 text-[7px] leading-[1.6] text-slate-500">
                            Every product we ship follows one principle: powerful features should
                            never come at the cost of simplicity. That is the LuxorPDF promise.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Laptop>

                {/* floating tools panel */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="absolute -right-2 top-6 lg:-right-6 bg-white rounded-xl shadow-xl border border-slate-100 p-2.5 w-[124px]"
                >
                  {[
                    { icon: Type, label: "Edit Text" },
                    { icon: ImageIcon, label: "Add Image" },
                    { icon: Link2, label: "Add Link" },
                    { icon: Crop, label: "Crop Page" },
                    { icon: Droplets, label: "Watermark" },
                    { icon: Hash, label: "Page Number" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2 py-1">
                      <Icon className="w-3.5 h-3.5 text-[#DC2626]" />
                      <span className="text-[10px] font-semibold text-slate-700">{label}</span>
                    </div>
                  ))}
                </motion.div>

                {/* floating team comment chip */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.45, duration: 0.6 }}
                  className="absolute -bottom-3 right-8 bg-white rounded-xl shadow-xl border border-slate-100 px-3 py-2 flex items-center gap-2"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                    <MessageSquare className="w-3 h-3 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-800 leading-tight">
                      Team Comment
                    </div>
                    <div className="text-[9px] text-slate-500 leading-tight">Great content!</div>
                  </div>
                </motion.div>
              </motion.div>
            </div>

            {/* Feature icon row */}
            <motion.div
              {...fadeUp}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-14 max-w-3xl"
            >
              {[
                { icon: ShieldCheck, label: "Secure &\nReliable", color: "#DC2626", bg: "bg-red-50", border: "border-red-100" },
                { icon: Rocket, label: "Fast &\nEfficient", color: "#2563EB", bg: "bg-blue-50", border: "border-blue-100" },
                { icon: Users, label: "User First\nDesign", color: "#16A34A", bg: "bg-green-50", border: "border-green-100" },
                { icon: BadgeCheck, label: "Trusted by\nThousands", color: "#9333EA", bg: "bg-purple-50", border: "border-purple-100" },
              ].map(({ icon: Icon, label, color, bg, border }) => (
                <div key={label} className="flex flex-col items-center text-center gap-3">
                  <div className={`w-14 h-14 rounded-lg ${bg} border ${border} flex items-center justify-center`}>
                    <Icon className="w-6 h-6" style={{ color }} />
                  </div>
                  <div className="text-[13px] font-semibold text-slate-800 whitespace-pre-line leading-snug">
                    {label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ========================== PRODUCTS HEADER ========================== */}
        <section id="products" className="pt-16 pb-10 bg-white scroll-mt-20">
          <motion.div {...fadeUp} className="container mx-auto max-w-3xl px-6 text-center">
            <div className="text-xs font-extrabold tracking-[0.2em] text-[#DC2626] uppercase mb-3">
              Our Products
            </div>
            <h2 className="text-3xl lg:text-4xl font-extrabold mb-4" style={{ color: NAVY }}>
              Three Powerful Tools. One Complete PDF Experience.
            </h2>
            <p className="text-[15px] text-slate-600 max-w-xl mx-auto">
              Whether you&apos;re reading, securing, or signing —{" "}
              <span className="font-semibold text-slate-800">LuxorPDF</span> has the perfect
              solution for you.
            </p>
          </motion.div>
        </section>

        {/* =========================== READER PANEL ============================ */}
        <section className="pb-10 bg-white">
          <div className="container mx-auto max-w-6xl px-6">
            <motion.div
              {...fadeUp}
              className="rounded-3xl bg-[#FDECEC] border border-red-100/60 p-8 lg:p-12 grid lg:grid-cols-2 gap-10 items-center overflow-hidden"
            >
              {/* devices */}
              <div className="relative">
                <Laptop className="max-w-md">
                  <div className="aspect-[16/10] bg-white relative">
                    <div className="h-6 bg-slate-50 border-b border-slate-200 flex items-center px-2 gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      <div className="ml-2 text-[8px] font-bold text-[#DC2626]">LUXOR PDF</div>
                    </div>
                    <div className="p-4 flex gap-4">
                      <div className="flex-1">
                        <div className="text-lg font-extrabold leading-tight" style={{ color: NAVY }}>
                          Build
                          <br />
                          with
                          <br />
                          <span className="text-[#DC2626]">Confidence</span>
                        </div>
                        <p className="mt-3 text-[7px] leading-[1.6] text-slate-500">
                          Great documents deserve a great reader. Open any PDF instantly, mark it
                          up with highlights and comments, and share it with your team — all in a
                          clean, distraction-free workspace built for focus.
                        </p>
                      </div>
                      {/* mountain photo */}
                      <img
                        src={`${import.meta.env.BASE_URL}brand/home2-mountain.png`}
                        alt="Mountain landscape inside a PDF document"
                        className="w-24 h-28 rounded-md object-cover shrink-0"
                      />
                    </div>
                  </div>
                </Laptop>
                {/* phone */}
                <div className="absolute -right-1 -bottom-2 w-24 rounded-[14px] border-[5px] border-slate-800 bg-white shadow-xl overflow-hidden">
                  <div className="aspect-[9/16] p-2">
                    <div className="text-[9px] font-extrabold leading-tight" style={{ color: NAVY }}>
                      Build
                      <br />
                      with
                      <br />
                      <span className="text-[#DC2626]">Confidence</span>
                    </div>
                    <p className="mt-1.5 text-[5px] leading-[1.6] text-slate-500">
                      Read, annotate and share PDFs on the go with the same smooth experience.
                    </p>
                    <img
                      src={`${import.meta.env.BASE_URL}brand/home2-mountain.png`}
                      alt="Mountain landscape on mobile PDF"
                      className="mt-2 h-10 w-full rounded object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* copy */}
              <div>
                <AppIcon src="product-reader.png" alt="Luxor PDF Reader icon" />
                <h3 className="text-2xl lg:text-3xl font-extrabold mt-5 mb-3" style={{ color: NAVY }}>
                  Luxor <span className="text-[#DC2626]">PDF Reader</span>
                </h3>
                <p className="text-[15px] text-slate-600 mb-6">
                  Your everyday PDF reader — fast, lightweight, and feature-rich.
                </p>
                <ul className="space-y-3 mb-8">
                  <CheckItem color="#DC2626" text="Open, view & annotate PDFs" />
                  <CheckItem color="#DC2626" text="Add comments, highlights & shapes" />
                  <CheckItem color="#DC2626" text="Fill and save PDF forms" />
                  <CheckItem color="#DC2626" text="Print and share with ease" />
                  <CheckItem color="#DC2626" text="Available for Windows" />
                </ul>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-lg border-[#DC2626] text-[#DC2626] hover:bg-red-50 hover:text-[#B91C1C] font-bold px-6 h-11"
                >
                  <Link href="/products/pdf-reader">
                    Learn More <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* =========================== SECURE PANEL ============================ */}
        <section className="pb-10 bg-white">
          <div className="container mx-auto max-w-6xl px-6">
            <motion.div
              {...fadeUp}
              className="rounded-3xl bg-[#EAF2FD] border border-blue-100/60 p-8 lg:p-12 grid lg:grid-cols-2 gap-10 items-center overflow-hidden"
            >
              {/* copy */}
              <div className="order-2 lg:order-1">
                <AppIcon src="product-secure.png" alt="Luxor PDF Secure icon" />
                <h3 className="text-2xl lg:text-3xl font-extrabold mt-5 mb-3" style={{ color: NAVY }}>
                  Luxor <span className="text-[#2563EB]">PDF Secure</span>
                </h3>
                <p className="text-[15px] text-slate-600 mb-6">
                  Protect what matters. Secure your PDFs with powerful encryption and control.
                </p>
                <ul className="space-y-3 mb-8">
                  <CheckItem color="#2563EB" text="Password protect & encrypt PDFs" />
                  <CheckItem color="#2563EB" text="Restrict editing, printing & copying" />
                  <CheckItem color="#2563EB" text="Add watermarks & redaction" />
                  <CheckItem color="#2563EB" text="Merge, split, compress & convert PDFs" />
                  <CheckItem color="#2563EB" text="Ensure document privacy & compliance" />
                </ul>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-lg border-[#2563EB] text-[#2563EB] hover:bg-blue-50 hover:text-[#1D4ED8] font-bold px-6 h-11"
                >
                  <Link href="/products/pdf-security">
                    Learn More <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </div>

              {/* devices */}
              <div className="order-1 lg:order-2 relative">
                <Laptop className="max-w-md ml-auto">
                  <div className="aspect-[16/10] bg-white relative">
                    <div className="h-6 bg-slate-50 border-b border-slate-200 flex items-center px-2 gap-2">
                      <Shield className="w-3 h-3 text-[#2563EB]" />
                      <span className="text-[9px] font-bold text-slate-700">Security</span>
                    </div>
                    <div className="p-3">
                      {/* table header */}
                      <div className="grid grid-cols-4 gap-2 px-2 py-1.5 bg-slate-50 rounded text-[7px] font-bold text-slate-500 uppercase">
                        <span>Document</span>
                        <span>Size</span>
                        <span>Status</span>
                        <span>Last Modified</span>
                      </div>
                      {[
                        ["Project Proposal.pdf", "2.4 MB"],
                        ["Financial Report.pdf", "1.1 MB"],
                        ["Contract Draft.pdf", "860 KB"],
                        ["Invoice Batch.pdf", "3.2 MB"],
                        ["Board Notes.pdf", "540 KB"],
                      ].map(([name, size], i) => (
                        <div key={name} className="grid grid-cols-4 gap-2 px-2 py-1.5 border-b border-slate-100 items-center">
                          <span className="text-[7px] font-semibold text-slate-700 truncate flex items-center gap-1">
                            <FileText className="w-2.5 h-2.5 text-[#DC2626] shrink-0" />
                            {name}
                          </span>
                          <span className="text-[7px] text-slate-500">{size}</span>
                          <span className={`text-[6.5px] font-bold px-1.5 py-0.5 rounded-full w-fit ${i % 2 === 0 ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
                            {i % 2 === 0 ? "Encrypted" : "Protected"}
                          </span>
                          <span className="text-[7px] text-slate-400">May {12 + i}, 2026</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Laptop>

                {/* shield lock */}
                <div className="absolute -left-3 bottom-2 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#1E40AF] shadow-xl flex items-center justify-center">
                  <Lock className="w-7 h-7 text-white" />
                </div>

                {/* set password card */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="absolute -right-2 -bottom-4 bg-white rounded-xl shadow-xl border border-slate-100 p-3 w-36"
                >
                  <div className="text-[10px] font-bold text-slate-800 mb-2">Set Password</div>
                  <div className="h-6 rounded border border-slate-200 bg-slate-50 flex items-center px-2 mb-2">
                    <span className="text-[10px] tracking-widest text-slate-400">••••••••</span>
                  </div>
                  <div className="text-[8px] font-semibold text-emerald-600 mb-2">Strong Password</div>
                  <div className="h-6 rounded bg-[#2563EB] text-white text-[9px] font-bold flex items-center justify-center">
                    Apply
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ============================ ESIGN PANEL ============================= */}
        <section className="pb-16 bg-white">
          <div className="container mx-auto max-w-6xl px-6">
            <motion.div
              {...fadeUp}
              className="rounded-3xl bg-[#EAF7EF] border border-green-100/60 p-8 lg:p-12 grid lg:grid-cols-2 gap-10 items-center overflow-hidden"
            >
              {/* devices */}
              <div className="relative">
                <Laptop className="max-w-md">
                  <div className="aspect-[16/10] bg-white relative">
                    <div className="h-6 bg-slate-50 border-b border-slate-200 flex items-center px-2 gap-2">
                      <PenLine className="w-3 h-3 text-[#16A34A]" />
                      <span className="text-[9px] font-bold text-slate-700">LuxorSign</span>
                    </div>
                    <div className="p-4">
                      <div className="text-[12px] font-extrabold mb-1" style={{ color: NAVY }}>
                        Sales Agreement
                      </div>
                      <div className="text-[7px] text-slate-500 mb-2">
                        This Sales Agreement (&quot;Agreement&quot;) is made and entered into…
                      </div>
                      <p className="text-[7px] leading-[1.6] text-slate-500 mb-3">
                        The Seller agrees to deliver the goods described herein, and the Buyer
                        agrees to accept and pay for them under the terms set out below. Both
                        parties confirm they are authorized to enter into this Agreement and that
                        all schedules attached form part of it.
                      </p>
                      <div className="text-[8px] text-slate-600 font-semibold mb-1">12 May 2026</div>
                      <div className="border-t border-slate-300 w-24 pt-1">
                        <svg viewBox="0 0 100 30" className="w-20 h-6 text-slate-800">
                          <path
                            d="M5 22 C 15 5, 25 28, 35 15 S 55 8, 62 18 S 82 25, 95 10"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Laptop>

                {/* signature widget */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="absolute -right-2 -bottom-4 bg-white rounded-xl shadow-xl border border-slate-100 p-3 w-44"
                >
                  <div className="grid grid-cols-3 text-center text-[9px] font-bold border-b border-slate-100 pb-1.5 mb-2">
                    <span className="text-slate-400">Type</span>
                    <span className="text-[#16A34A] border-b-2 border-[#16A34A] pb-1 -mb-[7px]">Draw</span>
                    <span className="text-slate-400">Upload</span>
                  </div>
                  <svg viewBox="0 0 140 40" className="w-full h-10 text-slate-800">
                    <path
                      d="M8 30 C 20 6, 34 38, 48 20 S 76 10, 86 24 S 116 34, 132 12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="flex justify-between mt-2">
                    <span className="text-[9px] font-semibold text-slate-400">Clear</span>
                    <span className="text-[9px] font-bold text-white bg-[#16A34A] rounded px-2.5 py-1">
                      Insert
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* copy */}
              <div>
                <AppIcon src="product-esign.png" alt="Luxor PDF eSign icon" />
                <h3 className="text-2xl lg:text-3xl font-extrabold mt-5 mb-3" style={{ color: NAVY }}>
                  Luxor <span className="text-[#16A34A]">PDF eSign</span>
                </h3>
                <p className="text-[15px] text-slate-600 mb-6">
                  Sign anything, anywhere. The easy and secure way to send and collect eSignatures.
                </p>
                <ul className="space-y-3 mb-8">
                  <CheckItem color="#16A34A" text="Create & send documents for signature" />
                  <CheckItem color="#16A34A" text="Legally valid eSignatures" />
                  <CheckItem color="#16A34A" text="Track status in real-time" />
                  <CheckItem color="#16A34A" text="Works on any device" />
                  <CheckItem color="#16A34A" text="Secure & audit-ready" />
                </ul>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-lg border-[#16A34A] text-[#16A34A] hover:bg-green-50 hover:text-[#15803D] font-bold px-6 h-11"
                >
                  <Link href="/products/esign">
                    Learn More <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* =============================== STATS =============================== */}
        <section className="pb-16 bg-white">
          <div className="container mx-auto max-w-5xl px-6">
            <motion.div {...fadeUp} className="text-center mb-12">
              <h2 className="text-2xl lg:text-3xl font-extrabold mb-3" style={{ color: NAVY }}>
                Trusted by professionals and businesses worldwide
              </h2>
              <p className="text-[15px] text-slate-600">
                Join thousands of users who rely on LuxorPDF every day.
              </p>
            </motion.div>
            <motion.div {...fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-10">
              {[
                { icon: Users, value: "100K+", label: "Happy Users", color: "#DC2626", bg: "bg-red-50", border: "border-red-100" },
                { icon: FileCheck2, value: "1M+", label: "Documents Secured", color: "#2563EB", bg: "bg-blue-50", border: "border-blue-100" },
                { icon: Download, value: "500K+", label: "Downloads", color: "#16A34A", bg: "bg-green-50", border: "border-green-100" },
                { icon: Globe, value: "120+", label: "Countries", color: "#9333EA", bg: "bg-purple-50", border: "border-purple-100" },
              ].map(({ icon: Icon, value, label, color, bg, border }) => (
                <div key={label} className="flex flex-col items-center text-center gap-3">
                  <div className={`w-14 h-14 rounded-2xl ${bg} border ${border} flex items-center justify-center`}>
                    <Icon className="w-6 h-6" style={{ color }} />
                  </div>
                  <div>
                    <div className="text-2xl font-extrabold" style={{ color: NAVY }}>
                      {value}
                    </div>
                    <div className="text-[13px] text-slate-600 mt-0.5">{label}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ============================ MISSION CTA ============================= */}
        <section className="pb-0 bg-white">
          <div className="container mx-auto max-w-6xl px-6 pb-16">
            <motion.div
              {...fadeUp}
              className="rounded-3xl px-8 lg:px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-8"
              style={{ background: "linear-gradient(120deg, #1E1B4B 0%, #27246B 100%)" }}
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl border border-white/20 bg-white/10 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-lg lg:text-xl font-extrabold text-white">
                    One Mission: Make PDF Simple, Secure &amp; Smart.
                  </div>
                  <div className="text-sm text-indigo-200 mt-1">
                    Explore our products and experience the LuxorPDF difference.
                  </div>
                </div>
              </div>
              <Button
                asChild
                className="bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-lg px-6 h-12 shrink-0"
              >
                <Link href="/download">Download All Products</Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
