"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface AuthButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
}

export default function AuthButton({ children, ...props }: AuthButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className="
        w-full
        h-11
        mt-1
        px-4
        rounded-xl
        bg-accent
        hover:bg-accent-hover
        text-white
        text-sm
        font-medium
        shadow-elevation
        focus:outline-none
        focus-visible:shadow-focus
        disabled:opacity-50
        disabled:cursor-not-allowed
        transition-all
        duration-200
        flex
        items-center
        justify-center
        gap-2
        cursor-pointer
      "
      {...props}
    >
      <span>{children}</span>
      <ArrowRight size={16} className="shrink-0" />
    </motion.button>
  );
}
