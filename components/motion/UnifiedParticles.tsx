'use client';

import { useRef, useEffect, memo } from 'react';
import { useReducedMotion } from 'framer-motion';

type ParticlePreset = 'constellation' | 'breathing' | 'drift';

interface UnifiedParticlesProps {
  /** Visual preset */
  preset?: ParticlePreset;
  /** Number of particles (default depends on preset) */
  count?: number;
  /** Base color as RGB string e.g. '0,180,220' */
  color?: string;
  /** Secondary color for mixed effects */
  secondaryColor?: string;
  /** Draw connection lines between nearby particles (constellation only) */
  connections?: boolean;
  /** Max connection distance in px (default: 120) */
  connectionDistance?: number;
  /** Opacity multiplier 0-1 (default: 1) */
  opacity?: number;
  /** FPS cap for animation loop (default: 30) */
  fpsCap?: number;
  className?: string;
}

const PRESET_DEFAULTS: Record<ParticlePreset, { count: number; speed: number; sizeRange: [number, number] }> = {
  constellation: { count: 50, speed: 0.3, sizeRange: [1.2, 3.2] },
  breathing: { count: 30, speed: 0.15, sizeRange: [1, 2.5] },
  drift: { count: 40, speed: 0.2, sizeRange: [0.8, 2] },
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  phase: number; // for breathing effect
}

function UnifiedParticlesInner({
  preset = 'constellation',
  count,
  color = '0,180,220',
  secondaryColor,
  connections = false,
  connectionDistance = 120,
  opacity = 1,
  fpsCap = 30,
  className = '',
}: UnifiedParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const isVisibleRef = useRef<boolean>(true);

  const defaults = PRESET_DEFAULTS[preset];
  const particleCount = count ?? defaults.count;

  useEffect(() => {
    if (shouldReduceMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();

    // Initialize particles
    const rect = canvas.getBoundingClientRect();
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * rect.width,
      y: Math.random() * rect.height,
      vx: (Math.random() - 0.5) * defaults.speed * 2,
      vy: (Math.random() - 0.5) * defaults.speed * 2,
      size: defaults.sizeRange[0] + Math.random() * (defaults.sizeRange[1] - defaults.sizeRange[0]),
      opacity: 0.15 + Math.random() * 0.35,
      phase: Math.random() * Math.PI * 2,
    }));

    const FPS_INTERVAL = 1000 / fpsCap;

    const animate = (timestamp: number) => {
      // Pause when off-screen
      if (!isVisibleRef.current) {
        rafRef.current = 0;
        return;
      }

      const elapsed = timestamp - lastFrameRef.current;
      if (elapsed < FPS_INTERVAL) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrameRef.current = timestamp;

      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      const particles = particlesRef.current;

      for (const p of particles) {
        // Update position
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        // Breathing effect
        let alpha = p.opacity * opacity;
        if (preset === 'breathing') {
          p.phase += 0.02;
          alpha *= 0.5 + 0.5 * Math.sin(p.phase);
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color},${alpha})`;
        ctx.fill();

        // Draw secondary color particle (smaller, offset)
        if (secondaryColor && Math.random() > 0.7) {
          ctx.beginPath();
          ctx.arc(p.x + 2, p.y + 2, p.size * 0.6, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${secondaryColor},${alpha * 0.5})`;
          ctx.fill();
        }
      }

      // Connection lines
      if (connections) {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < connectionDistance) {
              const lineAlpha = (1 - dist / connectionDistance) * 0.15 * opacity;
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.strokeStyle = `rgba(${color},${lineAlpha})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    // Off-screen detection: pause animation when canvas is not visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
        // Resume the loop when becoming visible again
        if (entry.isIntersecting && rafRef.current === 0) {
          lastFrameRef.current = 0;
          rafRef.current = requestAnimationFrame(animate);
        }
      },
      { threshold: 0 }
    );
    observer.observe(canvas);

    rafRef.current = requestAnimationFrame(animate);

    const handleResize = () => resize();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [shouldReduceMotion, particleCount, color, secondaryColor, connections, connectionDistance, opacity, preset, defaults, fpsCap]);

  if (shouldReduceMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
}

export const UnifiedParticles = memo(UnifiedParticlesInner);
export default UnifiedParticles;
