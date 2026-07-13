import { motion } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowRight,
  BookOpen,
  PenSquare,
  Repeat,
  Shield,
  ShieldCheck,
  PenLine,
  Minimize2,
  Combine,
  Scissors,
  Eye,
  KeyRound,
  PenTool,
  FileOutput,
  Share2,
  FolderOpen,
  Settings2,
  Lock,
  Star,
  CheckCircle2,
  Sparkles,
  FileText,
  Download,
} from "lucide-react";
import secureVault from "@/assets/secure-vault.webp";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

const NAVY = "#1E1B4B";
const RED = "#DC2626";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
};

const asset = (file: string) => `${import.meta.env.BASE_URL}brand/${file}`;

/* ----------------------------- Small helpers ------------------------------ */

function Stars({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`${className} fill-amber-400 text-amber-400`} />
      ))}
    </div>
  );
}

function CheckItem({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <li className="flex items-start gap-2">
      <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color }} />
      <span className="text-[14px] text-slate-600">{children}</span>
    </li>
  );
}

function ProductIcon({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="w-14 h-14 shrink-0 flex items-center justify-center">
      <img src={asset(src)} alt={alt} className="w-full h-full object-contain" />
    </div>
  );
}

/* --------------------------------- Page ----------------------------------- */

export default function Home3Page() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Navbar />

      <main className="pt-20">
        {/* ================================ HERO ================================ */}
        <section className="relative overflow-hidden bg-gradient-to-br from-red-50/70 via-white to-rose-50/50">
          <div className="container mx-auto max-w-[88rem] px-6 pt-12 lg:pt-16 pb-14">
            <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-12 items-center">
              {/* Left copy */}
              <motion.div {...fadeUp}>
                <div className="inline-flex items-center gap-1.5 bg-white border border-red-100 text-[#DC2626] rounded-full px-3.5 py-1.5 text-[13px] font-bold shadow-sm mb-5">
                  <Sparkles className="w-3.5 h-3.5" />
                  All-in-One PDF Solution
                </div>
                <h1
                  className="text-4xl lg:text-[46px] font-extrabold leading-[1.12] mb-5"
                  style={{ color: NAVY }}
                >
                  Smarter PDF Reading, Editing &amp; Security —{" "}
                  <span className="text-[#DC2626]">All in One Place</span>
                </h1>
                <p className="text-[16px] text-slate-600 leading-relaxed max-w-md mb-7">
                  Read, annotate, edit, convert, compress, organize, and protect PDFs with speed
                  and confidence. Everything you need to work with documents &mdash; beautifully
                  together.
                </p>
                <div className="flex flex-wrap items-center gap-3 mb-7">
                  <Link
                    href="/products/pdf-reader"
                    data-testid="hero-download-reader-button"
                  >
                    <Button className="bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-xl px-6 h-11">
                      <Download className="w-4 h-4 mr-2" />
                      Download Now
                    </Button>
                  </Link>
                  <a href="#products">
                    <Button
                      variant="outline"
                      className="rounded-xl px-6 h-11 font-bold border-slate-300 text-slate-700"
                    >
                      Explore Products
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {["home3-avatar1.webp", "home3-avatar2.webp", "home3-avatar3.webp"].map((a) => (
                      <img
                        key={a}
                        src={asset(a)}
                        alt="LuxorPDF user"
                        className="w-8 h-8 rounded-full border-2 border-white object-cover"
                      />
                    ))}
                  </div>
                  <div>
                    <Stars />
                    <div className="text-[13px] text-slate-500 mt-0.5">
                      Trusted by 50,000+ professionals worldwide
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Right visual */}
              <motion.div {...fadeUp} className="relative">
                <img
                  src={asset("hero-app.webp")}
                  alt="LuxorPDF app showing a protected monthly report with PDF tools"
                  className="w-full lg:scale-110 lg:origin-center select-none"
                  draggable={false}
                />
              </motion.div>
            </div>

            {/* ----------------------------- Tools row ----------------------------- */}
            <motion.div
              {...fadeUp}
              className="mt-14 bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-6 grid grid-cols-4 md:grid-cols-8 gap-y-6"
            >
              {[
                { icon: BookOpen, label: "Read" },
                { icon: PenSquare, label: "Edit" },
                { icon: Repeat, label: "Convert" },
                { icon: Shield, label: "Secure" },
                { icon: PenLine, label: "Sign" },
                { icon: Minimize2, label: "Compress" },
                { icon: Combine, label: "Merge" },
                { icon: Scissors, label: "Split" },
              ].map(({ icon: Icon, label }, i) => (
                <div
                  key={label}
                  className={`flex flex-col items-center gap-2 ${i < 7 ? "md:border-r md:border-slate-100" : ""}`}
                >
                  <Icon className="w-5 h-5 text-[#DC2626]" />
                  <span className="text-[13px] font-semibold text-slate-700">{label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ============================== PRODUCTS ============================== */}
        <section id="products" className="py-14 bg-white scroll-mt-20">
          <motion.div {...fadeUp} className="container mx-auto max-w-[88rem] px-6 text-center mb-10">
            <h2 className="text-[34px] md:text-[40px] font-extrabold tracking-tight" style={{ color: NAVY }}>
              One Suite. <span className="text-[#DC2626]">Three Powerful Apps.</span>
            </h2>
            <p className="mt-3 text-slate-600 text-base md:text-lg max-w-2xl mx-auto">
              Read, eSign, and protect your PDFs with dedicated apps that work seamlessly under a single Luxor account.
            </p>
          </motion.div>
          <div className="container mx-auto max-w-[88rem] px-6 grid md:grid-cols-3 gap-6">
            {/* Reader */}
            <motion.div
              {...fadeUp}
              className="rounded-3xl bg-[#FDECEC] border border-red-100/60 p-7 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-1.5">
                <ProductIcon src="product-reader.webp" alt="Luxor PDF Reader icon" />
                <h3 className="text-lg font-extrabold leading-tight" style={{ color: NAVY }}>
                  Luxor PDF
                  <br />
                  <span className="text-[#DC2626]">Reader</span>
                </h3>
              </div>
              <p className="text-[14px] text-slate-600 mb-4">
                A fast, lightweight PDF reader with powerful annotation tools.
              </p>
              <ul className="space-y-2 mb-5">
                <CheckItem color={RED}>Ultra-fast PDF viewing</CheckItem>
                <CheckItem color={RED}>Annotate &amp; highlight</CheckItem>
                <CheckItem color={RED}>Fill &amp; form support</CheckItem>
                <CheckItem color={RED}>Night mode &amp; more</CheckItem>
              </ul>
              {/* mini laptop */}
              <div className="mt-auto mb-5">
                <div className="rounded-t-md border-[5px] border-slate-800 bg-white overflow-hidden shadow-lg max-w-[230px] mx-auto">
                  <div className="aspect-[16/10] bg-white p-2.5">
                    <div className="text-[8px] font-extrabold" style={{ color: NAVY }}>
                      Build <span className="text-[#DC2626]">with Confidence</span>
                    </div>
                    <div className="flex gap-1.5 mt-1">
                      <p className="flex-1 text-[4.5px] leading-[1.7] text-slate-500">
                        Open any PDF instantly, mark it up with highlights and comments, and share
                        it with your team in a clean, distraction-free workspace.
                      </p>
                      <img
                        src={asset("home2-mountain.webp")}
                        alt="Sample PDF page"
                        className="w-9 h-11 rounded-sm object-cover shrink-0"
                      />
                    </div>
                  </div>
                </div>
                <div className="h-2 bg-slate-300 rounded-b-md shadow mx-6" />
              </div>
              <Link
                href="/products/pdf-reader"
                className="inline-flex items-center gap-1.5 text-[14px] font-bold text-[#DC2626]"
              >
                Learn more <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>

            {/* Secure */}
            <motion.div
              {...fadeUp}
              className="rounded-3xl bg-[#EAF2FD] border border-blue-100/60 p-7 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-1.5">
                <ProductIcon src="product-secure.webp" alt="Luxor PDF Secure icon" />
                <h3 className="text-lg font-extrabold leading-tight" style={{ color: NAVY }}>
                  Luxor PDF
                  <br />
                  <span className="text-[#2563EB]">Secure</span>
                </h3>
              </div>
              <p className="text-[14px] text-slate-600 mb-4">
                Advanced PDF protection to keep your documents safe.
              </p>
              <ul className="space-y-2 mb-5">
                <CheckItem color="#2563EB">Encrypt PDFs</CheckItem>
                <CheckItem color="#2563EB">Password protection</CheckItem>
                <CheckItem color="#2563EB">Redaction &amp; permissions</CheckItem>
                <CheckItem color="#2563EB">Digital certificate support</CheckItem>
              </ul>
              {/* 3D vault visual */}
              <div className="mt-auto mb-5 flex items-center justify-center py-1">
                <img
                  src={secureVault}
                  alt="Luxor PDF Secure vault illustration"
                  className="w-36 h-36 object-contain drop-shadow-xl"
                  loading="lazy"
                />
              </div>
              <Link
                href="/products/pdf-security"
                className="inline-flex items-center gap-1.5 text-[14px] font-bold text-[#2563EB]"
              >
                Learn more <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>

            {/* eSign */}
            <motion.div
              {...fadeUp}
              className="rounded-3xl bg-[#EAF7EF] border border-green-100/60 p-7 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-1.5">
                <ProductIcon src="product-esign.webp" alt="Luxor PDF eSign icon" />
                <h3 className="text-lg font-extrabold leading-tight" style={{ color: NAVY }}>
                  Luxor PDF
                  <br />
                  <span className="text-[#16A34A]">eSign</span>
                </h3>
                <span className="ml-auto self-start rounded-full bg-[#16A34A]/10 border border-[#16A34A]/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#15803D]">
                  Coming soon
                </span>
              </div>
              <p className="text-[14px] text-slate-600 mb-4">
                Legally binding eSignatures made simple and secure.
              </p>
              <ul className="space-y-2 mb-5">
                <CheckItem color="#16A34A">eSign in seconds</CheckItem>
                <CheckItem color="#16A34A">Invite &amp; track signers</CheckItem>
                <CheckItem color="#16A34A">Audit trail &amp; verification</CheckItem>
                <CheckItem color="#16A34A">Cloud compliant</CheckItem>
              </ul>
              {/* tablet visual with live signature */}
              <div className="mt-auto mb-5 flex items-center justify-center py-2">
                <div className="w-44 rounded-xl border-[5px] border-slate-800 bg-white shadow-lg p-3 rotate-[-4deg]">
                  <div className="text-[8px] font-extrabold text-slate-800 mb-1">
                    Service Agreement
                  </div>
                  <div className="space-y-[3px] mb-2">
                    <div className="h-[3px] w-full bg-slate-200 rounded-full" />
                    <div className="h-[3px] w-[92%] bg-slate-200 rounded-full" />
                    <div className="h-[3px] w-[78%] bg-slate-200 rounded-full" />
                  </div>
                  <div className="text-[7px] font-semibold text-slate-500 mb-0.5">Sign here</div>
                  <svg viewBox="0 0 150 40" className="w-full h-9 text-[#1E3A8A]">
                    <motion.path
                      d="M10 30 C 12 18, 18 10, 22 12 C 27 15, 20 32, 16 33 C 24 30, 30 20, 36 22 C 40 24, 36 31, 41 30 C 45 29, 47 22, 51 24 C 54 26, 53 30, 58 28 C 61 26, 63 21, 66 24 C 68 26, 70 29, 74 27 M 82 30 C 86 16, 92 12, 96 15 C 99 18, 92 30, 88 31 C 96 28, 102 20, 108 23 C 111 25, 108 30, 113 29 C 118 27, 122 20, 127 23 C 130 25, 132 28, 140 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true, amount: 0.6 }}
                      transition={{ duration: 2.2, ease: "easeInOut", delay: 0.4 }}
                    />
                  </svg>
                  <div className="h-[3px] w-full bg-slate-300 rounded-full" />
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-[6px] font-semibold text-slate-400">Alex Morrin</span>
                    <span className="text-[6px] font-bold text-white bg-[#16A34A] rounded px-1.5 py-0.5">
                      Done
                    </span>
                  </div>
                </div>
              </div>
              <Link
                href="/products/esign"
                className="inline-flex items-center gap-1.5 text-[14px] font-bold text-[#16A34A]"
              >
                Learn more <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ============================ FEATURE GRID ============================ */}
        <section className="py-14 bg-white">
          <div className="container mx-auto max-w-[88rem] px-6">
            <motion.h2
              {...fadeUp}
              className="text-[26px] lg:text-[30px] font-extrabold text-center mb-10"
              style={{ color: NAVY }}
            >
              Everything You Need in One Powerful PDF Suite
            </motion.h2>
            <motion.div {...fadeUp} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { icon: Eye, title: "Fast Viewing", text: "Open large PDFs instantly with smooth performance.", color: RED, bg: "bg-red-50" },
                { icon: ShieldCheck, title: "PDF Security", text: "Protect documents with advanced encryption.", color: "#2563EB", bg: "bg-blue-50" },
                { icon: KeyRound, title: "Password Protection", text: "Set passwords and control access permissions.", color: "#16A34A", bg: "bg-green-50" },
                { icon: PenTool, title: "Digital Signatures", text: "Add legally binding eSignatures with ease.", color: "#9333EA", bg: "bg-purple-50" },
                { icon: FileOutput, title: "File Conversion", text: "Convert PDFs to Word, Excel, PPT, JPG and more.", color: RED, bg: "bg-red-50" },
                { icon: Combine, title: "Merge & Split", text: "Combine multiple PDFs or split pages effortlessly.", color: "#2563EB", bg: "bg-blue-50" },
                { icon: Minimize2, title: "Compression", text: "Reduce file size without losing quality.", color: "#16A34A", bg: "bg-green-50" },
                { icon: Share2, title: "Easy Sharing", text: "Share, collaborate and track PDFs securely.", color: "#9333EA", bg: "bg-purple-50" },
              ].map(({ icon: Icon, title, text, color, bg }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-slate-100 shadow-sm bg-white p-5 flex gap-3.5"
                >
                  <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <div>
                    <div className="text-[15px] font-bold text-slate-800 mb-0.5">{title}</div>
                    <div className="text-[13px] text-slate-500 leading-relaxed">{text}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* =============================== 4 STEPS ============================== */}
        <section className="py-14 bg-white">
          <div className="container mx-auto max-w-[88rem] px-6">
            <motion.h2
              {...fadeUp}
              className="text-[26px] lg:text-[30px] font-extrabold text-center mb-10"
              style={{ color: NAVY }}
            >
              Work Smarter. In 4 Simple Steps.
            </motion.h2>
            <motion.div {...fadeUp} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { n: 1, icon: FolderOpen, title: "Open", text: "Upload or open your PDF in seconds.", color: RED, bg: "bg-red-50" },
                { n: 2, icon: Settings2, title: "Manage", text: "Read, edit, annotate and organize easily.", color: "#2563EB", bg: "bg-blue-50" },
                { n: 3, icon: Lock, title: "Secure", text: "Protect with passwords, redactions and more.", color: "#16A34A", bg: "bg-green-50" },
                { n: 4, icon: PenLine, title: "Share or Sign", text: "Share securely or collect legally binding eSignatures.", color: "#9333EA", bg: "bg-purple-50" },
              ].map(({ n, icon: Icon, title, text, color, bg }) => (
                <div
                  key={n}
                  className="rounded-2xl border border-slate-100 shadow-sm bg-white p-6 relative"
                >
                  <div
                    className="absolute -top-3 left-6 w-7 h-7 rounded-full text-white text-[13px] font-extrabold flex items-center justify-center shadow"
                    style={{ background: color }}
                  >
                    {n}
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center mb-3 mt-2`}>
                    <Icon className="w-6 h-6" style={{ color }} />
                  </div>
                  <div className="text-[15px] font-bold text-slate-800 mb-1">{title}</div>
                  <div className="text-[13px] text-slate-500 leading-relaxed">{text}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* =========================== PRODUCTIVITY BAND ======================== */}
        <section className="py-16 bg-slate-50">
          <div className="container mx-auto max-w-[88rem] px-6">
            <div className="grid lg:grid-cols-[0.85fr_2fr] gap-10 items-start">
              <motion.div {...fadeUp}>
                <div className="text-[13px] font-extrabold tracking-[0.2em] text-[#DC2626] uppercase mb-3">
                  Why Choose Luxor PDF
                </div>
                <h2 className="text-[26px] lg:text-[32px] font-extrabold leading-tight mb-4" style={{ color: NAVY }}>
                  Built for Productivity.
                  <br />
                  Trusted for Security.
                </h2>
                <p className="text-[15px] text-slate-600 leading-relaxed mb-6">
                  Luxor PDF combines powerful features with a beautiful experience to help
                  individuals and teams do more, faster and safer.
                </p>
                <Link href="/features">
                  <Button className="bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-xl px-5 h-10">
                    Explore All Features
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </motion.div>

              <motion.div {...fadeUp} className="grid sm:grid-cols-3 gap-6">
                {[
                  {
                    img: "home3-illus-protection.webp",
                    title: "Enterprise-Grade Protection",
                    text: "Bank-level encryption, compliance standards and secure infrastructure to keep your data safe.",
                  },
                  {
                    img: "home3-illus-productivity.webp",
                    title: "Boost Productivity",
                    text: "Powerful tools, AI assistance and seamless workflows to save time and get more done.",
                  },
                  {
                    img: "home3-illus-collab.webp",
                    title: "Simple Collaboration",
                    text: "Share, collaborate and collect signatures with complete transparency and control.",
                  },
                ].map(({ img, title, text }) => (
                  <div key={title} className="text-center sm:text-left">
                    <img
                      src={asset(img)}
                      alt={title}
                      className="w-36 h-36 object-contain mx-auto sm:mx-0 mb-3"
                    />
                    <div className="text-[15px] font-bold text-slate-800 mb-1.5">{title}</div>
                    <div className="text-[13px] text-slate-500 leading-relaxed">{text}</div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* ============================ TESTIMONIALS ============================ */}
        <section className="py-14 bg-white">
          <div className="container mx-auto max-w-[88rem] px-6">
            <motion.h2
              {...fadeUp}
              className="text-[26px] lg:text-[30px] font-extrabold text-center mb-10"
              style={{ color: NAVY }}
            >
              Loved by Professionals Worldwide
            </motion.h2>
            <motion.div {...fadeUp} className="grid md:grid-cols-3 gap-6">
              {[
                {
                  quote:
                    "Luxor PDF Reader is incredibly fast and the annotation tools are perfect for my daily work. Highly recommended!",
                  name: "Sarah Johnson",
                  role: "Project Manager",
                  avatar: "home3-avatar1.webp",
                },
                {
                  quote:
                    "The security features give me peace of mind. We protect sensitive documents with ease.",
                  name: "Michael Chen",
                  role: "IT Security Lead",
                  avatar: "home3-avatar2.webp",
                },
                {
                  quote:
                    "eSigning documents has never been easier. Our clients love the simple experience.",
                  name: "Priya Sharma",
                  role: "Legal Advisor",
                  avatar: "home3-avatar3.webp",
                },
              ].map(({ quote, name, role, avatar }) => (
                <div
                  key={name}
                  className="rounded-2xl border border-slate-100 shadow-sm bg-white p-6 flex flex-col"
                >
                  <div className="text-3xl leading-none text-[#DC2626] font-serif mb-3">&ldquo;</div>
                  <p className="text-[14px] text-slate-600 leading-relaxed mb-5">{quote}</p>
                  <div className="mt-auto flex items-center gap-3">
                    <img
                      src={asset(avatar)}
                      alt={name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="text-[14px] font-bold text-slate-800 leading-tight">{name}</div>
                      <div className="text-[11px] text-slate-500 leading-tight">{role}</div>
                    </div>
                    <Stars className="w-3 h-3" />
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
