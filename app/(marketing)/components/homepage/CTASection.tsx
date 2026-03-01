'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { duration } from '@/config/motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { useRef, useEffect, useState } from 'react';
import { ArrowRight, Sparkles, CheckCircle } from 'lucide-react';
import { brand } from '@/config/brand';
import { AmbientParticleLayer } from '@/components/motion/AmbientParticleLayer';
import { useControlPlaneRuntime } from '@/lib/control-plane/runtime-client';
import { DEFAULT_RUNTIME_MARKETING } from '@/lib/control-plane/defaults';
import { useDeviceTier } from '@/lib/device-tier';

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
    // Size canvas responsively
    const canvasW = Math.min(800, window.innerWidth * 0.9);
    const canvasH = canvasW * 0.75;
    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas.style.width = `${canvasW}px`;
    canvas.style.height = `${canvasH}px`;

    const cx = canvasW / 2;
    const cy = canvasH / 2;
    const scale = canvasW / 800; // scale factor relative to original 800px design

    let time = 0;
    let animId: number;

    const particles = Array.from({ length: 30 }, (_, i) => ({
      x: 80 * scale + Math.random() * 640 * scale,
      y: 80 * scale + Math.random() * 440 * scale,
      targetX: cx,
      targetY: cy,
      speed: 0.4 + Math.random() * 0.8,
      size: (1.5 + Math.random() * 2.5) * scale,
      opacity: 0.3 + Math.random() * 0.4,
      verified: false,
      verifyTime: 150 + i * 60,
      angle: (Math.PI * 2 * i) / 30,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvasW, canvasH);

      // Radial depth layers
      const bg1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, 350 * scale);
      bg1.addColorStop(0, 'rgba(20, 184, 166, 0.06)');
      bg1.addColorStop(0.5, 'rgba(52, 211, 153, 0.03)');
      bg1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bg1;
      ctx.fillRect(0, 0, canvasW, canvasH);

      // Rotating scan line
      const sweepAngle = (time * 0.0015) % (Math.PI * 2);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(sweepAngle);
      const sweepGrad = ctx.createLinearGradient(0, 0, 300 * scale, 0);
      sweepGrad.addColorStop(0, 'rgba(20, 184, 166, 0.12)');
      sweepGrad.addColorStop(1, 'rgba(20, 184, 166, 0)');
      ctx.fillStyle = sweepGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 280 * scale, -0.08, 0.08);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Concentric rings
      [100, 180, 260].forEach((radius, i) => {
        ctx.strokeStyle = `rgba(148, 163, 184, ${0.04 + i * 0.01})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * scale, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Particles converging
      particles.forEach((p, pi) => {
        const convergeFactor = Math.min(time / 2500, 1);
        const orbitRadius = 200 * scale * (1 - convergeFactor * 0.7);
        const orbitAngle = p.angle + time * 0.0005;

        const targetX = cx + Math.cos(orbitAngle) * orbitRadius * (1 - convergeFactor * 0.5);
        const targetY = cy + Math.sin(orbitAngle) * orbitRadius * (1 - convergeFactor * 0.5);

        p.x += (targetX - p.x) * 0.02 * p.speed;
        p.y += (targetY - p.y) * 0.02 * p.speed;

        const dist = Math.sqrt(Math.pow(p.x - cx, 2) + Math.pow(p.y - cy, 2));

        if (time > p.verifyTime && dist < 120 * scale) {
          p.verified = true;
        }

        const pg = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        if (p.verified) {
          pg.addColorStop(0, `rgba(16, 185, 129, ${p.opacity})`);
          pg.addColorStop(1, 'rgba(16, 185, 129, 0)');
        } else {
          pg.addColorStop(0, `rgba(20, 184, 166, ${p.opacity * 0.7})`);
          pg.addColorStop(1, 'rgba(20, 184, 166, 0)');
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
          if (d < 100 * scale) {
            ctx.strokeStyle = `rgba(148, 163, 184, ${(1 - d / (100 * scale)) * 0.08})`;
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
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 35 * scale);
      cg.addColorStop(0, `rgba(20, 184, 166, ${centerAlpha})`);
      cg.addColorStop(0.6, `rgba(52, 211, 153, ${centerAlpha * 0.5})`);
      cg.addColorStop(1, 'rgba(20, 184, 166, 0)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(cx, cy, 30 * scale, 0, Math.PI * 2);
      ctx.fill();

      // Checkmark
      ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(time / 3000, 0.9)})`;
      ctx.lineWidth = 2.5 * scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - 9 * scale, cy);
      ctx.lineTo(cx - 3 * scale, cy + 6 * scale);
      ctx.lineTo(cx + 9 * scale, cy - 7 * scale);
      ctx.stroke();

      time += 16;
      animId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(animId);
  }, [isInView, shouldReduceMotion]);

  if (shouldReduceMotion) return null;

  return <canvas ref={canvasRef} className="opacity-50 max-w-full" />;
}

