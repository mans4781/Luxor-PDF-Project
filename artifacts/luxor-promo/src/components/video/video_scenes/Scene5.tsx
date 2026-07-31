import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 1600),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Logo lockup */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 300, damping: 25 }}
      >
        <img
          src={`${import.meta.env.BASE_URL}brand/luxor-icon.png`}
          alt="Luxor PDF"
          className="w-[15vw] h-[15vw] drop-shadow-2xl"
        />
      </motion.div>

      {/* Main CTA */}
      <motion.h1
        className="text-[10vw] font-bold text-center leading-none mb-4"
        style={{ fontFamily: "var(--font-display)", color: "hsl(var(--foreground))" }}
        initial={{ opacity: 0, y: 30 }}
        animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        Luxor PDF
      </motion.h1>

      {/* Tagline */}
      <motion.p
        className="text-[3.5vw] font-semibold text-center mb-6"
        style={{ fontFamily: "var(--font-body)", color: "hsl(var(--primary))" }}
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        Your Complete PDF Solution
      </motion.p>

      {/* URL */}
      <motion.div
        className="px-[4vw] py-[2vh] rounded-full backdrop-blur-md border-2"
        style={{
          backgroundColor: "hsl(var(--primary) / 0.1)",
          borderColor: "hsl(var(--primary))",
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={phase >= 3 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 400, damping: 25 }}
      >
        <p
          className="text-[3vw] font-bold text-center"
          style={{ fontFamily: "var(--font-body)", color: "hsl(var(--primary))" }}
        >
          luxorpdf.com
        </p>
      </motion.div>

      {/* Decorative elements for exit */}
      <motion.div
        className="absolute top-[15vh] right-[10vw] w-[5vw] h-[5vw] rounded-full"
        style={{ background: "hsl(var(--accent))" }}
        initial={{ scale: 0, opacity: 0 }}
        animate={phase >= 3 ? { scale: 1, opacity: 0.4 } : { scale: 0, opacity: 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
      />

      <motion.div
        className="absolute bottom-[20vh] left-[15vw] w-[4vw] h-[4vw] rounded-full"
        style={{ background: "hsl(var(--secondary))" }}
        initial={{ scale: 0, opacity: 0 }}
        animate={phase >= 3 ? { scale: 1, opacity: 0.3 } : { scale: 0, opacity: 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 300, delay: 0.1 }}
      />
    </motion.div>
  );
}
