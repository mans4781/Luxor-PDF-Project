import { motion } from "framer-motion";
import { ArrowRight, Monitor, WifiOff, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function DesktopApp() {
  return (
    <section id="desktop" className="py-24 md:py-32 bg-gradient-to-b from-slate-50 via-indigo-50/40 to-slate-50 border-t border-slate-200 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="order-2 lg:order-1"
          >
            <div className="relative w-full max-w-lg mx-auto aspect-[4/3] rounded-2xl border border-slate-200 shadow-2xl shadow-slate-900/10 bg-white flex items-center justify-center p-8 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-9 bg-slate-50 border-b border-slate-200 flex items-center px-4 gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              </div>
              <div className="mt-8 text-center">
                <Monitor className="w-14 h-14 text-[#312E81] mx-auto mb-4" strokeWidth={1.5} />
                <div className="h-2 w-32 bg-slate-200 rounded mx-auto mb-2" />
                <div className="h-2 w-48 bg-slate-200 rounded mx-auto mb-6" />
                <div className="grid grid-cols-3 gap-3 mt-8">
                  <div className="h-14 w-14 bg-slate-100 rounded-md" />
                  <div className="h-14 w-14 bg-slate-100 rounded-md" />
                  <div className="h-14 w-14 bg-slate-100 rounded-md" />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="order-1 lg:order-2"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-medium mb-6">
              Included with every plan
            </div>

            <h2 className="text-4xl md:text-5xl text-slate-900 mb-6 tracking-[-0.02em] leading-[1.1]">
              The native desktop app,<br/>
              <span className="text-neutral-400 font-semibold">included.</span>
            </h2>

            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Every Luxor subscription unlocks the Windows desktop app. Same license key, same account.
              Use it offline, in court, on a flight — wherever your work takes you.
            </p>

            <ul className="space-y-3 mb-10">
              {[
                { icon: WifiOff, text: "Works completely offline in air-gapped environments" },
                { icon: Cpu, text: "Native performance on huge files (1000+ pages)" },
                { icon: Monitor, text: "Deep OS integration — file associations, shortcuts, drag & drop" }
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700">
                  <div className="w-6 h-6 rounded-md bg-[#312E81]/5 border border-[#312E81]/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-3.5 h-3.5 text-[#312E81]" />
                  </div>
                  <span className="text-[15px]">{item.text}</span>
                </li>
              ))}
            </ul>

            <Button asChild size="lg" className="h-12 px-7 text-base font-semibold bg-[#312E81] hover:bg-[#3730A3] text-white rounded-lg shadow-sm group">
              <Link href="/pricing">
                See plans
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <p className="text-xs text-slate-500 mt-4">Windows 10/11 · macOS coming soon · Web app available now</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
