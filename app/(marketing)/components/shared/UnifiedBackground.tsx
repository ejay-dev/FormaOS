'use client';

import { motion } from 'framer-motion';
import { useRef, useEffect } from 'react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';

// ============================================
// UNIFIED BACKGROUND SYSTEM
// ============================================
// Consistent design system across all public pages:
// - Glassmorphism
// - Particle/dust motion
// - Subtle gradient fields
// - No flat empty sections

// Dust Particle Field - subtle ambient motion
export function DustParticleField({
  intensity = 1,
  color = 'cyan',
}: {
  intensity?: number;
  color?: 'cyan' | 'purple' | 'blue' | 'green';
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const colorMap = {
    cyan: { r: 6, g: 182, b: 212 },
    purple: { r: 168, g: 85, b: 247 },
    blue: { r: 59, g: 130, b: 246 },
    green: { r: 16, g: 185, b: 129 },
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const { r, g, b } = colorMap[color];
    const particles = Array.from(
      { length: Math.floor(150 * intensity) },
      () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        z: Math.random() * 1,
        speed: Math.random() * 0.15 + 0.03,
      }),
    );

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.y += p.speed * (1 + p.z * 2);
        if (p.y > canvas.height) {
          p.y = 0;
          p.x = Math.random() * canvas.width;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, 1 + p.z * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${0.1 + p.z * 0.2})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, [color, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}

// Gradient Orb Animation - premium background effect
export function GradientOrbs({
  variant = 'default',
}: {
  variant?: 'default' | 'security' | 'pricing' | 'industries' | 'product';
}) {
  const gradientConfig = {
    default: {
      primary: 'from-cyan-500/15 via-blue-500/10',
      secondary: 'from-purple-500/15 via-pink-500/10',
    },
    security: {
      primary: 'from-blue-500/15 via-cyan-500/10',
      secondary: 'from-green-500/12 via-emerald-500/8',
    },
    pricing: {
      primary: 'from-purple-500/12 via-violet-500/10',
      secondary: 'from-cyan-500/12 via-blue-500/8',
    },
    industries: {
      primary: 'from-cyan-500/12 via-teal-500/10',
      secondary: 'from-blue-500/10 via-purple-500/8',
    },
    product: {
      primary: 'from-cyan-500/15 via-blue-500/12',
      secondary: 'from-purple-500/12 via-blue-500/8',
    },
  };

  const config = gradientConfig[variant];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Primary gradient orb - top left */}
      <motion.div
        className={`absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br ${config.primary} to-transparent rounded-full blur-3xl`}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.4, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Secondary gradient orb - bottom right */}
      <motion.div
        className={`absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-gradient-to-tl ${config.secondary} to-transparent rounded-full blur-3xl`}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
      />
      {/* Center ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-radial from-cyan-500/5 to-transparent rounded-full" />
    </div>
  );
}

// Grid Pattern Overlay - REMOVED (deprecated dot grid pattern)
// export function GridPattern({ opacity = 0.3 }: { opacity?: number }) {
//   return (
//     <div
//       className="absolute inset-0 pointer-events-none"
//       style={{
//         opacity,
//         backgroundImage:
//           'radial-gradient(circle at 1px 1px, rgba(6, 182, 212, 0.15) 1px, transparent 0)',
//         backgroundSize: '40px 40px',
//       }}
//     />
//   );
// }

// Unified Page Background - combines all effects
export function UnifiedPageBackground({
  variant = 'default',
  showParticles = true,
  showOrbs = true,
  showGrid = true,
  particleColor = 'cyan' as const,
}: {
  variant?: 'default' | 'security' | 'pricing' | 'industries' | 'product';
  showParticles?: boolean;
  showOrbs?: boolean;
  showGrid?: boolean;
  particleColor?: 'cyan' | 'purple' | 'blue' | 'green';
}) {
  return (
    <>
      {/* Base gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1421] to-[#0a0f1c]" />

      {/* Gradient orbs */}
      {showOrbs && (
        <div className="fixed inset-0 z-0">
          <GradientOrbs variant={variant} />
        </div>
      )}

      {/* Particle field */}
      {showParticles && (
        <div className="fixed inset-0 z-1 opacity-40">
          <DustParticleField intensity={0.8} color={particleColor} />
        </div>
      )}

    </>
  );
}

// Glassmorphism Card - consistent card styling
export function GlassCard({
  children,
  className = '',
  hover = true,
  glow = false,
  glowColor = 'cyan',
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  glowColor?: 'cyan' | 'purple' | 'blue' | 'green';
}) {
  const glowColors = {
    cyan: 'hover:border-cyan-500/30 hover:shadow-cyan-500/10',
    purple: 'hover:border-purple-500/30 hover:shadow-purple-500/10',
    blue: 'hover:border-blue-500/30 hover:shadow-blue-500/10',
    green: 'hover:border-green-500/30 hover:shadow-green-500/10',
  };

  return (
    <motion.div
      whileHover={hover ? { y: -5, scale: 1.02 } : undefined}
      className={`
        relative p-6 sm:p-8 rounded-2xl 
        bg-gradient-to-br from-gray-900/60 to-gray-950/60 
        backdrop-blur-xl border border-white/5 
        ${hover ? `transition-all duration-300 ${glowColors[glowColor]}` : ''}
        ${glow ? 'shadow-lg shadow-black/20' : ''}
        ${className}
      `}
    >
      {/* Inner glow edge */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
      </div>
      {children}
    </motion.div>
  );
}

// Section Container with unified styling
export function UnifiedSection({
  children,
  className = '',
  showBackground = true,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  showBackground?: boolean;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`relative py-24 sm:py-32 overflow-hidden ${className}`}
    >
      {showBackground && (
        <>
          {/* Animated ambient orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl"
              animate={{
                x: [0, 30, 0],
                y: [0, 20, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-blue-500/5 blur-3xl"
              animate={{
                x: [0, -30, 0],
                y: [0, -20, 0],
                scale: [1, 1.15, 1],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1,
              }}
            />
          </div>
        </>
      )}
      <div className="relative z-10">{children}</div>
    </section>
  );
}

// Premium Badge Component
export function PremiumBadge({
  children,
  icon,
  color = 'cyan',
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  color?: 'cyan' | 'purple' | 'blue' | 'green' | 'emerald';
}) {
  const colorStyles = {
    cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    green: 'bg-green-500/10 border-green-500/20 text-green-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  };

  return (
    <ScrollReveal variant="scaleUp" range={[0, 0.3]}>
      <div
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${colorStyles[color]}`}
      >
        {icon && (
          <span className="w-2 h-2 rounded-full bg-current" />
        )}
        {children}
      </div>
    </ScrollReveal>
  );
}

// Hero Section Pattern - consistent hero styling
export function HeroBackground() {
  return (
    <>
      {/* Premium Background Effects - Cinematic Gradient Layers */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary gradient orb - top left */}
        <motion.div
          className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-gradient-to-br from-cyan-500/15 via-blue-500/10 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Secondary gradient orb - bottom right */}
        <motion.div
          className="absolute -bottom-40 -right-40 w-[700px] h-[700px] bg-gradient-to-tl from-purple-500/15 via-pink-500/10 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
        {/* Tertiary accent - center glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-radial from-cyan-500/5 to-transparent rounded-full" />
      </div>

      {/* Particle field */}
      <div className="absolute inset-0 z-1 opacity-40">
        <DustParticleField intensity={1} color="cyan" />
      </div>
    </>
  );
}
