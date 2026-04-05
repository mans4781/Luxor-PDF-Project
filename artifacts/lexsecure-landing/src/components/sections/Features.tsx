import { motion } from "framer-motion";
import { Lock, FileStack, RefreshCw, FileImage, FileText, SplitSquareHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const FADE_UP = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const FEATURES = [
  {
    id: "expiry",
    title: "PDF Expiry & Control",
    description: "Set an expiration date for your shared documents. After the deadline, the download returns corrupted data, enforcing document control globally.",
    icon: Lock,
    color: "bg-rose-50 text-rose-600",
    borderColor: "border-rose-100",
    image: `${import.meta.env.BASE_URL}feature-expiry.png`
  },
  {
    id: "tool",
    title: "Precision PDF Tools",
    description: "Merge multiple documents, split large files into parts, or extract specific pages. All processing happens locally in your browser—no uploads required.",
    icon: FileStack,
    color: "bg-violet-50 text-violet-600",
    borderColor: "border-violet-100",
    image: `${import.meta.env.BASE_URL}feature-tool.png`
  },
  {
    id: "to-pdf",
    title: "Convert to PDF",
    description: "Instantly convert JPG, PNG, WEBP, GIF, and BMP images into high-quality PDFs. Pristine document generation, 100% client-side.",
    icon: RefreshCw,
    color: "bg-emerald-50 text-emerald-600",
    borderColor: "border-emerald-100",
    image: `${import.meta.env.BASE_URL}feature-to-pdf.png`
  },
  {
    id: "from-pdf",
    title: "Convert from PDF",
    description: "Extract text or images from existing PDFs effortlessly. Turn locked documents back into editable, usable assets securely on your machine.",
    icon: FileImage,
    color: "bg-amber-50 text-amber-600",
    borderColor: "border-amber-100",
    image: `${import.meta.env.BASE_URL}feature-from-pdf.png`
  }
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-gray-50/50">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={FADE_UP}
            className="text-4xl md:text-5xl font-serif text-foreground mb-6"
          >
            A full suite of tools.<br />Zero compromises on trust.
          </motion.h2>
          <motion.p 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={FADE_UP}
            className="text-lg text-muted-foreground"
          >
            LexSecure PDF combines powerful document manipulation with an uncompromising security model. Every feature is designed for professionals who handle sensitive data.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={{
                hidden: { opacity: 0, y: 40 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] } }
              }}
            >
              <Card className={`overflow-hidden border-2 transition-all duration-300 hover:shadow-xl ${feature.borderColor}`}>
                <div className="aspect-[16/9] w-full overflow-hidden bg-gray-100 border-b border-gray-100 relative group">
                  <img 
                    src={feature.image} 
                    alt={feature.title} 
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                </div>
                <CardContent className="p-8">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${feature.color}`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-serif font-semibold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
