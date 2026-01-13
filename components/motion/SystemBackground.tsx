"use client";

import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useRef, useEffect, useState, ReactNode, useMemo } from "react";

/**
 * =========================================================
 * SYSTEM BACKGROUND - Premium Visual Layer System
 * =========================================================
 * A living compliance engine operating beneath the interface.
 * 
 * Features:
 * - Multi-layer gradients (deep navy → blue → cyan/purple)
 * - Floating orb system (replaces wire networks)
 * - Ambient motion (parallax, opacity breathing, drifting particles)
 * - Glassmorphism depth layers
 * - Light bloom / soft glow hierarchy
 * 
 * Variants:
 * - info: Minimal particles, soft breathing, calm
 * - metrics: Radial glow, micro-particles, depth shadows
 * - process: Stronger presence, directional flow, data pathways
 */

export type SystemBackgroundVariant = "info" | "metrics" | "process";

interface SystemBackgroundProps {
  variant?: SystemBackgroundVariant;
  children: ReactNode;
  className?: string;
  intensity?: "low" | "medium" | "high";
}

// =========================================================
// FLOATING ORBS - Replaces wire networks
// =========================================================
interface OrbConfig {
  size: number;
  x: number;
  y: number;
  color: string;
  blur: number;
  opacity: number;
  duration: number;
  delay: number;
}

