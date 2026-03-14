import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import logo from "../../assets/images/logo.png";

type SplashScreenProps = { onFinish: () => void };

function useParticles(count: number) {
  return useMemo(() => {
    const rand = (seed: number) => { const x = Math.sin(seed + 1) * 43758.5453; return x - Math.floor(x); };
    return Array.from({ length: count }, (_, i) => ({
      id: i, x: rand(i * 3.1) * 100, y: rand(i * 7.3) * 100,
      size: rand(i * 11.7) * 3 + 1.5, dur: rand(i * 5.9) * 3 + 2.5,
      delay: rand(i * 2.3) * 2, pink: rand(i * 17.1) > 0.6,
    }));
  }, [count]);
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [phase, setPhase] = useState<"intro" | "reveal" | "exit">("intro");
  const [progress, setProgress] = useState(0);
  const particles = useParticles(40);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("reveal"), 400);
    const t2 = setTimeout(() => setPhase("exit"), 3600);
    const t3 = setTimeout(() => onFinish(), 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onFinish]);

  useEffect(() => {
    const start = Date.now(); const total = 3400;
    const tick = () => {
      const p = Math.min(((Date.now() - start) / total) * 100, 100);
      setProgress(p);
      if (p < 100) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  const corners = [
    { top: 20, left: 20, d: "M0 16 V0 H16" },
    { top: 20, right: 20, d: "M20 16 V0 H4" },
    { bottom: 20, left: 20, d: "M0 4 V20 H16" },
    { bottom: 20, right: 20, d: "M20 4 V20 H4" },
  ];

  return (
    <AnimatePresence>
      <motion.div
        key="splash"
        className="fixed inset-0 z-[999] flex flex-col items-center justify-center overflow-hidden"
        style={{ background: "#04040a", fontFamily: "'Syne', sans-serif" }}
        animate={phase === "exit" ? { opacity: 0, scale: 1.03 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.65, ease: "easeInOut" }}
      >
        {/* Grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(rgba(139,92,246,1) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,1) 1px,transparent 1px)", backgroundSize: "64px 64px" }} />

        {/* Glows */}
        <motion.div className="absolute rounded-full pointer-events-none"
          style={{ width: 900, height: 900, top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "radial-gradient(circle,rgba(109,40,217,0.38) 0%,transparent 65%)", filter: "blur(40px)" }}
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.5 }} />
        <motion.div className="absolute rounded-full pointer-events-none"
          style={{ width: 520, height: 520, top: "28%", left: "60%", background: "radial-gradient(circle,rgba(219,39,119,0.22) 0%,transparent 70%)", filter: "blur(60px)" }}
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.8, delay: 0.3 }} />
        <motion.div className="absolute rounded-full pointer-events-none"
          style={{ width: 420, height: 420, top: "65%", left: "22%", background: "radial-gradient(circle,rgba(6,182,212,0.14) 0%,transparent 70%)", filter: "blur(60px)" }}
          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 2, delay: 0.5 }} />

        {/* Scan line */}
        <motion.div className="absolute left-0 right-0 pointer-events-none" style={{ height: 2, background: "linear-gradient(90deg,transparent,rgba(139,92,246,0.7),rgba(236,72,153,0.7),transparent)" }}
          initial={{ top: "0%", opacity: 0 }} animate={{ top: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 2.2, delay: 0.5, ease: "linear", times: [0, 0.05, 0.95, 1] }} />

        {/* Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {particles.map(p => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, background: p.pink ? "rgba(236,72,153,0.8)" : "rgba(167,139,250,0.8)" }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 0.9, 0], scale: [0, 1, 0], y: [0, -(28 + p.size * 5), 0] }}
              transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeInOut" }} />
          ))}
        </div>

        {/* Corner brackets */}
        {corners.map((c, i) => (
          <motion.svg key={i} width="22" height="22" viewBox="0 0 20 20" fill="none"
            className="absolute pointer-events-none"
            style={{ top: c.top, bottom: c.bottom, left: c.left, right: c.right } as React.CSSProperties}
            initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} transition={{ delay: 0.6 + i * 0.07 }}>
            <path d={c.d} stroke="rgba(167,139,250,0.9)" strokeWidth="1.5" strokeLinecap="round" />
          </motion.svg>
        ))}

        {/* Main content */}
        <div className="relative z-10 flex flex-col items-center">

          {/* Orbit system */}
          <div className="relative flex items-center justify-center" style={{ width: 360, height: 360 }}>

            {/* Rings */}
            {[
              { size: 360, border: "1px dashed rgba(139,92,246,0.32)", dir: 1, dur: 26, delay: 0.5 },
              { size: 280, border: "1px solid rgba(236,72,153,0.26)", dir: -1, dur: 18, delay: 0.65 },
              { size: 205, border: "1.5px solid rgba(139,92,246,0.52)", dir: 1, dur: 12, delay: 0.8 },
            ].map((ring, i) => (
              <motion.div key={i} className="absolute rounded-full"
                style={{ width: ring.size, height: ring.size, border: ring.border, boxShadow: i === 2 ? "0 0 28px rgba(139,92,246,0.16), inset 0 0 28px rgba(139,92,246,0.06)" : undefined }}
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1, rotate: ring.dir * 360 }}
                transition={{ opacity: { duration: 0.8, delay: ring.delay }, scale: { duration: 0.9, delay: ring.delay, ease: "easeOut" }, rotate: { duration: ring.dur, repeat: Infinity, ease: "linear" } }} />
            ))}

            {/* Orbiting dots */}
            {[
              { color: "#a78bfa", shadow: "#a78bfa", dur: 4, offset: 180, topOff: 180 },
              { color: "#ec4899", shadow: "#ec4899", dur: 6.5, offset: 140, topOff: 140 },
            ].map((dot, i) => (
              <motion.div key={i} className="absolute rounded-full"
                style={{ width: 7, height: 7, background: dot.color, boxShadow: `0 0 10px ${dot.shadow}`, top: `calc(50% - ${dot.topOff}px)`, left: "calc(50% - 3.5px)", transformOrigin: `3.5px ${dot.topOff}px` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, rotate: 360 }}
                transition={{ opacity: { delay: 1.1 + i * 0.1 }, rotate: { duration: dot.dur, repeat: Infinity, ease: "linear" } }} />
            ))}

            {/* Logo */}
            <motion.div className="relative z-10 flex items-center justify-center"
              initial={{ scale: 0, opacity: 0, rotate: -20 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 1.05, delay: 0.55, ease: [0.34, 1.56, 0.64, 1] }}>
              <div className="absolute rounded-full" style={{ width: 180, height: 180, background: "radial-gradient(circle,rgba(139,92,246,0.55) 0%,rgba(219,39,119,0.18) 55%,transparent 70%)", filter: "blur(22px)" }} />
              <motion.img src={logo} alt="TryOnX"
                style={{ width: 150, height: 150, objectFit: "contain", filter: "drop-shadow(0 0 32px rgba(139,92,246,0.95)) drop-shadow(0 0 64px rgba(139,92,246,0.4))" }}
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }} />
            </motion.div>
          </div>

          {/* Brand */}
          <motion.div className="flex items-baseline gap-1 mt-5"
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 1.0 }}>
            <span className="text-5xl font-black tracking-tight"
              style={{ background: "linear-gradient(135deg,#a78bfa,#ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Try
            </span>
            <span className="text-5xl font-black tracking-tight text-white">OnX</span>
          </motion.div>

          {/* Tagline */}
          <div className="flex items-center gap-2 mt-2">
            {["Virtual", "·", "Fashion", "·", "Experience"].map((w, i) => (
              <motion.span key={i}
                className={`text-[11px] font-medium tracking-[0.22em] uppercase ${w === "·" ? "text-purple-500" : "text-purple-300/55"}`}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1.15 + i * 0.07 }}>
                {w}
              </motion.span>
            ))}
          </div>
        </div>

        {/* Progress */}
        <motion.div className="absolute bottom-10 z-10 flex flex-col items-center gap-1.5"
          style={{ width: 220 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
          <div className="flex justify-between w-full">
            <span className="text-[10px] font-mono text-purple-400/45 tracking-widest uppercase">Loading</span>
            <span className="text-[10px] font-mono text-purple-400/45">{Math.round(progress)}%</span>
          </div>
          <div className="w-full rounded-full overflow-hidden" style={{ height: 2, background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full" style={{ width: `${progress}%`, background: "linear-gradient(90deg,#7c3aed,#a855f7,#ec4899)", boxShadow: "0 0 10px rgba(139,92,246,0.7)", transition: "width 0.1s linear" }} />
          </div>
        </motion.div>

      </motion.div>
    </AnimatePresence>
  );
}
