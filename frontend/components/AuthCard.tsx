"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AuthCardProps {
  children: ReactNode;
  footer?: ReactNode;
}

export default function AuthCard({ children, footer }: AuthCardProps) {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-transparent select-none overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="
          w-full
          max-w-[400px]
          rounded-2xl
          md:rounded-[24px]
          border
          border-white/10
          bg-[#0b0e14]/80
          backdrop-blur-3xl
          shadow-[0_0_80px_rgba(139,92,246,0.12)]
          p-8
          md:p-10
          flex
          flex-col
          gap-7
          relative
          overflow-hidden
        "
      >
        {/* Ambient Top Highlight Border */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-violet-500/40 to-transparent blur-[1px]" />

        {/* Logo and Header Text */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-violet-950/30 border border-violet-500/20 shadow-[0_0_20px_rgba(139,92,246,0.15)] overflow-hidden shrink-0 transition-transform duration-300 hover:scale-105">
            <img 
              src="/axiom-icon.png" 
              alt="AXIOM Icon" 
              className="w-full h-full object-contain p-2.5" 
            />
          </div>
          <div className="flex flex-col gap-1 items-center mt-1">
            <img 
              src="/axiom-text.png" 
              alt="AXIOM" 
              className="h-6 object-contain filter drop-shadow-[0_0_10px_rgba(139,92,246,0.15)]" 
            />
            <p className="text-xs text-[#9aa3b2]/75 font-medium tracking-wide">
              Your intelligent AI assistant
            </p>
          </div>
        </div>

        {children}

        {footer && (
          <div className="text-center text-xs text-[#9aa3b2] mt-1">
            {footer}
          </div>
        )}
      </motion.div>
    </main>
  );
}
