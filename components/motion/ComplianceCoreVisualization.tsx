"use client";

import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";
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
  const [isMobile, setIsMobile] = useState(true);

  // Detect screen size for responsive orbital radius
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // 5 orbiting modules with perfect 72° angular distribution
  // Reordered for mobile grid: Row 1 (Security, Policies, Controls), Row 2 (Audits, Evidence)
  const modules: ModuleConfig[] = [
    { icon: <Shield className="h-5 w-5 md:h-6 md:w-6" />, label: "Controls", color: "rgb(56, 189, 248)", angle: 0 },
    { icon: <FileCheck className="h-5 w-5 md:h-6 md:w-6" />, label: "Evidence", color: "rgb(139, 92, 246)", angle: 72 },
    { icon: <BarChart3 className="h-5 w-5 md:h-6 md:w-6" />, label: "Audits", color: "rgb(6, 182, 212)", angle: 144 },
    { icon: <Lock className="h-5 w-5 md:h-6 md:w-6" />, label: "Security", color: "rgb(236, 72, 153)", angle: 216 },
    { icon: <Zap className="h-5 w-5 md:h-6 md:w-6" />, label: "Policies", color: "rgb(34, 197, 94)", angle: 288 },
  ];

  // Mobile grid order: Security, Policies, Controls (top row), Audits, Evidence (bottom row)
  const mobileOrderedModules = [modules[3], modules[4], modules[0], modules[2], modules[1]];

  // Responsive orbital radius
  const orbitRadius = 200;

  // Mobile layout - clean compact grid with NO center glow
  if (isMobile) {
    return (
      <div ref={containerRef} className="relative w-full py-6 px-2">
        {/* Grid layout for mobile circles - compact 2 rows */}
        <div className="flex flex-col gap-6">
          {/* Row 1: 3 modules - Security, Policies, Controls */}
          <div className="flex justify-center gap-6">
            {mobileOrderedModules.slice(0, 3).map((module, i) => (
              <motion.div
                key={`mobile-module-${i}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                className="flex flex-col items-center"
              >
                {/* Circle — 48px min tap target */}
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/15 transition-all"
                  style={{ backgroundColor: `${module.color}15` }}
                >
                  {/* Very subtle glow ring */}
                  <div
                    className="absolute -inset-0.5 rounded-full opacity-30"
                    style={{
                      border: `1px solid ${module.color}`,
                    }}
                  />
                  {/* Icon */}
                  <div style={{ color: module.color }} className="relative z-10">
                    {module.icon}
                  </div>
                </motion.div>
                {/* Label */}
                <span
                  className="mt-2 text-xs font-semibold"
                  style={{ color: module.color }}
                >
                  {module.label}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Row 2: 2 modules - Audits, Evidence (centered) */}
          <div className="flex justify-center gap-8">
            {mobileOrderedModules.slice(3, 5).map((module, i) => (
              <motion.div
                key={`mobile-module-row2-${i}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                className="flex flex-col items-center"
              >
                {/* Circle — 48px min tap target */}
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/15 transition-all"
                  style={{ backgroundColor: `${module.color}15` }}
                >
                  {/* Very subtle glow ring */}
                  <div
                    className="absolute -inset-0.5 rounded-full opacity-30"
                    style={{
                      border: `1px solid ${module.color}`,
                    }}
                  />
                  {/* Icon */}
                  <div style={{ color: module.color }} className="relative z-10">
                    {module.icon}
                  </div>
                </motion.div>
                {/* Label */}
                <span
                  className="mt-2 text-xs font-semibold"
                  style={{ color: module.color }}
                >
                  {module.label}
                </span>
              </motion.div>
            ))}
          </div>
          
          {/* Connecting wire accents - subtle lines between modules */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 0.8 }}
            className="absolute inset-0 pointer-events-none"
          >
            <svg className="w-full h-full" style={{ position: 'absolute', top: 0, left: 0 }}>
              {/* Subtle connecting arcs */}
              <path
                d="M 50% 25% Q 50% 40%, 50% 55%"
                fill="none"
                stroke="url(#mobileWireGradient)"
                strokeWidth="1"
                strokeDasharray="4,4"
                opacity="0.4"
              />
              <defs>
                <linearGradient id="mobileWireGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgb(56, 189, 248)" stopOpacity="0.5" />
                  <stop offset="50%" stopColor="rgb(139, 92, 246)" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="rgb(6, 182, 212)" stopOpacity="0.5" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
        </div>
      </div>
    );
  }

  // Desktop layout - orbital system (unchanged)
  return (
    <div ref={containerRef} className="relative w-full h-[700px] flex items-center justify-center">
      {/* Background glow layers - refined for cinema */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Primary central glow - subtle, premium */}
        <motion.div
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.2, 0.35, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] rounded-full bg-primary/20 blur-2xl"
        />
        {/* Secondary glow layer - minimal */}
        <motion.div
          animate={{
            scale: [1.05, 1.2, 1.05],
            opacity: [0.12, 0.22, 0.12],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.7,
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-secondary/10 blur-2xl"
        />
      </div>

      {/* Orbital container - larger size */}
      <div className="relative w-[600px] h-[600px]">
        {/* Orbital paths (SVG) - properly aligned */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
          viewBox="0 0 600 600"
        >
          {/* Outer orbit circle - soft, atmospheric */}
          <motion.circle
            cx="300"
            cy="300"
            r={orbitRadius}
            fill="none"
            stroke="url(#orbitGradient)"
            strokeWidth="1.5"
            strokeDasharray="8,12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.35 }}
            transition={{ delay: 0.8, duration: 0.8 }}
          />

          {/* Inner secondary orbit - barely visible */}
          <motion.circle
            cx="300"
            cy="300"
            r={orbitRadius * 0.5}
            fill="none"
            stroke="url(#orbitGradientReverse)"
            strokeWidth="1"
            strokeDasharray="6,10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            transition={{ delay: 1.2, duration: 1 }}
          />

          {/* Connection lines from core to modules - very subtle */}
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
                strokeWidth="1"
                opacity="0.08"
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{ opacity: 0.12, pathLength: 1 }}
                transition={{
                  delay: 1.2 + i * 0.15,
                  duration: 1.2,
                }}
              />
            );
          })}

          {/* Data flow animation - subtle accent only */}
          {modules.map((module, i) => {
            const rad = (module.angle * Math.PI) / 180;
            const x = 300 + orbitRadius * Math.cos(rad);
            const y = 300 + orbitRadius * Math.sin(rad);

            return (
              <motion.circle
                key={`flow-${i}`}
                r="3"
                fill={module.color}
                opacity="0.5"
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
              <stop offset="0%" stopColor="rgb(56, 189, 248)" stopOpacity="0.4" />
              <stop offset="50%" stopColor="rgb(139, 92, 246)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="rgb(6, 182, 212)" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="orbitGradientReverse" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="rgb(6, 182, 212)" stopOpacity="0.3" />
              <stop offset="50%" stopColor="rgb(139, 92, 246)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="rgb(56, 189, 248)" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </svg>

        {/* Central core - soft glass energy node */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
        >
          <motion.div
            animate={{ rotateZ: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="relative w-32 h-32"
          >
            {/* Outer energy ring - subtle pulse */}
            <motion.div
              animate={{ opacity: [0.2, 0.4, 0.2], scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full border border-primary/30"
            />

            {/* Core gradient orb - soft glass with cyan→purple */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/40 via-blue-500/35 to-purple-600/40 backdrop-blur-sm shadow-[0_0_30px_rgba(34,211,238,0.35)] border border-white/20" />
            
            {/* Soft internal light sweep - minimal */}
            <motion.div
              animate={{
                background: [
                  "conic-gradient(from 0deg, transparent, rgba(255,255,255,0.2), transparent)",
                  "conic-gradient(from 180deg, transparent, rgba(255,255,255,0.2), transparent)",
                  "conic-gradient(from 360deg, transparent, rgba(255,255,255,0.2), transparent)"
                ]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full"
            />

            {/* Inner pulsing glow - soft */}
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-4 rounded-full bg-blue-300/20 blur-md"
            />

            {/* Center highlight - subtle */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-40" />

            {/* Subtle particle halo */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={`particle-${i}`}
                animate={{ y: [0, -12, 0], opacity: [0, 0.6, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.625 }}
                className="absolute left-1/2 -translate-x-1/2 w-0.5 h-0.5 rounded-full bg-cyan-300"
                style={{ top: "-10px", transform: `translateX(-50%) rotate(${(i * 90)}deg) translateY(-14px)` }}
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
                animate={{ y: hoveredIndex === i ? -8 : [0, -8, 0], scale: hoveredIndex === i ? 1.12 : 1 }}
                transition={{ y: hoveredIndex === i ? { duration: 0.3 } : { duration: 3.5 + i * 0.2, repeat: Infinity, ease: "easeInOut" }, scale: { duration: 0.3 } }}
                className="relative"
              >
              {/* Module glow - subtle, soft, premium */}
                <motion.div
                  animate={{ scale: hoveredIndex === i ? [1.2, 1.35, 1.2] : [0.9, 1.1, 0.9], opacity: hoveredIndex === i ? [0.25, 0.4, 0.25] : [0.1, 0.2, 0.1] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
                  className="absolute -inset-4 rounded-full blur-md"
                  style={{ backgroundColor: module.color, opacity: hoveredIndex === i ? 0.2 : 0.08 }}
                />

                {/* Module circle - soft glass aesthetic */}
                <motion.div
                  animate={{
                    boxShadow: hoveredIndex === i 
                      ? `0 0 16px ${module.color}40, inset 0 0 6px ${module.color}20`
                      : `0 0 10px ${module.color}25, inset 0 0 4px ${module.color}10`
                  }}
                  transition={{ duration: 0.3 }}
                  className="relative w-20 h-20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/15 transition-all"
                  style={{
                    backgroundColor: `${module.color}12`,
                  }}
                >
                  {/* Icon */}
                  <div style={{ color: module.color }} className="relative z-10 transition-transform">
                    {module.icon}
                  </div>

                  {/* Pulsing indicator ring - subtle */}
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
                    className="absolute inset-0 rounded-full border border-white/25"
                  />

                  {/* Hover highlight inner ring */}
                  {hoveredIndex === i && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="absolute inset-1 rounded-full border border-white/20"
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
    </div>
  );
}
