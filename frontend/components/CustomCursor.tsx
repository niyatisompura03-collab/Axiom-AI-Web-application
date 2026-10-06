"use client";

import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CustomCursor() {
  const [isDesktop, setIsDesktop] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  // Spring config for smooth trailing effect
  const coreSpringConfig = { damping: 25, stiffness: 400, mass: 0.5 };
  const smoothX = useSpring(cursorX, coreSpringConfig);
  const smoothY = useSpring(cursorY, coreSpringConfig);

  // Slower spring for the trailing glow (creates the fluid trailing orb effect)
  const glowSpringConfig = { damping: 20, stiffness: 150, mass: 0.8 };
  const glowX = useSpring(cursorX, glowSpringConfig);
  const glowY = useSpring(cursorY, glowSpringConfig);

  useEffect(() => {
    // Check device capabilities
    const finePointerMq = window.matchMedia("(pointer: fine)");
    const reducedMotionMq = window.matchMedia("(prefers-reduced-motion: reduce)");

    setIsDesktop(finePointerMq.matches);
    setReducedMotion(reducedMotionMq.matches);

    const handlePointerChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    const handleMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);

    finePointerMq.addEventListener("change", handlePointerChange);
    reducedMotionMq.addEventListener("change", handleMotionChange);

    return () => {
      finePointerMq.removeEventListener("change", handlePointerChange);
      reducedMotionMq.removeEventListener("change", handleMotionChange);
    };
  }, []);

  useEffect(() => {
    if (!isDesktop || reducedMotion) return;

    document.documentElement.style.cursor = "none";
    
    // Force hide native cursor everywhere safely
    const style = document.createElement("style");
    style.id = "custom-cursor-style";
    style.innerHTML = `
      * {
        cursor: none !important;
      }
    `;
    document.head.appendChild(style);

    const moveCursor = (e: MouseEvent) => {
      if (!isActive) setIsActive(true);
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);

      // Check if hovering over clickable element
      const target = e.target as HTMLElement;
      const isClickable = 
        target.tagName === 'A' || 
        target.tagName === 'BUTTON' || 
        target.tagName === 'INPUT' || 
        target.closest('a') !== null ||
        target.closest('button') !== null ||
        (target.hasAttribute('role') && target.getAttribute('role') === 'button');
      
      setIsHovering(isClickable);
    };
    
    const handleMouseLeave = () => setIsActive(false);

    window.addEventListener("mousemove", moveCursor, { passive: true });
    document.documentElement.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      document.documentElement.removeEventListener("mouseleave", handleMouseLeave);
      document.documentElement.style.cursor = "auto";
      const styleEl = document.getElementById("custom-cursor-style");
      if (styleEl) document.head.removeChild(styleEl);
    };
  }, [isDesktop, reducedMotion, cursorX, cursorY, isActive]);

  if (!isDesktop || reducedMotion) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --cursor-core: var(--accent-color, #4aa8ff);
          --cursor-glow-primary: var(--accent-color); /* Purple base glow */
          --cursor-glow-secondary: rgba(74, 168, 255, 0.4); /* Blue secondary glow */
        }
        .light {
          --cursor-glow-primary: var(--accent-color); 
          --cursor-glow-secondary: rgba(74, 168, 255, 0.2); 
        }
      `}} />
      
      {/* Outer blurred glowing orb (subtle blue->purple blend) */}
      <motion.div
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          x: glowX,
          y: glowY,
          width: 60,
          height: 60,
          marginLeft: -30,
          marginTop: -30,
          borderRadius: "50%",
          background: "radial-gradient(circle at center, var(--cursor-glow-secondary) 0%, var(--cursor-glow-primary) 50%, transparent 100%)",
          filter: "blur(12px)",
          pointerEvents: "none",
          zIndex: 9998,
          opacity: isActive ? (isHovering ? 0.9 : 0.6) : 0,
          scale: isHovering ? 1.3 : 1,
        }}
        transition={{ scale: { type: "spring", stiffness: 300, damping: 20 }, opacity: { duration: 0.2 } }}
      />

      {/* Main Core Dot (small luminous light) */}
      <motion.div
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          x: smoothX,
          y: smoothY,
          width: 5,
          height: 5,
          marginLeft: -2.5,
          marginTop: -2.5,
          borderRadius: "50%",
          backgroundColor: "var(--cursor-core)",
          boxShadow: "0 0 10px 2px var(--cursor-core), 0 0 15px 4px rgba(255, 255, 255, 0.3)",
          pointerEvents: "none",
          zIndex: 9999,
          opacity: isActive ? 1 : 0,
          scale: isHovering ? 1.5 : 1,
        }}
        transition={{ scale: { type: "spring", stiffness: 400, damping: 25 }, opacity: { duration: 0.2 } }}
      />
    </>
  );
}
