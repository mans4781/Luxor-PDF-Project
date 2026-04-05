import { Link } from "wouter";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const navLinks = [
  {
    label: "Home",
    href: "BASE_URL",
    gradient: "from-rose-500 to-orange-400",
  },
  {
    label: "Features",
    href: "#features",
    gradient: "from-violet-500 to-purple-400",
  },
  {
    label: "Security",
    href: "#security",
    gradient: "from-sky-500 to-blue-400",
  },
  {
    label: "Desktop App",
    href: "#desktop",
    gradient: "from-emerald-500 to-teal-400",
  },
];

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
          <span className="font-serif font-bold text-2xl text-primary tracking-tight">LexSecure PDF</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(({ label, href, gradient }) => (
            <a
              key={label}
              href={href === "BASE_URL" ? import.meta.env.BASE_URL : href}
              className="group relative text-[1.05rem] font-medium transition-colors duration-300"
            >
              <span
                className={`bg-gradient-to-r ${gradient} bg-clip-text text-muted-foreground group-hover:text-transparent transition-colors duration-300`}
              >
                {label}
              </span>
              <span
                className={`absolute -bottom-1 left-0 h-[2px] w-0 rounded-full bg-gradient-to-r ${gradient} transition-all duration-300 group-hover:w-full`}
              />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" className="text-[1.05rem] font-medium hidden sm:inline-flex hover:bg-violet-50 hover:text-violet-600 transition-colors duration-300">
            <Link href="/web-app">Open Web App</Link>
          </Button>
          <Button
            asChild
            className="text-[1.05rem] font-medium bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white border-0 shadow-md transition-all duration-300 hover:shadow-rose-200 hover:shadow-lg"
          >
            <a href="#download">Download for Windows</a>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
