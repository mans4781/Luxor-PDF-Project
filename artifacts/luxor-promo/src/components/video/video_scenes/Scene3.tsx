import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 900),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center gap-[8vw]">
        {/* Left side - Security visual */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, x: -50, rotateY: -20 }}
          animate={phase >= 1 ? { opacity: 1, x: 0, rotateY: 0 } : { opacity: 0, x: -50, rotateY: -20 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{ perspective: 1000 }}
        >
          <div
            className="w-[25vw] h-[25vw] rounded-3xl flex items-center justify-center relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, hsl(var(--secondary)) 0%, hsl(var(--accent)) 100%)`,
            }}
          >
            <motion.img
              src={`${import.meta.env.BASE_URL}images/security-shield.png`}
              alt="Security"
              className="w-[18vw] h-[18vw] object-contain drop-shadow-2xl"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* Glow effect */}
            <div
              className="absolute inset-0 rounded-3xl opacity-40"
              style={{
                background: "radial-gradient(circle at center, white 0%, transparent 70%)",
              }}
            />
          </div>
        </motion.div>

        {/* Right side - Text */}
        <div>
          <motion.h2
            className="text-[6vw] font-bold leading-tight mb-4"
            style={{ fontFamily: "var(--font-display)", color: "hsl(var(--foreground))" }}
            initial={{ opacity: 0, y: 30 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
            Premium
            <br />
            <span style={{ color: "hsl(var(--secondary))" }}>Security</span>
          </motion.h2>

          <motion.ul
            className="space-y-[1.5vh] text-[2.2vw] font-medium"
            style={{ fontFamily: "var(--font-body)", color: "hsl(var(--muted-foreground))" }}
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(var(--secondary))" }} />
              Password Protection
            </li>
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(var(--secondary))" }} />
              PDF Expiry Control
            </li>
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(var(--secondary))" }} />
              Print & Copy Restrictions
            </li>
          </motion.ul>
        </div>
      </div>
    </motion.div>
  );
}
