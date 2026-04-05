import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    quote: "Finally, a PDF tool we can actually use. Our IT department banned cloud PDF converters years ago due to data sovereignty concerns. LuxorSecure running client-side solves everything.",
    author: "Sarah Jenkins",
    role: "Managing Partner, Jenkins & Croft Legal",
    color: "bg-blue-50"
  },
  {
    quote: "The expiry feature is brilliant for sending confidential term sheets to prospective investors. We know exactly when access is revoked, and we control it cryptographically.",
    author: "Michael Torres",
    role: "Director of M&A, Catalyst Ventures",
    color: "bg-rose-50"
  },
  {
    quote: "Merging 500-page discovery documents in the browser without uploading them first feels like magic. The desktop app is even faster. Indispensable tool for our paralegals.",
    author: "David Chen",
    role: "Head of IT, Chen & Associates",
    color: "bg-emerald-50"
  }
];

export function Testimonials() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl font-serif text-foreground mb-4">Trusted by Professionals</h2>
          <p className="text-lg text-muted-foreground">Used daily by law firms, financial institutions, and security-conscious businesses.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className={`p-8 rounded-2xl border border-gray-200 shadow-sm relative ${t.color}`}
            >
              <Quote className="w-8 h-8 text-black/10 absolute top-6 left-6" />
              <p className="text-foreground font-medium leading-relaxed mb-6 mt-4 relative z-10">
                "{t.quote}"
              </p>
              <div>
                <p className="font-bold text-foreground font-serif">{t.author}</p>
                <p className="text-sm text-muted-foreground">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
