import { motion, useReducedMotion } from "framer-motion";
import {
  Zap,
  Shield,
  FileText,
  Combine,
  Scissors,
  Lock,
  Image as ImageIcon,
  type LucideIcon,
} from "lucide-react";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Solid Tailwind classes — must appear as literals so JIT picks them up. */
  iconBg: string;
  iconRing: string;
  iconText: string;
  hoverBorder: string;
  hoverShadow: string;
  gradient: string;
  blob: string;
  hoverTitle: string;
};

const FEATURES: Feature[] = [
  {
    icon: Shield,
    title: "PDF Security",
    description:
      "Protect PDFs with passwords, expiry dates, and restricted access controls.",
    iconBg: "bg-[#DC2626]/10",
    iconRing: "ring-[#DC2626]/20",
    iconText: "text-[#DC2626]",
    hoverBorder: "group-hover:border-[#DC2626]/40",
    hoverShadow: "group-hover:shadow-[#DC2626]/15",
    gradient: "from-[#DC2626] via-[#F43F5E] to-[#FB7185]",
    blob: "bg-[#DC2626]/15",
    hoverTitle: "group-hover:text-[#DC2626]",
  },
  {
    icon: FileText,
    title: "PDF Conversion",
    description:
      "Convert PDF to Word, JPG, PNG, SVG and convert documents back to PDF.",
    iconBg: "bg-[#2563EB]/10",
    iconRing: "ring-[#2563EB]/20",
    iconText: "text-[#2563EB]",
    hoverBorder: "group-hover:border-[#2563EB]/40",
    hoverShadow: "group-hover:shadow-[#2563EB]/15",
    gradient: "from-[#1D4ED8] via-[#2563EB] to-[#60A5FA]",
    blob: "bg-[#2563EB]/15",
    hoverTitle: "group-hover:text-[#2563EB]",
  },
  {
    icon: Combine,
    title: "Merge PDFs",
    description:
      "Combine multiple PDF files into one clean, organized document.",
    iconBg: "bg-[#312E81]/10",
    iconRing: "ring-[#312E81]/20",
    iconText: "text-[#312E81]",
    hoverBorder: "group-hover:border-[#312E81]/40",
    hoverShadow: "group-hover:shadow-[#312E81]/15",
    gradient: "from-[#1E1B4B] via-[#312E81] to-[#6366F1]",
    blob: "bg-[#312E81]/15",
    hoverTitle: "group-hover:text-[#312E81]",
  },
  {
    icon: Scissors,
    title: "Split & Extract",
    description:
      "Split large PDFs or extract selected pages with speed and precision.",
    iconBg: "bg-[#E11D48]/10",
    iconRing: "ring-[#E11D48]/20",
    iconText: "text-[#E11D48]",
    hoverBorder: "group-hover:border-[#E11D48]/40",
    hoverShadow: "group-hover:shadow-[#E11D48]/15",
    gradient: "from-[#E11D48] via-[#FB7185] to-[#FDA4AF]",
    blob: "bg-[#FB7185]/15",
    hoverTitle: "group-hover:text-[#E11D48]",
  },
  {
    icon: Lock,
    title: "Permission Control",
    description:
      "Disable printing, copying, and unauthorized editing of important files.",
    iconBg: "bg-[#059669]/10",
    iconRing: "ring-[#059669]/20",
    iconText: "text-[#059669]",
    hoverBorder: "group-hover:border-[#059669]/40",
    hoverShadow: "group-hover:shadow-[#059669]/15",
    gradient: "from-[#047857] via-[#059669] to-[#34D399]",
    blob: "bg-[#059669]/15",
    hoverTitle: "group-hover:text-[#059669]",
  },
  {
    icon: ImageIcon,
    title: "Image Tools",
    description:
      "Convert images into PDFs and export PDF pages as high-quality images.",
    iconBg: "bg-[#D97706]/10",
    iconRing: "ring-[#D97706]/20",
    iconText: "text-[#D97706]",
    hoverBorder: "group-hover:border-[#D97706]/40",
    hoverShadow: "group-hover:shadow-[#D97706]/15",
    gradient: "from-[#B45309] via-[#D97706] to-[#FBBF24]",
    blob: "bg-[#D97706]/15",
    hoverTitle: "group-hover:text-[#D97706]",
  },
];

export function WorkflowGrid() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="workflow"
      aria-labelledby="workflow-heading"
      className="py-24 md:py-32 bg-gradient-to-b from-slate-50 via-white to-slate-50 border-t border-slate-100 relative overflow-hidden"
    >
      {/* Section-level decorative glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-[#312E81]/5 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-[#DC2626]/5 blur-3xl"
      />

      <div className="container mx-auto px-6 relative">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12, scale: 0.8 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#DC2626] via-[#FB7185] to-[#F59E0B] text-white shadow-lg shadow-[#DC2626]/30"
          >
            <Zap className="h-6 w-6" strokeWidth={2.6} aria-hidden="true" />
          </motion.div>
          <motion.h2
            id="workflow-heading"
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl font-black tracking-tight text-slate-950 md:text-5xl"
          >
            Everything your PDF workflow needs
          </motion.h2>
          <motion.p
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 text-lg leading-8 text-slate-600"
          >
            A complete PDF solution for document reading, conversion, editing,
            organization, and protection.
          </motion.p>
        </div>

        {/* Cards */}
        <ul
          className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          role="list"
        >
          {FEATURES.map((feature, index) => (
            <motion.li
              key={feature.title}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.55,
                delay: index * 0.07,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={`group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 pt-7 shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl ${feature.hoverBorder} ${feature.hoverShadow}`}
            >
              {/* Top gradient accent bar */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient} opacity-80 transition-opacity duration-500 group-hover:opacity-100`}
                aria-hidden="true"
              />

              {/* Soft animated blob in corner */}
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full ${feature.blob} blur-3xl opacity-0 transition-opacity duration-700 group-hover:opacity-100`}
              />

              <div className="relative">
                <div
                  className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ring-1 ${feature.iconBg} ${feature.iconRing} ${feature.iconText} transition-all duration-500 group-hover:scale-110 group-hover:rotate-[-6deg] group-hover:shadow-lg`}
                >
                  <feature.icon
                    className="h-6 w-6"
                    strokeWidth={2.4}
                    aria-hidden="true"
                  />
                </div>
                <h3
                  className={`text-lg font-bold text-slate-950 transition-colors duration-300 ${feature.hoverTitle}`}
                >
                  {feature.title}
                </h3>
                <p className="mt-3 leading-7 text-slate-600">
                  {feature.description}
                </p>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
