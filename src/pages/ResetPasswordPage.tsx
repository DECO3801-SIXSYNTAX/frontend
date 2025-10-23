//src\pages\ResetPasswordPage.tsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import Input from "../components/Input";
import Button from "../components/Button";
import { Lock, Calendar, CheckCircle, XCircle, X, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants, Transition } from "framer-motion";
import type { CSSProperties } from "react";

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Animation variants matching SignIn component
const easeOutBack = [0.16, 1, 0.3, 1] as const;
const easeStd = "easeInOut" as const;

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: easeOutBack,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.97,
    transition: {
      duration: 0.45,
      ease: easeStd,
    },
  },
};

const blobVariants = (delay = 0): Variants => ({
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      delay,
      duration: 0.9,
      ease: easeOutBack,
    },
  },
});

const haloVariants: Variants = {
  hidden: { opacity: 0, scale: 0.7, filter: "blur(6px)" as CSSProperties["filter"] },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)" as CSSProperties["filter"],
    transition: { duration: 0.6, ease: easeOutBack },
  },
};

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | "loading">("error");
  const [showPopup, setShowPopup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uid, setUid] = useState<string>("");
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    // Parse URL to extract uid and token from /reset-password/<uid>/<token>
    const path = window.location.pathname;
    const pathParts = path.split('/').filter(part => part.length > 0);

    if (pathParts.length >= 3 && pathParts[0] === 'reset-password') {
      setUid(pathParts[1]);
      setToken(pathParts[2]);
    } else {
      // Invalid URL format
      showMessage("Invalid reset password link. Please check the link from your email.", "error");
    }
  }, []);

  const showMessage = (text: string, type: "success" | "error" | "loading") => {
    setMessage(text);
    setMessageType(type);
    setShowPopup(true);

    if (type !== "loading") {
      setTimeout(() => {
        setShowPopup(false);
      }, 5000);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!password || !confirmPassword) {
      showMessage("Please fill in both password fields", "error");
      return;
    }

    if (password !== confirmPassword) {
      showMessage("Passwords do not match", "error");
      return;
    }

    if (password.length < 8) {
      showMessage("Password must be at least 8 characters long", "error");
      return;
    }

    if (!uid || !token) {
      showMessage("Invalid reset link. Please request a new password reset.", "error");
      return;
    }

    setIsSubmitting(true);
    showMessage("Resetting your password...", "loading");

    try {
      await axios.post(`${API_URL}/api/auth/password-reset-confirm/`, {
        uid: uid,
        token: token,
        password: password,
        password2: confirmPassword
      });

      showMessage("Password reset successful! Redirecting to login...", "success");

      // Redirect to login page after success
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);

    } catch (error: any) {
      let errorMessage = "Failed to reset password. Please try again.";

      if (error.response?.status === 400) {
        errorMessage = "Invalid or expired reset link. Please request a new password reset.";
      } else if (error.response?.data?.password) {
        // Handle Django password validation errors
        const passwordErrors = error.response.data.password;
        if (Array.isArray(passwordErrors) && passwordErrors.length > 0) {
          errorMessage = passwordErrors[0];
        }
      }

      showMessage(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50 px-4 sm:px-6 lg:px-8 overflow-hidden">

      {/* Background blobs matching SignIn component */}
      <motion.div
        variants={blobVariants(0.0)}
        initial="hidden"
        className="pointer-events-none absolute -top-24 -left-16 h-72 w-72"
        style={{ zIndex: 0 }}
        animate={{
          opacity: 1,
          scale: 1,
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

      <motion.div
        variants={blobVariants(0.1)}
        initial="hidden"
        className="pointer-events-none absolute -top-40 right-0 h-80 w-80"
        style={{ zIndex: 0 }}
        animate={{
          opacity: 1,
          scale: 1,
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

      <motion.div
        variants={blobVariants(0.15)}
        initial="hidden"
        className="pointer-events-none absolute bottom-[-100px] left-1/4 h-96 w-96"
        style={{ zIndex: 0 }}
        animate={{
          opacity: 1,
          scale: 1,
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

      {/* Popup Messages */}
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

      {/* Main Reset Password Card */}
      <motion.div
        className="relative w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-xl ring-1 ring-black/5"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Halo glow effect */}
        <motion.div
          variants={haloVariants}
          initial="hidden"
          animate="visible"
          className="absolute inset-0 -z-10 rounded-3xl"
          style={{
            background:
              "radial-gradient(120px 120px at 50% 0%, rgba(99,102,241,0.08), transparent 70%)",
          }}
        />

        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
          <Lock className="h-6 w-6" strokeWidth={2} />
        </div>

        <h2 className="text-center text-xl sm:text-2xl font-extrabold text-gray-800">Reset Password</h2>
        <p className="mt-1 mb-5 text-center text-sm sm:text-base text-gray-500">
          Enter your new password to complete the reset
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              label="New Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your new password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 focus:outline-none z-10"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="Confirm New Password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 focus:outline-none z-10"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <Button
            type="submit"
            label={isSubmitting ? "Resetting Password..." : "Reset Password"}
            className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 disabled:opacity-70"
            disabled={isSubmitting}
          />
        </form>

        <p className="mt-6 text-center text-xs sm:text-sm text-gray-500">
          Remember your password?{" "}
          <button
            onClick={() => window.location.href = "/"}
            className="text-indigo-600 hover:underline focus:outline-none"
          >
            Back to Sign In
          </button>
        </p>
      </motion.div>
    </div>
  );
}