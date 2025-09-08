import React, { useState } from "react";
import { AuthService, User } from "../services/AuthService";
import Input from "../components/Input";
import Button from "../components/Button";
import GoogleButton from "../components/GoogleButton";
import { Mail, Lock, Calendar, CheckCircle, XCircle, X, Eye, EyeOff } from "lucide-react";
import { apiLogin, apiUpdateUser } from "../api/auth";

const authService = new AuthService();

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); 
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'loading'>('error');
  const [showPopup, setShowPopup] = useState(false);
  
  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      showMessage("Please fill in both email and password fields", 'error');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showMessage("Please enter a valid email address", 'error');
      return;
    }

    showMessage("Signing you in...", 'loading');
    
    try {
      const res = await authService.signIn({ email, password });
      showMessage(`Welcome back, ${res.name}! Sign in successful.`, 'success');
    } catch (err: any) {
      let errorMessage = "An error occurred. Please try again.";
      
      if (err.message === "Invalid credentials") {
        errorMessage = "Invalid email or password. Please check your credentials and try again.";
      } else if (err.message.includes("network") || err.message.includes("Login failed")) {
        errorMessage = "Connection error. Please check your internet and try again.";
      } else if (err.message.includes("Email")) {
        errorMessage = "Please enter a valid email address.";
      } else if (err.message.includes("password")) {
        errorMessage = "Password is required.";
      }
      
      showMessage(errorMessage, 'error');
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) {
      showMessage("Please enter your email address", 'error');
      return;
    }
  
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail)) {
      showMessage("Please enter a valid email address", 'error');
      return;
    }
  
    if (!newPassword || !confirmPassword) {
      showMessage("Please fill in both password fields", 'error');
      return;
    }
  
    if (newPassword !== confirmPassword) {
      showMessage("Passwords do not match", 'error');
      return;
    }
  
    if (newPassword.length < 6) {
      showMessage("Password must be at least 6 characters long", 'error');
      return;
    }
  
    try {
      console.log('Looking for email:', forgotEmail);
      
      // Use your existing API function to get users
      const users = await apiLogin({ email: "", password: "" });
      console.log('All users from API:', users);
      
      // Find the user with matching email
      const userToUpdate = users.find((user: User) => {
        console.log('Comparing:', user.email, 'with', forgotEmail, '=', user.email === forgotEmail);
        return user.email === forgotEmail;
      });
      
      console.log('User found:', userToUpdate);
      
      if (!userToUpdate) {
        showMessage("Email address not found", 'error');
        return;
      }
  
      console.log('Updating user with ID:', userToUpdate.id);
  
      // Use your apiUpdateUser function to update the password
      const updatedUser = await apiUpdateUser(userToUpdate.id, {
        ...userToUpdate,
        password: newPassword
      });
      
      console.log('Update successful:', updatedUser);
      
      showMessage("Password updated successfully! You can now sign in with your new password.", 'success');
      setShowForgotPassword(false);
      setForgotEmail("");
      setNewPassword("");
      setConfirmPassword("");
  
    } catch (error: any) {
      console.error('Full error object:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      
      showMessage("Failed to update password. Check console for details.", 'error');
    }
  };

  const showMessage = (text: string, type: 'success' | 'error' | 'loading') => {
    setMessage(text);
    setMessageType(type);
    setShowPopup(true);
    
    if (type !== 'loading') {
      setTimeout(() => {
        setShowPopup(false);
      }, 5000);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50 px-4 sm:px-6 lg:px-8">
      {/* Background blur circles */}
      <div className="pointer-events-none absolute -top-16 -left-16 h-40 w-40 rounded-full bg-indigo-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-12 h-48 w-48 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-violet-200/50 blur-3xl" />

      {/* Popup Messages */}
      {showPopup && message && (
        <div className={`fixed top-6 right-6 z-50 max-w-sm rounded-lg border shadow-lg transition-all duration-300 ease-in-out transform ${
          showPopup ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        } ${
          messageType === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : messageType === 'loading'
            ? 'bg-blue-50 border-blue-200 text-blue-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-start p-4">
            <div className="flex-shrink-0">
              {messageType === 'success' && (
                <CheckCircle className="h-5 w-5 text-green-400" />
              )}
              {messageType === 'error' && (
                <XCircle className="h-5 w-5 text-red-400" />
              )}
              {messageType === 'loading' && (
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
                  messageType === 'success' 
                    ? 'text-green-500 hover:bg-green-100 focus:ring-green-500' 
                    : messageType === 'loading'
                    ? 'text-blue-500 hover:bg-blue-100 focus:ring-blue-500'
                    : 'text-red-500 hover:bg-red-100 focus:ring-red-500'
                }`}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl mx-4">
            <button
              onClick={() => setShowForgotPassword(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
            
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Reset Password</h3>
              <p className="text-sm text-gray-600">
                Enter your email and new password to reset your account password.
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
              
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                icon={<Lock size={16} />}
                placeholder="Enter new password"
              />
              
              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                icon={<Lock size={16} />}
                placeholder="Confirm new password"
              />

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setShowForgotPassword(false)}
                  label="Cancel"
                  className="flex-1 bg-gray-500 hover:bg-gray-600"
                />
                <Button
                  onClick={handleForgotPassword}
                  label="Reset Password"
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card login */}
      <div className="relative w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-xl ring-1 ring-black/5">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
          <Calendar className="h-6 w-6" strokeWidth={2} />
        </div>

        <h2 className="text-center text-xl sm:text-2xl font-extrabold text-gray-800">
          SiPanit
        </h2>
        <p className="mt-1 mb-5 text-center text-sm sm:text-base text-gray-500">
          Welcome back! Please sign in to continue
        </p>

        <div className="space-y-4">
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
            onClick={handleSubmit}
            label={messageType === 'loading' ? "Signing In..." : "Sign In"}
            className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 disabled:opacity-70"
            disabled={messageType === 'loading'}
          />

          <div className="text-center text-gray-400 text-sm">or</div>

          <GoogleButton
            onSuccess={(email) => {
              const userName = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              showMessage(`Welcome ${userName}! Google sign in successful.`, 'success');
            }}
            onError={(error) => showMessage(`Google sign in failed: ${error}`, 'error')}
          />
        </div>

        <p className="mt-6 text-center text-xs sm:text-sm text-gray-500">
          Don't have an account?{" "}
          <a href="#" className="text-indigo-600 hover:underline">
            Create Account
          </a>
        </p>
      </div>
    </div>
  );
}