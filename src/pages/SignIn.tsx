//src\pages\SignIn.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthService, User } from "../services/AuthService";
import Input from "../components/Input";
import Button from "../components/Button";
import GoogleButton from "../components/GoogleButton";
import SignUp from "./SignUp";
import { Mail, Lock, Calendar, CheckCircle, XCircle, X, Eye, EyeOff } from "lucide-react";
import type { Variants, Transition } from "framer-motion";
import type { CSSProperties } from "react";

// 🎬 Framer Motion untuk opening/ending animation
import { motion, AnimatePresence } from "framer-motion";

import { useDashboard } from "../contexts/DashboardContext";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../config/firebase";
import { apiDjangoLogin } from "../api/auth";

const authService = new AuthService();

// =======================
// 🎞️ Variants animasi (opening & ending)
// =======================

// Card utama: masuk smooth (scale+fade+slide), keluar elegan
const easeOutBack = [0.16, 1, 0.3, 1] as const;
const easeStd = "easeInOut" as const;
// Card utama: masuk smooth (scale+fade+slide), keluar elegan
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: easeOutBack, // ✅ tuple-typed
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.97,
    transition: {
      duration: 0.45,
      ease: easeStd, // ✅ string ease
    },
  },
};

// Blob latar: morphing border-radius + rotasi lambat, fade-in saat opening
const blobVariants = (delay = 0): Variants => ({
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      delay,
      duration: 0.9,
      ease: easeOutBack, // ✅ tuple-typed
    },
  },
});

// Glow ring di card icon: muncul dari scale 0 → 1 + blur subtle
const haloVariants: Variants = {
  hidden: { opacity: 0, scale: 0.7, filter: "blur(6px)" as CSSProperties["filter"] },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)" as CSSProperties["filter"],
    transition: { duration: 0.6, ease: easeOutBack }, // ✅ tuple-typed
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    filter: "blur(6px)" as CSSProperties["filter"],
    transition: { duration: 0.35, ease: easeStd }, // ✅ string ease
  },
};

