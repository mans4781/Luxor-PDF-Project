import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 700),
      setTimeout(() => setPhase(3), 1100),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const tools = [
    { label: "Merge", color: "hsl(var(--primary))" },
    { label: "Split", color: "hsl(var(--accent))" },
    { label: "Convert", color: "hsl(var(--secondary))" },
    { label: "Compress", color: "hsl(var(--primary))" },
    { label: "Edit", color: "hsl(var(--accent))" },
    { label: "Sign", color: "hsl(var(--secondary))" },
  ];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Headline */}
      <motion.h2
        className="text-[7vw] font-bold mb-8"
        style={{ fontFamily: "var(--font-display)", color: "hsl(var(--foreground))" }}
        initial={{ opacity: 0, y: 30 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        30+ Free Tools
      </motion.h2>

      {/* Tool grid */}
      <div className="grid grid-cols-3 gap-[2vw] max-w-[60vw]">
        {tools.map((tool, i) => (
          <motion.div
            key={tool.label}
            className="relative px-[3vw] py-[2vh] rounded-2xl backdrop-blur-sm border-2"
            style={{
              backgroundColor: `${tool.color}15`,
              borderColor: tool.color,
            }}
            initial={{ opacity: 0, scale: 0.7, y: 20 }}
            animate={phase >= 2 ? {
              opacity: 1,
              scale: 1,
              y: 0,
            } : { opacity: 0, scale: 0.7, y: 20 }}
            transition={{
              duration: 0.4,
              delay: i * 0.08,
              type: "spring",
              stiffness: 400,
              damping: 25,
            }}
          >
            <p
              className="text-[2.5vw] font-semibold text-center"
              style={{ fontFamily: "var(--font-body)", color: tool.color }}
            >
              {tool.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Bottom tagline */}
      <motion.p
        className="text-[2.5vw] font-medium mt-8"
        style={{ fontFamily: "var(--font-body)", color: "hsl(var(--muted-foreground))" }}
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        All online. All free.
      </motion.p>
    </motion.div>
  );
}