function FloatingOrbs({ 
  variant, 
  reducedMotion 
}: { 
  variant: SystemBackgroundVariant;
  reducedMotion: boolean;
}) {
  const orbConfigs = useMemo(() => {
    const configs: OrbConfig[] = [];
    
    // Color palette - premium deep tones
    const colors = {
      primary: "rgba(0, 180, 220, 0.25)",      // Cyan
      secondary: "rgba(59, 130, 246, 0.2)",    // Blue
      accent: "rgba(139, 92, 246, 0.18)",      // Purple
      highlight: "rgba(6, 182, 212, 0.15)",    // Teal
      deep: "rgba(30, 64, 175, 0.12)",         // Deep blue
    };
    
    // Generate orbs based on variant
    const orbCount = variant === "info" ? 4 : variant === "metrics" ? 6 : 8;
    
    for (let i = 0; i < orbCount; i++) {
      const colorKeys = Object.keys(colors) as (keyof typeof colors)[];
      const colorKey = colorKeys[i % colorKeys.length];
      
      configs.push({
        size: variant === "process" 
          ? 300 + Math.random() * 400 
          : variant === "metrics" 
            ? 250 + Math.random() * 300 
            : 200 + Math.random() * 250,
        x: 10 + (i * 18) + Math.random() * 15,
        y: 15 + (i * 12) + Math.random() * 20,
        color: colors[colorKey],
        blur: variant === "process" ? 80 : variant === "metrics" ? 100 : 120,
        opacity: variant === "info" ? 0.5 : variant === "metrics" ? 0.7 : 0.85,
        duration: 15 + Math.random() * 15,
        delay: i * 2,
      });
    }
    
    return configs;
  }, [variant]);

  if (reducedMotion) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {orbConfigs.map((orb, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: orb.size,
              height: orb.size,
              left: `${orb.x}%`,
              top: `${orb.y}%`,
              background: orb.color,
              filter: `blur(${orb.blur}px)`,
              opacity: orb.opacity,
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {orbConfigs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            background: orb.color,
            filter: `blur(${orb.blur}px)`,
            transform: "translate(-50%, -50%)",
          }}
          initial={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            opacity: 0,
            scale: 0.8,
          }}
          animate={{
            left: [`${orb.x}%`, `${orb.x + 8}%`, `${orb.x - 5}%`, `${orb.x}%`],
            top: [`${orb.y}%`, `${orb.y - 10}%`, `${orb.y + 6}%`, `${orb.y}%`],
            opacity: [orb.opacity * 0.6, orb.opacity, orb.opacity * 0.8, orb.opacity * 0.6],
            scale: [0.9, 1.1, 0.95, 0.9],
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// =========================================================
// MICRO PARTICLES - Drifting ambient particles
// =========================================================
function MicroParticles({ 
  variant, 
  reducedMotion 
}: { 
  variant: SystemBackgroundVariant;
  reducedMotion: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [mounted, setMounted] = useState(false);

  // Ensure component only runs on client
  useEffect(() => {
    setMounted(true);
  }, []);

  const particleConfig = useMemo(() => ({
    count: variant === "info" ? 20 : variant === "metrics" ? 40 : 60,
    speed: variant === "process" ? 0.4 : 0.25,
    maxSize: variant === "metrics" ? 3 : 2,
    colors: [
      "rgba(0, 180, 220, 0.6)",
      "rgba(59, 130, 246, 0.5)",
      "rgba(139, 92, 246, 0.4)",
    ],
  }), [variant]);

  useEffect(() => {
    if (reducedMotion || !mounted) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Safely access window APIs
    if (typeof window === "undefined") return;

    const resizeCanvas = () => {
      try {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
      } catch {
        // Ignore resize errors
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      color: string;
      breathPhase: number;
      breathSpeed: number;
    }

    const particles: Particle[] = [];
    const rect = canvas.getBoundingClientRect();

    for (let i = 0; i < particleConfig.count; i++) {
      particles.push({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        vx: (Math.random() - 0.5) * particleConfig.speed,
        vy: (Math.random() - 0.5) * particleConfig.speed - 0.1, // Slight upward drift
        size: Math.random() * particleConfig.maxSize + 0.5,
        opacity: Math.random() * 0.5 + 0.2,
        color: particleConfig.colors[Math.floor(Math.random() * particleConfig.colors.length)],
        breathPhase: Math.random() * Math.PI * 2,
        breathSpeed: 0.01 + Math.random() * 0.02,
      });
    }

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      particles.forEach((p) => {
        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Breathing effect
        p.breathPhase += p.breathSpeed;
        const breathScale = 0.7 + Math.sin(p.breathPhase) * 0.3;

        // Wrap around edges
        if (p.x < -10) p.x = rect.width + 10;
        if (p.x > rect.width + 10) p.x = -10;
        if (p.y < -10) p.y = rect.height + 10;
        if (p.y > rect.height + 10) p.y = -10;

        // Draw particle with glow
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        gradient.addColorStop(0, p.color.replace(")", `, ${p.opacity * breathScale})`).replace("rgba", "rgba"));
        gradient.addColorStop(1, "transparent");
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * breathScale, 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace(")", `, ${p.opacity * breathScale})`).replace("rgba", "rgba");
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [variant, reducedMotion, particleConfig, mounted]);

  // Don't render until mounted (avoid SSR issues)
  if (!mounted || reducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

// =========================================================
// GRADIENT LAYERS - Multi-layer depth gradients
// =========================================================
function GradientLayers({ variant }: { variant: SystemBackgroundVariant }) {
  const gradientConfigs = useMemo(() => {
    const base = {
      // Deep navy base → blue → cyan/purple
      primary: `
        radial-gradient(ellipse 120% 80% at 20% 20%, rgba(0, 60, 120, 0.4) 0%, transparent 50%),
        radial-gradient(ellipse 100% 100% at 80% 30%, rgba(30, 64, 175, 0.3) 0%, transparent 45%),
        radial-gradient(ellipse 80% 80% at 50% 80%, rgba(139, 92, 246, 0.2) 0%, transparent 50%),
        linear-gradient(180deg, rgba(3, 7, 18, 0.95) 0%, rgba(10, 15, 30, 0.98) 50%, rgba(15, 23, 42, 1) 100%)
      `,
      secondary: `
        radial-gradient(ellipse 100% 60% at 70% 10%, rgba(6, 182, 212, 0.15) 0%, transparent 40%),
        radial-gradient(ellipse 80% 80% at 30% 90%, rgba(59, 130, 246, 0.12) 0%, transparent 45%)
      `,
    };
    
    return {
      info: base,
      metrics: {
        ...base,
        secondary: `
          radial-gradient(ellipse 80% 60% at 50% 20%, rgba(0, 180, 220, 0.2) 0%, transparent 45%),
          radial-gradient(ellipse 100% 80% at 75% 75%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
          radial-gradient(ellipse 60% 60% at 25% 60%, rgba(59, 130, 246, 0.12) 0%, transparent 40%)
        `,
      },
      process: {
        ...base,
        secondary: `
          radial-gradient(ellipse 120% 80% at 60% 20%, rgba(0, 180, 220, 0.25) 0%, transparent 50%),
          radial-gradient(ellipse 100% 100% at 20% 70%, rgba(139, 92, 246, 0.2) 0%, transparent 55%),
          radial-gradient(ellipse 80% 60% at 85% 50%, rgba(30, 64, 175, 0.18) 0%, transparent 45%)
        `,
      },
    };
  }, []);

  const config = gradientConfigs[variant];

  return (
    <>
      {/* Base gradient layer */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ background: config.primary }}
      />
      {/* Secondary gradient overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ background: config.secondary }}
      />
    </>
  );
}

// =========================================================
// LIGHT BLOOM EFFECTS - Soft glow hierarchy
// =========================================================
function LightBloom({ 
  variant, 
  reducedMotion 
}: { 
  variant: SystemBackgroundVariant;
  reducedMotion: boolean;
}) {
  const blooms = useMemo(() => {
    const configs = [];
    
    // Variant-specific bloom configurations
    if (variant === "metrics") {
      configs.push(
        { x: 50, y: 30, size: 400, color: "rgba(0, 180, 220, 0.08)", blur: 100 },
        { x: 30, y: 70, size: 300, color: "rgba(139, 92, 246, 0.06)", blur: 80 }
      );
    } else if (variant === "process") {
      configs.push(
        { x: 20, y: 25, size: 500, color: "rgba(0, 180, 220, 0.1)", blur: 120 },
        { x: 75, y: 40, size: 400, color: "rgba(59, 130, 246, 0.08)", blur: 100 },
        { x: 50, y: 80, size: 350, color: "rgba(139, 92, 246, 0.07)", blur: 90 }
      );
    } else {
      configs.push(
        { x: 40, y: 35, size: 350, color: "rgba(0, 180, 220, 0.05)", blur: 100 }
      );
    }
    
    return configs;
  }, [variant]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {blooms.map((bloom, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: bloom.size,
            height: bloom.size,
            left: `${bloom.x}%`,
            top: `${bloom.y}%`,
            background: bloom.color,
            filter: `blur(${bloom.blur}px)`,
            transform: "translate(-50%, -50%)",
          }}
          animate={reducedMotion ? undefined : {
            opacity: [0.5, 1, 0.5],
            scale: [0.95, 1.05, 0.95],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// =========================================================
// DIRECTIONAL FLOW - Data pathway effects for process variant
// =========================================================
function DirectionalFlow({ reducedMotion }: { reducedMotion: boolean }) {
  if (reducedMotion) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
      {/* Horizontal flow lines */}
      {[20, 40, 60, 80].map((y, i) => (
        <motion.div
          key={`h-${i}`}
          className="absolute h-px left-0 right-0"
          style={{
            top: `${y}%`,
            background: `linear-gradient(90deg, transparent, rgba(0, 180, 220, 0.3) 20%, rgba(59, 130, 246, 0.2) 50%, rgba(139, 92, 246, 0.3) 80%, transparent)`,
          }}
          animate={{
            opacity: [0, 0.6, 0],
            scaleX: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 6 + i,
            delay: i * 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      
      {/* Vertical flow indicators */}
      {[25, 50, 75].map((x, i) => (
        <motion.div
          key={`v-${i}`}
          className="absolute w-px top-0 bottom-0"
          style={{
            left: `${x}%`,
            background: `linear-gradient(180deg, transparent, rgba(0, 180, 220, 0.2) 30%, rgba(139, 92, 246, 0.2) 70%, transparent)`,
          }}
          animate={{
            opacity: [0, 0.4, 0],
          }}
          transition={{
            duration: 8,
            delay: i * 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// =========================================================
// NOISE TEXTURE - Subtle grain overlay
// =========================================================
function NoiseTexture() {
  return (
    <div
      className="absolute inset-0 pointer-events-none opacity-[0.02]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        mixBlendMode: "overlay",
      }}
    />
  );
}

// =========================================================
// VIGNETTE - Cinematic edge darkening
// =========================================================
function Vignette({ intensity = 0.4 }: { intensity?: number }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: `radial-gradient(ellipse at center, transparent 40%, rgba(3, 7, 18, ${intensity}) 100%)`,
      }}
    />
  );
}

// =========================================================
// MAIN COMPONENT - SystemBackground
// =========================================================
export function SystemBackground({ 
  variant = "info", 
  children, 
  className = "",
  intensity = "medium"
}: SystemBackgroundProps) {
  const ref = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = prefersReducedMotion ?? false;
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  // Parallax for gradient layers
  const gradientY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]);
  const orbY = useTransform(scrollYProgress, [0, 1], ["0%", "5%"]);

  // Intensity modifiers
  const intensityModifier = intensity === "low" ? 0.6 : intensity === "high" ? 1.2 : 1;

  return (
    <motion.section 
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      style={{
        background: "linear-gradient(180deg, #030712 0%, #0a0f1f 50%, #0f172a 100%)",
      }}
    >
      {/* Layer 1: Base gradients with parallax */}
      <motion.div 
        className="absolute inset-0"
        style={{ y: reducedMotion ? 0 : gradientY }}
      >
        <GradientLayers variant={variant} />
      </motion.div>

      {/* Layer 2: Floating orbs with parallax */}
      <motion.div 
        className="absolute inset-0"
        style={{ 
          y: reducedMotion ? 0 : orbY,
          opacity: intensityModifier,
        }}
      >
        <FloatingOrbs variant={variant} reducedMotion={reducedMotion} />
      </motion.div>

      {/* Layer 3: Light bloom effects */}
      <LightBloom variant={variant} reducedMotion={reducedMotion} />

      {/* Layer 4: Micro particles */}
      <div style={{ opacity: intensityModifier * 0.8 }}>
        <MicroParticles variant={variant} reducedMotion={reducedMotion} />
      </div>

      {/* Layer 5: Directional flow (process variant only) */}
      {variant === "process" && (
        <DirectionalFlow reducedMotion={reducedMotion} />
      )}

      {/* Layer 6: Noise texture */}
      <NoiseTexture />

      {/* Layer 7: Vignette */}
      <Vignette intensity={variant === "process" ? 0.5 : 0.35} />

      {/* Content layer */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.section>
  );
}

// =========================================================
// GLASS CARD - Premium glassmorphism card component
// =========================================================
interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "intense";
  glow?: boolean;
  glowColor?: "cyan" | "blue" | "purple";
}

export function GlassCard({
  children,
  className = "",
  variant = "default",
  glow = false,
  glowColor = "cyan",
}: GlassCardProps) {
  const variantStyles = {
    default: `
      bg-gradient-to-b from-white/[0.08] to-white/[0.03]
      backdrop-blur-xl
      border border-white/[0.1]
      shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)]
    `,
    elevated: `
      bg-gradient-to-b from-white/[0.12] to-white/[0.05]
      backdrop-blur-2xl
      border border-white/[0.15]
      shadow-[0_16px_48px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.1)]
    `,
    intense: `
      bg-gradient-to-br from-white/[0.15] via-white/[0.08] to-white/[0.05]
      backdrop-blur-3xl
      border border-white/[0.2]
      shadow-[0_24px_64px_rgba(0,0,0,0.6),inset_0_2px_0_rgba(255,255,255,0.2),0_0_100px_rgba(0,180,220,0.05)]
    `,
  };

  const glowStyles = {
    cyan: "shadow-[0_0_30px_rgba(0,180,220,0.15)]",
    blue: "shadow-[0_0_30px_rgba(59,130,246,0.15)]",
    purple: "shadow-[0_0_30px_rgba(139,92,246,0.15)]",
  };

  return (
    <div 
      className={`
        rounded-2xl
        ${variantStyles[variant]}
        ${glow ? glowStyles[glowColor] : ""}
        transition-all duration-300
        hover:border-white/[0.2]
        hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// =========================================================
// SECTION GLOW - Radial glow behind content
// =========================================================
interface SectionGlowProps {
  color?: "cyan" | "blue" | "purple" | "mixed";
  intensity?: "low" | "medium" | "high";
  position?: "center" | "top" | "bottom";
  className?: string;
}

export function SectionGlow({
  color = "cyan",
  intensity = "medium",
  position = "center",
  className = "",
}: SectionGlowProps) {
  const colorStyles = {
    cyan: "rgba(0, 180, 220, 0.15)",
    blue: "rgba(59, 130, 246, 0.12)",
    purple: "rgba(139, 92, 246, 0.12)",
    mixed: "rgba(0, 180, 220, 0.1)",
  };

  const intensityScale = intensity === "low" ? 0.6 : intensity === "high" ? 1.4 : 1;
  const positionStyles = {
    center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
    top: "top-0 left-1/2 -translate-x-1/2",
    bottom: "bottom-0 left-1/2 -translate-x-1/2",
  };

  return (
    <div 
      className={`absolute pointer-events-none ${positionStyles[position]} ${className}`}
      style={{
        width: 600 * intensityScale,
        height: 400 * intensityScale,
        background: `radial-gradient(ellipse, ${colorStyles[color]}, transparent 70%)`,
        filter: "blur(60px)",
      }}
    />
  );
}

export default SystemBackground;