export default function SignIn() {
  const navigate = useNavigate();
  const { setCurrentPage, setCurrentUser } = useDashboard();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | "loading">("error");
  const [showPopup, setShowPopup] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  // 🚪 state buat ending animation; saat true → AnimatePresence main-card akan exit
  const [exiting, setExiting] = useState(false);

  // ✅ Opening animation terjadi otomatis karena AnimatePresence + initial="hidden" → animate="visible"
  // (tidak butuh kode khusus; cukup varian + AnimatePresence)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      showMessage("Please fill in both email and password fields", "error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showMessage("Please enter a valid email address", "error");
      return;
    }

    showMessage("Signing you in...", "loading");

    try {
      // Sign in with Django backend to get JWT tokens
      let djangoAuthResponse;
      try {
        console.log('Attempting Django backend login...');
        djangoAuthResponse = await apiDjangoLogin(email, password);
        console.log('✓ Django backend login successful');

        // Store JWT tokens for API calls
        localStorage.setItem('access_token', djangoAuthResponse.access);
        localStorage.setItem('refresh_token', djangoAuthResponse.refresh);
        console.log('✓ JWT tokens stored in localStorage');
      } catch (djangoError: any) {
        console.error('Django backend login error:', djangoError);

        // Show specific error message from Django backend
        if (djangoError.response?.status === 401) {
          showMessage('Invalid email or password', 'error');
        } else if (djangoError.response?.status === 400) {
          showMessage('Please check your credentials', 'error');
        } else {
          showMessage('Login failed. Please check if backend is running.', 'error');
        }
        return;
      }

      // Sign in to Firebase to enable Firestore access
      try {
        console.log('Attempting Firebase sign-in...');
        await signInWithEmailAndPassword(auth, email, password);
        console.log('✓ Firebase sign-in successful');
      } catch (firebaseError: any) {
        console.log('Firebase sign-in error:', firebaseError.code, firebaseError.message);

        // If user doesn't exist in Firebase, create them
        if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password' || firebaseError.code === 'auth/invalid-credential') {
          try {
            console.log('Attempting to create Firebase user...');
            await createUserWithEmailAndPassword(auth, email, password);
            console.log('✓ Firebase user created successfully');
          } catch (createError: any) {
            console.error('Firebase user creation error:', createError.code, createError.message);

            // If creation fails (e.g., user exists but wrong password), show error
            if (createError.code === 'auth/email-already-in-use') {
              showMessage('Invalid password for existing account', 'error');
              return;
            } else if (createError.code === 'auth/weak-password') {
              showMessage('Password should be at least 6 characters', 'error');
              return;
            } else {
              throw createError;
            }
          }
        } else {
          throw firebaseError;
        }
      }

      // Use user data from Django backend
      const user = djangoAuthResponse.user;
      const userRole = (user.role as 'admin' | 'planner' | 'vendor') || 'planner';
      const finalUser = {
        id: auth.currentUser?.uid || user.id,
        email: user.email,
        name: user.name || email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        role: userRole,
        password: password
      };

      // ✅ Berhasil → tampilin success + trigger ending animation
      showMessage(`Welcome back, ${finalUser.name}! Sign in successful.`, "success");

      // Set current user in context
      setCurrentUser(finalUser);
      console.log('✓ Current user set in context:', finalUser);

      // 🎬 Ending: delay dikit biar popup kebaca, lalu animate keluar
      setTimeout(() => setExiting(true), 500);

      // Navigate to dashboard after animation based on user role
      setTimeout(() => {
        setCurrentPage('dashboard');
        console.log('✓ Navigating to dashboard as:', finalUser.role);
        // Navigate based on user role
        if (finalUser.role === 'admin') {
          navigate('/admin');
        } else if (finalUser.role === 'vendor') {
          navigate('/vendor');
        } else {
          navigate('/planner/dashboard');
        }
      }, 900);
      return;
    } catch (err: any) {
      let errorMessage = "An error occurred. Please try again.";

      if (err.message === "Invalid credentials") {
        errorMessage = "Invalid email or password. Please check your credentials and try again.";
      } else if (err.message.toLowerCase().includes("network") || err.message.includes("Login failed")) {
        errorMessage = "Connection error. Please check your internet and try again.";
      } else if (err.message.includes("Email")) {
        errorMessage = "Please enter a valid email address.";
      } else if (err.message.toLowerCase().includes("password")) {
        errorMessage = "Password is required.";
      }

      showMessage(errorMessage, "error");
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      showMessage("Please enter your email address", "error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail)) {
      showMessage("Please enter a valid email address", "error");
      return;
    }

    showMessage("Sending password reset email...", "loading");

    try {
      await authService.requestPasswordReset(forgotEmail);
      showMessage("If this email is registered, you will receive a password reset link shortly.", "success");
      setShowForgotPassword(false);
      setForgotEmail("");
    } catch (error: any) {
      showMessage(error.message || "Failed to send password reset email. Please try again.", "error");
    }
  };

  const showMessage = (text: string, type: "success" | "error" | "loading") => {
    setMessage(text);
    setMessageType(type);
    setShowPopup(true);

    if (type !== "loading") {
      setTimeout(() => {
        setShowPopup(false);
      }, 4000);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  // 🎬 Ending animation ketika user memilih "Create Account"
  const goToSignUp = () => {
    setExiting(true);
    setTimeout(() => setShowSignUp(true), 450);
  };

  return (
    <>
      {showSignUp ? (
        <SignUp     onBackToSignIn={() => {
            setExiting(false);     // 🔧 penting: hidupkan lagi stage Sign In
            setShowSignUp(false);  // balik ke Sign In
          }} />
      ) : (
        // AnimatePresence agar opening (enter) & ending (exit) mulus
        <AnimatePresence mode="sync">
          {!exiting && (
            <motion.div
              key="signin-stage"
              className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50 px-4 sm:px-6 lg:px-8 overflow-hidden"
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* =========================
                  🌈 OPENING: Background blobs (morphing)
                 ========================= */}
{/* Blob kiri-atas */}
<motion.div
  variants={blobVariants(0.0)}
  className="pointer-events-none absolute -top-24 -left-16 h-72 w-72"
  style={{ zIndex: 0 }}
  animate={{
    borderRadius: [
      "20% 80% 70% 30% / 30% 30% 70% 70%",
      "40% 60% 30% 70% / 50% 40% 60% 50%",
      "25% 75% 60% 40% / 40% 60% 30% 70%",
      "20% 80% 70% 30% / 30% 30% 70% 70%",
    ],
    rotate: [0, 8, -6, 0],
    backgroundColor: ["#c7d2fe80", "#bfdbfe66", "#ddd6fe80", "#c7d2fe80"],
  }}
  transition={{ duration: 12, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
/>

{/* Blob kanan-atas */}
<motion.div
  variants={blobVariants(0.1)}
  className="pointer-events-none absolute -top-40 right-0 h-80 w-80"
  style={{ zIndex: 0 }}
  animate={{
    borderRadius: [
      "60% 40% 35% 65% / 35% 60% 40% 65%",
      "50% 50% 70% 30% / 45% 55% 55% 45%",
      "65% 35% 55% 45% / 55% 45% 35% 65%",
      "60% 40% 35% 65% / 35% 60% 40% 65%",
    ],
    rotate: [0, -10, 6, 0],
    backgroundColor: ["#bae6fd66", "#c7d2fe80", "#ddd6fe80", "#bae6fd66"],
  }}
  transition={{ duration: 13, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
/>

{/* Blob bawah */}
<motion.div
  variants={blobVariants(0.15)}
  className="pointer-events-none absolute bottom-[-100px] left-1/4 h-96  w-96"
  style={{ zIndex: 0 }}
  animate={{
    borderRadius: [
      "45% 55% 70% 30% / 40% 60% 30% 70%",
      "30% 70% 40% 60% / 60% 40% 70% 30%",
      "55% 45% 30% 70% / 30% 70% 45% 55%",
      "45% 55% 70% 30% / 40% 60% 30% 70%",
    ],
    rotate: [0, 10, -8, 0],
    backgroundColor: ["#ddd6fe80", "#c7d2fe80", "#bae6fd66", "#ddd6fe80"],
  }}
  transition={{ duration: 11, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
/>


              {/* Popup Messages (fade/slide in-out) */}
              <AnimatePresence>
                {showPopup && message && (
                  <motion.div
                    key="popup"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 24 }}
                    transition={{ type: "spring", stiffness: 260, damping: 24 }}
                    className={`fixed top-6 right-6 z-50 max-w-sm rounded-lg border shadow-lg ${
                      messageType === "success"
                        ? "bg-green-50 border-green-200 text-green-800"
                        : messageType === "loading"
                        ? "bg-blue-50 border-blue-200 text-blue-800"
                        : "bg-red-50 border-red-200 text-red-800"
                    }`}
                  >
                    <div className="flex items-start p-4">
                      <div className="flex-shrink-0">
                        {messageType === "success" && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {messageType === "error" && <XCircle className="h-5 w-5 text-red-500" />}
                        {messageType === "loading" && (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-400 border-t-transparent" />
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium">{message}</p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <button
                          onClick={closePopup}
                          className={`inline-flex rounded-md p-1.5 hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            messageType === "success"
                              ? "text-green-500 hover:bg-green-100 focus:ring-green-500"
                              : messageType === "loading"
                              ? "text-blue-500 hover:bg-blue-100 focus:ring-blue-500"
                              : "text-red-500 hover:bg-red-100 focus:ring-red-500"
                          }`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Forgot Password Modal (fade+scale) */}
              <AnimatePresence>
                {showForgotPassword && (
                  <motion.div
                    key="forgot-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                  >
                    <motion.div
                      key="forgot-card"
                      initial={{ opacity: 0, scale: 0.96, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, y: -6 }}
                      transition={{ duration: 0.25 }}
                      className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl mx-4"
                    >
                      <button
                        onClick={() => setShowForgotPassword(false)}
                        className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                      >
                        <X size={20} />
                      </button>

                      <div className="mb-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Reset Password</h3>
                        <p className="text-sm text-gray-600">
                          Enter your email address and we'll send you a secure link to reset your password.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <Input
                          label="Email address"
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          icon={<Mail size={16} />}
                          placeholder="Enter your email address"
                        />

                        <div className="flex gap-3 pt-4">
                          <Button
                            onClick={() => setShowForgotPassword(false)}
                            label="Cancel"
                            className="flex-1 bg-gray-500 hover:bg-gray-600"
                          />
                          <Button
                            onClick={handleForgotPassword}
                            label="Send Reset Link"
                            className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600"
                          />
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* =========================
                  🟣 CARD Sign In (opening & ending variants)
                 ========================= */}
              <motion.div
                key="signin-card"
                className="relative w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-xl ring-1 ring-black/5"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
              >
                {/* Halo glow opening */}
                <motion.div
                  variants={haloVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute inset-0 -z-10 rounded-3xl"
                  style={{
                    background:
                      "radial-gradient(120px 120px at 50% 0%, rgba(99,102,241,0.08), transparent 70%)",
                  }}
                />

                <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
                  <Calendar className="h-6 w-6" strokeWidth={2} />
                </div>

                <h2 className="text-center text-xl sm:text-2xl font-extrabold text-gray-800">SiPanit</h2>
                <p className="mt-1 mb-5 text-center text-sm sm:text-base text-gray-500">
                  Welcome back! Please sign in to continue
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Email address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={<Mail size={16} />}
                    placeholder="Enter your email address"
                  />

                  <div className="relative">
                    <Input
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 focus:outline-none z-10"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm font-medium text-indigo-600 hover:underline focus:outline-none"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    label={messageType === "loading" ? "Signing In..." : "Sign In"}
                    className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 disabled:opacity-70"
                    disabled={messageType === "loading"}
                  />
                </form>

                <div className="text-center text-gray-400 text-sm">or</div>

                <GoogleButton
                  onSuccess={async (user) => {
                    const userName = user.email
                      .split("@")[0]
                      .replace(/[._]/g, " ")
                      .replace(/\b\w/g, (l: string) => l.toUpperCase());

                    // Sign in to Firebase with email (for Firestore access)
                    // Use a default password for Google sign-ins
                    const defaultPassword = 'google-signin-' + user.email;
                    try {
                      try {
                        await signInWithEmailAndPassword(auth, user.email, defaultPassword);
                      } catch (firebaseError: any) {
                        if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password' || firebaseError.code === 'auth/invalid-credential') {
                          await createUserWithEmailAndPassword(auth, user.email, defaultPassword);
                        }
                      }
                    } catch (err) {
                      console.error('Firebase auth error:', err);
                    }

                    showMessage(`Welcome ${userName}! Google sign in successful.`, "success");

                    // Set user data from Google authentication with Firebase UID
                    const userRole = (user.role as 'admin' | 'planner' | 'vendor') || 'planner';
                    setCurrentUser({
                      ...user,
                      id: auth.currentUser?.uid || user.id,
                      role: userRole
                    });

                    // 🎬 Ending setelah Google success
                    setTimeout(() => setExiting(true), 350);
                    setTimeout(() => {
                      setCurrentPage('dashboard');
                      // Navigate based on user role
                      if (userRole === 'admin') {
                        navigate('/admin');
                      } else if (userRole === 'vendor') {
                        navigate('/vendor');
                      } else {
                        navigate('/planner/dashboard');
                      }
                    }, 800);
                  }}
                  onError={(error) => showMessage(`Google sign in failed: ${error}`, "error")}
                />

                <p className="mt-6 text-center text-xs sm:text-sm text-gray-500">
                  Don't have an account?{" "}
                  <button onClick={goToSignUp} className="text-indigo-600 hover:underline focus:outline-none">
                    Create Account
                  </button>
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  );
}
