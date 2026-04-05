import { Link } from "wouter";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        scrolled ? "bg-background/80 backdrop-blur-lg border-b" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="bg-[#E11D48] p-2 rounded-md">
            <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-serif font-bold text-xl text-primary tracking-tight">LexSecure PDF</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
          <a href="#security" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Security</a>
          <a href="#desktop" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Desktop App</a>
        </nav>

        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" className="font-medium hidden sm:inline-flex">
            <Link href="/web-app">Open Web App</Link>
          </Button>
          <Button asChild className="font-medium bg-foreground text-background hover:bg-foreground/90">
            <a href="#download">Download for Windows</a>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
