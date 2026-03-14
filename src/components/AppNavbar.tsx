import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Search, Menu, X, LayoutDashboard, Shirt, Sparkles, Package, User, LogOut } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import logo from "../assets/images/logo.png";

const NAV_LINKS = [
  { label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={16} /> },
  { label: "Try-On", path: "/tryon", icon: <Shirt size={16} /> },
  { label: "Wardrobe", path: "/wardrobe", icon: <Package size={16} /> },
  { label: "AI Stylist", path: "/stylist", icon: <Sparkles size={16} /> },
];

export default function AppNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const name = profile?.firstName ?? user?.displayName?.split(" ")[0] ?? "User";
  const photo = profile?.photo;

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl border-b border-white/[0.06]"
        style={{ background: "rgba(4,4,10,0.9)" }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <button onClick={() => navigate("/")} className="flex items-center gap-2.5 flex-shrink-0">
            <img src={logo} alt="TryOnX" className="w-8 h-8 object-contain"
              style={{ filter: "drop-shadow(0 0 8px rgba(139,92,246,0.8))" }} />
            <span className="text-lg font-black tracking-tight hidden sm:block" style={{ fontFamily: "'Syne',sans-serif" }}>
              <span style={{ background: "linear-gradient(135deg,#a78bfa,#ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Try</span>
              <span className="text-white">OnX</span>
            </span>
          </button>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(link => {
              const active = location.pathname === link.path;
              return (
                <button key={link.path} onClick={() => navigate(link.path)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    active ? "bg-purple-600/20 text-purple-300 border border-purple-500/30" : "text-gray-400 hover:text-white hover:bg-white/[0.05]"
                  }`}>
                  {link.icon} {link.label}
                </button>
              );
            })}
          </div>

          {/* Search + actions */}
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.07] bg-white/[0.03] w-48">
              <Search size={13} className="text-gray-600 flex-shrink-0" />
              <input placeholder="Search…" className="bg-transparent text-sm text-white placeholder-gray-700 outline-none w-full" />
            </div>

            <button className="relative w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-gray-400 hover:text-white transition-colors">
              <Bell size={15} />
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-purple-500" />
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button onClick={() => setProfileOpen(v => !v)}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.08] transition-colors">
                {photo
                  ? <img src={photo} alt={name} className="w-7 h-7 rounded-lg object-cover" />
                  : <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold">
                      {name[0]?.toUpperCase()}
                    </div>
                }
                <span className="text-sm text-gray-300 hidden sm:block max-w-[80px] truncate">{name}</span>
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -8 }}
                      className="absolute right-0 top-12 z-50 w-52 rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl"
                      style={{ background: "#0d0d18" }}>
                      <div className="px-4 py-3 border-b border-white/[0.06]">
                        <p className="text-sm font-semibold text-white truncate">{name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <div className="p-1.5">
                        {[
                          { icon: <User size={14} />, label: "Profile", action: () => { navigate("/profile"); setProfileOpen(false); } },
                          { icon: <LayoutDashboard size={14} />, label: "Dashboard", action: () => { navigate("/dashboard"); setProfileOpen(false); } },
                        ].map(item => (
                          <button key={item.label} onClick={item.action}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors text-left">
                            {item.icon} {item.label}
                          </button>
                        ))}
                        <div className="h-px bg-white/[0.06] my-1" />
                        <button onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left">
                          <LogOut size={14} /> Sign Out
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile hamburger */}
            <button onClick={() => setMenuOpen(v => !v)}
              className="md:hidden w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center text-gray-400">
              {menuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/[0.06] overflow-hidden" style={{ background: "rgba(4,4,10,0.98)" }}>
              <div className="px-4 py-3 space-y-1">
                {NAV_LINKS.map(link => (
                  <button key={link.path} onClick={() => { navigate(link.path); setMenuOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      location.pathname === link.path ? "bg-purple-600/20 text-purple-300" : "text-gray-400"
                    }`}>
                    {link.icon} {link.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
