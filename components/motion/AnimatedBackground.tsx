"use client";

import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function AnimatedSystemGrid() {
  // Disabled animated grid - static background only
  return (
    <div className="absolute inset-0 opacity-30">
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  );
}

export function FloatingUIPanel({ delay = 0, children, className = "" }: { delay?: number; children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, rotateX: 10 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, delay, ease: [0.21, 0.45, 0.27, 0.9] }}
      style={{ y, opacity }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function DataFlowLines() {
  // Disabled animated lines - return empty div
  return <div className="absolute inset-0" />;
}

export function ParallaxLayer({ children, speed = 0.5, className = "" }: { children: React.ReactNode; speed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [-50 * speed, 50 * speed]);
  
  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

export function PulsingNode({ x, y, size = 4, color = "rgb(56, 189, 248)", delay = 0 }: { x: string; y: string; size?: number; color?: string; delay?: number }) {
  // Disabled pulsing animation - return null
  return null;
}
