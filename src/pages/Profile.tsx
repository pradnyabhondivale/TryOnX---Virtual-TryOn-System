import { useState } from "react";
import type { ReactNode } from "react";
import { signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { auth, db } from "../firebase";
import { useAuth } from "../context/useAuth";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut, User, Mail, Shield, Edit3, Check, X,
  Shirt, Sparkles, Star, ChevronRight, Lock, ArrowRight, Bell
} from "lucide-react";

/* ── Avatar ───────────────────────────────────────────────────────────────── */
function Avatar({ name, photo, size = 72 }: { name: string; photo?: string; size?: number }) {
  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  if (photo) return <img src={photo} alt={name} className="rounded-2xl object-cover ring-2 ring-violet-500/30" style={{ width: size, height: size }} />;
  return (
    <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center ring-2 ring-violet-500/30 font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.33 }}>
      {initials}
    </div>
  );
}

/* ── Editable Field ───────────────────────────────────────────────────────── */
function EditableField({ label, value, onSave, icon }: { label: string; value: string; onSave: (v: string) => Promise<void>; icon: ReactNode }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const save = async () => {
    if (draft.trim() === value) { setEditing(false); return; }
    if (!draft.trim()) { setError("Cannot be empty"); return; }
    setSaving(true);
    try { await onSave(draft.trim()); setEditing(false); setError(""); }
    catch { setError("Failed to save. Try again."); }
    finally { setSaving(false); }
  };

  return (
    <div className="flex items-center justify-between py-4 border-b border-white/[0.05] last:border-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="text-gray-600 flex-shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-gray-600 mb-0.5 uppercase tracking-widest">{label}</p>
          {editing ? (
            <input autoFocus value={draft}
              onChange={e => { setDraft(e.target.value); setError(""); }}
              onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
              className="w-full bg-white/[0.04] border border-violet-500/40 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:ring-1 focus:ring-violet-500/30"
            />
          ) : (
            <p className="text-sm text-white truncate">{value || <span className="text-gray-700 italic">Not set</span>}</p>
          )}
          {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
        {editing ? (
          <>
            <button onClick={save} disabled={saving} className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 flex items-center justify-center transition-colors">
              {saving ? <div className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin" /> : <Check size={13}/>}
            </button>
            <button onClick={() => { setEditing(false); setDraft(value); setError(""); }} className="w-7 h-7 rounded-lg bg-white/[0.05] text-gray-500 hover:bg-white/[0.1] flex items-center justify-center transition-colors">
              <X size={13}/>
            </button>
          </>
        ) : (
          <button onClick={() => { setEditing(true); setDraft(value); }} className="w-7 h-7 rounded-lg bg-white/[0.04] text-gray-600 hover:text-violet-400 hover:bg-violet-500/[0.1] flex items-center justify-center transition-colors">
            <Edit3 size={12}/>
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Password Modal ───────────────────────────────────────────────────────── */
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext]       = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [done, setDone]       = useState(false);

  const handle = async () => {
    if (next.length < 8) { setError("New password must be 8+ characters."); return; }
    if (next !== confirm) { setError("Passwords don't match."); return; }
    setLoading(true); setError("");
    try {
      const user = auth.currentUser!;
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email!, current));
      await updatePassword(user, next);
      setDone(true);
      setTimeout(onClose, 1800);
    } catch (err) {
      const fe = err as FirebaseError;
      setError(fe.code === "auth/wrong-password" || fe.code === "auth/invalid-credential"
        ? "Current password is incorrect." : fe.message ?? "Something went wrong.");
    } finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#0d1117] border border-white/[0.1] rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-white">Change Password</h3>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-400 transition-colors"><X size={18}/></button>
        </div>
        {done ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/[0.1] flex items-center justify-center mx-auto mb-3">
              <Check className="text-emerald-400" size={22}/>
            </div>
            <p className="text-emerald-400 font-medium text-sm">Password updated!</p>
          </div>
        ) : (
          <>
            {error && <p className="text-sm text-red-400 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-3 py-2 mb-4">{error}</p>}
            {[
              { label: "Current password", val: current, set: setCurrent, auto: "current-password" },
              { label: "New password", val: next, set: setNext, auto: "new-password" },
              { label: "Confirm new password", val: confirm, set: setConfirm, auto: "new-password" },
            ].map(({ label, val, set, auto }) => (
              <div key={label} className="mb-3">
                <label className="text-xs text-gray-600 block mb-1.5">{label}</label>
                <input type="password" value={val} onChange={e => { set(e.target.value); setError(""); }} autoComplete={auto}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all" />
              </div>
            ))}
            <motion.button onClick={handle} disabled={loading || !current || !next || !confirm}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="w-full h-11 mt-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : "Update Password"}
            </motion.button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ── Stat Card ────────────────────────────────────────────────────────────── */
function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="text-center p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05]">
      <div className="flex justify-center text-violet-400 mb-2 opacity-60">{icon}</div>
      <p className="text-2xl font-bold text-white mb-0.5">{value}</p>
      <p className="text-xs text-gray-600">{label}</p>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: d, ease: "easeOut" as const } }),
};

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [showPwModal, setShowPwModal]   = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);

  const displayName = profile?.displayName
    ?? `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim()
    ?? user?.displayName ?? "User";

  const isEmailProvider = !profile?.provider || profile.provider === "email";

  const saveDisplayName = async (val: string) => {
    if (!user) return;
    const parts = val.trim().split(" ");
    await updateDoc(doc(db, "users", user.uid), {
      displayName: val,
      firstName: parts[0] ?? "",
      lastName: parts.slice(1).join(" ") ?? "",
    });
    await refreshProfile();
  };

  const handleSignOut = async () => {
    setSignOutLoading(true);
    await signOut(auth);
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#07090f] text-white" style={{ fontFamily: "Syne, sans-serif" }}>

      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[700px] h-[700px] bg-violet-700/[0.07] blur-[160px] rounded-full -top-80 -left-80" />
        <div className="absolute w-[600px] h-[600px] bg-fuchsia-700/[0.06] blur-[160px] rounded-full -bottom-60 -right-60" />
      </div>

      {/* Topbar */}
      <nav className="sticky top-0 z-40 bg-[#07090f]/90 backdrop-blur-2xl border-b border-white/[0.05]">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm font-bold hover:opacity-75 transition-opacity">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Shirt size={13} className="text-white" />
            </div>
            Try<span className="text-violet-400">OnX</span>
          </button>
          <button onClick={handleSignOut} disabled={signOutLoading}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-400 transition-colors disabled:opacity-50">
            {signOutLoading
              ? <div className="w-4 h-4 border border-gray-600 border-t-red-400 rounded-full animate-spin"/>
              : <LogOut size={14}/>}
            Sign out
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 pt-10 pb-20 relative">

        {/* Hero card */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0}
          className="bg-white/[0.03] border border-white/[0.07] rounded-3xl p-7 mb-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.05] to-transparent pointer-events-none rounded-3xl" />
          <div className="relative flex items-start gap-5">
            <Avatar name={displayName} photo={profile?.photo} size={72} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold truncate">{displayName}</h1>
                  <p className="text-sm text-gray-500 truncate mt-0.5">{user?.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
                  user?.emailVerified
                    ? "bg-emerald-500/[0.08] border-emerald-500/25 text-emerald-400"
                    : "bg-yellow-500/[0.08] border-yellow-500/25 text-yellow-400"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${user?.emailVerified ? "bg-emerald-400" : "bg-yellow-400"}`}/>
                  {user?.emailVerified ? "Verified" : "Unverified"}
                </span>
                {profile?.provider && (
                  <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-violet-500/[0.08] border border-violet-500/25 text-violet-400 capitalize">
                    {profile.provider}
                  </span>
                )}
                <span className="text-xs text-gray-700">
                  Joined {user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-7 pt-6 border-t border-white/[0.06]">
            <StatCard icon={<Shirt size={18}/>} label="Try-Ons" value="0" />
            <StatCard icon={<Sparkles size={18}/>} label="Saved Looks" value="0" />
            <StatCard icon={<Star size={18}/>} label="Reviews" value="0" />
          </div>
        </motion.div>

        {/* Profile info */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0.08}
          className="bg-white/[0.03] border border-white/[0.07] rounded-3xl p-6 mb-4">
          <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-1">Profile</h2>
          <EditableField label="Display name" value={displayName} icon={<User size={15}/>} onSave={saveDisplayName} />
          <EditableField label="Email address" value={user?.email ?? ""} icon={<Mail size={15}/>} onSave={async (val) => {
            if (!user) return;
            await updateDoc(doc(db, "users", user.uid), { email: val });
            await refreshProfile();
          }} />
        </motion.div>

        {/* Security */}
        {isEmailProvider && (
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0.14}
            className="bg-white/[0.03] border border-white/[0.07] rounded-3xl p-6 mb-4">
            <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-1">Security</h2>
            <button onClick={() => setShowPwModal(true)}
              className="flex items-center justify-between w-full py-4 group rounded-xl hover:bg-white/[0.03] transition-colors px-2 -mx-2">
              <div className="flex items-center gap-3">
                <Lock size={15} className="text-gray-600"/>
                <div className="text-left">
                  <p className="text-[11px] text-gray-600 uppercase tracking-widest mb-0.5">Password</p>
                  <p className="text-sm text-white">••••••••••</p>
                </div>
              </div>
              <ChevronRight size={15} className="text-gray-700 group-hover:text-violet-400 transition-colors"/>
            </button>
          </motion.div>
        )}

        {/* Account info */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0.2}
          className="bg-white/[0.03] border border-white/[0.07] rounded-3xl p-6 mb-8">
          <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-1">Account</h2>
          <div className="flex items-center gap-3 py-4 border-b border-white/[0.05]">
            <Shield size={15} className="text-gray-600 flex-shrink-0"/>
            <div className="min-w-0">
              <p className="text-[11px] text-gray-600 uppercase tracking-widest mb-0.5">User ID</p>
              <p className="text-xs text-gray-700 font-mono break-all">{user?.uid}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-4">
            <Bell size={15} className="text-gray-600 flex-shrink-0"/>
            <div>
              <p className="text-[11px] text-gray-600 uppercase tracking-widest mb-0.5">Member since</p>
              <p className="text-sm text-white">
                {user?.metadata.creationTime
                  ? new Date(user.metadata.creationTime).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                  : "—"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0.26} className="text-center">
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(139,92,246,0.4)" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 px-10 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 font-semibold text-sm shadow-xl shadow-violet-500/20">
            Start Virtual Try-On <ArrowRight size={16}/>
          </motion.button>
          <p className="text-xs text-gray-700 mt-3">Upload a photo and try on outfits with AI</p>
        </motion.div>
      </div>

      <AnimatePresence>
        {showPwModal && <ChangePasswordModal onClose={() => setShowPwModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
