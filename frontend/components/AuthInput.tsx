"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { LucideIcon } from "lucide-react";

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: LucideIcon;
  error?: boolean;
  errorMessage?: string;
}

export default function AuthInput({ 
  label, 
  icon: Icon, 
  type, 
  error,
  errorMessage,
  disabled,
  className = "", 
  ...props 
}: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const currentType = isPassword && showPassword ? "text" : type;

  return (
    <div className={`flex flex-col gap-1.5 ${disabled ? "opacity-60" : ""}`}>
      <label htmlFor={props.id} className="text-xs font-medium text-text-secondary ml-0.5">
        {label}
      </label>
      <div 
        className={`
          flex items-center gap-2.5 px-3.5 h-11 rounded-xl border bg-surface-input 
          transition-all duration-200 group
          ${error 
            ? "border-error focus-within:border-error" 
            : "border-border hover:border-text-muted/30 focus-within:border-accent focus-within:shadow-focus"
          }
          ${disabled ? "cursor-not-allowed" : ""}
        `}
      >
        <Icon 
          size={16} 
          className={`shrink-0 transition-colors duration-200 ${
            error 
              ? "text-error" 
              : "text-text-muted group-focus-within:text-accent"
          }`} 
        />
        <input
          type={currentType}
          disabled={disabled}
          {...props}
          className={`flex-1 bg-transparent text-text-primary text-sm placeholder:text-text-muted focus:outline-none min-w-0 ${disabled ? "cursor-not-allowed" : ""} ${className}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={disabled}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors duration-200 shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {errorMessage && (
        <p className="text-xs text-error ml-0.5" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
