import { motion } from "framer-motion";
import { Download, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import ctaIllustration from "@/assets/cta-illustration.png";

/** Illustration lifted from the user's own mockup image. */
function CtaIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[340px]" aria-hidden="true">
      <img
        src={ctaIllustration}
        alt=""
        width={660}
        height={610}
        loading="lazy"
        className="h-auto w-full rounded-2xl"
      />
    </div>
  );
}

export function CTA() {
  return (
    <section className="py-20 md:py-24 relative overflow-hidden bg-gradient-to-b from-white to-[#eef1f9]">
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-[#f6f8fe] to-[#e9effc] p-10 shadow-[0_24px_60px_-24px_rgba(37,99,235,0.25)] md:p-14"
        >
          {/* corner dot accents */}
          <div
            className="pointer-events-none absolute right-6 bottom-6 h-20 w-28 opacity-60"
            style={{
              backgroundImage: "radial-gradient(circle at 2px 2px, #b8cdf6 1.6px, transparent 0)",
              backgroundSize: "11px 11px",
            }}
            aria-hidden="true"
          />

          <div className="relative grid grid-cols-1 items-center gap-10 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <CtaIllustration />
            <div>
              <h2 className="font-serif text-4xl font-bold tracking-tight text-slate-900 md:text-[44px] md:leading-[1.15]">
                Ready to work smarter with PDFs?
              </h2>
              <p className="mt-5 max-w-md text-lg leading-8 text-slate-600">
                Join thousands of professionals who trust Luxor PDF to get work
                done—faster and more securely.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button
                  asChild
                  size="lg"
                  className="h-[52px] rounded-xl bg-[#2563EB] px-7 text-base font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-[#1D4ED8]"
                >
                  <Link href="/download">
                    <Download className="mr-1 h-[18px] w-[18px]" />
                    Download Luxor PDF
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-[52px] rounded-xl border-[#bfd3f8] bg-white px-7 text-base font-semibold text-[#2563EB] hover:bg-blue-50 hover:text-[#1D4ED8]"
                >
                  <Link href="/pricing">
                    <Crown className="mr-1 h-[18px] w-[18px]" />
                    View Plans
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
