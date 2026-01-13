"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import { Shield, FileCheck, BarChart3, Lock, Zap } from "lucide-react";

interface ModuleConfig {
  icon: React.ReactNode;
  label: string;
  color: string;
  angle: number;
}

export function ComplianceCoreVisualization() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 5 orbiting modules
  const modules: ModuleConfig[] = [
    { icon: <Shield className="h-5 w-5" />, label: "Controls", color: "rgb(56, 189, 248)", angle: 0 },
    { icon: <FileCheck className="h-5 w-5" />, label: "Evidence", color: "rgb(139, 92, 246)", angle: 72 },
    { icon: <BarChart3 className="h-5 w-5" />, label: "Audits", color: "rgb(6, 182, 212)", angle: 144 },
    { icon: <Lock className="h-5 w-5" />, label: "Security", color: "rgb(236, 72, 153)", angle: 216 },
    { icon: <Zap className="h-5 w-5" />, label: "Policies", color: "rgb(34, 197, 94)", angle: 288 },
  ];

  // Orbital radius (in pixels)
  const orbitRadius = 140;

  return (
    <div ref={containerRef} className="relative w-full h-[600px] flex items-center justify-center">
      {/* Background glow layers */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Central core glow */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full bg-primary/30 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1.4, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full bg-secondary/20 blur-3xl"
        />
      </div>

      {/* Orbital container */}
      <div className="relative w-[400px] h-[400px]">
        {/* Orbital paths (SVG) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-30"
          viewBox="0 0 400 400"
        >
          {/* Outer orbit circle */}
          <motion.circle
            cx="200"
            cy="200"
            r={orbitRadius}
            fill="none"
            stroke="url(#orbitGradient)"
            strokeWidth="1.5"
            strokeDasharray="4,8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          />

          {/* Connection lines from core to modules */}
          {modules.map((module, i) => {
            const rad = (module.angle * Math.PI) / 180;
            const x = 200 + orbitRadius * Math.cos(rad);
            const y = 200 + orbitRadius * Math.sin(rad);

            return (
              <motion.line
                key={`line-${i}`}
                x1="200"
                y1="200"
                x2={x}
                y2={y}
                stroke={module.color}
                strokeWidth="1"
                opacity="0.2"
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{ opacity: 0.3, pathLength: 1 }}
                transition={{
                  delay: 1 + i * 0.15,
                  duration: 1,
                }}
              />
            );
          })}

          {/* Data flow animation */}
          {modules.map((module, i) => {
            const rad = (module.angle * Math.PI) / 180;
            const x = 200 + orbitRadius * Math.cos(rad);
            const y = 200 + orbitRadius * Math.sin(rad);

            return (
              <motion.circle
                key={`flow-${i}`}
                r="3"
                fill={module.color}
                opacity="0.6"
                initial={{ x: 200, y: 200 }}
                animate={{ x, y }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                  delay: i * 0.6,
                }}
              />
            );
          })}

          <defs>
            <linearGradient id="orbitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(56, 189, 248)" stopOpacity="0.5" />
              <stop offset="50%" stopColor="rgb(139, 92, 246)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(6, 182, 212)" stopOpacity="0.5" />
            </linearGradient>
          </defs>
        </svg>

        {/* Central core */}
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
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
            className="relative w-20 h-20"
          >
            {/* Core orb */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary via-secondary to-accent opacity-80 shadow-[0_0_40px_rgba(56,189,248,0.6)]" />
            
            {/* Inner pulse */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.8, 0.4, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-2 rounded-full bg-white/20 blur-sm"
            />

            {/* Center glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white to-transparent opacity-40" />
          </motion.div>
        </motion.div>

        {/* Orbiting modules */}
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
            >
              {/* Orbital module */}
              <motion.div
                animate={{
                  y: [0, -6, 0],
                }}
                transition={{
                  duration: 3 + i * 0.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.3,
                }}
                className="relative"
              >
                {/* Module glow */}
                <motion.div
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.2,
                  }}
                  className="absolute -inset-4 rounded-full blur-lg"
                  style={{ backgroundColor: module.color, opacity: 0.2 }}
                />

                {/* Module container */}
                <div
                  className="relative w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 shadow-lg"
                  style={{
                    backgroundColor: `${module.color}15`,
                    boxShadow: `0 0 20px ${module.color}40, inset 0 0 10px ${module.color}20`,
                  }}
                >
                  {/* Icon */}
                  <div style={{ color: module.color }} className="relative z-10">
                    {module.icon}
                  </div>

                  {/* Pulsing indicator */}
                  <motion.div
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [1, 0, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.3,
                    }}
                    className="absolute inset-0 rounded-full border border-white/30"
                  />
                </div>

                {/* Module label */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 + i * 0.1, duration: 0.6 }}
                  className="absolute top-full mt-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-semibold text-foreground/80"
                  style={{ color: module.color }}
                >
                  {module.label}
                </motion.div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Status indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center"
      >
        <div className="text-sm text-foreground/60">
          <span className="inline-flex items-center gap-2">
            <motion.span
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="h-2 w-2 rounded-full bg-primary"
            />
            Enterprise Compliance Engine
          </span>
        </div>
      </motion.div>
    </div>
  );
}
