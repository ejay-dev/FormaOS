"use client";

import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { Shield, FileCheck, BarChart3, Lock, Zap } from "lucide-react";

interface ModuleConfig {
  icon: React.ReactNode;
  label: string;
  color: string;
  angle: number;
}

export function ComplianceCoreVisualization() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  // 5 orbiting modules with perfect 72° angular distribution
  const modules: ModuleConfig[] = [
    { icon: <Shield className="h-6 w-6" />, label: "Controls", color: "rgb(56, 189, 248)", angle: 0 },
    { icon: <FileCheck className="h-6 w-6" />, label: "Evidence", color: "rgb(139, 92, 246)", angle: 72 },
    { icon: <BarChart3 className="h-6 w-6" />, label: "Audits", color: "rgb(6, 182, 212)", angle: 144 },
    { icon: <Lock className="h-6 w-6" />, label: "Security", color: "rgb(236, 72, 153)", angle: 216 },
    { icon: <Zap className="h-6 w-6" />, label: "Policies", color: "rgb(34, 197, 94)", angle: 288 },
  ];

  // Larger orbital radius (increased from 140px)
  const orbitRadius = 200;

  return (
    <div ref={containerRef} className="relative w-full h-[700px] flex items-center justify-center">
      {/* Background glow layers - enhanced */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Primary central glow */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full bg-primary/35 blur-3xl"
        />
        {/* Secondary glow layer */}
        <motion.div
          animate={{
            scale: [1.1, 1.4, 1.1],
            opacity: [0.25, 0.45, 0.25],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-secondary/20 blur-3xl"
        />
        {/* Tertiary accent glow */}
        <motion.div
          animate={{
            scale: [0.9, 1.2, 0.9],
            opacity: [0.2, 0.35, 0.2],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-accent/15 blur-3xl"
        />
      </div>

      {/* Orbital container - larger size */}
      <div className="relative w-[600px] h-[600px]">
        {/* Orbital paths (SVG) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-35"
          viewBox="0 0 600 600"
        >
          {/* Outer orbit circle */}
          <motion.circle
            cx="300"
            cy="300"
            r={orbitRadius}
            fill="none"
            stroke="url(#orbitGradient)"
            strokeWidth="2"
            strokeDasharray="6,10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          />

          {/* Inner secondary orbit */}
          <motion.circle
            cx="300"
            cy="300"
            r={orbitRadius * 0.5}
            fill="none"
            stroke="url(#orbitGradientReverse)"
            strokeWidth="1.5"
            strokeDasharray="4,8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            transition={{ delay: 1.2, duration: 1 }}
          />

          {/* Connection lines from core to modules */}
          {modules.map((module, i) => {
            const rad = (module.angle * Math.PI) / 180;
            const x = 300 + orbitRadius * Math.cos(rad);
            const y = 300 + orbitRadius * Math.sin(rad);

            return (
              <motion.line
                key={`line-${i}`}
                x1="300"
                y1="300"
                x2={x}
                y2={y}
                stroke={module.color}
                strokeWidth="1.5"
                opacity="0.15"
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{ opacity: 0.25, pathLength: 1 }}
                transition={{
                  delay: 1.2 + i * 0.15,
                  duration: 1.2,
                }}
              />
            );
          })}

          {/* Data flow animation along connection lines */}
          {modules.map((module, i) => {
            const rad = (module.angle * Math.PI) / 180;
            const x = 300 + orbitRadius * Math.cos(rad);
            const y = 300 + orbitRadius * Math.sin(rad);

            return (
              <motion.circle
                key={`flow-${i}`}
                r="4"
                fill={module.color}
                opacity="0.7"
                initial={{ x: 300, y: 300 }}
                animate={{ x, y }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "linear",
                  delay: i * 0.7,
                }}
              />
            );
          })}

          <defs>
            <linearGradient id="orbitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(56, 189, 248)" stopOpacity="0.6" />
              <stop offset="50%" stopColor="rgb(139, 92, 246)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="rgb(6, 182, 212)" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="orbitGradientReverse" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="rgb(6, 182, 212)" stopOpacity="0.5" />
              <stop offset="50%" stopColor="rgb(139, 92, 246)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(56, 189, 248)" stopOpacity="0.5" />
            </linearGradient>
          </defs>
        </svg>

        {/* Central core - ENHANCED */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
        >
          <motion.div
            animate={{
              rotateZ: 360,
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear",
            }}
            className="relative w-32 h-32"
          >
            {/* Outer energy ring */}
            <motion.div
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 rounded-full border-2 border-primary/40"
            />

            {/* Core gradient orb - enhanced */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary via-secondary to-accent opacity-85 shadow-[0_0_60px_rgba(56,189,248,0.7)]" />
            
            {/* Internal light sweep animation */}
            <motion.div
              animate={{
                background: [
                  "conic-gradient(from 0deg, transparent, rgba(255,255,255,0.4), transparent)",
                  "conic-gradient(from 180deg, transparent, rgba(255,255,255,0.4), transparent)",
                  "conic-gradient(from 360deg, transparent, rgba(255,255,255,0.4), transparent)"
                ]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute inset-0 rounded-full"
            />

            {/* Inner pulsing core */}
            <motion.div
              animate={{
                scale: [1, 1.25, 1],
                opacity: [0.6, 0.9, 0.6],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-3 rounded-full bg-white/25 blur-md"
            />

            {/* Center highlight */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white to-transparent opacity-50" />

            {/* Particle halo effect */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                animate={{
                  y: [0, -15, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.33,
                }}
                className="absolute left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white"
                style={{
                  top: "-8px",
                  transform: `translateX(-50%) rotate(${(i * 60)}deg) translateY(-12px)`,
                }}
              />
            ))}
          </motion.div>
        </motion.div>

        {/* Orbiting modules - ENHANCED */}
        {modules.map((module, i) => {
          const rad = (module.angle * Math.PI) / 180;
          const x = orbitRadius * Math.cos(rad);
          const y = orbitRadius * Math.sin(rad);

          return (
            <motion.div
              key={`module-${i}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.5 + i * 0.1,
                duration: 0.6,
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
              style={{
                x,
                y,
              }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Module container with hover interaction */}
              <motion.div
                animate={{
                  y: hoveredIndex === i ? -8 : [0, -8, 0],
                  scale: hoveredIndex === i ? 1.12 : 1,
                }}
                transition={{
                  y: hoveredIndex === i 
                    ? { duration: 0.3 }
                    : { duration: 3.5 + i * 0.2, repeat: Infinity, ease: "easeInOut" },
                  scale: { duration: 0.3 },
                }}
                className="relative"
              >
                {/* Module glow - enhanced on hover */}
                <motion.div
                  animate={{
                    scale: hoveredIndex === i ? [1.5, 1.8, 1.5] : [1, 1.4, 1],
                    opacity: hoveredIndex === i ? [0.6, 0.9, 0.6] : [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.2,
                  }}
                  className="absolute -inset-6 rounded-full blur-lg"
                  style={{ backgroundColor: module.color, opacity: hoveredIndex === i ? 0.4 : 0.2 }}
                />

                {/* Module circle - larger */}
                <motion.div
                  animate={{
                    boxShadow: hoveredIndex === i 
                      ? `0 0 35px ${module.color}70, inset 0 0 15px ${module.color}35`
                      : `0 0 25px ${module.color}50, inset 0 0 10px ${module.color}20`
                  }}
                  transition={{ duration: 0.3 }}
                  className="relative w-20 h-20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/25 transition-all"
                  style={{
                    backgroundColor: `${module.color}20`,
                  }}
                >
                  {/* Icon */}
                  <div style={{ color: module.color }} className="relative z-10 transition-transform">
                    {module.icon}
                  </div>

                  {/* Pulsing indicator ring */}
                  <motion.div
                    animate={{
                      scale: [1, 1.6, 1],
                      opacity: [1, 0, 1],
                    }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.3,
                    }}
                    className="absolute inset-0 rounded-full border border-white/40"
                  />

                  {/* Hover highlight inner ring */}
                  {hoveredIndex === i && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="absolute inset-1 rounded-full border border-white/40"
                    />
                  )}
                </motion.div>

                {/* Module label - enhanced visibility */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 + i * 0.1, duration: 0.6 }}
                  className="absolute top-full mt-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm font-bold"
                  style={{ color: module.color }}
                >
                  {module.label}
                </motion.div>

                {/* Connector line highlight on hover */}
                {hoveredIndex === i && (
                  <motion.div
                    layoutId={`highlight-${i}`}
                    className="absolute -inset-0 rounded-full"
                    style={{
                      background: `radial-gradient(circle, ${module.color}30, transparent)`,
                      filter: "blur(8px)",
                    }}
                  />
                )}
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Status indicator - enhanced */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.2, duration: 0.6 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center"
      >
        <div className="text-sm font-semibold text-foreground/70">
          <span className="inline-flex items-center gap-2.5">
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1, 0.8] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="h-2.5 w-2.5 rounded-full bg-primary"
            />
            Enterprise Compliance Engine
          </span>
        </div>
      </motion.div>
    </div>
  );
}
