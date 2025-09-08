// src/components/Input.tsx
import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ label, icon, ...props }) => {
  return (
    <div className="flex flex-col mb-4">
      <label className="text-sm font-medium mb-1">{label}</label>
      <div className="flex items-center border rounded-lg px-3 py-2 bg-white">
        {icon && <span className="mr-2 text-gray-400">{icon}</span>}
        <input
          {...props}
          className="flex-1 outline-none text-sm text-gray-700"
        />
      </div>
    </div>
  );
};

export default Input;
