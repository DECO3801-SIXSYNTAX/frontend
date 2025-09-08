import React, { useState } from "react";
import { AuthService } from "../services/AuthService";
import Input from "../components/Input";
import { Mail, Lock } from "lucide-react";

const authService = new AuthService();

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage("Email and password are required");
      return;
    }
    setMessage("Logging in...");
    try {
      const res = await authService.signIn({ email, password });
      setMessage(`Welcome, ${res.email}`);
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100">
      <div className="bg-white shadow-lg rounded-2xl w-full max-w-md p-8">
        <h2 className="text-xl font-bold mb-2 text-center">SiPanit</h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Welcome back! Please sign in to continue
        </p>
        <form onSubmit={handleSubmit}>
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={16} />}
            placeholder="Enter your email address"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock size={16} />}
            placeholder="Enter your password"
          />
          {message && <p className="text-sm mt-2 text-red-500">{message}</p>}
          <button
            type="submit"
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg mt-4"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
