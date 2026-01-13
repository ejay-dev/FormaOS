"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useState, ReactNode } from "react";

/**
 * =========================================================
 * PREMIUM BACKGROUND EFFECTS SYSTEM
 * =========================================================
 * Cinematic backgrounds with:
 * - Particle systems
 * - Gradient meshes
 * - Node-wire constellations
 * - Light motion noise
 */

// Ambient particle system
interface ParticleFieldProps {
  count?: number;
  color?: string;
  speed?: number;
  className?: string;
}

export function ParticleField({ 
  count = 50, 
  color = "rgb(56, 189, 248)",
  speed = 1,
  className = "" 
}: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Particle definition
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
    }

    const particles: Particle[] = [];

    // Initialize particles
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * speed * 0.5,
        vy: (Math.random() - 0.5) * speed * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      particles.forEach((particle, i) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.offsetWidth;
        if (particle.x > canvas.offsetWidth) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.offsetHeight;
        if (particle.y > canvas.offsetHeight) particle.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = color.replace("rgb", "rgba").replace(")", `,${particle.opacity})`);
        ctx.fill();

        // Draw connections to nearby particles
        particles.slice(i + 1).forEach((other) => {
          const dx = other.x - particle.x;
          const dy = other.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            const opacity = (1 - distance / 120) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = color.replace("rgb", "rgba").replace(")", `,${opacity})`);
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [count, color, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ width: "100%", height: "100%" }}
    />
  );
}

// Gradient mesh background
interface GradientMeshProps {
  colors?: string[];
  animate?: boolean;
  className?: string;
}

export function GradientMesh({ 
  colors = [
    "rgba(56, 189, 248, 0.15)",
    "rgba(139, 92, 246, 0.12)",
    "rgba(6, 182, 212, 0.10)",
  ],
  animate = true,
  className = "" 
}: GradientMeshProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {colors.map((color, i) => (
        <motion.div
          key={i}
          initial={{ scale: 1, rotate: 0 }}
          animate={animate ? {
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0],
            x: [0, 50, -50, 0],
            y: [0, -30, 30, 0],
          } : undefined}
          transition={{
            duration: 20 + i * 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute rounded-full blur-[120px]"
          style={{
            background: color,
            width: `${400 + i * 100}px`,
            height: `${400 + i * 100}px`,
            left: `${20 + i * 30}%`,
            top: `${10 + i * 25}%`,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </div>
  );
}

// Noise overlay
interface NoiseOverlayProps {
  opacity?: number;
  className?: string;
}

export function NoiseOverlay({ opacity = 0.03, className = "" }: NoiseOverlayProps) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        opacity,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }}
    />
  );
}

// Constellation node system
interface ConstellationProps {
  nodeCount?: number;
  className?: string;
}

export function Constellation({ nodeCount = 20, className = "" }: ConstellationProps) {
  const [nodes, setNodes] = useState<{ x: number; y: number; size: number }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const newNodes = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 2,
    }));
    
    setNodes(newNodes);
  }, [nodeCount]);

  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden ${className}`}>
      <svg className="w-full h-full">
        <defs>
          <radialGradient id="nodeGlow">
            <stop offset="0%" stopColor="rgb(56, 189, 248)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="rgb(56, 189, 248)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Draw connections */}
        {nodes.map((node, i) =>
          nodes.slice(i + 1).map((other, j) => {
            const distance = Math.sqrt(
              Math.pow(other.x - node.x, 2) + Math.pow(other.y - node.y, 2)
            );
            if (distance > 25) return null;
            
            const opacity = (1 - distance / 25) * 0.2;
            return (
              <motion.line
                key={`${i}-${j}`}
                x1={`${node.x}%`}
                y1={`${node.y}%`}
                x2={`${other.x}%`}
                y2={`${other.y}%`}
                stroke="rgb(56, 189, 248)"
                strokeOpacity={opacity}
                strokeWidth="1"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: i * 0.1 }}
              />
            );
          })
        )}

        {/* Draw nodes */}
        {nodes.map((node, i) => (
          <motion.g key={i}>
            {/* Glow */}
            <motion.circle
              cx={`${node.x}%`}
              cy={`${node.y}%`}
              r={node.size * 3}
              fill="url(#nodeGlow)"
              animate={{
                opacity: [0.3, 0.6, 0.3],
                r: [node.size * 3, node.size * 4, node.size * 3],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
            {/* Core */}
            <motion.circle
              cx={`${node.x}%`}
              cy={`${node.y}%`}
              r={node.size}
              fill="rgb(56, 189, 248)"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1, type: "spring" }}
            />
          </motion.g>
        ))}
      </svg>
    </div>
  );
}

// Cinematic section background wrapper
interface CinematicBackgroundProps {
  children: ReactNode;
  variant?: "particles" | "mesh" | "constellation" | "minimal";
  className?: string;
  intensity?: "low" | "medium" | "high";
}

export function CinematicBackground({
  children,
  variant = "particles",
  className = "",
  intensity = "medium",
}: CinematicBackgroundProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.3, 1, 1, 0.3]);

  const intensityConfig = {
    low: { particleCount: 30, meshOpacity: 0.5 },
    medium: { particleCount: 50, meshOpacity: 0.7 },
    high: { particleCount: 80, meshOpacity: 1 },
  };

  const config = intensityConfig[intensity];

  return (
    <motion.div
      ref={ref}
      style={{ opacity }}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />

      {/* Background effect based on variant */}
      {variant === "particles" && (
        <ParticleField count={config.particleCount} className="opacity-40" />
      )}
      {variant === "mesh" && (
        <GradientMesh className={`opacity-${Math.round(config.meshOpacity * 100)}`} />
      )}
      {variant === "constellation" && (
        <Constellation nodeCount={config.particleCount} className="opacity-50" />
      )}

      {/* Noise overlay */}
      <NoiseOverlay />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.4) 100%)",
      }} />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

// Scroll-linked parallax wrapper
interface ParallaxSectionProps {
  children: ReactNode;
  speed?: number;
  className?: string;
}

export function ParallaxSection({
  children,
  speed = 0.5,
  className = "",
}: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [-50 * speed, 50 * speed]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <motion.div
      ref={ref}
      style={{ y, opacity }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default {
  ParticleField,
  GradientMesh,
  NoiseOverlay,
  Constellation,
  CinematicBackground,
  ParallaxSection,
};
