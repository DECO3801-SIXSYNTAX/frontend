import React from "react";
import { AuthService } from "../services/AuthService";

const authService = new AuthService();

interface GoogleButtonProps {
  onSuccess?: (email: string) => void;
  onError?: (error: string) => void;
}

export default function GoogleButton({ onSuccess, onError }: GoogleButtonProps) {
  const handleClick = async () => {
    try {
      const user = await authService.signIn({
        email: "googleuser@gmail.com",
        password: "oauth-mock",
      });
      onSuccess?.(user.email);
      alert(`Logged in as ${user.email} (Google Mock)`);
    } catch (err: any) {
      onError?.(err.message);
      alert("Google login failed: " + err.message);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    >
      <img
        src="https://www.svgrepo.com/show/355037/google.svg"
        alt="Google"
        className="h-5 w-5"
      />
      Continue with Google
    </button>
  );
}
