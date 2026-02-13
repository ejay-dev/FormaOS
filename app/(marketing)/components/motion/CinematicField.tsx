'use client';

import { useRef, useEffect } from 'react';

export default function CinematicField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Respect prefers-reduced-motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches) return;

    let animationId: number;
    let isVisible = true;
    let lastFrameTs = 0;
    const frameIntervalMs = 1000 / 30;
    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;

    const resizeCanvas = () => {
      viewportWidth = window.innerWidth;
      viewportHeight = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(viewportWidth * dpr);
      canvas.height = Math.floor(viewportHeight * dpr);
      canvas.style.width = `${viewportWidth}px`;
      canvas.style.height = `${viewportHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Reduced particle count for better performance (was 200)
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      z: Math.random(),
      speed: Math.random() * 0.2 + 0.05,
    }));

    const animate = (ts: number) => {
      if (!isVisible) {
        animationId = requestAnimationFrame(animate);
        return;
      }

      if (ts - lastFrameTs < frameIntervalMs) {
        animationId = requestAnimationFrame(animate);
        return;
      }
      lastFrameTs = ts;

      ctx.clearRect(0, 0, viewportWidth, viewportHeight);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y += p.speed * (1 + p.z * 2);
        if (p.y > canvas.height) {
          p.y = 0;
          p.x = Math.random() * canvas.width;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.2 + p.z * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(6,182,212,${0.15 + p.z * 0.3})`;
        ctx.fill();
      }

      animationId = requestAnimationFrame(animate);
    };

    // Pause when tab is not visible
    const handleVisibility = () => {
      isVisible = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibility);

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}
