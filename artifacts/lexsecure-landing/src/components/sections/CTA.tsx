import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function CTA() {
  return (
    <section className="py-24 relative overflow-hidden bg-primary">
      <div className="absolute inset-0 opacity-20 mix-blend-overlay"></div>
      
      <div className="container mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-xl mb-6">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-4xl md:text-6xl font-serif text-white mb-6 leading-tight">
            Stop giving your data <br className="hidden md:block"/>to cloud converters.
          </h2>
          
          <p className="text-xl text-primary-foreground/80 mb-10">
            Take control of your sensitive documents today with LexSecure PDF. Try the web app instantly or download the desktop client for ultimate security.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto h-14 px-8 text-base font-semibold shadow-xl group">
              <Link href="/web-app">
                Launch Web App
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild size="lg" className="w-full sm:w-auto h-14 px-8 text-base font-medium bg-foreground text-background hover:bg-foreground/90 rounded-md border border-transparent hover:border-gray-700">
              <a href="#download">
                Download for Windows
              </a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
