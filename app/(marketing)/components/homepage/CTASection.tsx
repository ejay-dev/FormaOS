'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { duration } from '@/config/motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { useRef, useEffect, useState } from 'react';
import { ArrowRight, Sparkles, CheckCircle } from 'lucide-react';
import { brand } from '@/config/brand';
import { AmbientParticleLayer } from '@/components/motion/AmbientParticleLayer';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

/* ── Convergence canvas: proof particles assembling into a shield ── */
function ProofConvergenceCanvas({ isInView }: { isInView: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || shouldReduceMotion || !isInView) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = 800 * dpr;
    canvas.height = 600 * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas.style.width = '800px';
    canvas.style.height = '600px';

    let time = 0;
    let animId: number;

    const particles = Array.from({ length: 30 }, (_, i) => ({
      x: 80 + Math.random() * 640,
      y: 80 + Math.random() * 440,
      targetX: 400,
      targetY: 300,
      speed: 0.4 + Math.random() * 0.8,
      size: 1.5 + Math.random() * 2.5,
      opacity: 0.3 + Math.random() * 0.4,
      verified: false,
      verifyTime: 150 + i * 60,
      angle: (Math.PI * 2 * i) / 30,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, 800, 600);

      // Radial depth layers
      const bg1 = ctx.createRadialGradient(400, 300, 0, 400, 300, 350);
      bg1.addColorStop(0, 'rgba(6, 182, 212, 0.06)');
      bg1.addColorStop(0.5, 'rgba(59, 130, 246, 0.03)');
      bg1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bg1;
      ctx.fillRect(0, 0, 800, 600);

      // Rotating scan line
      const sweepAngle = (time * 0.0015) % (Math.PI * 2);
      ctx.save();
      ctx.translate(400, 300);
      ctx.rotate(sweepAngle);
      const sweepGrad = ctx.createLinearGradient(0, 0, 300, 0);
      sweepGrad.addColorStop(0, 'rgba(6, 182, 212, 0.12)');
      sweepGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = sweepGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 280, -0.08, 0.08);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Concentric rings
      [100, 180, 260].forEach((radius, i) => {
        ctx.strokeStyle = `rgba(148, 163, 184, ${0.04 + i * 0.01})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(400, 300, radius, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Particles converging
      particles.forEach((p, pi) => {
        const convergeFactor = Math.min(time / 2500, 1);
        const orbitRadius = 200 * (1 - convergeFactor * 0.7);
        const orbitAngle = p.angle + time * 0.0005;

        const targetX = 400 + Math.cos(orbitAngle) * orbitRadius * (1 - convergeFactor * 0.5);
        const targetY = 300 + Math.sin(orbitAngle) * orbitRadius * (1 - convergeFactor * 0.5);

        p.x += (targetX - p.x) * 0.02 * p.speed;
        p.y += (targetY - p.y) * 0.02 * p.speed;

        const dist = Math.sqrt(Math.pow(p.x - 400, 2) + Math.pow(p.y - 300, 2));

        if (time > p.verifyTime && dist < 120) {
          p.verified = true;
        }

        const pg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        if (p.verified) {
          pg.addColorStop(0, `rgba(16, 185, 129, ${p.opacity})`);
          pg.addColorStop(1, 'rgba(16, 185, 129, 0)');
        } else {
          pg.addColorStop(0, `rgba(6, 182, 212, ${p.opacity * 0.7})`);
          pg.addColorStop(1, 'rgba(6, 182, 212, 0)');
        }

        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx.fill();

        // Connection lines to nearby particles
        particles.slice(pi + 1).forEach((p2) => {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 100) {
            ctx.strokeStyle = `rgba(148, 163, 184, ${(1 - d / 100) * 0.08})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });

        if (p.verified) {
          const pulse = p.size * (2 + Math.sin(time * 0.008 + pi * 0.3));
          ctx.strokeStyle = `rgba(16, 185, 129, ${0.15})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, pulse, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      // Center shield icon
      const centerAlpha = Math.min(time / 2000, 1) * 0.5 + Math.sin(time * 0.003) * 0.1;
      const cg = ctx.createRadialGradient(400, 300, 0, 400, 300, 35);
      cg.addColorStop(0, `rgba(6, 182, 212, ${centerAlpha})`);
      cg.addColorStop(0.6, `rgba(59, 130, 246, ${centerAlpha * 0.5})`);
      cg.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(400, 300, 30, 0, Math.PI * 2);
      ctx.fill();

      // Checkmark
      ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(time / 3000, 0.9)})`;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(391, 300);
      ctx.lineTo(397, 306);
      ctx.lineTo(409, 293);
      ctx.stroke();

      time += 16;
      animId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animId);
  }, [isInView, shouldReduceMotion]);

  if (shouldReduceMotion) return null;

  return <canvas ref={canvasRef} className="opacity-50" />;
}

