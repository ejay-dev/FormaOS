"use client";

import { motion } from "framer-motion";

export function CleanSystemGrid() {
  return (
    <div className="absolute inset-0">
      {/* Static subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]" 
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

export function PulsingNode({ 
  x, 
  y, 
  delay = 0, 
  color = "rgb(59, 130, 246)" 
}: { 
  x: string; 
  y: string; 
  delay?: number; 
  color?: string; 
}) {
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full pointer-events-none"
      style={{
        left: x,
        top: y,
        background: color,
        boxShadow: `0 0 20px ${color}`,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0.3, 0.7, 0.3],
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration: 3,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

export function ParallaxLayer({ 
  children, 
  speed = 0.5,
  className = "" 
}: { 
  children: React.ReactNode;
  speed?: number;
  className?: string;
}) {
  return (
    <motion.div 
      className={className}
      initial={{ y: 50, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      {children}
    </motion.div>
  );
}