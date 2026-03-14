import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Upload, Zap, RotateCcw, Download, Share2, ChevronLeft,
  CheckCircle, Loader, Camera, Shirt, Star, Heart, Filter, Search
} from "lucide-react";
import AppNavbar from "../components/AppNavbar";
import { OUTFITS, SAMPLE_MODELS, CATEGORIES } from "../data/outfits";
import { useVirtualTryOn } from "../hooks/useVirtualTryOn";
import PaymentModal from "../components/PaymentModal";
import { useAuth } from "../context/useAuth";

type Step = "upload" | "select" | "processing" | "result";

function StepDot({ n, current, done }: { n: number; current: number; done: boolean }) {
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${done ? "bg-emerald-500 border-emerald-500 text-white" : current === n ? "bg-purple-600 border-purple-400 text-white shadow-[0_0_16px_rgba(124,58,237,0.5)]" : "bg-white/[0.04] border-white/[0.1] text-gray-600"}`}>
      {done ? <CheckCircle size={16} /> : n}
    </div>
  );
}

export default function TryOn() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const { result, runTryOn } = useVirtualTryOn();

  const [step, setStep] = useState<Step>("upload");
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [selectedOutfit, setSelectedOutfit] = useState<typeof OUTFITS[0] | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [filterCat, setFilterCat] = useState("All");
  const [search, setSearch] = useState("");
  const [likedOutfits, setLikedOutfits] = useState<Set<number>>(new Set());
  const [showPayment, setShowPayment] = useState(false);
  const { user, profile } = useAuth();

  const stepIndex: Record<Step, number> = { upload: 1, select: 2, processing: 3, result: 4 };
  const STEPS = ["Upload Photo", "Choose Outfit", "AI Processing", "Your Look"];

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = e => { setUserPhoto(e.target?.result as string); setStep("select"); };
    reader.readAsDataURL(file);
  }, []);

  const startTryOn = async () => {
    if (!selectedOutfit || !userPhoto) return;
    setStep("processing");
    await runTryOn(userPhoto, selectedOutfit.img);
    setStep("result");
  };

  const reset = () => { setStep("upload"); setUserPhoto(null); setSelectedOutfit(null); };

  const downloadResult = () => {
    if (!result.resultUrl) return;
    const a = document.createElement("a");
    a.href = result.resultUrl;
    a.download = `tryonx-${selectedOutfit?.name ?? "look"}.jpg`;
    a.click();
  };

  const shareResult = async () => {
    if (!result.resultUrl) return;
    if (navigator.share) {
      const blob = await (await fetch(result.resultUrl)).blob();
      const file = new File([blob], "my-look.jpg", { type: "image/jpeg" });
      navigator.share({ title: "My TryOnX Look", files: [file] }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const filteredOutfits = OUTFITS.filter(o => {
    const catMatch = filterCat === "All" || o.category === filterCat;
    const searchMatch = !search || o.name.toLowerCase().includes(search.toLowerCase()) || o.brand.toLowerCase().includes(search.toLowerCase());
    return catMatch && searchMatch;
  });

  return (
    <div className="min-h-screen text-white" style={{ background: "#04040a" }}>
      <AppNavbar />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-20 pb-16">

        {/* Header + stepper */}
        <div className="py-8 mb-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-black" style={{ fontFamily: "'Syne',sans-serif" }}>Virtual Try-On</h1>
              <p className="text-gray-500 text-sm mt-0.5">Upload your photo, pick an outfit, see the magic ✨</p>
            </div>
            {step !== "upload" && (
              <button onClick={reset} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white border border-white/[0.08] px-3 py-1.5 rounded-xl transition-colors">
                <RotateCcw size={13} /> Start over
              </button>
            )}
          </div>

          {/* Progress stepper */}
          <div className="flex items-center">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <StepDot n={i + 1} current={stepIndex[step]} done={stepIndex[step] > i + 1} />
                  <span className={`text-[10px] font-medium hidden sm:block transition-colors ${stepIndex[step] === i + 1 ? "text-purple-300" : stepIndex[step] > i + 1 ? "text-emerald-400" : "text-gray-700"}`}>{s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded-full transition-colors ${stepIndex[step] > i + 1 ? "bg-emerald-500/50" : "bg-white/[0.06]"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* ── STEP 1: Upload ── */}
          {step === "upload" && (
            <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.35 }}>
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">

                {/* Drop zone */}
                <div>
                  <p className="text-sm font-semibold text-gray-300 mb-3">Upload your photo</p>
                  <motion.div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]); }}
                    onClick={() => fileRef.current?.click()}
                    animate={{ borderColor: dragOver ? "rgba(139,92,246,0.8)" : "rgba(255,255,255,0.08)", background: dragOver ? "rgba(124,58,237,0.07)" : "rgba(255,255,255,0.02)" }}
                    className="rounded-3xl border-2 border-dashed p-12 flex flex-col items-center gap-4 cursor-pointer mb-4 min-h-[260px] justify-center">
                    <motion.div animate={{ scale: dragOver ? 1.2 : 1, rotate: dragOver ? 10 : 0 }}
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}>
                      <Upload size={28} className="text-purple-400" />
                    </motion.div>
                    <div className="text-center">
                      <p className="text-base font-semibold text-white">Drop your photo here</p>
                      <p className="text-xs text-gray-600 mt-1">JPG, PNG, WEBP · Max 10MB</p>
                    </div>
                    <span className="text-xs text-purple-400 border border-purple-500/30 px-4 py-1.5 rounded-full hover:bg-purple-500/10 transition-colors">
                      Browse files
                    </span>
                  </motion.div>

                  {/* Tips */}
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="flex items-start gap-3">
                      <Camera size={16} className="text-purple-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-white mb-2">📸 Tips for best results</p>
                        {["Full-body photo with good lighting", "Stand straight, arms slightly away from body", "Plain or simple background", "Wear form-fitting clothes for accuracy"].map(tip => (
                          <div key={tip} className="flex items-center gap-2 mb-1">
                            <div className="w-1 h-1 rounded-full bg-purple-400" />
                            <p className="text-xs text-gray-500">{tip}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sample models */}
                <div>
                  <p className="text-sm font-semibold text-gray-300 mb-3">Or choose a sample model</p>
                  <div className="grid grid-cols-2 gap-3">
                    {SAMPLE_MODELS.map(m => (
                      <motion.button key={m.id} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        onClick={() => { setUserPhoto(m.img); setStep("select"); }}
                        className="relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-transparent hover:border-purple-500/60 transition-all group">
                        <img src={m.img} alt={m.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400"; }} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                          <span className="text-[10px] bg-black/60 backdrop-blur px-2.5 py-1 rounded-full text-gray-300 font-medium">{m.label}</span>
                        </div>
                        <div className="absolute inset-0 bg-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-xs font-bold text-white bg-purple-600 px-3 py-1 rounded-full">Select</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Select Outfit ── */}
          {step === "select" && (
            <motion.div key="select" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.35 }}>
              <div className="flex gap-6">

                {/* Left panel — user photo */}
                <div className="w-56 flex-shrink-0 hidden md:block">
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest font-semibold">Your Photo</p>
                  <div className="relative rounded-2xl overflow-hidden border border-white/[0.1] aspect-[3/4]">
                    {userPhoto && <img src={userPhoto} alt="You" className="w-full h-full object-cover" />}
                    <button onClick={() => { setUserPhoto(null); setStep("upload"); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 backdrop-blur flex items-center justify-center hover:bg-red-500/80 transition-colors">
                      <RotateCcw size={12} className="text-white" />
                    </button>
                  </div>
                  {selectedOutfit && (
                    <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      onClick={startTryOn}
                      className="w-full mt-3 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                      style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)", boxShadow: "0 0 24px rgba(124,58,237,0.4)" }}>
                      <Zap size={16} /> Try It On!
                    </motion.button>
                  )}
                  {selectedOutfit && (
                    <div className="mt-3 p-3 rounded-xl border border-purple-500/30 bg-purple-500/10">
                      <p className="text-xs font-semibold text-purple-300">Selected:</p>
                      <p className="text-sm text-white font-medium mt-0.5 truncate">{selectedOutfit.name}</p>
                      <p className="text-xs text-gray-500">{selectedOutfit.brand} · {selectedOutfit.price}</p>
                    </div>
                  )}
                </div>

                {/* Right panel — outfit grid */}
                <div className="flex-1 min-w-0">
                  {/* Mobile try on button */}
                  {selectedOutfit && (
                    <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileTap={{ scale: 0.96 }}
                      onClick={startTryOn}
                      className="md:hidden w-full mb-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                      style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}>
                      <Zap size={16} /> Try On: {selectedOutfit.name}
                    </motion.button>
                  )}

                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.08] bg-white/[0.03] flex-1">
                      <Search size={13} className="text-gray-600" />
                      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search outfits…"
                        className="bg-transparent text-sm text-white placeholder-gray-700 outline-none flex-1" />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {["All", "Dresses", "Formal", "Casual", "Streetwear"].map(cat => (
                        <button key={cat} onClick={() => setFilterCat(cat)}
                          className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${filterCat === cat ? "bg-purple-600 text-white" : "bg-white/[0.04] text-gray-400 border border-white/[0.07]"}`}>
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 mb-3">{filteredOutfits.length} outfits · tap to select</p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[65vh] overflow-y-auto pr-1">
                    {filteredOutfits.map(outfit => {
                      const isSelected = selectedOutfit?.id === outfit.id;
                      const isLiked = likedOutfits.has(outfit.id);
                      return (
                        <motion.div key={outfit.id} whileHover={{ y: -4 }} whileTap={{ scale: 0.97 }}
                          onClick={() => setSelectedOutfit(outfit)}
                          className={`rounded-xl overflow-hidden cursor-pointer border-2 transition-all relative ${isSelected ? "border-purple-500 shadow-[0_0_24px_rgba(124,58,237,0.45)]" : "border-transparent hover:border-white/20"}`}>
                          <div className="aspect-[3/4] relative">
                            <img src={outfit.img} alt={outfit.name} className="w-full h-full object-cover"
                              onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400"; }} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                            {/* Selected overlay */}
                            {isSelected && (
                              <div className="absolute inset-0 bg-purple-500/25 flex items-center justify-center">
                                <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                                  <CheckCircle size={20} className="text-white" />
                                </div>
                              </div>
                            )}

                            {/* Badges */}
                            {outfit.isNew && <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500 text-white">NEW</span>}

                            {/* Like */}
                            <button onClick={e => { e.stopPropagation(); setLikedOutfits(prev => { const s = new Set(prev); s.has(outfit.id) ? s.delete(outfit.id) : s.add(outfit.id); return s; }); }}
                              className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
                              <Heart size={12} fill={isLiked ? "#ec4899" : "none"} stroke={isLiked ? "#ec4899" : "white"} />
                            </button>

                            <div className="absolute bottom-2 left-2 right-2">
                              <p className="text-[11px] font-semibold text-white truncate">{outfit.name}</p>
                              <div className="flex items-center justify-between mt-0.5">
                                <p className="text-[10px] text-gray-400">{outfit.brand}</p>
                                <p className="text-[11px] font-bold text-purple-300">{outfit.price}</p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Processing ── */}
          {step === "processing" && (
            <motion.div key="processing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center py-16 max-w-lg mx-auto text-center">

              {/* Pulsing AI orb */}
              <div className="relative w-36 h-36 mb-10">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="absolute inset-0 rounded-full border border-purple-500/40"
                    animate={{ scale: [1, 1.5 + i * 0.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }} />
                ))}
                <div className="absolute inset-0 rounded-full flex items-center justify-center"
                  style={{ background: "radial-gradient(circle,rgba(124,58,237,0.3),rgba(236,72,153,0.2),transparent)" }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                    <Zap size={40} className="text-purple-400" />
                  </motion.div>
                </div>
              </div>

              <h2 className="text-3xl font-black mb-2" style={{ fontFamily: "'Syne',sans-serif" }}>AI is working…</h2>
              <p className="text-gray-500 text-sm mb-2">{result.stage}</p>

              {/* Progress bar */}
              <div className="w-full max-w-xs bg-white/[0.06] rounded-full h-1.5 mb-8 overflow-hidden">
                <motion.div className="h-full rounded-full" animate={{ width: `${result.progress}%` }} transition={{ duration: 0.3 }}
                  style={{ background: "linear-gradient(90deg,#7c3aed,#ec4899)" }} />
              </div>

              {/* Stage list */}
              <div className="w-full max-w-xs space-y-2.5">
                {["Detecting body keypoints…", "Segmenting clothing region…", "Aligning outfit to pose…", "Blending textures…", "Rendering final result…"].map((s, i) => {
                  const done = result.progress >= (i + 1) * 20;
                  const active = !done && result.progress >= i * 20;
                  return (
                    <div key={s} className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${done ? "border-emerald-500/20 bg-emerald-500/[0.06]" : active ? "border-purple-500/30 bg-purple-500/[0.06]" : "border-white/[0.04] bg-transparent"}`}>
                      {done ? <CheckCircle size={15} className="text-emerald-400 flex-shrink-0" />
                        : active ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><Loader size={15} className="text-purple-400 flex-shrink-0" /></motion.div>
                        : <div className="w-3.5 h-3.5 rounded-full border border-gray-700 flex-shrink-0" />}
                      <span className={`text-xs ${done ? "text-emerald-400" : active ? "text-purple-300" : "text-gray-700"}`}>{s}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ── STEP 4: Result ── */}
          {step === "result" && (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>

              {/* Success badge */}
              <div className="flex flex-col items-center mb-8">
                <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200 }}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-3 border border-emerald-500/30 bg-emerald-500/10">
                  <CheckCircle size={15} className="text-emerald-400" />
                  <span className="text-sm text-emerald-400 font-semibold">Your look is ready! 🎉</span>
                </motion.div>
                <h2 className="text-4xl font-black text-center" style={{ fontFamily: "'Syne',sans-serif" }}>Looking amazing! ✨</h2>
                <p className="text-gray-500 text-sm mt-1">Here's how {selectedOutfit?.name} looks on you</p>
              </div>

              {/* Before / After */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 mb-8">

                {/* Before */}
                <div className="text-center">
                  <div className="flex items-center gap-2 justify-center mb-2">
                    <div className="w-2 h-2 rounded-full bg-gray-500" />
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest">Original</p>
                  </div>
                  <div className="w-64 rounded-3xl overflow-hidden border border-white/[0.1] shadow-xl">
                    {userPhoto && <img src={userPhoto} alt="Original" className="w-full aspect-[3/4] object-cover" />}
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex flex-row md:flex-col items-center gap-2 md:mt-12">
                  <div className="w-10 h-0.5 md:w-0.5 md:h-10 bg-gradient-to-r md:bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}>
                    <Zap size={18} className="text-white" />
                  </div>
                  <div className="w-10 h-0.5 md:w-0.5 md:h-10 bg-gradient-to-r md:bg-gradient-to-b from-pink-500 to-purple-500 rounded-full" />
                </div>

                {/* After — canvas composite */}
                <div className="text-center">
                  <div className="flex items-center gap-2 justify-center mb-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400" />
                    <p className="text-xs text-purple-300 font-semibold uppercase tracking-widest">AI Try-On</p>
                  </div>
                  <div className="w-64 rounded-3xl overflow-hidden border-2 border-purple-500/50 shadow-[0_0_48px_rgba(124,58,237,0.3)] relative">
                    {result.resultUrl && <img src={result.resultUrl} alt="Result" className="w-full aspect-[3/4] object-cover" />}
                    {!result.resultUrl && selectedOutfit && (
                      <div className="relative aspect-[3/4]">
                        <img src={selectedOutfit.img} alt={selectedOutfit.name} className="w-full h-full object-cover opacity-90" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-[10px] font-bold text-white" style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}>
                      ✦ AI Generated
                    </div>
                  </div>
                </div>
              </div>

              {/* Outfit details */}
              {selectedOutfit && (
                <div className="flex justify-center mb-6">
                  <div className="flex items-center gap-4 px-5 py-3 rounded-2xl border border-white/[0.08] bg-white/[0.03]">
                    <img src={selectedOutfit.img} alt="" className="w-12 h-16 rounded-lg object-cover"
                      onError={e => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=100"; }} />
                    <div>
                      <p className="font-bold text-sm">{selectedOutfit.name}</p>
                      <p className="text-xs text-gray-500">{selectedOutfit.brand} · {selectedOutfit.price}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star size={10} fill="#f59e0b" stroke="none" />
                        <span className="text-xs text-gray-400">{selectedOutfit.rating} ({selectedOutfit.reviews} reviews)</span>
                      </div>
                    </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}
                      onClick={() => setShowPayment(true)}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold text-white"
                      style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}>
                      Buy Now →
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 justify-center">
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={downloadResult}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)", boxShadow: "0 0 20px rgba(124,58,237,0.35)" }}>
                  <Download size={15} /> Save Look
                </motion.button>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={shareResult}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08]">
                  <Share2 size={15} /> Share
                </motion.button>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => setStep("select")}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08]">
                  <Shirt size={15} /> Try Another
                </motion.button>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={reset}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08]">
                  <RotateCcw size={15} /> New Photo
                </motion.button>
              </div>

            </motion.div>
          )}

      </AnimatePresence>

{/* Payment Modal */}
<AnimatePresence>
  {showPayment && selectedOutfit && (
    <PaymentModal
      outfit={selectedOutfit}
      onClose={() => setShowPayment(false)}
      userEmail={user?.email ?? ""}
      userName={profile?.displayName ?? user?.displayName ?? ""}
    />
  )}
</AnimatePresence>

</div>
</div>
);
}