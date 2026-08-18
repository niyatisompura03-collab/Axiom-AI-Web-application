"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { LucideIcon } from "lucide-react";

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: LucideIcon;
}

export default function AuthInput({ label, icon: Icon, type, ...props }: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const currentType = isPassword && showPassword ? "text" : type;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={props.id} className="text-[10px] font-bold tracking-wider text-[#9aa3b2] uppercase ml-1">
        {label}
      </label>
      <div className="flex items-center gap-2 px-3 py-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] focus-within:bg-white/[0.05] focus-within:border-violet-500/50 focus-within:shadow-[0_0_15px_rgba(139,92,246,0.15)] transition-all duration-300 group">
        <Icon size={16} className="text-gray-500 group-focus-within:text-violet-400 transition-colors duration-200 shrink-0" />
        <input
          type={currentType}
          {...props}
          className={`flex-1 bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none min-w-0 ${props.className || ""}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-gray-500 hover:text-white transition-colors duration-200 shrink-0 p-0.5"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}
