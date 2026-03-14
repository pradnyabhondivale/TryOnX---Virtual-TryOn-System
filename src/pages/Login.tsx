import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
} from "firebase/auth";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { auth, db } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { Eye, EyeOff, ArrowRight, Shirt } from "lucide-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function friendlyError(err: FirebaseError): string {
  switch (err.code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password. Please try again.";
    case "auth/invalid-email": return "Enter a valid email address.";
    case "auth/too-many-requests": return "Too many attempts. Wait a moment and try again.";
    case "auth/network-request-failed": return "Network error. Check your connection.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request": return "";
    default: return err.message ?? "Something went wrong.";
  }
}

export default function Login() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) navigate("/dashboard", { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    getRedirectResult(auth).then(async (result) => {
      if (!result) return;
      const u = result.user;
      await setDoc(doc(db, "users", u.uid), {
        firstName: u.displayName?.split(" ")[0] ?? "",
        lastName: u.displayName?.split(" ").slice(1).join(" ") ?? "",
        displayName: u.displayName,
        email: u.email,
        photo: u.photoURL ?? null,
        emailVerified: true,
        provider: result.providerId === GoogleAuthProvider.PROVIDER_ID ? "google" : "apple",
        createdAt: serverTimestamp(),
      }, { merge: true });
      navigate("/dashboard", { replace: true });
    }).catch((err: FirebaseError) => {
      const msg = friendlyError(err);
      if (msg) setGlobalError(msg);
    });
  }, []); // eslint-disable-line

  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [emailErr, setEmailErr]     = useState("");
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading]       = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google"|"apple"|null>(null);
  const [resetSent, setResetSent]   = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const validateEmail = (v: string) => {
    setEmail(v);
    setEmailErr(v && !EMAIL_RE.test(v) ? "Enter a valid email address." : "");
  };

  const isReady = EMAIL_RE.test(email) && password.length >= 6 && !loading;

  const handleLogin = async () => {
    if (!isReady) return;
    setGlobalError(""); setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setLoading(false);
      const msg = friendlyError(err as FirebaseError);
      if (msg) setGlobalError(msg);
    }
  };

  const handleGoogle = async () => {
    setGlobalError(""); setSocialLoading("google");
    try {
      const p = new GoogleAuthProvider();
      p.setCustomParameters({ prompt: "select_account" });
      await signInWithRedirect(auth, p);
    } catch (err) {
      setSocialLoading(null);
      const msg = friendlyError(err as FirebaseError);
      if (msg) setGlobalError(msg);
    }
  };

  const handleApple = async () => {
    setGlobalError(""); setSocialLoading("apple");
    try {
      const p = new OAuthProvider("apple.com");
      p.addScope("email"); p.addScope("name");
      await signInWithRedirect(auth, p);
    } catch (err) {
      setSocialLoading(null);
      const msg = friendlyError(err as FirebaseError);
      if (msg) setGlobalError(msg);
    }
  };

  const handleReset = async () => {
    if (!EMAIL_RE.test(email)) { setEmailErr("Enter your email above first."); return; }
    setResetLoading(true);
    try { await sendPasswordResetEmail(auth, email); setResetSent(true); }
    catch (err) { const msg = friendlyError(err as FirebaseError); if (msg) setGlobalError(msg); }
    finally { setResetLoading(false); }
  };

  if (authLoading) return (
    <div className="min-h-screen bg-[#07090f] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#07090f] text-white" style={{ fontFamily: "Syne, sans-serif" }}>

      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 relative overflow-hidden bg-[#0a0c14] border-r border-white/[0.06] p-12">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-[400px] h-[400px] bg-violet-600/[0.15] blur-[100px] rounded-full -top-20 -left-20" />
          <div className="absolute w-[300px] h-[300px] bg-fuchsia-600/[0.1] blur-[100px] rounded-full bottom-0 right-0" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }} />
        </div>
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-xl shadow-violet-500/30">
            <Shirt size={17} className="text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Try<span className="text-violet-400">OnX</span></span>
        </div>
        <div className="relative z-10">
          <h2 className="text-4xl font-normal leading-tight mb-4" style={{ fontFamily: "Instrument Serif, serif" }}>
            Your virtual<br />wardrobe<br /><em className="not-italic text-violet-400">awaits.</em>
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            Sign in to access your AI-powered try-on experience, saved looks, and style recommendations.
          </p>
          <div className="flex flex-col gap-3">
            {["AI-powered outfit previews", "Smart size recommendations", "Virtual wardrobe organizer"].map((t) => (
              <div key={t} className="flex items-center gap-2.5 text-sm text-gray-400">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />
                {t}
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-xs text-gray-700">© 2026 TryOnX. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-5 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[400px]"
        >
          {/* Mobile brand */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Shirt size={14} className="text-white" />
            </div>
            <span className="font-bold text-white">Try<span className="text-violet-400">OnX</span></span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight mb-1">Welcome back</h1>
          <p className="text-gray-500 text-sm mb-8">Sign in to continue to your account.</p>

          {/* Global error */}
          <AnimatePresence>
            {globalError && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-5 overflow-hidden">
                <div className="flex items-start gap-2 bg-red-500/[0.08] border border-red-500/25 rounded-xl px-3.5 py-3 text-sm text-red-400">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                  {globalError}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reset sent */}
          <AnimatePresence>
            {resetSent && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-5 overflow-hidden">
                <div className="flex items-center gap-2 bg-emerald-500/[0.08] border border-emerald-500/25 rounded-xl px-3.5 py-3 text-sm text-emerald-400">
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                  Password reset email sent — check your inbox.
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Social */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { key: "google", label: "Google", icon: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" className="w-4 h-4" />, fn: handleGoogle },
              { key: "apple",  label: "Apple",  icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>, fn: handleApple },
            ].map(({ key, label, icon, fn }) => (
              <motion.button key={key} onClick={fn} disabled={!!socialLoading || loading}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-2.5 h-11 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-sm text-gray-300 font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                {socialLoading === key ? <div className="w-4 h-4 border-2 border-gray-500 border-t-white rounded-full animate-spin" /> : icon}
                {label}
              </motion.button>
            ))}
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/[0.07]" />
            <span className="text-xs text-gray-600">or continue with email</span>
            <div className="flex-1 h-px bg-white/[0.07]" />
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Email address</label>
            <input
              type="email" value={email} onChange={e => validateEmail(e.target.value)}
              placeholder="you@example.com" autoComplete="email"
              onKeyDown={e => e.key === "Enter" && isReady && handleLogin()}
              className={`w-full px-4 py-3 rounded-xl bg-white/[0.04] border text-sm text-white placeholder-gray-700 outline-none transition-all focus:bg-white/[0.06] ${
                emailErr ? "border-red-500/40 focus:border-red-400/60" : "border-white/[0.08] focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
              }`}
            />
            {emailErr && <p className="text-[11px] text-red-400 mt-1">{emailErr}</p>}
          </div>

          {/* Password */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-500">Password</label>
              <button type="button" onClick={handleReset} disabled={resetLoading}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-50">
                {resetLoading ? "Sending…" : "Forgot password?"}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Your password" autoComplete="current-password"
                onKeyDown={e => e.key === "Enter" && isReady && handleLogin()}
                className="w-full pl-4 pr-11 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-gray-700 outline-none transition-all focus:bg-white/[0.06] focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20"
              />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors p-0.5">
                {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>

          {/* Submit */}
          <motion.button
            onClick={handleLogin} disabled={!isReady}
            whileHover={isReady ? { scale: 1.02 } : {}} whileTap={isReady ? { scale: 0.98 } : {}}
            className={`w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
              isReady
                ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-600/20 hover:shadow-violet-600/40"
                : "bg-white/[0.05] text-gray-600 cursor-not-allowed"
            }`}
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Sign In <ArrowRight size={16}/></>}
          </motion.button>

          <p className="text-center text-gray-600 text-xs mt-5">
            No account yet?{" "}
            <Link to="/signup" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">Create one free</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
