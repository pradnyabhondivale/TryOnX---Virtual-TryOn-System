import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  fetchSignInMethodsForEmail,
  sendEmailVerification,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";

import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

// ─── Types ────────────────────────────────────────────────────────────────────

type FieldState = "idle" | "valid" | "invalid" | "checking";

interface FieldMeta {
  value: string;
  state: FieldState;
  message: string;
}

interface FormFields {
  firstName: FieldMeta;
  lastName: FieldMeta;
  email: FieldMeta;
  password: FieldMeta;
  confirmPassword: FieldMeta;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function getPasswordStrength(pw: string): {
  score: number; // 0-4
  label: string;
  color: string;
} {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: "Too weak", color: "#ef4444" },
    { label: "Weak", color: "#f97316" },
    { label: "Fair", color: "#eab308" },
    { label: "Good", color: "#22c55e" },
    { label: "Strong", color: "#10b981" },
  ];
  return { score, ...map[score] };
}

function friendlyFirebaseError(err: FirebaseError): string {
  switch (err.code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Try signing in instead.";
    case "auth/invalid-email":
      return "The email address is badly formatted.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/popup-closed-by-user":
      return "Sign-in popup was closed before completing. Please try again.";
    case "auth/cancelled-popup-request":
      return "";
    default:
      return err.message ?? "An unexpected error occurred.";
  }
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function FieldIcon({ type }: { type: "user" | "email" | "lock" }) {
  if (type === "user")
    return (
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    );
  if (type === "email")
    return (
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
      </svg>
    );
  return (
    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
    </svg>
  );
}

function StatusIcon({ state }: { state: FieldState }) {
  if (state === "checking")
    return (
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  if (state === "valid")
    return (
      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    );
  if (state === "invalid")
    return (
      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    );
  return null;
}

function StrengthBar({ score }: { score: number }) {
  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];
  const color = colors[score] ?? "#e5e7eb";
  return (
    <div className="flex gap-1 mt-1.5">
      {[1, 2, 3, 4].map((n) => (
        <div
          key={n}
          className="h-1 flex-1 rounded-full transition-all duration-300"
          style={{ background: n <= score ? color : "#374151" }}
        />
      ))}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function Signup() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Redirect already-logged-in users away from signup
  useEffect(() => {
    if (!authLoading && user) navigate("/dashboard", { replace: true });
  }, [user, authLoading, navigate]);

  // ── Form state ──────────────────────────────────────────────────────────────

  const blank = (value = ""): FieldMeta => ({ value, state: "idle", message: "" });

  const [fields, setFields] = useState<FormFields>({
    firstName: blank(),
    lastName: blank(),
    email: blank(),
    password: blank(),
    confirmPassword: blank(),
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "apple" | null>(null);
  const [success, setSuccess] = useState(false);

  // Debounce timer for email check
  const emailDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Field updater ────────────────────────────────────────────────────────────

  const setField = useCallback(
    (name: keyof FormFields, patch: Partial<FieldMeta>) => {
      setFields((prev) => ({ ...prev, [name]: { ...prev[name], ...patch } }));
    },
    []
  );

  // ── Validators ───────────────────────────────────────────────────────────────

  const validateFirstName = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return setField("firstName", { value, state: "idle", message: "" });
    if (trimmed.length < 2)
      return setField("firstName", { value, state: "invalid", message: "At least 2 characters" });
    setField("firstName", { value, state: "valid", message: "" });
  };

  const validateLastName = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return setField("lastName", { value, state: "idle", message: "" });
    if (trimmed.length < 2)
      return setField("lastName", { value, state: "invalid", message: "At least 2 characters" });
    setField("lastName", { value, state: "valid", message: "" });
  };

  const validateEmail = (value: string) => {
    // Clear previous debounce
    if (emailDebounce.current) clearTimeout(emailDebounce.current);

    if (!value) return setField("email", { value, state: "idle", message: "" });

    if (!EMAIL_RE.test(value)) {
      return setField("email", {
        value,
        state: "invalid",
        message: "Enter a valid email address",
      });
    }

    // Format is valid — check if already registered (debounced 600ms)
    setField("email", { value, state: "checking", message: "Checking availability…" });

    emailDebounce.current = setTimeout(async () => {
      try {
        const methods = await fetchSignInMethodsForEmail(auth, value);
        if (methods.length > 0) {
          setField("email", {
            value,
            state: "invalid",
            message: "Account already exists. Sign in instead?",
          });
        } else {
          setField("email", { value, state: "valid", message: "Looks good!" });
        }
      } catch {
        // Don't block the user if the check itself fails
        setField("email", { value, state: "valid", message: "" });
      }
    }, 600);
  };

  const validatePassword = (value: string) => {
    if (!value) {
      setField("password", { value, state: "idle", message: "" });
      // Re-validate confirm too
      revalidateConfirm(fields.confirmPassword.value, value);
      return;
    }
    const { score, label } = getPasswordStrength(value);
    if (score < 2) {
      setField("password", { value, state: "invalid", message: label });
    } else {
      setField("password", { value, state: "valid", message: label });
    }
    revalidateConfirm(fields.confirmPassword.value, value);
  };

  const revalidateConfirm = (confirmValue: string, pwValue: string) => {
    if (!confirmValue) return;
    if (confirmValue === pwValue) {
      setField("confirmPassword", { value: confirmValue, state: "valid", message: "Passwords match" });
    } else {
      setField("confirmPassword", { value: confirmValue, state: "invalid", message: "Passwords don't match" });
    }
  };

  const validateConfirm = (value: string) => {
    if (!value) return setField("confirmPassword", { value, state: "idle", message: "" });
    if (value === fields.password.value) {
      setField("confirmPassword", { value, state: "valid", message: "Passwords match" });
    } else {
      setField("confirmPassword", { value, state: "invalid", message: "Passwords don't match" });
    }
  };

  // ── Form readiness ────────────────────────────────────────────────────────────

  const isFormReady =
    fields.firstName.state === "valid" &&
    fields.lastName.state === "valid" &&
    fields.email.state === "valid" &&
    fields.password.state === "valid" &&
    fields.confirmPassword.state === "valid" &&
    termsAccepted;

  // ── Email signup ──────────────────────────────────────────────────────────────

  const handleSignup = async () => {
    if (!isFormReady) return;
    setGlobalError("");
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        fields.email.value,
        fields.password.value
      );

      const user = userCredential.user;

      // Send verification email
      await sendEmailVerification(user);

      // Persist to Firestore
      await setDoc(doc(db, "users", user.uid), {
        firstName: fields.firstName.value.trim(),
        lastName: fields.lastName.value.trim(),
        displayName: `${fields.firstName.value.trim()} ${fields.lastName.value.trim()}`,
        email: fields.email.value,
        emailVerified: false,
        provider: "email",
        createdAt: serverTimestamp(),
      });

      setLoading(false);
      setSuccess(true);

      setTimeout(() => navigate("/dashboard"), 3000);
    } catch (err) {
      setLoading(false);
      const message = friendlyFirebaseError(err as FirebaseError);
      if (message) setGlobalError(message);
    }
  };

  // ── Handle redirect result on mount (Google / Apple return) ──────────────────

  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (!result) return; // no pending redirect
        const user = result.user;
        const isGoogle = result.providerId === GoogleAuthProvider.PROVIDER_ID;

        await setDoc(
          doc(db, "users", user.uid),
          {
            firstName: user.displayName?.split(" ")[0] ?? "",
            lastName: user.displayName?.split(" ").slice(1).join(" ") ?? "",
            displayName: user.displayName,
            email: user.email,
            photo: user.photoURL ?? null,
            emailVerified: true,
            provider: isGoogle ? "google" : "apple",
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );

        navigate("/dashboard");
      })
      .catch((err: FirebaseError) => {
        const message = friendlyFirebaseError(err);
        if (message) setGlobalError(message);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Google signup ─────────────────────────────────────────────────────────────

  const handleGoogleSignup = async () => {
    setGlobalError("");
    setSocialLoading("google");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithRedirect(auth, provider);
      // Page will redirect — code below won't run until user returns
    } catch (err) {
      setSocialLoading(null);
      const message = friendlyFirebaseError(err as FirebaseError);
      if (message) setGlobalError(message);
    }
  };

  // ── Apple signup ──────────────────────────────────────────────────────────────

  const handleAppleSignup = async () => {
    setGlobalError("");
    setSocialLoading("apple");
    try {
      const provider = new OAuthProvider("apple.com");
      provider.addScope("email");
      provider.addScope("name");
      await signInWithRedirect(auth, provider);
      // Page will redirect — code below won't run until user returns
    } catch (err) {
      setSocialLoading(null);
      const message = friendlyFirebaseError(err as FirebaseError);
      if (message) setGlobalError(message);
    }
  };

  // ── Keyboard submit ───────────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && isFormReady && !loading) handleSignup();
  };

  // ── Input class helper ────────────────────────────────────────────────────────

  const inputClass = (state: FieldState) =>
    [
      "w-full pl-9 pr-9 py-2.5 rounded-lg bg-[#111827] text-sm text-white placeholder-gray-600",
      "border outline-none transition-all duration-200",
      state === "valid"
        ? "border-emerald-500/60 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20"
        : state === "invalid"
        ? "border-red-500/60 focus:border-red-400 focus:ring-1 focus:ring-red-400/20"
        : "border-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20",
    ].join(" ");

  const strength = getPasswordStrength(fields.password.value);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#080c14] text-white relative overflow-hidden px-4 py-10"
      onKeyDown={handleKeyDown}
    >
      {/* Background ambience */}
      <div className="absolute w-[500px] h-[500px] bg-purple-700/10 blur-[120px] rounded-full -top-32 -left-32 pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] bg-cyan-700/10 blur-[120px] rounded-full -bottom-32 -right-32 pointer-events-none" />

      {/* Success overlay */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="bg-[#111827] border border-gray-700/50 rounded-2xl p-10 text-center max-w-sm w-full shadow-2xl"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Welcome, {fields.firstName.value}!
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Your account is ready. A verification email has been sent to{" "}
                <span className="text-white">{fields.email.value}</span>.
                <br />
                Redirecting you now…
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[420px] bg-[#0d1117]/80 border border-gray-800/60 rounded-2xl p-8 shadow-2xl backdrop-blur-xl"
      >
        {/* Header */}
        <div className="mb-7">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 16 16" fill="none">
                <path d="M3 8C3 5.239 5.239 3 8 3s5 2.239 5 5-2.239 5-5 5S3 10.761 3 8Z" stroke="#fff" strokeWidth="1.5"/>
                <path d="M6 8l1.5 1.5L10 6.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-sm font-semibold tracking-tight text-white">Drape AI</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Create your account</h1>
          <p className="text-gray-500 text-sm">Get started — it only takes a minute.</p>
        </div>

        {/* Global error */}
        <AnimatePresence>
          {globalError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 overflow-hidden"
            >
              <div className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/30 rounded-lg px-3.5 py-3 text-sm text-red-400">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {globalError}
                {globalError.includes("Sign in instead") && (
                  <Link to="/login" className="ml-auto text-purple-400 hover:text-purple-300 whitespace-nowrap underline">
                    Login →
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Social buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <motion.button
            onClick={handleGoogleSignup}
            disabled={!!socialLoading || loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center justify-center gap-2 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-gray-700/60 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {socialLoading === "google" ? (
              <div className="w-4 h-4 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
            ) : (
              <img
                src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg"
                className="w-4 h-4"
                alt="Google"
              />
            )}
            Google
          </motion.button>

          <motion.button
            onClick={handleAppleSignup}
            disabled={!!socialLoading || loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center justify-center gap-2 h-10 rounded-lg bg-white/5 hover:bg-white/10 border border-gray-700/60 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {socialLoading === "apple" ? (
              <div className="w-4 h-4 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
            )}
            Apple
          </motion.button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-xs text-gray-600">or sign up with email</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        {/* Name row */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* First name */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">First name</label>
            <div className="relative">
              <FieldIcon type="user" />
              <input
                type="text"
                placeholder="Jane"
                value={fields.firstName.value}
                onChange={(e) => validateFirstName(e.target.value)}
                className={inputClass(fields.firstName.state)}
                autoComplete="given-name"
              />
              <StatusIcon state={fields.firstName.state} />
            </div>
            {fields.firstName.message && (
              <p className={`text-[11px] mt-1 ${fields.firstName.state === "invalid" ? "text-red-400" : "text-emerald-400"}`}>
                {fields.firstName.message}
              </p>
            )}
          </div>

          {/* Last name */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Last name</label>
            <div className="relative">
              <FieldIcon type="user" />
              <input
                type="text"
                placeholder="Doe"
                value={fields.lastName.value}
                onChange={(e) => validateLastName(e.target.value)}
                className={inputClass(fields.lastName.state)}
                autoComplete="family-name"
              />
              <StatusIcon state={fields.lastName.state} />
            </div>
            {fields.lastName.message && (
              <p className={`text-[11px] mt-1 ${fields.lastName.state === "invalid" ? "text-red-400" : "text-emerald-400"}`}>
                {fields.lastName.message}
              </p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Email address</label>
          <div className="relative">
            <FieldIcon type="email" />
            <input
              type="email"
              placeholder="jane@company.com"
              value={fields.email.value}
              onChange={(e) => validateEmail(e.target.value)}
              className={inputClass(fields.email.state)}
              autoComplete="email"
            />
            <StatusIcon state={fields.email.state} />
          </div>
          {fields.email.message && (
            <p
              className={`text-[11px] mt-1 ${
                fields.email.state === "invalid"
                  ? "text-red-400"
                  : fields.email.state === "checking"
                  ? "text-gray-500"
                  : "text-emerald-400"
              }`}
            >
              {fields.email.message}
              {fields.email.message.includes("Sign in instead") && (
                <Link to="/login" className="ml-1 underline text-purple-400 hover:text-purple-300">
                  Login →
                </Link>
              )}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
          <div className="relative">
            <FieldIcon type="lock" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Min. 8 characters"
              value={fields.password.value}
              onChange={(e) => validatePassword(e.target.value)}
              className={inputClass(fields.password.state)}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showPassword ? (
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
          {fields.password.value && <StrengthBar score={strength.score} />}
          {fields.password.message && (
            <p
              className={`text-[11px] mt-1 ${
                fields.password.state === "invalid" ? "text-red-400" : "text-emerald-400"
              }`}
            >
              {fields.password.message}
            </p>
          )}
        </div>

        {/* Confirm password */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Confirm password</label>
          <div className="relative">
            <FieldIcon type="lock" />
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Re-enter password"
              value={fields.confirmPassword.value}
              onChange={(e) => validateConfirm(e.target.value)}
              className={inputClass(fields.confirmPassword.state)}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showConfirm ? (
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
          {fields.confirmPassword.message && (
            <p
              className={`text-[11px] mt-1 ${
                fields.confirmPassword.state === "invalid" ? "text-red-400" : "text-emerald-400"
              }`}
            >
              {fields.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Terms */}
        <label className="flex items-start gap-2.5 mb-5 cursor-pointer group">
          <div className="relative mt-0.5">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                termsAccepted
                  ? "bg-purple-500 border-purple-500"
                  : "border-gray-600 group-hover:border-gray-400"
              }`}
            >
              {termsAccepted && (
                <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-xs text-gray-500 leading-relaxed">
            I agree to the{" "}
            <a href="#" className="text-purple-400 hover:text-purple-300 underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-purple-400 hover:text-purple-300 underline">
              Privacy Policy
            </a>
            . My photos are processed securely and never shared.
          </span>
        </label>

        {/* Submit */}
        <motion.button
          onClick={handleSignup}
          disabled={!isFormReady || loading}
          whileHover={isFormReady && !loading ? { scale: 1.02 } : {}}
          whileTap={isFormReady && !loading ? { scale: 0.98 } : {}}
          className={`w-full h-11 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
            isFormReady && !loading
              ? "bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40"
              : "bg-gray-800 text-gray-600 cursor-not-allowed"
          }`}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating account…
            </>
          ) : (
            "Create Account"
          )}
        </motion.button>

        <p className="text-center text-gray-600 text-xs mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-purple-400 hover:text-purple-300 transition-colors font-medium">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
