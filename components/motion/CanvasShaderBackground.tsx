'use client';

import { useEffect, useRef, memo } from 'react';

/**
 * CanvasShaderBackground
 * ──────────────────────
 * Full-screen fixed canvas background providing:
 * - Aurora sine-wave bands (cyan, blue, purple)
 * - Data stream vertical dot lines
 * - Radial center bloom
 * - Scroll-reactive parallax via --mk-scroll-depth CSS var
 * - 30fps cap, pauses on reduced-motion / mobile / document hidden
 */

interface DataStreamLine {
  x: number;
  dots: { y: number; size: number; opacity: number; spacing: number }[];
  speed: number;
}

function buildStreamLines(w: number, h: number): DataStreamLine[] {
  const lines: DataStreamLine[] = [];
  for (let i = 0; i < 15; i++) {
    const x = Math.random() * w;
    const speed = 0.3 + Math.random() * 0.5;
    const dotCount = Math.ceil(h / 30) + 2;
    const dots = Array.from({ length: dotCount }, (_, j) => ({
      y: j * (20 + Math.random() * 20),
      size: 1 + Math.random(),
      opacity: 0.03 + Math.random() * 0.05,
      spacing: 20 + Math.random() * 20,
    }));
    lines.push({ x, dots, speed });
  }
  return lines;
}

function CanvasShaderBackgroundInner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const linesRef = useRef<DataStreamLine[]>([]);
  const timeRef = useRef<number>(0);
  const pausedRef = useRef<boolean>(false);

  useEffect(() => {
    // Respect prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    // Pause on mobile
    if (window.innerWidth < 768) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      linesRef.current = buildStreamLines(canvas.width, canvas.height);
    };

    setSize();

    const onResize = () => {
      setSize();
    };
    window.addEventListener('resize', onResize);

    const onVisChange = () => { pausedRef.current = document.hidden; };
    document.addEventListener('visibilitychange', onVisChange);

    const draw = (timestamp: number) => {
      if (pausedRef.current) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      // 30fps cap (~33ms)
      if (timestamp - lastFrameRef.current < 33) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      lastFrameRef.current = timestamp;
      timeRef.current += 0.016;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      const t = timeRef.current;

      // Read scroll depth for parallax
      const scrollDepthStr = getComputedStyle(document.documentElement).getPropertyValue('--mk-scroll-depth').trim();
      const scrollDepth = parseFloat(scrollDepthStr) || 0;
      const parallax = scrollDepth * 0.04;

      // ── Base fill
      ctx.fillStyle = '#050a14';
      ctx.fillRect(0, 0, w, h);

      // ── Aurora bands
      const bands = [
        { pos: 0.20, color: '6,182,212', opacity: 0.06, wl: 200, speed: 0.2 },
        { pos: 0.50, color: '59,130,246', opacity: 0.04, wl: 300, speed: 0.15 },
        { pos: 0.80, color: '168,85,247', opacity: 0.03, wl: 400, speed: 0.1 },
      ];

      for (const band of bands) {
        const baseY = band.pos * h + parallax * (band.pos - 0.5) * 2;
        const amplitude = 18;
        const freq = (Math.PI * 2) / (band.wl * 2);
        const phase = t * band.speed * 0.5;

        ctx.beginPath();
        for (let x = 0; x <= w; x += 4) {
          const offsetY = Math.sin(x * freq + phase) * amplitude;
          const y = baseY + offsetY;
          if (x === 0) ctx.moveTo(x, y - 60);
          else ctx.lineTo(x, y - 60);
        }
        for (let x = w; x >= 0; x -= 4) {
          const offsetY = Math.sin(x * freq + phase) * amplitude;
          const y = baseY + offsetY;
          ctx.lineTo(x, y + 60);
        }
        ctx.closePath();
        ctx.fillStyle = `rgba(${band.color},${band.opacity})`;
        ctx.fill();
      }

      // ── Data stream lines
      for (const line of linesRef.current) {
        for (const dot of line.dots) {
          dot.y += line.speed;
          if (dot.y > h + dot.spacing) {
            dot.y = -dot.spacing;
          }
          ctx.beginPath();
          ctx.arc(line.x, dot.y, dot.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(6,182,212,${dot.opacity})`;
          ctx.fill();
        }
      }

      // ── Radial center bloom
      const bloomY = h * 0.35 + parallax * 0.1;
      const grd = ctx.createRadialGradient(w * 0.5, bloomY, 0, w * 0.5, bloomY, Math.min(w, h) * 0.45);
      grd.addColorStop(0, 'rgba(6,182,212,0.05)');
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{ display: 'block' }}
    />
  );
}

export const CanvasShaderBackground = memo(CanvasShaderBackgroundInner);
export default CanvasShaderBackground;
