import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0, clipPath: "circle(0% at 50% 50%)" }}
      animate={{ opacity: 1, clipPath: "circle(100% at 50% 50%)" }}
      exit={{ opacity: 0, scale: 1.2 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Main visual */}
      <motion.div
        className="relative mb-8"
        initial={{ opacity: 0, y: 40 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.img
          src={`${import.meta.env.BASE_URL}images/speed-abstract.png`}
          alt="Speed"
          className="w-[35vw] h-[20vh] object-contain drop-shadow-2xl"
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Headline */}
      <motion.h2
        className="text-[8vw] font-bold text-center leading-none"
        style={{ fontFamily: "var(--font-display)", color: "hsl(var(--foreground))" }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 400, damping: 25 }}
      >
        Blazing Fast
      </motion.h2>

      {/* Subtext */}
      <motion.p
        className="text-[3vw] font-semibold mt-4 text-center"
        style={{ fontFamily: "var(--font-body)", color: "hsl(var(--primary))" }}
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        Desktop app for Windows
      </motion.p>

      {/* Speed indicators */}
      <div className="flex gap-4 mt-6">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-[2vw] h-[12vh] rounded-full"
            style={{
              background: `linear-gradient(to top, hsl(var(--primary)), hsl(var(--accent)))`,
              transformOrigin: "bottom",
            }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={phase >= 2 ? {
              scaleY: [0, 1, 0.8, 1],
              opacity: 1,
            } : { scaleY: 0, opacity: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.3 + i * 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
