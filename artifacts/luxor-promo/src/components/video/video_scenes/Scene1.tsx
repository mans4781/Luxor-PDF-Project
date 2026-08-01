import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1400),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4 }}
    >
      {/* Main headline */}
      <div className="text-center">
        <motion.h1
          className="text-[12vw] font-bold leading-none tracking-tight"
          style={{ fontFamily: "var(--font-display)", color: "hsl(var(--foreground))" }}
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={phase >= 1 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.8 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          Everything
        </motion.h1>
        
        <motion.h2
          className="text-[8vw] font-semibold leading-none tracking-tight mt-4"
          style={{ fontFamily: "var(--font-display)", color: "hsl(var(--primary))" }}
          initial={{ opacity: 0, y: 50 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        >
          for PDF
        </motion.h2>

        <motion.p
          className="text-[3vw] font-medium mt-6"
          style={{ fontFamily: "var(--font-body)", color: "hsl(var(--muted-foreground))" }}
          initial={{ opacity: 0, y: 20 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          One suite. All tools.
        </motion.p>
      </div>

      {/* Decorative elements */}
      <motion.div
        className="absolute top-[20vh] left-[15vw] w-[4vw] h-[4vw] rounded-full"
        style={{ background: "hsl(var(--accent))" }}
        initial={{ scale: 0, opacity: 0 }}
        animate={phase >= 1 ? { scale: 1, opacity: 0.6 } : { scale: 0, opacity: 0 }}
        transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 20 }}
      />

      <motion.div
        className="absolute bottom-[25vh] right-[20vw] w-[3vw] h-[3vw] rounded-full"
        style={{ background: "hsl(var(--secondary))" }}
        initial={{ scale: 0, opacity: 0 }}
        animate={phase >= 2 ? { scale: 1, opacity: 0.5 } : { scale: 0, opacity: 0 }}
        transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
      />
    </motion.div>
  );
}
