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
};

const FEATURES: Feature[] = [
  {
    icon: Shield,
    title: "PDF Security",
    description:
      "Protect PDFs with passwords, expiry dates, and restricted access controls.",
  },
  {
    icon: FileText,
    title: "PDF Conversion",
    description:
      "Convert PDF to Word, JPG, PNG, SVG and convert documents back to PDF.",
  },
  {
    icon: Combine,
    title: "Merge PDFs",
    description:
      "Combine multiple PDF files into one clean, organized document.",
  },
  {
    icon: Scissors,
    title: "Split & Extract",
    description:
      "Split large PDFs or extract selected pages with speed and precision.",
  },
  {
    icon: Lock,
    title: "Permission Control",
    description:
      "Disable printing, copying, and unauthorized editing of important files.",
  },
  {
    icon: ImageIcon,
    title: "Image Tools",
    description:
      "Convert images into PDFs and export PDF pages as high-quality images.",
  },
];

export function WorkflowGrid() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section
      id="workflow"
      aria-labelledby="workflow-heading"
      className="py-24 md:py-32 bg-slate-50 border-t border-slate-100"
    >
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FB7185]/10 text-[#FB7185]"
          >
            <Zap className="h-5 w-5" strokeWidth={2.4} aria-hidden="true" />
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
              initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.5,
                delay: index * 0.06,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#312E81]/30 hover:shadow-xl hover:shadow-indigo-950/10"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#312E81]/10 text-[#312E81] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-6deg]">
                <feature.icon
                  className="h-5 w-5"
                  strokeWidth={2.2}
                  aria-hidden="true"
                />
              </div>
              <h3 className="text-lg font-semibold text-slate-950">
                {feature.title}
              </h3>
              <p className="mt-3 leading-7 text-slate-600">
                {feature.description}
              </p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
