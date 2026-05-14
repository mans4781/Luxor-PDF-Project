import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";

/**
 * Floating "back to top" button.
 *
 * Anchored to the bottom-LEFT of the viewport (the bottom-right is
 * occupied by the chatbot bubble). Appears once the user has scrolled
 * past 300px and smoothly scrolls the window back to the top on click.
 */
export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="scroll-top"
          onClick={scrollTop}
          initial={{ opacity: 0, y: 16, scale: 0.8 }}
          animate={{ opacity: 1, y: 0,  scale: 1   }}
          exit={{    opacity: 0, y: 16, scale: 0.8 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          whileHover={{ scale: 1.1 }}
          whileTap={{  scale: 0.92 }}
          aria-label="Scroll to top"
          className="fixed bottom-6 left-5 z-[200] w-12 h-12 rounded-full bg-gradient-to-br from-[#312E81] to-[#2563EB] text-white shadow-lg shadow-indigo-900/30 ring-2 ring-white flex items-center justify-center hover:shadow-xl hover:-translate-y-0.5 transition-all"
        >
          <ArrowUp className="w-5 h-5" strokeWidth={2.6} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
