import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import SplashScreen from "./components/splash/SplashScreen";
import LandingPage  from "./pages/LandingPage";
import Login        from "./pages/Login";
import Signup       from "./pages/Signup";
import Profile      from "./pages/Profile";
import Dashboard    from "./pages/Dashboard";
import TryOn        from "./pages/TryOn";
import Wardrobe     from "./pages/Wardrobe";
import Stylist      from "./pages/Stylist";

function ProtectedApp({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <AuthProvider>
      <BrowserRouter>
        <AnimatePresence mode="wait">
          {!splashDone ? (
            <SplashScreen key="splash" onFinish={() => setSplashDone(true)} />
          ) : (
            <Routes>
              {/* Public */}
              <Route path="/"       element={<LandingPage />} />
              <Route path="/login"  element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected */}
              <Route path="/profile"   element={<ProtectedApp><Profile /></ProtectedApp>} />
              <Route path="/dashboard" element={<ProtectedApp><Dashboard /></ProtectedApp>} />
              <Route path="/tryon"     element={<ProtectedApp><TryOn /></ProtectedApp>} />
              <Route path="/wardrobe"  element={<ProtectedApp><Wardrobe /></ProtectedApp>} />
              <Route path="/stylist"   element={<ProtectedApp><Stylist /></ProtectedApp>} />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </AnimatePresence>
      </BrowserRouter>
    </AuthProvider>
  );
}
