"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AuthCardProps {
  children: ReactNode;
  footer?: ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AuthCard({ children, footer, title, subtitle }: AuthCardProps) {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-transparent select-none overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="
          w-full
          max-w-[420px]
          rounded-2xl
          border
          border-border
          bg-surface-secondary/90
          backdrop-blur-2xl
          shadow-elevation
          p-7
          sm:p-9
          flex
          flex-col
          gap-6
          relative
        "
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="flex items-center justify-center">
            <img 
              src="/brand/axiom-mark-white.png" 
              alt="Axiom" 
              className="h-10 w-auto object-contain dark-logo" 
            />
            <img 
              src="/brand/axiom-mark-black.png" 
              alt="Axiom" 
              className="h-10 w-auto object-contain light-logo" 
            />
          </div>
          <div className="flex flex-col items-center gap-1">
            <img 
              src="/brand/axiom-wordmark-white.png" 
              alt="AXIOM" 
              className="h-5 w-auto object-contain dark-logo" 
            />
            <img 
              src="/brand/axiom-wordmark-black.png" 
              alt="AXIOM" 
              className="h-5 w-auto object-contain light-logo" 
            />
            {subtitle ? (
              <p className="text-xs text-text-secondary font-normal tracking-normal max-w-[320px] mt-0.5">
                {subtitle}
              </p>
            ) : (
              <p className="text-xs text-text-secondary font-medium tracking-wide mt-0.5">
                Think • Remember • Do more
              </p>
            )}
          </div>
          {title && (
            <h1 className="text-lg font-semibold text-text-primary tracking-tight mt-1">
              {title}
            </h1>
          )}
        </div>

        {children}

        {footer && (
          <div className="text-center text-xs text-text-secondary mt-0.5">
            {footer}
          </div>
        )}
      </motion.div>
    </main>
  );
}
