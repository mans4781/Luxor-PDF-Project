import { motion } from "framer-motion";

export function AppPreview() {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-gray-50/80 overflow-hidden">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-4">
            See it in action
          </span>
          <h2 className="text-4xl md:text-5xl font-serif text-foreground mb-4">
            Clean. Fast. Secure.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Everything you need from a single dashboard — no clutter, no
            complexity. Just your tools, ready to go.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-5xl mx-auto"
        >
          {/* Glow behind the window */}
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-200/40 via-violet-200/30 to-rose-200/40 rounded-3xl blur-2xl pointer-events-none" />

          {/* Browser chrome frame */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white">
            {/* Browser toolbar */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-100 border-b border-gray-200">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-white rounded-md px-3 py-1 text-xs text-gray-500 border border-gray-200 flex items-center gap-2 max-w-xs mx-auto">
                  <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  app.lexsecurepdf.com
                </div>
              </div>
            </div>

            {/* Dashboard screenshot */}
            <img
              src={`${import.meta.env.BASE_URL}dashboard-preview.jpg`}
              alt="Luxor Dashboard — showing PDF Tool, Convert, and PDF Expiry navigation cards with the secure upload form"
              className="w-full block"
              draggable={false}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
