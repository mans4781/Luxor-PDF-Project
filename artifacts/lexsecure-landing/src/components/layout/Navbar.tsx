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
    label: "About Us",
    href: "#about",
    gradient: "from-violet-500 to-purple-400",
  },
  {
    label: "Products",
    href: "#products",
    gradient: "from-sky-500 to-blue-400",
  },
  {
    label: "Features",
    href: "#features",
    gradient: "from-emerald-500 to-teal-400",
  },
  {
    label: "Buy Now",
    href: "#buy",
    gradient: "from-amber-500 to-yellow-400",
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
          <div className="bg-[#FA0F00] p-2 rounded-md">
            <Shield className="w-[23px] h-[23px] text-white" strokeWidth={2.5} />
          </div>
          <span className="font-serif font-bold text-[1.71rem] text-primary tracking-tight">LexSecure PDF</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(({ label, href, gradient }) => (
            <a
              key={label}
              href={href === "BASE_URL" ? import.meta.env.BASE_URL : href}
              className="group relative text-[1.05rem] font-medium transition-colors duration-300"
            >
              <span
                className={`bg-gradient-to-r ${gradient} bg-clip-text text-blue-700 font-bold group-hover:text-transparent transition-colors duration-300`}
              >
                {label}
              </span>
              <span
                className={`absolute -bottom-1 left-0 h-[2px] w-0 rounded-full bg-gradient-to-r ${gradient} transition-all duration-300 group-hover:w-full`}
              />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            className="text-[1.05rem] font-bold text-blue-700 hidden sm:inline-flex hover:bg-blue-50 hover:text-blue-800 transition-colors duration-300 border border-blue-200"
          >
            <a href="#login">Login</a>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
