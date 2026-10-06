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
        from-accent
        to-indigo-600
        hover:from-accent
        hover:to-indigo-500
        text-white
        text-sm
        font-semibold
        shadow-[0_4px_20px_var(--accent-color)]
        hover:shadow-[0_4px_25px_var(--accent-color)]
        focus:outline-none
        focus:ring-2
        focus:ring-accent/50
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
