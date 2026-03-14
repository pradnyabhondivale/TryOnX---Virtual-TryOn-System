import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppNavbar from "../components/AppNavbar";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Send, Sparkles, Shirt, RefreshCw } from "lucide-react";

interface Message {
  id: number;
  role: "user" | "ai";
  text: string;
  outfits?: { img: string; name: string; match: number }[];
  typing?: boolean;
}

const outfit1 = "/src/assets/images/outfit1.jpg";
const outfit2 = "/src/assets/images/outfit2.jpg";

const SUGGESTIONS = [
  "What should I wear to a beach wedding?",
  "Suggest a business casual outfit",
  "I need a date night look",
  "What's trending in street fashion?",
  "Cosy autumn outfit ideas",
  "Smart casual for a job interview",
];

const AI_RESPONSES: Record<string, Message["outfits"]> = {
  wedding: [
    { img: outfit1, name: "Floral Midi Dress", match: 96 },
    { img: outfit2, name: "Pastel Linen Set", match: 88 },
  ],
  business: [
    { img: outfit2, name: "Tailored Blazer Set", match: 94 },
    { img: outfit1, name: "Smart Shirt & Trousers", match: 90 },
  ],
  default: [
    { img: outfit1, name: "Curated Pick #1", match: 92 },
    { img: outfit2, name: "Curated Pick #2", match: 85 },
  ],
};

function getAiResponse(q: string): { text: string; outfits?: Message["outfits"] } {
  const lower = q.toLowerCase();
  if (lower.includes("wedding") || lower.includes("beach")) {
    return { text: "For a beach wedding, you'll want something elegant yet breathable. I'd recommend flowing fabrics like chiffon or linen. Here are my top picks:", outfits: AI_RESPONSES.wedding };
  }
  if (lower.includes("business") || lower.includes("casual") || lower.includes("interview")) {
    return { text: "Smart business casual means polished but comfortable. Think well-fitted trousers, a neat blazer, and clean shoes. Here's what I'd recommend:", outfits: AI_RESPONSES.business };
  }
  if (lower.includes("date") || lower.includes("night")) {
    return { text: "Date night calls for something that makes you feel confident and attractive. Here are some options that strike the perfect balance:", outfits: AI_RESPONSES.default };
  }
  if (lower.includes("trend") || lower.includes("street")) {
    return { text: "Street fashion this season is all about oversized silhouettes, bold colours, and mixing high and low pieces. Here are some trending looks:", outfits: AI_RESPONSES.default };
  }
  return { text: "Great choice! Based on your query, I've curated some outfit suggestions that should work perfectly for you. Let me know if you'd like me to refine these based on colour preferences, occasion, or body type.", outfits: AI_RESPONSES.default };
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map(i => (
        <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-purple-400"
          animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} />
      ))}
    </div>
  );
}

function OutfitSuggestion({ outfit, onTryOn }: { outfit: { img: string; name: string; match: number }; onTryOn: () => void }) {
  return (
    <motion.div whileHover={{ y: -3 }} className="w-36 flex-shrink-0 rounded-xl overflow-hidden border border-white/[0.08] cursor-pointer group">
      <div className="relative aspect-[3/4]">
        <img src={outfit.img} alt={outfit.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}>
          {outfit.match}%
        </div>
      </div>
      <div className="p-2 bg-white/[0.04]">
        <p className="text-xs font-medium truncate">{outfit.name}</p>
        <button onClick={onTryOn} className="text-[10px] text-purple-400 hover:text-purple-300 mt-0.5 flex items-center gap-0.5">
          Try on →
        </button>
      </div>
    </motion.div>
  );
}

export default function Stylist() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: "ai", text: "Hi! I'm your personal AI stylist. Tell me about the occasion, your style preferences, or ask me anything about fashion. I'll suggest the perfect outfits for you! 👗✨" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: Date.now(), role: "user", text };
    const typingMsg: Message = { id: Date.now() + 1, role: "ai", text: "", typing: true };

    setMessages(prev => [...prev, userMsg, typingMsg]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      const { text: aiText, outfits } = getAiResponse(text);
      setMessages(prev => prev.filter(m => !m.typing).concat({
        id: Date.now() + 2, role: "ai", text: aiText, outfits
      }));
      setLoading(false);
    }, 1200 + Math.random() * 800);
  };

  const reset = () => {
    setMessages([{ id: 0, role: "ai", text: "Hi! I'm your personal AI stylist. Tell me about the occasion, your style preferences, or ask me anything about fashion. I'll suggest the perfect outfits for you! 👗✨" }]);
  };

  return (
    <div className="min-h-screen text-white flex flex-col" style={{ background: "#04040a" }}>
      <AppNavbar />

      {/* Messages */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-4 pt-24 pb-36 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div key={msg.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              {/* Avatar */}
              {msg.role === "ai" && (
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 mt-1">
                  <Sparkles size={14} className="text-white" />
                </div>
              )}
              <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-2`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "text-white rounded-tr-sm"
                    : "text-gray-200 rounded-tl-sm border border-white/[0.07]"
                  }`}
                  style={msg.role === "user" ? { background: "linear-gradient(135deg,#7c3aed,#ec4899)" } : { background: "rgba(255,255,255,0.04)" }}>
                  {msg.typing ? <TypingIndicator /> : msg.text}
                </div>
                {/* Outfit suggestions */}
                {msg.outfits && (
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {msg.outfits.map((o, i) => (
                      <OutfitSuggestion key={i} outfit={o} onTryOn={() => navigate("/tryon")} />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-white/[0.06]" style={{ background: "rgba(4,4,10,0.95)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Suggestions */}
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => send(s)}
                className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border border-white/[0.08] text-gray-400 hover:text-white hover:border-purple-500/40 transition-all bg-white/[0.03]">
                {s}
              </button>
            ))}
          </div>
          {/* Text input */}
          <div className="flex gap-3 items-end">
            <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-2xl border border-white/[0.08] bg-white/[0.04]">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send(input))}
                placeholder="Ask your AI stylist anything…"
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
              />
              <Shirt size={16} className="text-gray-600 flex-shrink-0" />
            </div>
            <motion.button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}>
              <Send size={16} className="text-white" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