export function CTASection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isInView, setIsInView] = useState(false);
  const tierConfig = useDeviceTier();
  const { snapshot } = useControlPlaneRuntime();
  const runtime = snapshot?.marketing.runtime ?? DEFAULT_RUNTIME_MARKETING.runtime;
  const expensiveEffectsEnabled = runtime.expensiveEffectsEnabled;
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

  // Allow heavy effects on all tiers (not just >=1024px), gated by tier + expensive flag
  const allowHeavyEffects = tierConfig.tier !== 'low' && expensiveEffectsEnabled;

  return (
    <section
      ref={containerRef}
      className="home-section home-section--cta relative overflow-hidden"
      style={{ position: 'relative' }}
    >
      {/* CTA section treatment: full-bleed gradient with cinematic depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#060a14] via-[#0a1628] to-[#060a14]" />

      {/* Cinematic gradient layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/[0.08] via-transparent to-amber-500/[0.04]" />
      <div className="absolute inset-0 bg-gradient-to-tl from-emerald-500/[0.04] via-transparent to-transparent" />

      {/* Edge vignette for full-bleed depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.4)_100%)]" />

      {expensiveEffectsEnabled ? <AmbientParticleLayer intensity="strong" /> : null}

      {/* Canvas proof visualization — tier-gated */}
      {allowHeavyEffects && isInView && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <ProofConvergenceCanvas isInView={isInView} />
        </div>
      )}

      <div className="relative z-10 py-20 sm:py-28 lg:py-40 max-w-4xl mx-auto px-5 sm:px-6 lg:px-12 text-center">
        <motion.div
          style={shouldReduceMotion ? undefined : { scale }}
        >
          <ScrollReveal variant="scaleUp" range={[0, 0.25]}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 mb-6 sm:mb-8">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span className="text-sm text-teal-400 font-medium">
                Start Your Free Trial
              </span>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="blurIn" range={[0, 0.3]}>
            <h2 className="text-[2rem] sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-5 sm:mb-6 leading-tight">
              Install the{' '}
              <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 bg-clip-text text-transparent">
                Operating System
              </span>
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-500 bg-clip-text text-transparent">
                Your Compliance Deserves
              </span>
            </h2>
          </ScrollReveal>

          <ScrollReveal variant="fadeUp" range={[0.02, 0.32]}>
            <p className="text-base sm:text-lg md:text-xl text-gray-400 mb-10 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
              Regulators don't accept "we were working on it." FormaOS enforces controls, captures evidence automatically, and keeps your organization audit-ready — every day, not just before the audit.
            </p>
          </ScrollReveal>

          <ScrollReveal variant="slideUp" range={[0.04, 0.34]}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto">
              <motion.a
                href={`${appBase}/auth/signup?plan=pro`}
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : {
                        scale: 1.03,
                        boxShadow:
                          '0 0 40px rgba(20, 184, 166, 0.8), inset 0 0 20px rgba(255, 255, 255, 0.1)',
                      }
                }
                whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                className="mk-btn mk-btn-primary px-8 py-4 min-h-[48px] text-base sm:text-lg w-full sm:w-auto justify-center"
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
                        boxShadow: '0 0 20px rgba(20, 184, 166, 0.3)',
                      }
                }
                whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                className="mk-btn mk-btn-secondary px-8 py-4 min-h-[48px] text-base sm:text-lg w-full sm:w-auto justify-center"
              >
                Schedule Demo
              </motion.a>
            </div>
          </ScrollReveal>

          <ScrollReveal variant="fadeUp" range={[0.06, 0.36]}>
            <p className="text-sm text-gray-500 mt-6 sm:mt-8">
              No credit card required &bull; 14-day free trial &bull; Security review packet included &bull; Cancel anytime
            </p>
          </ScrollReveal>

          {/* Trust proof badges */}
          <ScrollReveal variant="fadeUp" range={[0.08, 0.38]} className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-white/[0.06]">
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              {[
                { label: 'SOC 2-aligned', detail: 'Trust framework' },
                { label: 'Audit-ready', detail: 'Continuous posture' },
                { label: 'Data sovereign', detail: 'AU / US / EU residency' },
                { label: 'Enterprise SSO', detail: 'SAML 2.0 + MFA' },
                { label: 'Full data export', detail: 'No lock-in on exit' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="home-panel home-panel--soft flex items-center gap-2.5 px-3 sm:px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]"
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
