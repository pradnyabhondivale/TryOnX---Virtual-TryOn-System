import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  Sparkles, Share2, Scan, Star, Shirt,
  ShoppingBag, Zap, ArrowRight, Menu, X,
  LogIn, UserPlus, User, LogOut, ChevronDown, Play
} from "lucide-react";
import { useAuth } from "../context/useAuth";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

/* ── Google Fonts ──────────────────────────────────────────────────────────── */
(function injectFonts() {
  if (document.getElementById("tryon-fonts")) return;
  const l = document.createElement("link");
  l.id = "tryon-fonts";
  l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap";
  document.head.appendChild(l);
})();

/* ── Variants ──────────────────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  show: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.65, delay: d, ease: [0.22, 1, 0.36, 1] } }),
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

/* ── Animated Counter ──────────────────────────────────────────────────────── */
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);
  useEffect(() => {
    const ob = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true;
        let s = 0;
        const inc = to / 80;
        const t = setInterval(() => {
          s = Math.min(s + inc, to);
          setVal(Math.floor(s));
          if (s >= to) clearInterval(t);
        }, 16);
      }
    });
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, [to]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ── Navbar ────────────────────────────────────────────────────────────────── */
function Navbar() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenu) return;
    const fn = () => setUserMenu(false);
    setTimeout(() => document.addEventListener("click", fn), 0);
    return () => document.removeEventListener("click", fn);
  }, [userMenu]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  const name = profile?.firstName ?? user?.displayName?.split(" ")[0] ?? "Account";

  const handleSignOut = async () => {
    setUserMenu(false);
    setMobileOpen(false);
    await signOut(auth);
    navigate("/");
  };

  return (
    <motion.nav
      initial={{ y: -72, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#07090f]/95 backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_4px_32px_rgba(0,0,0,0.5)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 md:px-8 h-[68px] flex items-center justify-between gap-4">

        {/* Brand */}
        <button onClick={() => scrollTo("hero")} className="flex items-center gap-2.5 flex-shrink-0 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/50 transition-all">
            <Shirt size={15} className="text-white" />
          </div>
          <span className="text-[17px] font-bold tracking-tight text-white" style={{ fontFamily: "Syne, sans-serif" }}>
            Try<span className="text-violet-400">OnX</span>
          </span>
        </button>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1" style={{ fontFamily: "Syne, sans-serif" }}>
          {[
            { id: "hero",         label: "Home" },
            { id: "features",     label: "Features" },
            { id: "how",          label: "How It Works" },
            { id: "testimonials", label: "Reviews" },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => scrollTo(id)}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all">
              {label}
            </button>
          ))}
        </div>

        {/* Auth area — gated on loading */}
        <div className="hidden md:flex items-center gap-2">
          {loading ? (
            /* skeleton while Firebase resolves auth state */
            <div className="w-24 h-8 rounded-lg bg-white/5 animate-pulse" />
          ) : user ? (
            /* ── Logged in ── */
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setUserMenu(v => !v); }}
                className="flex items-center gap-2.5 pl-2.5 pr-3.5 py-1.5 rounded-xl bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] transition-all text-sm text-white"
                style={{ fontFamily: "Syne, sans-serif" }}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                  {name[0]?.toUpperCase()}
                </div>
                <span className="max-w-[100px] truncate">{name}</span>
                <ChevronDown size={13} className={`text-gray-500 transition-transform duration-200 ${userMenu ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {userMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.94 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2.5 w-52 bg-[#0d1117] border border-white/[0.1] rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.6)] overflow-hidden"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="px-4 py-3 border-b border-white/[0.06]">
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <button onClick={() => { navigate("/dashboard"); setUserMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/[0.05] transition-all">
                      <User size={14} className="text-violet-400" /> My Profile
                    </button>
                    <div className="h-px bg-white/[0.05]" />
                    <button onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/[0.06] transition-all">
                      <LogOut size={14} /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* ── Logged out ── */
            <>
              <button onClick={() => navigate("/login")}
                className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all"
                style={{ fontFamily: "Syne, sans-serif" }}>
                <LogIn size={14} /> Sign In
              </button>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/signup")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold text-white transition-colors shadow-lg shadow-violet-600/20"
                style={{ fontFamily: "Syne, sans-serif" }}>
                <UserPlus size={14} /> Get Started
              </motion.button>
            </>
          )}
        </div>

        {/* Mobile burger */}
        <button onClick={() => setMobileOpen(v => !v)} className="md:hidden text-gray-400 hover:text-white p-1 flex-shrink-0">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0a0c14]/98 backdrop-blur-2xl border-t border-white/[0.06] overflow-hidden"
          >
            <div className="px-5 py-4 flex flex-col gap-1" style={{ fontFamily: "Syne, sans-serif" }}>
              {[
                { id: "hero", label: "Home" },
                { id: "features", label: "Features" },
                { id: "how", label: "How It Works" },
                { id: "testimonials", label: "Reviews" },
              ].map(({ id, label }) => (
                <button key={id} onClick={() => scrollTo(id)}
                  className="text-left px-3 py-2.5 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-all">
                  {label}
                </button>
              ))}
              <div className="h-px bg-white/[0.06] my-2" />
              {loading ? (
                <div className="h-9 rounded-lg bg-white/[0.05] animate-pulse" />
              ) : user ? (
                <>
                  <div className="flex items-center gap-2.5 px-3 py-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold text-white">
                      {name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm text-white font-medium">{name}</p>
                      <p className="text-[11px] text-gray-500 truncate max-w-[180px]">{user.email}</p>
                    </div>
                  </div>
                  <button onClick={() => { navigate("/dashboard"); setMobileOpen(false); }}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-300 hover:text-white rounded-lg hover:bg-white/[0.06]">
                    <User size={14} className="text-violet-400" /> My Profile
                  </button>
                  <button onClick={handleSignOut}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-400 rounded-lg hover:bg-red-500/[0.06]">
                    <LogOut size={14} /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => { navigate("/login"); setMobileOpen(false); }}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-300 hover:text-white rounded-lg hover:bg-white/[0.06]">
                    <LogIn size={14} /> Sign In
                  </button>
                  <button onClick={() => { navigate("/signup"); setMobileOpen(false); }}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-white font-semibold rounded-xl bg-violet-600 hover:bg-violet-500 mt-1 transition-colors">
                    <UserPlus size={14} /> Get Started Free
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

/* ── Main Page ─────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  useEffect(() => {
    const fn = (e: MouseEvent) => setMouse({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
  }, []);

  const firstName = profile?.firstName ?? user?.displayName?.split(" ")[0] ?? null;

  const features = [
    { icon: <Scan size={22} />, title: "AI Virtual Try-On", desc: "Upload your photo and instantly see how any outfit looks on you. No fitting room, no guessing.", tag: "Core" },
    { icon: <Sparkles size={22} />, title: "Smart Size AI", desc: "Body measurement analysis gives you perfect size recommendations across every brand globally.", tag: "AI" },
    { icon: <Share2 size={22} />, title: "Save & Share Looks", desc: "Build a shareable collection of your favourite outfit combos and send to friends in one tap.", tag: "Social" },
    { icon: <ShoppingBag size={22} />, title: "Virtual Wardrobe", desc: "Organise everything you own digitally. Mix, match and rediscover forgotten pieces instantly.", tag: "Organise" },
  ];

  const steps = [
    { icon: <Scan size={28} />, num: "01", title: "Upload your photo", desc: "Take a full-body selfie or upload any photo. Your privacy is always guaranteed." },
    { icon: <Shirt size={28} />, num: "02", title: "Pick an outfit", desc: "Browse thousands of real products from top fashion brands in our growing catalog." },
    { icon: <Zap size={28} />, num: "03", title: "See the magic", desc: "AI renders you wearing the outfit in seconds. Realistic, accurate, and instant." },
  ];

  const testimonials = [
    { text: "I returned 90% fewer online purchases after using TryOnX. It genuinely changed how I shop.", name: "Sophia M.", role: "Fashion Blogger" },
    { text: "The AI accuracy is wild. It even gets fabric drape right. Nothing else comes close.", name: "James K.", role: "Stylist" },
    { text: "Finally — online shopping without the anxiety of 'will this actually fit me?'", name: "Emma R.", role: "Designer" },
    { text: "Feels like the future arrived early. My wardrobe has never been more intentional.", name: "Daniel L.", role: "Photographer" },
    { text: "The virtual wardrobe alone is worth it. I rediscovered pieces I forgot I owned.", name: "Olivia T.", role: "Model" },
    { text: "Size recommendations are scarily accurate. Saved me hours of returns.", name: "Priya S.", role: "Influencer" },
  ];

  return (
    <div className="bg-[#07090f] text-white min-h-screen overflow-x-hidden" style={{ fontFamily: "Syne, sans-serif" }}>

      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section id="hero" ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">

        {/* Layered background */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-50 transition-all duration-1000"
            style={{
              background: `radial-gradient(ellipse 80% 70% at ${mouse.x * 100}% ${mouse.y * 100}%, rgba(124,58,237,0.22) 0%, transparent 65%),
                           radial-gradient(ellipse 60% 50% at ${100 - mouse.x * 60}% ${100 - mouse.y * 50}%, rgba(192,38,211,0.14) 0%, transparent 60%)`,
            }}
          />
          {/* Fine grid */}
          <div className="absolute inset-0 opacity-[0.035]" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
            backgroundSize: "72px 72px",
          }} />
          {/* Floating orbs */}
          <motion.div animate={{ y: [0, -35, 0], x: [0, 18, 0] }} transition={{ repeat: Infinity, duration: 9, ease: "easeInOut" }}
            className="absolute top-1/4 left-[20%] w-72 h-72 rounded-full bg-violet-600/[0.12] blur-3xl" />
          <motion.div animate={{ y: [0, 28, 0], x: [0, -22, 0] }} transition={{ repeat: Infinity, duration: 11, ease: "easeInOut" }}
            className="absolute bottom-1/3 right-[18%] w-96 h-96 rounded-full bg-fuchsia-600/[0.1] blur-3xl" />
          <motion.div animate={{ y: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
            className="absolute top-1/2 right-[30%] w-48 h-48 rounded-full bg-sky-600/[0.08] blur-3xl" />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 text-center px-5 max-w-5xl mx-auto pt-24">

          {/* Pill badge */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}
            className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/[0.1] text-violet-300 text-sm backdrop-blur-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            AI-Powered Virtual Fashion
            <ArrowRight size={13} />
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={fadeUp} initial="hidden" animate="show" custom={0.08}
            className="leading-[0.92] tracking-tight mb-6"
            style={{ fontFamily: "Instrument Serif, serif", fontSize: "clamp(3.2rem, 8.5vw, 6.5rem)" }}
          >
            Try on any outfit
            <br />
            <em className="not-italic" style={{
              background: "linear-gradient(120deg, #a78bfa 0%, #e879f9 45%, #38bdf8 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              before you buy.
            </em>
          </motion.h1>

          {/* Sub */}
          <motion.p variants={fadeUp} initial="hidden" animate="show" custom={0.18}
            className="text-gray-400 text-lg md:text-xl max-w-[520px] mx-auto mb-10 leading-relaxed"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Upload a photo. Pick a look. See yourself wearing it in seconds — powered by cutting-edge generative AI.
          </motion.p>

          {/* CTA — strictly auth-aware, gated on loading */}
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0.28}
            className="flex flex-wrap items-center justify-center gap-3 mb-6">

            {loading ? (
              /* Skeleton CTAs while auth resolves — prevents flash */
              <>
                <div className="w-40 h-12 rounded-xl bg-white/[0.06] animate-pulse" />
                <div className="w-28 h-12 rounded-xl bg-white/[0.04] animate-pulse" />
              </>
            ) : user ? (
              /* Logged in CTAs */
              <>
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(139,92,246,0.45)" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-base shadow-xl shadow-violet-500/20"
                >
                  <User size={17} /> Go to My Dashboard
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-xl border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.08] text-white text-base transition-all"
                >
                  Explore Features <ChevronDown size={16} />
                </motion.button>
              </>
            ) : (
              /* Logged out CTAs */
              <>
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(139,92,246,0.45)" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/signup")}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-base shadow-xl shadow-violet-500/20"
                >
                  Start for Free <ArrowRight size={17} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate("/login")}
                  className="flex items-center gap-2 px-7 py-3.5 rounded-xl border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.08] text-white text-base transition-all"
                >
                  <LogIn size={16} /> Sign In
                </motion.button>
              </>
            )}
          </motion.div>

          {/* Personalised greeting if logged in */}
          {!loading && user && firstName && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
              className="text-sm text-gray-600">
              Welcome back, <span className="text-violet-400 font-medium">{firstName}</span> 👋
            </motion.p>
          )}

          {/* Social proof */}
          {!loading && !user && (
            <motion.p variants={fadeUp} initial="hidden" animate="show" custom={0.45}
              className="text-sm text-gray-600">
              Join <span className="text-gray-400 font-medium">10,000+</span> fashion lovers · No credit card required
            </motion.p>
          )}

          {/* Scroll cue */}
          <motion.div
            animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2.4 }}
            className="mt-16 flex justify-center text-gray-700"
          >
            <ChevronDown size={22} />
          </motion.div>
        </motion.div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <section className="py-16 border-y border-white/[0.05] bg-white/[0.015]">
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="max-w-4xl mx-auto grid grid-cols-3 gap-6 px-6 text-center">
          {[
            { n: 50000, s: "+", label: "Virtual Try-Ons" },
            { n: 10000, s: "+", label: "Active Users" },
            { n: 500,   s: "+", label: "Fashion Brands" },
          ].map(({ n, s, label }) => (
            <motion.div key={label} variants={fadeUp}>
              <p className="text-3xl md:text-4xl mb-1 text-white" style={{ fontFamily: "Instrument Serif, serif" }}>
                <Counter to={n} suffix={s} />
              </p>
              <p className="text-xs text-gray-600 tracking-widest uppercase">{label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────── */}
      <section id="features" className="py-28 md:py-40 px-5">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-20">
            <p className="text-violet-400 text-xs font-semibold mb-3 tracking-[0.2em] uppercase">What you get</p>
            <h2 className="text-4xl md:text-[3.2rem] leading-tight" style={{ fontFamily: "Instrument Serif, serif" }}>
              Everything you need<br />
              <em className="not-italic text-gray-500">to shop smarter.</em>
            </h2>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <motion.div key={i} variants={fadeUp}
                whileHover={{ y: -3, borderColor: "rgba(139,92,246,0.35)" }}
                className="group p-7 rounded-2xl bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.05] transition-all">
                <div className="flex items-start gap-5">
                  <div className="w-11 h-11 rounded-xl bg-violet-500/[0.12] border border-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0 group-hover:bg-violet-500/[0.2] transition-colors mt-0.5">
                    {f.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5 mb-2">
                      <h3 className="font-semibold text-white text-[15px]">{f.title}</h3>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-500/[0.1] text-violet-400 border border-violet-500/20">{f.tag}</span>
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section id="how" className="py-28 md:py-40 px-5 bg-white/[0.015] border-y border-white/[0.05]">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-20">
            <p className="text-violet-400 text-xs font-semibold mb-3 tracking-[0.2em] uppercase">Process</p>
            <h2 className="text-4xl md:text-[3.2rem] leading-tight" style={{ fontFamily: "Instrument Serif, serif" }}>
              Three steps to your<br />
              <em className="not-italic text-gray-500">perfect look.</em>
            </h2>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-5">
            {steps.map((s, i) => (
              <motion.div key={i} variants={fadeUp}
                whileHover={{ y: -6, borderColor: "rgba(139,92,246,0.35)" }}
                className="relative p-8 rounded-2xl bg-[#0d1117] border border-white/[0.07] hover:bg-[#0f1420] transition-all group">
                <div className="absolute top-6 right-6 text-[11px] font-bold text-violet-500/40 tracking-widest" style={{ fontFamily: "Instrument Serif, serif" }}>
                  {s.num}
                </div>
                <div className="w-14 h-14 rounded-2xl bg-violet-500/[0.1] border border-violet-500/20 flex items-center justify-center text-violet-400 mb-6 group-hover:bg-violet-500/[0.18] transition-colors">
                  {s.icon}
                </div>
                <h3 className="font-semibold text-white text-[15px] mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Mid-section CTA — auth-aware */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mt-14">
            {loading ? (
              <div className="w-52 h-12 rounded-xl bg-white/[0.05] animate-pulse mx-auto" />
            ) : user ? (
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/dashboard")}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold shadow-xl shadow-violet-500/20">
                Open My Dashboard <ArrowRight size={16} />
              </motion.button>
            ) : (
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/signup")}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold shadow-xl shadow-violet-500/20">
                Try it free — no card needed <ArrowRight size={16} />
              </motion.button>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────────────── */}
      <section id="testimonials" className="py-28 overflow-hidden">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="text-center mb-16 px-5">
          <p className="text-violet-400 text-xs font-semibold mb-3 tracking-[0.2em] uppercase">Reviews</p>
          <h2 className="text-4xl md:text-[3.2rem]" style={{ fontFamily: "Instrument Serif, serif" }}>
            Loved by fashion people.
          </h2>
        </motion.div>

        <motion.div animate={{ x: ["0%", "-50%"] }} transition={{ repeat: Infinity, duration: 38, ease: "linear" }}
          className="flex gap-4 w-max mb-4">
          {[...testimonials, ...testimonials].map((t, i) => (
            <div key={i} className="w-[300px] flex-shrink-0 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, j) => <Star key={j} size={12} className="text-amber-400 fill-amber-400" />)}
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">"{t.text}"</p>
              <div>
                <p className="text-white text-sm font-semibold">{t.name}</p>
                <p className="text-gray-600 text-xs">{t.role}</p>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div animate={{ x: ["-50%", "0%"] }} transition={{ repeat: Infinity, duration: 44, ease: "linear" }}
          className="flex gap-4 w-max">
          {[...testimonials.slice().reverse(), ...testimonials.slice().reverse()].map((t, i) => (
            <div key={i} className="w-[300px] flex-shrink-0 p-6 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, j) => <Star key={j} size={12} className="text-amber-400 fill-amber-400" />)}
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">"{t.text}"</p>
              <div>
                <p className="text-white text-sm font-semibold">{t.name}</p>
                <p className="text-gray-600 text-xs">{t.role}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section className="py-28 px-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/40 via-transparent to-fuchsia-950/25 pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.035] pointer-events-none" style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="relative max-w-3xl mx-auto text-center">

          <h2 className="text-4xl md:text-6xl leading-tight mb-5" style={{ fontFamily: "Instrument Serif, serif" }}>
            {user
              ? <>Ready to find your<br /><em className="not-italic" style={{ background: "linear-gradient(120deg,#a78bfa,#e879f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>next look?</em></>
              : <>The future of fashion<br /><em className="not-italic" style={{ background: "linear-gradient(120deg,#a78bfa,#e879f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>starts here.</em></>
            }
          </h2>

          <p className="text-gray-400 mb-10 text-[17px] max-w-xl mx-auto leading-relaxed">
            {loading
              ? "\u00A0"
              : user
                ? `You're signed in as ${user.email}. Your virtual wardrobe is waiting.`
                : "Join 10,000+ users who shop smarter with AI. Free forever — no credit card."}
          </p>

          {loading ? (
            <div className="flex justify-center gap-3">
              <div className="w-44 h-14 rounded-xl bg-white/[0.06] animate-pulse" />
              <div className="w-32 h-14 rounded-xl bg-white/[0.04] animate-pulse" />
            </div>
          ) : user ? (
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 0 50px rgba(139,92,246,0.45)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-lg font-semibold shadow-2xl shadow-violet-500/20"
            >
              Open Dashboard <ArrowRight size={20} />
            </motion.button>
          ) : (
            <div className="flex flex-wrap justify-center gap-3">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: "0 0 50px rgba(139,92,246,0.45)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/signup")}
                className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-lg font-semibold shadow-2xl shadow-violet-500/20"
              >
                Create Free Account <ArrowRight size={20} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/login")}
                className="inline-flex items-center gap-2 px-10 py-4 rounded-xl border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.08] text-white text-lg transition-all"
              >
                Sign In
              </motion.button>
            </div>
          )}
        </motion.div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.05] py-10 px-5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Shirt size={13} className="text-white" />
            </div>
            <span className="font-bold text-white text-sm">TryOnX</span>
          </div>
          <p className="text-xs text-gray-600">© 2026 TryOnX. AI Powered Virtual Fashion Platform.</p>
          <div className="flex gap-6 text-xs text-gray-600">
            <a href="#" className="hover:text-gray-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-gray-400 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
