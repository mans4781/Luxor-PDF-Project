import { motion } from "framer-motion";
import { ShieldAlert, ServerOff, Cpu } from "lucide-react";

export function Security() {
  return (
    <section id="security" className="py-24 bg-foreground text-background overflow-hidden relative">
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-4xl md:text-5xl font-serif mb-6 leading-tight">
              Your documents never leave your device.
            </h2>
            <p className="text-lg text-gray-400 mb-8 leading-relaxed max-w-lg">
              Unlike cloud-based PDF tools that silently upload your sensitive contracts and financial records to third-party servers, LexSecure PDF processes everything directly on your machine using WebAssembly.
            </p>
            
            <div className="space-y-6">
              {[
                {
                  icon: ServerOff,
                  title: "Zero Server Uploads",
                  desc: "We don't want your data. All merging, splitting, and converting happens client-side in your browser or desktop app."
                },
                {
                  icon: ShieldAlert,
                  title: "Enforced Expiry Control",
                  desc: "When sharing, you set the deadline. The server strictly enforces access, permanently corrupting the download after the expiry date."
                },
                {
                  icon: Cpu,
                  title: "Offline Capable",
                  desc: "The Windows desktop app requires zero internet connection. Work securely on planes, in courtrooms, or air-gapped environments."
                }
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                      <item.icon className="w-5 h-5 text-primary-foreground" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold mb-1">{item.title}</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
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
                <div className="absolute inset-0 rounded-full border border-gray-800 animate-[spin_60s_linear_infinite]" />
                <div className="absolute inset-4 rounded-full border border-gray-700 animate-[spin_40s_linear_infinite_reverse]" />
                <div className="absolute inset-12 rounded-full border border-primary/30 bg-primary/5 backdrop-blur-sm" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 bg-primary rounded-2xl rotate-45 flex items-center justify-center shadow-[0_0_50px_rgba(37,99,235,0.3)]">
                    <ShieldAlert className="w-12 h-12 text-white -rotate-45" />
                  </div>
                </div>
                
                {/* Floating data nodes */}
                <div className="absolute top-1/4 left-0 w-4 h-4 bg-rose-500 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
                <div className="absolute bottom-1/4 right-0 w-4 h-4 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                <div className="absolute top-0 right-1/4 w-4 h-4 bg-violet-500 rounded-full shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
             </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
