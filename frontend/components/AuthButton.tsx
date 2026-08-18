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
        mt-1
        py-3
        px-4
        rounded-xl
        bg-gradient-to-r
        from-violet-600
        to-indigo-600
        hover:from-violet-500
        hover:to-indigo-500
        text-white
        text-sm
        font-semibold
        shadow-[0_4px_20px_rgba(139,92,246,0.25)]
        hover:shadow-[0_4px_25px_rgba(139,92,246,0.4)]
        focus:outline-none
        focus:ring-2
        focus:ring-violet-500/50
        transition-all
        duration-300
        flex
        items-center
        justify-center
        gap-2
        cursor-pointer
      "
      {...props}
    >
      <span>{children}</span>
      <ArrowRight size={16} />
    </motion.button>
  );
}
