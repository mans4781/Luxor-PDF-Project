import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight,
  CheckCircle2,
  Target,
  Telescope,
  Layers,
  Puzzle,
  FileStack,
  HardDriveDownload,
  ShieldAlert,
  Hourglass,
  EyeOff,
  LayoutGrid,
  Sparkles,
  Workflow,
  ShieldCheck,
  Users,
  RefreshCcw,
  HeartHandshake,
  Globe2,
  Star,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

const NAVY = "#1E1B4B";
const RED = "#DC2626";
const BLUE = "#2563EB";
const GREEN = "#16A34A";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
};

const asset = (file: string) => `${import.meta.env.BASE_URL}brand/${file}`;

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-extrabold tracking-[0.2em] text-[#DC2626] uppercase mb-3 text-center">
      {children}
    </div>
  );
}

export default function About2Page() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Navbar />

      <main className="pt-20">
        {/* ================================ HERO ================================ */}
        <section className="relative overflow-hidden bg-gradient-to-br from-red-50/70 via-white to-rose-50/50">
          <div className="container mx-auto max-w-[88rem] px-6 pt-12 lg:pt-16 pb-16">
            <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
              <motion.div {...fadeUp}>
                <div className="inline-flex items-center gap-1.5 bg-white border border-red-100 text-[#DC2626] rounded-full px-3.5 py-1.5 text-xs font-bold shadow-sm mb-5">
                  <Sparkles className="w-3.5 h-3.5" />
                  About Luxor PDF
                </div>
                <h1
                  className="text-4xl lg:text-[44px] font-extrabold leading-[1.12] mb-5"
                  style={{ color: NAVY }}
                >
                  Smarter PDF Tools. Secure Documents.{" "}
                  <span className="text-[#DC2626]">Simpler Workflows.</span>
                </h1>
                <p className="text-[16px] text-slate-600 leading-relaxed max-w-lg mb-4">
                  Luxor PDF is a modern document productivity platform created to make working
                  with PDF files simpler, faster, and more secure.
                </p>
                <p className="text-[15px] text-slate-600 leading-relaxed max-w-lg mb-7">
                  From opening and reviewing everyday documents to protecting confidential files
                  and completing legally important signature workflows, Luxor PDF brings essential
                  document tools together in one professional software ecosystem.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <a href="#products">
                    <Button className="bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-xl px-6 h-11">
                      Explore Our Products
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                  <Link href="/pricing">
                    <Button
                      variant="outline"
                      className="rounded-xl px-6 h-11 font-bold border-slate-300 text-slate-700"
                    >
                      View Pricing
                    </Button>
                  </Link>
                </div>
              </motion.div>

              <motion.div {...fadeUp} className="relative">
                <img
                  src={asset("about2-team.webp")}
                  alt="The people behind Luxor PDF collaborating"
                  className="rounded-3xl shadow-2xl w-full object-cover aspect-[4/3]"
                />
                {/* floating stat cards */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="absolute -bottom-5 -left-3 lg:-left-6 bg-white rounded-2xl shadow-xl border border-slate-100 px-4 py-3 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                    <Users className="w-5 h-5 text-[#DC2626]" />
                  </div>
                  <div>
                    <div className="text-[15px] font-extrabold leading-tight" style={{ color: NAVY }}>
                      50,000+
                    </div>
                    <div className="text-[11px] text-slate-500">Professionals trust us</div>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: -14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="absolute -top-4 right-4 bg-white rounded-2xl shadow-xl border border-slate-100 px-4 py-3 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Globe2 className="w-5 h-5 text-[#2563EB]" />
                  </div>
                  <div>
                    <div className="text-[15px] font-extrabold leading-tight" style={{ color: NAVY }}>
                      120+ countries
                    </div>
                    <div className="text-[11px] text-slate-500">Documents managed daily</div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ============================ PRODUCT SUITE ============================ */}
        <section id="products" className="py-16 bg-white scroll-mt-20">
          <div className="container mx-auto max-w-[88rem] px-6">
            <motion.div {...fadeUp}>
              <SectionLabel>One Connected Ecosystem</SectionLabel>
              <h2
                className="text-2xl lg:text-[30px] font-extrabold text-center mb-10"
                style={{ color: NAVY }}
              >
                Three Products. One Product Family.
              </h2>
            </motion.div>
            <motion.div {...fadeUp} className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: "product-reader.webp",
                  tint: "bg-[#FDECEC] border-red-100/60",
                  color: RED,
                  name: "Reader",
                  href: "/products/pdf-reader",
                  text: "A fast, reliable, and user-friendly PDF reader designed for comfortable everyday document viewing, navigation, annotation, printing, and management.",
                },
                {
                  icon: "product-secure.webp",
                  tint: "bg-[#EAF2FD] border-blue-100/60",
                  color: BLUE,
                  name: "Secure",
                  href: "/products/pdf-security",
                  text: "A powerful PDF security and document-management solution to protect, organize, convert, compress, merge, split, watermark, and securely share PDF files.",
                },
                {
                  icon: "product-esign.webp",
                  tint: "bg-[#EAF7EF] border-green-100/60",
                  color: GREEN,
                  name: "eSign",
                  href: "/products/esign",
                  text: "A streamlined electronic-signature solution that helps individuals and businesses prepare, send, sign, track, and manage documents without paper-based delays.",
                },
              ].map(({ icon, tint, color, name, href, text }) => (
                <div key={name} className={`rounded-3xl border p-7 flex flex-col ${tint}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-14 h-14 rounded-2xl shadow-md bg-white ring-1 ring-slate-900/5 overflow-hidden shrink-0 flex items-center justify-center">
                      <img
                        src={asset(icon)}
                        alt={`Luxor PDF ${name} icon`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <h3 className="text-lg font-extrabold leading-tight" style={{ color: NAVY }}>
                      Luxor PDF
                      <br />
                      <span style={{ color }}>{name}</span>
                    </h3>
                  </div>
                  <p className="text-[13px] text-slate-600 leading-relaxed mb-5">{text}</p>
                  <Link
                    href={href}
                    className="mt-auto inline-flex items-center gap-1.5 text-[13px] font-bold"
                    style={{ color }}
                  >
                    Learn more <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ============================= WHAT WE DO ============================= */}
        <section className="py-16 bg-slate-50">
          <div className="container mx-auto max-w-[88rem] px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div {...fadeUp} className="relative order-2 lg:order-1">
                {/* laptop mockup with readable LuxorPDF document */}
                <div className="max-w-xl mx-auto">
                  <div className="rounded-t-xl border-[8px] border-slate-800 bg-white overflow-hidden shadow-2xl">
                    <div className="bg-slate-100 relative">
                      <div className="h-8 bg-white border-b border-slate-200 flex items-center px-3 gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="ml-3 text-[11px] font-extrabold tracking-tight text-[#DC2626]">
                          LUXOR<span className="text-slate-800">PDF</span>
                        </span>
                        <div className="ml-3 hidden sm:flex items-center gap-3">
                          {["View", "Annotate", "Convert", "Protect", "Sign"].map((t, i) => (
                            <span
                              key={t}
                              className={`text-[10px] font-semibold ${i === 0 ? "text-[#DC2626]" : "text-slate-500"}`}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="bg-white rounded-lg shadow-md p-5">
                          <div className="text-[17px] font-extrabold mb-1" style={{ color: NAVY }}>
                            Everyday Documents, <span className="text-[#DC2626]">Done Right</span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-slate-600 mb-3">
                            Luxor PDF keeps your daily document work simple — open a file, review
                            it, protect it, and send it for signature without switching apps.
                          </p>
                          <div className="flex gap-3">
                            <div className="flex-1 min-w-0">
                              <ul className="space-y-1.5">
                                {[
                                  "Read & annotate instantly",
                                  "Protect with passwords",
                                  "Sign & track agreements",
                                ].map((item) => (
                                  <li key={item} className="flex items-start gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 mt-px shrink-0 text-[#DC2626]" />
                                    <span className="text-[11px] font-semibold text-slate-700">
                                      {item}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                              <div className="mt-3 inline-flex items-center gap-1.5 bg-[#DC2626] text-white rounded-md px-2.5 py-1.5 text-[10px] font-bold">
                                Open a PDF <ArrowRight className="w-3 h-3" />
                              </div>
                            </div>
                            <img
                              src={asset("home3-office.webp")}
                              alt="Team reviewing documents in Luxor PDF"
                              className="w-32 rounded-md object-cover shrink-0 hidden sm:block"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="h-3.5 bg-slate-300 rounded-b-xl shadow-md mx-[-4%] flex justify-center">
                    <div className="w-20 h-1.5 bg-slate-400/60 rounded-b" />
                  </div>
                </div>
                <div className="absolute -bottom-4 right-6 bg-white rounded-xl shadow-lg border border-slate-100 px-4 py-2.5 flex items-center gap-2">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-bold text-slate-700">
                    Built for everyday document work
                  </span>
                </div>
              </motion.div>
              <motion.div {...fadeUp} className="order-1 lg:order-2">
                <div className="text-xs font-extrabold tracking-[0.2em] text-[#DC2626] uppercase mb-3">
                  What We Do
                </div>
                <h2
                  className="text-2xl lg:text-[30px] font-extrabold leading-tight mb-4"
                  style={{ color: NAVY }}
                >
                  Practical Software for People Who Work With Documents Every Day
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  We help individuals, professionals, educational institutions, legal teams,
                  financial organizations, government offices, and businesses manage their
                  documents with greater speed, control, and confidence.
                </p>
                <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
                  {[
                    "Open and read documents effortlessly",
                    "Annotate, search, and print PDFs",
                    "Merge, split, and reorganize pages",
                    "Convert between common file formats",
                    "Compress large files for easy sharing",
                    "Protect files with passwords & permissions",
                    "Set expiration dates or revoke access",
                    "Send, sign, and track agreements",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-[#DC2626]" />
                      <span className="text-[13px] text-slate-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* =========================== MISSION & VISION ========================== */}
        <section className="py-16 bg-white">
          <div className="container mx-auto max-w-[88rem] px-6">
            <motion.div {...fadeUp} className="grid md:grid-cols-2 gap-6">
              <div className="rounded-3xl bg-[#FDECEC] border border-red-100/60 p-8">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-[#DC2626]" />
                </div>
                <h3 className="text-xl font-extrabold mb-3" style={{ color: NAVY }}>
                  Our Mission
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">
                  To make professional PDF tools accessible, dependable, and easy to use for
                  everyone — powerful features without complicated interfaces, unnecessary steps,
                  or expensive software packages.
                </p>
                <p className="text-sm font-semibold" style={{ color: NAVY }}>
                  Document software should not slow people down. It should help them move forward.
                </p>
              </div>
              <div className="rounded-3xl bg-[#EAF2FD] border border-blue-100/60 p-8">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4">
                  <Telescope className="w-6 h-6 text-[#2563EB]" />
                </div>
                <h3 className="text-xl font-extrabold mb-3" style={{ color: NAVY }}>
                  Our Vision
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">
                  To build a trusted global document productivity ecosystem — one connected
                  platform where documents are viewed, edited, protected, shared, signed, tracked,
                  and managed with confidence.
                </p>
                <p className="text-sm font-semibold" style={{ color: NAVY }}>
                  Simple for everyday users. Powerful for teams. Secure for confidential work.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ========================== PROBLEMS WE SOLVE ========================== */}
        <section className="py-16 bg-slate-50">
          <div className="container mx-auto max-w-[88rem] px-6">
            <motion.div {...fadeUp}>
              <SectionLabel>The Problems We Solve</SectionLabel>
              <h2
                className="text-2xl lg:text-[30px] font-extrabold text-center mb-10"
                style={{ color: NAVY }}
              >
                Document Work Shouldn&rsquo;t Be This Hard
              </h2>
            </motion.div>
            <motion.div {...fadeUp} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: Puzzle, color: RED, bg: "bg-red-50", title: "Complicated, Expensive Software", text: "Many PDF apps are too limited for professional work or too complex and costly for everyday users. We deliver advanced capabilities through a cleaner experience." },
                { icon: Layers, color: BLUE, bg: "bg-blue-50", title: "Too Many Separate Apps", text: "One app to read, another to convert, another to secure, another to sign. Luxor PDF brings these workflows together in three connected products." },
                { icon: FileStack, color: GREEN, bg: "bg-green-50", title: "Difficult Page Management", text: "Rearranging, extracting, merging, or splitting pages can be unnecessarily hard. We make page-level management fast and intuitive." },
                { icon: HardDriveDownload, color: "#9333EA", bg: "bg-purple-50", title: "Large, Hard-to-Share Files", text: "Big PDFs are hard to upload, email, and store. Our compression tools reduce file size while keeping practical quality." },
                { icon: ShieldAlert, color: RED, bg: "bg-red-50", title: "Unprotected Confidential Files", text: "Sensitive documents are often shared with no access controls. Luxor PDF Secure adds passwords, restrictions, watermarks, and expiry." },
                { icon: Hourglass, color: BLUE, bg: "bg-blue-50", title: "Slow Paper Signatures", text: "Print, sign, scan, email — delays everywhere. Luxor PDF eSign moves documents from preparation to completion efficiently." },
                { icon: EyeOff, color: GREEN, bg: "bg-green-50", title: "No Visibility Into Status", text: "Was it opened? Signed? Still waiting? eSign provides a clearer, more organized signing workflow with better tracking." },
                { icon: LayoutGrid, color: "#9333EA", bg: "bg-purple-50", title: "Cluttered, Outdated Interfaces", text: "Crowded menus make features hard to find. Luxor PDF focuses on a modern, organized interface that gets you to the right tool quickly." },
                { icon: Workflow, color: RED, bg: "bg-red-50", title: "Broken Workflows", text: "Jumping between tools breaks focus. Our suite supports the complete PDF workflow from first open to final signature." },
              ].map(({ icon: Icon, color, bg, title, text }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-slate-100 shadow-sm bg-white p-6"
                >
                  <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <div className="text-[14px] font-bold text-slate-800 mb-1.5">{title}</div>
                  <div className="text-xs text-slate-500 leading-relaxed">{text}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ============================= WHY CHOOSE ============================= */}
        <section className="py-16 bg-white">
          <div className="container mx-auto max-w-[88rem] px-6">
            <div className="grid lg:grid-cols-[0.85fr_2fr] gap-10 items-start">
              <motion.div {...fadeUp}>
                <div className="text-xs font-extrabold tracking-[0.2em] text-[#DC2626] uppercase mb-3">
                  Why Choose Luxor PDF
                </div>
                <h2
                  className="text-2xl lg:text-[30px] font-extrabold leading-tight mb-4"
                  style={{ color: NAVY }}
                >
                  Built Around the Way People Actually Work
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                  Every feature is designed around practical problems faced by individuals and
                  organizations — from personal productivity to professional business operations.
                </p>
                <Link href="/pricing">
                  <Button className="bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-xl px-5 h-10">
                    Explore Our Plans
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </motion.div>
              <motion.div {...fadeUp} className="grid sm:grid-cols-3 gap-6">
                {[
                  {
                    img: "home3-illus-protection.webp",
                    title: "Security-Focused Approach",
                    text: "Tools that help you maintain greater control over confidential and sensitive documents.",
                  },
                  {
                    img: "home3-illus-productivity.webp",
                    title: "Simple by Design",
                    text: "Advanced document functions made easier to understand and use — for first-timers and professionals alike.",
                  },
                  {
                    img: "home3-illus-collab.webp",
                    title: "Flexible for Individuals & Teams",
                    text: "Designed to support personal productivity as well as professional business operations.",
                  },
                ].map(({ img, title, text }) => (
                  <div key={title} className="text-center sm:text-left">
                    <img
                      src={asset(img)}
                      alt={title}
                      className="w-36 h-36 object-contain mx-auto sm:mx-0 mb-3"
                    />
                    <div className="text-[15px] font-bold text-slate-800 mb-1.5">{title}</div>
                    <div className="text-xs text-slate-500 leading-relaxed">{text}</div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* ============================ WHO IT'S FOR ============================ */}
        <section className="py-16 bg-slate-50">
          <div className="container mx-auto max-w-[88rem] px-6 text-center">
            <motion.div {...fadeUp}>
              <SectionLabel>Built for Modern Document Work</SectionLabel>
              <h2
                className="text-2xl lg:text-[30px] font-extrabold mb-4"
                style={{ color: NAVY }}
              >
                Designed for Everyone Who Works With Documents
              </h2>
              <p className="text-sm text-slate-600 max-w-2xl mx-auto mb-8">
                Whether you are reading a report, protecting a confidential agreement,
                reorganizing a project document, or collecting signatures from multiple parties —
                Luxor PDF helps you complete the task efficiently.
              </p>
              <div className="flex flex-wrap justify-center gap-2.5 max-w-3xl mx-auto">
                {[
                  "Individual professionals",
                  "Small & medium businesses",
                  "Corporate teams",
                  "Legal & compliance",
                  "Finance & insurance",
                  "Educational institutions",
                  "Government offices",
                  "Consultants",
                  "Remote teams",
                  "Students & researchers",
                ].map((who) => (
                  <span
                    key={who}
                    className="bg-white border border-slate-200 rounded-full px-4 py-2 text-[13px] font-semibold text-slate-700 shadow-sm"
                  >
                    {who}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ============================= COMMITMENT ============================= */}
        <section className="py-16 bg-white">
          <div className="container mx-auto max-w-5xl px-6">
            <motion.div
              {...fadeUp}
              className="rounded-3xl px-8 py-12 lg:px-14 text-center relative overflow-hidden"
              style={{ background: NAVY }}
            >
              <div
                className="absolute inset-0 opacity-[0.07]"
                style={{
                  backgroundImage: `radial-gradient(circle at 20% 20%, ${RED} 0, transparent 40%), radial-gradient(circle at 80% 80%, ${BLUE} 0, transparent 40%)`,
                }}
              />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-5">
                  <HeartHandshake className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl lg:text-[30px] font-extrabold text-white mb-4">
                  Our Commitment
                </h2>
                <p className="text-[15px] text-white/80 leading-relaxed max-w-2xl mx-auto mb-2">
                  We are committed to building software that respects the value of your time,
                  your work, and your documents.
                </p>
                <p className="text-[16px] font-bold text-white max-w-2xl mx-auto mb-8">
                  Powerful PDF solutions that are easier to use, more secure, and built for the
                  way people work today.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link href="/products/pdf-reader">
                    <Button className="bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-xl px-5 h-11">
                      Explore Reader
                    </Button>
                  </Link>
                  <Link href="/products/pdf-security">
                    <Button className="bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-xl px-5 h-11">
                      Discover Secure
                    </Button>
                  </Link>
                  <Link href="/products/esign">
                    <Button
                      variant="outline"
                      className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white font-bold rounded-xl px-5 h-11"
                    >
                      Get Started with eSign
                    </Button>
                  </Link>
                </div>
                <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 text-[13px] text-white/70 font-semibold">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Protect with confidence
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Read with ease
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <RefreshCcw className="w-4 h-4" /> Sign without delays
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
