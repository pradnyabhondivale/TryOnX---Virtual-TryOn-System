import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { Shirt, Sparkles, Upload, Star, TrendingUp, Heart, Zap, ShoppingBag, Package, ChevronRight, ArrowUpRight, Eye } from "lucide-react";
import AppNavbar from "../components/AppNavbar";
import { OUTFITS } from "../data/outfits";
import PaymentModal from "../components/PaymentModal";
import { AnimatePresence } from "framer-motion";

const fade = (i: number) => ({ initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: i * 0.07 } });

function OutfitCard({ outfit, onTryOn }: { outfit: typeof OUTFITS[0]; onTryOn: () => void }) {
  const [liked, setLiked] = useState(outfit.liked ?? false);
  return (
    <motion.div whileHover={{ y: -6 }} transition={{ duration: 0.22 }}
      className="group rounded-2xl overflow-hidden border border-white/[0.07] cursor-pointer"
      style={{ background: "rgba(255,255,255,0.025)" }}>
      <div className="relative aspect-[3/4] overflow-hidden">
        <img src={outfit.img} alt={outfit.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80"; }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          {outfit.isNew && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">NEW</span>}
          {outfit.isTrending && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white">🔥 HOT</span>}
        </div>

        {/* Like */}
        <button onClick={e => { e.stopPropagation(); setLiked(v => !v); }}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
          <Heart size={14} fill={liked ? "#ec4899" : "none"} stroke={liked ? "#ec4899" : "white"} />
        </button>

        {/* Try On CTA */}
        <div className="absolute bottom-3 inset-x-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200">
          <button onClick={onTryOn}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 backdrop-blur-sm"
            style={{ background: "linear-gradient(135deg,rgba(124,58,237,0.95),rgba(236,72,153,0.95))", boxShadow: "0 4px 20px rgba(124,58,237,0.5)" }}>
            <Zap size={12} /> Virtual Try-On
          </button>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{outfit.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{outfit.brand}</p>
          </div>
          <p className="text-sm font-bold text-purple-300 flex-shrink-0">{outfit.price}</p>
        </div>
        <div className="flex items-center gap-1 mt-1.5">
          <Star size={10} fill="#f59e0b" stroke="none" />
          <span className="text-[10px] text-gray-400">{outfit.rating} ({outfit.reviews})</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const name = profile?.firstName ?? user?.displayName?.split(" ")[0] ?? "there";
  const [buyOutfit, setBuyOutfit] = useState<typeof OUTFITS[0] | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [hour] = useState(new Date().getHours());

  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const filtered = activeCategory === "All" ? OUTFITS : OUTFITS.filter(o => o.category === activeCategory);
  const trending = OUTFITS.filter(o => o.isTrending).slice(0, 4);
  const categories = ["All", "Dresses", "Formal", "Casual", "Streetwear", "Athleisure"];

  const stats = [
    { icon: <Shirt size={20} />, label: "Try-Ons Done", value: "0", trend: "Start now", color: "#a78bfa", bg: "rgba(167,139,250,0.1)" },
    { icon: <Heart size={20} />, label: "Saved Outfits", value: String(OUTFITS.filter(o => o.liked).length), trend: "+2 today", color: "#ec4899", bg: "rgba(236,72,153,0.1)" },
    { icon: <Package size={20} />, label: "Wardrobe Items", value: "0", trend: "Add items", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
    { icon: <Star size={20} />, label: "Style Score", value: "—", trend: "Unlock now", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  ];

  const quickActions = [
    { icon: <Upload size={20} />, label: "Try On", desc: "Upload your photo", color: "#a78bfa", to: "/tryon" },
    { icon: <ShoppingBag size={20} />, label: "Browse", desc: "Explore catalog", color: "#ec4899", to: "/catalog" },
    { icon: <Sparkles size={20} />, label: "AI Stylist", desc: "Get outfit advice", color: "#f59e0b", to: "/stylist" },
    { icon: <Package size={20} />, label: "Wardrobe", desc: "Manage your closet", color: "#10b981", to: "/wardrobe" },
  ];

  return (
    <div className="min-h-screen text-white" style={{ background: "#04040a" }}>
      <AppNavbar />

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-24 pb-20">

        {/* Welcome hero */}
        <motion.div {...fade(0)}
          className="relative rounded-3xl overflow-hidden mb-8 p-8 md:p-10"
          style={{ background: "linear-gradient(135deg,rgba(109,40,217,0.45) 0%,rgba(219,39,119,0.3) 50%,rgba(4,4,10,0.9) 100%)", border: "1px solid rgba(139,92,246,0.25)" }}>
          {/* Dot pattern */}
          <div className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.8) 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
          {/* Ambient glow */}
          <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full opacity-30 blur-3xl"
            style={{ background: "radial-gradient(circle,#7c3aed,transparent)" }} />

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <p className="text-purple-300/80 text-sm mb-1 font-medium">{greeting},</p>
              <h1 className="text-4xl md:text-5xl font-black mb-2" style={{ fontFamily: "'Syne',sans-serif" }}>
                {name} 👋
              </h1>
              <p className="text-gray-400 text-sm max-w-md">
                Ready to find your next perfect outfit? We have {OUTFITS.length} new looks waiting for you.
              </p>
              <div className="flex gap-3 mt-5">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
                  onClick={() => navigate("/tryon")}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)", boxShadow: "0 0 30px rgba(124,58,237,0.4)" }}>
                  <Zap size={16} /> Start Try-On
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
                  onClick={() => navigate("/stylist")}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border border-white/[0.12] bg-white/[0.06]">
                  <Sparkles size={16} /> AI Stylist
                </motion.button>
              </div>
            </div>

            {/* Preview stack */}
            <div className="hidden md:flex items-end gap-2">
              {trending.slice(0, 3).map((o, i) => (
                <motion.div key={o.id} whileHover={{ y: -8, zIndex: 10 }}
                  className="relative rounded-2xl overflow-hidden border border-white/10 flex-shrink-0"
                  style={{ width: 90 + i * 8, height: 120 + i * 12, zIndex: i }}>
                  <img src={o.img} alt={o.name} className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400"; }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <motion.div key={s.label} {...fade(i + 1)}
              whileHover={{ y: -3, scale: 1.02 }} transition={{ duration: 0.2 }}
              className="rounded-2xl border border-white/[0.07] p-5 cursor-default"
              style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: s.bg }}>
                  <span style={{ color: s.color }}>{s.icon}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full text-gray-400 bg-white/[0.05]">{s.trend}</span>
              </div>
              <p className="text-3xl font-black mb-0.5" style={{ fontFamily: "'Syne',sans-serif", color: s.color }}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <motion.div {...fade(5)} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {quickActions.map(a => (
            <motion.button key={a.label} whileHover={{ y: -4, scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate(a.to)}
              className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-white/[0.07] hover:border-white/[0.14] transition-all group"
              style={{ background: "rgba(255,255,255,0.025)" }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ background: `${a.color}15`, border: `1px solid ${a.color}25` }}>
                <span style={{ color: a.color }}>{a.icon}</span>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-white">{a.label}</p>
                <p className="text-[11px] text-gray-600 mt-0.5">{a.desc}</p>
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* Trending now */}
        <motion.div {...fade(6)} className="mb-8">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-orange-400" />
              <h2 className="text-xl font-black" style={{ fontFamily: "'Syne',sans-serif" }}>Trending Now 🔥</h2>
            </div>
            <button onClick={() => navigate("/tryon")} className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors">
              See all <ChevronRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {trending.map(outfit => (
              <OutfitCard key={outfit.id} outfit={outfit} onTryOn={() => navigate("/tryon")} />
            ))}
          </div>
        </motion.div>

        {/* Browse by category */}
        <motion.div {...fade(7)}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-black" style={{ fontFamily: "'Syne',sans-serif" }}>Browse Catalog</h2>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${activeCategory === cat ? "bg-purple-600 text-white" : "bg-white/[0.05] text-gray-400 hover:text-white border border-white/[0.07]"}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filtered.map((outfit, i) => (
              <motion.div key={outfit.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
                <OutfitCard outfit={outfit} onTryOn={() => navigate("/tryon")} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Style tips banner */}
        <motion.div {...fade(8)} className="mt-8 rounded-3xl p-6 border border-white/[0.07] flex items-center justify-between gap-4"
          style={{ background: "linear-gradient(135deg,rgba(17,17,27,1),rgba(30,20,50,1))" }}>
          <div>
            <p className="text-xs text-purple-400 font-semibold mb-1 uppercase tracking-widest">AI Powered</p>
            <h3 className="text-lg font-black" style={{ fontFamily: "'Syne',sans-serif" }}>Get your personalised style report</h3>
            <p className="text-gray-500 text-sm mt-1">Our AI analyses your preferences and suggests outfits tailored just for you.</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
            onClick={() => navigate("/stylist")}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold"
            style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}>
            <ArrowUpRight size={16} /> Try Now
          </motion.button>
        </motion.div>

      </div>

      <AnimatePresence>
        {buyOutfit && (
          <PaymentModal
            outfit={buyOutfit}
            onClose={() => setBuyOutfit(null)}
            userEmail={user?.email ?? ""}
            userName={profile?.displayName ?? ""}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
