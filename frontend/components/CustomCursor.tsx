"use client";

import React, { useEffect, useRef, useState } from "react";

const CustomCursor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  
  const [isDesktop, setIsDesktop] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check device capabilities and user preferences
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
    if (!isDesktop) return;

    // Hide default system cursor
    document.body.style.cursor = "none";
    
    const canvas = canvasRef.current;
    const pointer = pointerRef.current;
    
    // We only strictly require pointer for Layer 1
    if (!pointer) return;
    
    const ctx = canvas?.getContext("2d");

    let width = window.innerWidth;
    let height = window.innerHeight;
    if (canvas) {
        canvas.width = width;
        canvas.height = height;
    }

    let mouse = { x: -100, y: -100 }; // start offscreen
    let history: { x: number; y: number; timestamp: number }[] = [];
    let lastMoveTime = 0;
    
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      lastMoveTime = performance.now();
      
      // Update Layer 1 precise pointer instantly with no lag
      pointer.style.transform = `translate(${mouse.x}px, ${mouse.y}px)`;
    };

    window.addEventListener("mousemove", handleMouseMove);

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      if (canvas) {
          canvas.width = width;
          canvas.height = height;
      }
    };
    window.addEventListener("resize", handleResize);

    let animationFrameId: number;
    const maxAge = 500; // Trail length in ms
    const maxRadius = 45; // Max thickness of the glow head

    const render = (time: DOMHighResTimeStamp) => {
      // Pause all animation when tab is inactive to save CPU/GPU
      if (!document.hasFocus()) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      if (ctx && canvas && !reducedMotion) {
        ctx.clearRect(0, 0, width, height);

        // Record history only if mouse moved to prevent clumping
        const lastPoint = history[history.length - 1];
        if (!lastPoint || lastPoint.x !== mouse.x || lastPoint.y !== mouse.y) {
            history.push({ x: mouse.x, y: mouse.y, timestamp: time });
        }

        // Remove points older than maxAge
        history = history.filter(p => time - p.timestamp < maxAge);

        const timeSinceLastMove = time - lastMoveTime;
        let globalAlpha = 1.0;
        
        // Idle behavior: fade out to transparent over half a second
        const idleDelay = 50;
        const fadeDuration = 450;
        if (timeSinceLastMove > idleDelay) {
          globalAlpha = Math.max(0, 1 - (timeSinceLastMove - idleDelay) / fadeDuration);
        }

        if (globalAlpha > 0 && history.length > 1) {
          ctx.globalAlpha = globalAlpha;
          // lighter composite creates an intensely bright overlapping core
          ctx.globalCompositeOperation = 'lighter';
          
          for (let i = 0; i < history.length - 1; i++) {
            const p1 = history[i];
            const p2 = history[i + 1];
            const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            const steps = Math.max(1, Math.floor(dist / 2)); // interpolate every ~2px for smooth curves
            
            for (let j = 0; j < steps; j++) {
              const fraction = j / steps;
              const x = p1.x + (p2.x - p1.x) * fraction;
              const y = p1.y + (p2.y - p1.y) * fraction;
              
              const pointTime = p1.timestamp + (p2.timestamp - p1.timestamp) * fraction;
              const age = time - pointTime;
              
              const t = Math.max(0, Math.min(1, age / maxAge)); // 0 (new) to 1 (old)
              
              // Non-linear radius taper (fat head, long thin tail)
              const radius = maxRadius * Math.pow(1 - t, 1.2);
              if (radius < 0.5) continue;

              // Organic hue drift shifting over time between Pink, Magenta, Purple
              const baseHue = 310 + Math.sin(time * 0.001) * 35; 
              const tailHue = baseHue - 50; // Deeper purple/red tail
              
              const currentHue = baseHue * (1 - t) + tailHue * t;
              
              // Lightness and opacity taper
              const lightness = 65 * (1 - t) + 20 * t; 
              const alpha = 0.6 * Math.pow(1 - t, 1.5);

              ctx.beginPath();
              const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
              
              // White-hot core fading out to soft soft edges
              grad.addColorStop(0, `hsla(${currentHue}, 100%, ${lightness + 25}%, ${alpha})`);
              grad.addColorStop(0.3, `hsla(${currentHue}, 100%, ${lightness}%, ${alpha * 0.7})`);
              grad.addColorStop(1, `hsla(${currentHue}, 100%, ${lightness}%, 0)`);

              ctx.fillStyle = grad;
              ctx.arc(x, y, radius, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      document.body.style.cursor = "auto"; // Restore cursor on unmount
    };
  }, [isDesktop, reducedMotion]);

  if (!isDesktop) return null; // Desktop only

  return (
    <>
      {/* SVG Filter for the organic, gritty sand-like noise texture */}
      <svg style={{ display: 'none' }}>
        <filter id="glow-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
          <feColorMatrix type="matrix" values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0.5 0" in="noise" result="coloredNoise" />
          <feComposite operator="in" in="coloredNoise" in2="SourceGraphic" result="maskedNoise" />
          <feBlend mode="overlay" in="maskedNoise" in2="SourceGraphic" />
        </filter>
      </svg>
      
      {/* Layer 2: Glowing Trail */}
      {!reducedMotion && (
        <canvas
          ref={canvasRef}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            pointerEvents: "none",
            zIndex: 9998,
            mixBlendMode: "screen", // Blend nicely without flattening underlying content
            filter: "url(#glow-grain)", // Apply the noise texture
          }}
        />
      )}

      {/* Layer 1: Precision Pointer */}
      <div
        ref={pointerRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "24px",
          height: "24px",
          marginLeft: "-12px",
          marginTop: "-12px",
          pointerEvents: "none",
          zIndex: 9999, // Sits strictly on top
          borderRadius: "50%",
          border: "1.5px solid #4aa8ff", // Axiom pale cyan theme
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          willChange: "transform", // Hardware accelerated zero-lag tracking
        }}
      >
        {/* Core Dot */}
        <div
          style={{
            width: "5px",
            height: "5px",
            backgroundColor: "#4aa8ff",
            borderRadius: "50%",
            boxShadow: "0 0 5px #4aa8ff",
          }}
        />
      </div>
    </>
  );
};

export default CustomCursor;
