import React, { useState } from "react";
import { AuthService } from "@/lib/services/AuthService";

// Type definition (duplicated to avoid circular dependency)
interface SignUpPayload {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'planner' | 'vendor';
  company?: string;
  phone?: string;
  experience?: string;
  specialty?: string;
}
import Input from "@/components/Input";

import DefaultButton from "@/components/ui/button";
import {
  Mail,
  Lock,
  Calendar,
  CheckCircle,
  XCircle,
  X,
  Eye,
  EyeOff,
  User,
  Building,
  Phone,
  Briefcase,
} from "lucide-react";
import { motion } from "framer-motion";

const authService = new AuthService();

interface SignUpProps {
  onBackToSignIn: () => void;
}

// Variants untuk animasi blob
const blobVariants = (delay: number) => ({
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      delay,
      duration: 1.2,
      ease: "easeInOut" as const   // ✅ fix TypeScript
    },
  },
});

export default function SignUp({ onBackToSignIn }: SignUpProps) {
  const [formData, setFormData] = useState<SignUpPayload>({
    name: "",
    email: "",
    password: "",
    role: "planner",
    company: "",
    phone: "",
    experience: "",
    specialty: "",
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<
    "success" | "error" | "loading"
  >("error");
  const [showPopup, setShowPopup] = useState(false);

  const handleInputChange = (field: keyof SignUpPayload, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      showMessage("Please fill in all required fields", "error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showMessage("Please enter a valid email address", "error");
      return;
    }

    if (formData.password.length < 6) {
      showMessage("Password must be at least 6 characters long", "error");
      return;
    }

    if (formData.password !== confirmPassword) {
      showMessage("Passwords do not match", "error");
      return;
    }

    if (formData.role === "planner") {
      if (
        !formData.company ||
        !formData.phone ||
        !formData.experience ||
        !formData.specialty
      ) {
        showMessage("Please fill in all planner information fields", "error");
        return;
      }
    }

    showMessage("Creating your account...", "loading");

    try {
      const newUser = await authService.signUp(formData);
      showMessage(
        `Welcome ${newUser.name}! Your account has been created successfully. Redirecting to sign in...`,
        "success"
      );

      setTimeout(() => {
        onBackToSignIn();
      }, 2000);
    } catch (err: any) {
      let errorMessage = "Registration failed. Please try again.";
      if (err.message === "User with this email already exists") {
        errorMessage =
          "An account with this email already exists. Please use a different email or sign in.";
      } else if (err.message.includes("network")) {
        errorMessage =
          "Connection error. Please check your internet and try again.";
      }
      showMessage(errorMessage, "error");
    }
  };

  const showMessage = (
    text: string,
    type: "success" | "error" | "loading"
  ) => {
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

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50 px-4 sm:px-6 lg:px-8 overflow-hidden">

  {/* Background blobs with animation */}
<motion.div
initial={{ opacity: 0, scale: 0.8 }}
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
transition={{
  duration: 12,
  repeat: Infinity,
  repeatType: "mirror",
  ease: "easeInOut",
}}
className="pointer-events-none absolute -top-20 -left-24 h-60 w-60"
/>

<motion.div
initial={{ opacity: 0, scale: 0.8 }}
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
transition={{
  duration: 13,
  repeat: Infinity,
  repeatType: "mirror",
  ease: "easeInOut",
}}
className="pointer-events-none absolute -bottom-24 left-20 h-72 w-72"
/>

<motion.div
initial={{ opacity: 0, scale: 0.8 }}
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
transition={{
  duration: 11,
  repeat: Infinity,
  repeatType: "mirror",
  ease: "easeInOut",
}}
className="pointer-events-none absolute -top-12 -right-20 h-52 w-52"
/>


      {/* Popup Messages */}
      {showPopup && message && (
        <div
          className={`fixed top-6 right-6 z-50 max-w-sm rounded-lg border shadow-lg transition-all duration-300 ease-in-out transform ${
            showPopup
              ? "translate-x-0 opacity-100"
              : "translate-x-full opacity-0"
          } ${
            messageType === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : messageType === "loading"
              ? "bg-blue-50 border-blue-200 text-blue-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-start p-4">
            <div className="flex-shrink-0">
              {messageType === "success" && (
                <CheckCircle className="h-5 w-5 text-green-400" />
              )}
              {messageType === "error" && (
                <XCircle className="h-5 w-5 text-red-400" />
              )}
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
                className="inline-flex rounded-md p-1.5 hover:bg-opacity-20 focus:outline-none"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card Sign Up */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 40 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="relative w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-xl ring-1 ring-black/5 z-10"
      >
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
          <Calendar className="h-6 w-6" strokeWidth={2} />
        </div>

        <h2 className="text-center text-xl sm:text-2xl font-extrabold text-gray-800">
          Join SiPanit
        </h2>
        <p className="mt-1 mb-6 text-center text-sm sm:text-base text-gray-500">
          Create your account and start planning amazing events
        </p>

        <div className="space-y-4">
          {/* Inputs */}
          <Input
            label="Full Name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            icon={<User size={16} />}
            placeholder="Enter your full name"
          />

          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            icon={<Mail size={16} />}
            placeholder="Enter your email address"
          />

          {/* Password */}
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
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

          <div className="relative">
            <Input
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 focus:outline-none z-10"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I am a...
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleInputChange("role", "planner")}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  formData.role === "planner"
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                <Calendar size={20} className="mx-auto mb-1" />
                Event Planner
              </button>
              <button
                type="button"
                onClick={() => handleInputChange("role", "vendor")}
                className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  formData.role === "vendor"
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                <Building size={20} className="mx-auto mb-1" />
                Service Vendor
              </button>
            </div>
          </div>

          {/* Planner-specific */}
          {formData.role === "planner" && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="font-medium text-gray-800">Planner Information</h3>

              <Input
                label="Company/Organization"
                type="text"
                value={formData.company || ""}
                onChange={(e) => handleInputChange("company", e.target.value)}
                icon={<Building size={16} />}
                placeholder="Your company or organization name"
              />

              <Input
                label="Phone Number"
                type="tel"
                value={formData.phone || ""}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                icon={<Phone size={16} />}
                placeholder="Your contact phone number"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Experience Level
                </label>
                <select
                  value={formData.experience || ""}
                  onChange={(e) =>
                    handleInputChange("experience", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select your experience level</option>
                  <option value="Less than 1 year">Less than 1 year</option>
                  <option value="1-2 years">1-2 years</option>
                  <option value="3-5 years">3-5 years</option>
                  <option value="5+ years">5+ years</option>
                  <option value="10+ years">10+ years</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Specialty
                </label>
                <select
                  value={formData.specialty || ""}
                  onChange={(e) =>
                    handleInputChange("specialty", e.target.value)
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select your specialty</option>
                  <option value="Corporate Events">Corporate Events</option>
                  <option value="Weddings">Weddings</option>
                  <option value="Social Events">Social Events</option>
                  <option value="Conferences">Conferences</option>
                  <option value="Trade Shows">Trade Shows</option>
                  <option value="Fundraising Events">Fundraising Events</option>
                  <option value="Product Launches">Product Launches</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          )}

          <DefaultButton
            onClick={handleSubmit}
            label={
              messageType === "loading" ? "Creating Account..." : "Create Account"
            }
            className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 disabled:opacity-70"
            disabled={messageType === "loading"}
          />
        </div>

        <p className="mt-6 text-center text-xs sm:text-sm text-gray-500">
          Already have an account?{" "}
          <button
            onClick={onBackToSignIn}
            className="text-indigo-600 hover:underline focus:outline-none"
          >
            Sign In
          </button>
        </p>
      </motion.div>
    </div>

    
  );
}
