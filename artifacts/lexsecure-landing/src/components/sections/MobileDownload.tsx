import { motion } from "framer-motion";

function GooglePlayButton() {
  return (
    <a
      href="#android"
      aria-label="Get it on Google Play"
      className="inline-flex items-center gap-4 bg-black text-white rounded-2xl px-6 py-3.5 border border-white/10 hover:border-white/30 hover:bg-neutral-900 transition-all duration-200 active:scale-95 shadow-lg"
    >
      {/* 2024 Google Play logo: 4-colour triangle */}
      <svg width="28" height="30" viewBox="0 0 28 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1.12 0.27C0.44 0.65 0 1.37 0 2.21V27.79C0 28.63 0.44 29.35 1.12 29.73L1.22 29.82L15.38 15.66V15.5V15.34L1.22 1.18L1.12 0.27Z" fill="url(#gp1)" />
        <path d="M20.06 20.36L15.38 15.66V15.5V15.34L20.07 10.64L20.19 10.71L25.74 13.89C27.32 14.78 27.32 16.22 25.74 17.12L20.19 20.3L20.06 20.36Z" fill="url(#gp2)" />
        <path d="M20.19 20.3L15.38 15.5L1.12 29.73C1.65 30.29 2.52 30.36 3.51 29.81L20.19 20.3Z" fill="url(#gp3)" />
        <path d="M20.19 10.71L3.51 1.19C2.52 0.64 1.65 0.71 1.12 1.27L15.38 15.5L20.19 10.71Z" fill="url(#gp4)" />
        <defs>
          <linearGradient id="gp1" x1="14.14" y1="1.43" x2="-5.53" y2="15.5" gradientUnits="userSpaceOnUse">
            <stop stopColor="#00A0FF" />
            <stop offset="0.007" stopColor="#00A1FF" />
            <stop offset="0.26" stopColor="#00BEFF" />
            <stop offset="0.51" stopColor="#00D2FF" />
            <stop offset="0.76" stopColor="#00DFFF" />
            <stop offset="1" stopColor="#00E3FF" />
          </linearGradient>
          <linearGradient id="gp2" x1="27.9" y1="15.5" x2="-0.18" y2="15.5" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFE000" />
            <stop offset="0.409" stopColor="#FFBD00" />
            <stop offset="0.775" stopColor="#FFA500" />
            <stop offset="1" stopColor="#FF9C00" />
          </linearGradient>
          <linearGradient id="gp3" x1="17.62" y1="17.93" x2="-8.15" y2="43.89" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF3A44" />
            <stop offset="1" stopColor="#C31162" />
          </linearGradient>
          <linearGradient id="gp4" x1="-2.47" y1="-7.77" x2="9.68" y2="4.49" gradientUnits="userSpaceOnUse">
            <stop stopColor="#32A071" />
            <stop offset="0.068" stopColor="#2DA771" />
            <stop offset="0.476" stopColor="#15CF74" />
            <stop offset="0.801" stopColor="#06E775" />
            <stop offset="1" stopColor="#00F076" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-left">
        <p className="text-[10px] font-normal text-white/70 leading-none tracking-wide uppercase">Get it on</p>
        <p className="text-[22px] font-semibold leading-tight tracking-tight mt-0.5" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>Google Play</p>
      </div>
    </a>
  );
}

function AppStoreButton() {
  return (
    <a
      href="#ios"
      aria-label="Download on the App Store"
      className="inline-flex items-center gap-4 bg-black text-white rounded-2xl px-6 py-3.5 border border-white/10 hover:border-white/30 hover:bg-neutral-900 transition-all duration-200 active:scale-95 shadow-lg"
    >
      {/* Apple logo — monochrome white */}
      <svg width="25" height="30" viewBox="0 0 814 1000" fill="white" xmlns="http://www.w3.org/2000/svg">
        <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.8-165.4-126.1C67.3 782.1 1 710 1 628.6C1 468.8 119.2 353.5 265.6 353.5c66.6 0 121.9 43.8 163.5 43.8 39.5 0 101.1-46.1 176.8-46.1 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
      </svg>
      <div className="text-left">
        <p className="text-[10px] font-normal text-white/70 leading-none tracking-wide uppercase">Download on the</p>
        <p className="text-[22px] font-semibold leading-tight tracking-tight mt-0.5" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>App Store</p>
      </div>
    </a>
  );
}

export function MobileDownload() {
  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">

          {/* Left: text */}
          <motion.div
            className="text-center lg:text-left max-w-lg"
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-xs font-semibold uppercase tracking-wider mb-5">
              <span>📱</span>
              <span>Mobile App</span>
            </div>
            <h2 className="text-4xl md:text-5xl text-white leading-tight mb-5">
              Luxor PDF in your <br />
              <span className="text-violet-300 italic">pocket.</span>
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              View, annotate, sign, and protect your PDFs on the go. Full feature parity with the web app — available free on Android and iOS.
            </p>

            <ul className="mt-7 space-y-3 text-sm text-slate-400">
              {[
                "Offline reading & annotation",
                "Biometric document unlock",
                "Push alerts when PDFs expire",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-violet-500/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-2.5 h-2.5 text-violet-300" fill="none" viewBox="0 0 10 10">
                      <path d="M2 5.5L4 7.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Right: phone mockup + buttons */}
          <motion.div
            className="flex flex-col items-center gap-8"
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.65, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Phone outline */}
            <div className="relative w-44 h-80 rounded-[2.5rem] border-2 border-slate-600 bg-slate-800 shadow-2xl flex flex-col overflow-hidden">
              {/* Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-4 bg-slate-900 rounded-full z-10" />
              {/* Screen content placeholder */}
              <div className="flex-1 mt-10 mx-2 mb-2 rounded-[1.8rem] bg-gradient-to-br from-violet-900/60 to-slate-900 flex flex-col items-center justify-center gap-3 p-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/30 flex items-center justify-center">
                  <svg className="w-6 h-6 text-violet-300" fill="none" viewBox="0 0 24 24">
                    <path d="M9 12h6M9 16h6M7 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2M9 4h6a1 1 0 010 2H9a1 1 0 010-2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="w-full space-y-2">
                  <div className="h-2 rounded-full bg-slate-600/60 w-3/4 mx-auto" />
                  <div className="h-2 rounded-full bg-slate-600/60 w-full" />
                  <div className="h-2 rounded-full bg-slate-600/60 w-5/6 mx-auto" />
                </div>
                <div className="w-full mt-2 space-y-1.5">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded bg-violet-500/30 flex-shrink-0" />
                      <div className="h-1.5 rounded-full bg-slate-600/40 flex-1" />
                    </div>
                  ))}
                </div>
              </div>
              {/* Home indicator */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-slate-600 rounded-full" />
            </div>

            {/* Store buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <GooglePlayButton />
              <AppStoreButton />
            </div>

            <p className="text-xs text-slate-500">Free download · No credit card required</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
