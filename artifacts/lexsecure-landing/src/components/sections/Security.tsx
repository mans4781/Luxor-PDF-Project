import { motion } from "framer-motion";
import { ShieldAlert, ServerOff, Cpu } from "lucide-react";

export function Security() {
  return (
    <section id="security" className="py-24 bg-[#312E81] text-white overflow-hidden relative">
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-4xl md:text-5xl mb-6 leading-tight">
              Your documents never leave your device.
            </h2>
            <p className="text-lg text-gray-400 mb-8 leading-relaxed max-w-lg">
              Unlike cloud-based PDF tools that silently upload your sensitive contracts and financial records to third-party servers, Luxor PDF processes everything directly on your machine using WebAssembly.
            </p>
            
            <div className="space-y-5">
              {[
                {
                  icon: ServerOff,
                  title: "Zero Server Uploads",
                  desc: "We don't want your data. All merging, splitting, and converting happens client-side in your browser or desktop app.",
                  iconBg: "bg-[#FB7185]/15 border-[#FB7185]/30",
                  iconColor: "text-[#FB7185]",
                  glow: "group-hover:shadow-[#FB7185]/20",
                },
                {
                  icon: ShieldAlert,
                  title: "Enforced Expiry Control",
                  desc: "When sharing, you set the deadline. The server strictly enforces access, permanently corrupting the download after the expiry date.",
                  iconBg: "bg-white/15 border-white/30",
                  iconColor: "text-white",
                  glow: "group-hover:shadow-white/20",
                },
                {
                  icon: Cpu,
                  title: "Offline Capable",
                  desc: "The Windows desktop app requires zero internet connection. Work securely on planes, in courtrooms, or air-gapped environments.",
                  iconBg: "bg-[#2563EB]/20 border-[#2563EB]/40",
                  iconColor: "text-[#93C5FD]",
                  glow: "group-hover:shadow-[#2563EB]/30",
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                  className="group flex gap-4 p-4 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex-shrink-0">
                    <div className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-6deg] ${item.iconBg} ${item.glow}`}>
                      <item.icon className={`w-5 h-5 ${item.iconColor}`} strokeWidth={2.2} />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-1 text-white">{item.title}</h4>
                    <p className="text-slate-300 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
             <div className="aspect-square max-w-md mx-auto relative">
                {/* Abstract security rings illustration */}
                <div className="absolute inset-0 rounded-full border-2 border-[#2563EB]/20 animate-[spin_60s_linear_infinite]" />
                <div className="absolute inset-4 rounded-full border border-[#FB7185]/25 animate-[spin_40s_linear_infinite_reverse]" />
                <div className="absolute inset-12 rounded-full border border-white/15 bg-white/[0.03] backdrop-blur-sm" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-[#2563EB] to-[#312E81] rounded-2xl rotate-45 flex items-center justify-center shadow-[0_0_60px_rgba(37,99,235,0.55)] hover:shadow-[0_0_80px_rgba(251,113,133,0.4)] transition-shadow duration-700">
                    <ShieldAlert className="w-12 h-12 text-white -rotate-45" />
                  </div>
                </div>

                {/* Floating data nodes — Scheme 1 trio */}
                <div className="absolute top-1/4 left-0 w-4 h-4 bg-[#FB7185] rounded-full shadow-[0_0_20px_rgba(251,113,133,0.7)] animate-pulse" />
                <div className="absolute bottom-1/4 right-0 w-4 h-4 bg-[#2563EB] rounded-full shadow-[0_0_20px_rgba(37,99,235,0.7)] animate-pulse [animation-delay:600ms]" />
                <div className="absolute top-0 right-1/4 w-4 h-4 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.6)] animate-pulse [animation-delay:1200ms]" />
                <div className="absolute bottom-0 left-1/3 w-3 h-3 bg-[#FB7185] rounded-full shadow-[0_0_18px_rgba(251,113,133,0.6)] animate-pulse [animation-delay:1800ms]" />
             </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