export function CTASection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isInView, setIsInView] = useState(false);
  const [allowHeavyEffects, setAllowHeavyEffects] = useState(false);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.85, 1, 0.85]);

  useEffect(() => {
    const target = containerRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { rootMargin: '300px 0px' },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const update = () => setAllowHeavyEffects(window.innerWidth >= 1024);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden"
      style={{ position: 'relative' }}
    >
      {/* CTA section treatment: full-bleed gradient with cinematic depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#060a14] via-[#0a1628] to-[#060a14]" />

      {/* Cinematic gradient layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.08] via-transparent to-purple-500/[0.06]" />
      <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/[0.06] via-transparent to-transparent" />

      {/* Edge vignette for full-bleed depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.4)_100%)]" />

      <AmbientParticleLayer intensity="strong" />

      {/* Canvas proof visualization */}
      {allowHeavyEffects && isInView && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <ProofConvergenceCanvas isInView={isInView} />
        </div>
      )}

      <div className="relative z-10 py-24 sm:py-32 lg:py-40 max-w-4xl mx-auto px-6 lg:px-12 text-center">
        <motion.div
          style={shouldReduceMotion ? undefined : { scale }}
        >
          <ScrollReveal variant="scaleUp" range={[0, 0.25]}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-8">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-400 font-medium">
                Start Your Free Trial
              </span>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="blurIn" range={[0, 0.3]}>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Install the{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                Operating System
              </span>
              <br />
              <span className="bg-gradient-to-r from-green-400 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
                Your Compliance Deserves
              </span>
            </h2>
          </ScrollReveal>

          <ScrollReveal variant="fadeUp" range={[0.02, 0.32]}>
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Stop managing compliance manually. FormaOS enforces controls,
              captures evidence, and keeps you audit-ready. Every single day.
            </p>
          </ScrollReveal>

          <ScrollReveal variant="slideUp" range={[0.04, 0.34]}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.a
                href={`${appBase}/auth/signup?plan=pro`}
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : {
                        scale: 1.03,
                        boxShadow:
                          '0 0 40px rgba(6, 182, 212, 0.8), inset 0 0 20px rgba(255, 255, 255, 0.1)',
                      }
                }
                whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                className="mk-btn mk-btn-primary px-8 py-4 text-lg"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </motion.a>

              <motion.a
                href="/contact"
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : {
                        scale: 1.03,
                        boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)',
                      }
                }
                whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                className="mk-btn mk-btn-secondary px-8 py-4 text-lg"
              >
                Schedule Demo
              </motion.a>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="fadeUp" range={[0.06, 0.36]}>
            <p className="text-sm text-gray-500 mt-8">
              No credit card required &bull; 14-day free trial &bull; Cancel anytime
            </p>
          </ScrollReveal>

          {/* Trust proof badges: monochrome, high-contrast */}
          <ScrollReveal variant="fadeUp" range={[0.08, 0.38]} className="mt-16 pt-8 border-t border-white/[0.06]">
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              {[
                { label: 'SOC 2-aligned', detail: 'Trust framework' },
                { label: 'Audit-ready', detail: 'Evidence workflows' },
                { label: 'Traceable', detail: 'Evidence records' },
                { label: 'Priority', detail: 'Support coverage' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400/70 flex-shrink-0" />
                  <div className="text-left">
                    <div className="text-sm font-semibold text-white">{stat.label}</div>
                    <div className="text-[11px] text-gray-500">{stat.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </motion.div>
      </div>
    </section>
  );
}
