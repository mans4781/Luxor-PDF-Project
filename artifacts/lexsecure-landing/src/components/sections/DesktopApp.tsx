import { motion } from "framer-motion";
import { Download, Monitor, WifiOff, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppStoreBadges } from "@/components/AppStoreBadges";

export function DesktopApp() {
  return (
    <section id="desktop" className="py-24 bg-white border-y border-gray-100 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="order-2 lg:order-1"
          >
             <div className="relative w-full max-w-lg mx-auto aspect-[4/3] rounded-xl border border-gray-200 shadow-2xl bg-gray-50 flex items-center justify-center p-8 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-10 bg-gray-200 flex items-center px-4 gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <div className="mt-8 text-center">
                  <Monitor className="w-16 h-16 text-primary mx-auto mb-4" strokeWidth={1.5} />
                  <div className="h-2 w-32 bg-gray-300 rounded mx-auto mb-2" />
                  <div className="h-2 w-48 bg-gray-300 rounded mx-auto mb-6" />
                  <div className="grid grid-cols-3 gap-4 mt-8">
                     <div className="h-16 w-16 bg-gray-200 rounded-md" />
                     <div className="h-16 w-16 bg-gray-200 rounded-md" />
                     <div className="h-16 w-16 bg-gray-200 rounded-md" />
                  </div>
                </div>
             </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="order-1 lg:order-2"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-xs font-semibold uppercase tracking-wider mb-6">
              <Monitor className="w-4 h-4" />
              <span>Native Experience</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-serif text-foreground mb-6 leading-tight">
              Powerful desktop app.<br />No internet required.
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              For ultimate security, download the Windows application. It runs entirely offline, guaranteeing your sensitive documents never leave your physical hardware.
            </p>
            
            <ul className="space-y-4 mb-10">
              {[
                { icon: WifiOff, text: "Works completely offline in air-gapped environments" },
                { icon: FileCheck, text: "Bypasses browser memory limits for massive files" },
                { icon: Monitor, text: "Native OS integration and file system access" }
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-foreground font-medium">
                  <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  {item.text}
                </li>
              ))}
            </ul>
            
            <a href="#download">
              <Button size="lg" className="h-14 px-8 text-base bg-primary hover:bg-primary/90 rounded-md shadow-lg shadow-primary/20">
                <Download className="w-5 h-5 mr-2" />
                Download for Windows (64-bit)
              </Button>
            </a>
            <p className="text-xs text-muted-foreground mt-4">Version 1.0.0 • 45MB • Requires Windows 10/11</p>

            <div className="mt-8 pt-8 border-t border-gray-100">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Also available on mobile</p>
              <AppStoreBadges size="sm" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
