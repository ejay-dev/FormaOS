'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useEffect } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

export function CTASection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctaButtonRef = useRef<HTMLAnchorElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);
  const glow = useTransform(scrollYProgress, [0, 1], [0.2, 0.6]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateSize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = 800 * dpr;
      canvas.height = 600 * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = '800px';
      canvas.style.height = '600px';
    };
    updateSize();

    let time = 0;
    let animId: number;

    const proofParticles = Array.from({ length: 25 }, (_, i) => ({
      x: 100 + Math.random() * 600,
      y: 100 + Math.random() * 400,
      targetX: 400,
      targetY: 300,
      speed: 0.5 + Math.random() * 1,
      size: 1 + Math.random() * 3,
      opacity: 0.3 + Math.random() * 0.4,
      verified: false,
      verifyTime: 200 + i * 80,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, 800, 600);

      const bgGradient1 = ctx.createRadialGradient(400, 300, 0, 400, 300, 400);
      bgGradient1.addColorStop(0, 'rgba(6, 182, 212, 0.05)');
      bgGradient1.addColorStop(0.5, 'rgba(59, 130, 246, 0.03)');
      bgGradient1.addColorStop(1, 'rgba(147, 51, 234, 0.02)');
      ctx.fillStyle = bgGradient1;
      ctx.fillRect(0, 0, 800, 600);

      const sweepAngle = (time * 0.002) % (Math.PI * 2);
      const sweepGradient = ctx.createLinearGradient(
        400 + Math.cos(sweepAngle) * 300,
        300 + Math.sin(sweepAngle) * 300,
        400 + Math.cos(sweepAngle + Math.PI) * 300,
        300 + Math.sin(sweepAngle + Math.PI) * 300,
      );
      sweepGradient.addColorStop(0, 'rgba(6, 182, 212, 0)');
      sweepGradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.08)');
      sweepGradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = sweepGradient;
      ctx.fillRect(0, 0, 800, 600);

      for (let i = 0; i < 8; i++) {
        const depthX = 100 + i * 100 + Math.sin(time * 0.001 + i) * 30;
        const depthY = 150 + Math.sin(time * 0.0008 + i * 0.5) * 100;
        const depthOpacity = 0.1 + Math.sin(time * 0.001 + i) * 0.05;

        const depthGradient = ctx.createRadialGradient(depthX, depthY, 0, depthX, depthY, 20);
        depthGradient.addColorStop(0, `rgba(59, 130, 246, ${depthOpacity})`);
        depthGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
        ctx.fillStyle = depthGradient;
        ctx.beginPath();
        ctx.arc(depthX, depthY, 15, 0, Math.PI * 2);
        ctx.fill();
      }

      proofParticles.forEach((particle, particleIndex) => {
        const convergeFactor = Math.min(time / 2000, 1);
        particle.x +=
          (particle.targetX - particle.x) * 0.01 * particle.speed * (0.5 + convergeFactor);
        particle.y +=
          (particle.targetY - particle.y) * 0.01 * particle.speed * (0.5 + convergeFactor);

        const distanceToCenter = Math.sqrt(
          Math.pow(particle.x - particle.targetX, 2) +
            Math.pow(particle.y - particle.targetY, 2),
        );

        if (time > particle.verifyTime && distanceToCenter < 80) {
          particle.verified = true;
        }

        const particleGradient = ctx.createRadialGradient(
          particle.x, particle.y, 0, particle.x, particle.y, particle.size * 3,
        );

        if (particle.verified) {
          particleGradient.addColorStop(0, `rgba(16, 185, 129, ${particle.opacity})`);
          particleGradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
        } else {
          particleGradient.addColorStop(0, `rgba(6, 182, 212, ${particle.opacity * 0.7})`);
          particleGradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
        }

        ctx.fillStyle = particleGradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
        ctx.fill();

        if (particle.verified) {
          const pulseSize = particle.size * (2 + Math.sin(time * 0.01 + particleIndex * 0.3));
          ctx.strokeStyle = `rgba(16, 185, 129, ${0.3 - (pulseSize - particle.size * 2) * 0.05})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, pulseSize, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      const centerGradient = ctx.createRadialGradient(400, 300, 0, 400, 300, 30);
      centerGradient.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
      centerGradient.addColorStop(0.7, 'rgba(59, 130, 246, 0.1)');
      centerGradient.addColorStop(1, 'rgba(6, 182, 212, 0.05)');
      ctx.fillStyle = centerGradient;
      ctx.beginPath();
      ctx.arc(400, 300, 25, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(392, 300);
      ctx.lineTo(397, 305);
      ctx.lineTo(408, 294);
      ctx.stroke();

      time += 16;
      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  useEffect(() => {
    const button = ctaButtonRef.current;
    if (!button) return;

    const pulseInterval = setInterval(() => {
      button.style.boxShadow = '0 0 40px rgba(6, 182, 212, 0.7)';
      setTimeout(() => {
        button.style.boxShadow = '0 0 20px rgba(6, 182, 212, 0.3)';
      }, 800);
    }, 7000);

    return () => clearInterval(pulseInterval);
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative py-32 bg-gradient-to-b from-[#0d1421] to-[#0a0f1c] overflow-hidden"
      style={{ position: 'relative' }}
    >
      <motion.div
        style={{ opacity: glow }}
        className="fixed inset-0 bg-gradient-to-br from-cyan-500/20 via-blue-500/15 to-purple-500/20 pointer-events-none"
      />

      <motion.div
        style={{ y: backgroundY }}
        className="fixed inset-0 pointer-events-none"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10" />
        <div className="absolute top-1/4 left-1/4 w-[50vw] h-[50vh] bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[50vw] h-[50vh] bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-purple-500/3 rounded-full blur-3xl" />
      </motion.div>

      <motion.div
        style={{ opacity }}
        className="fixed inset-0 flex items-center justify-center pointer-events-none"
      >
        <canvas ref={canvasRef} className="opacity-60" />
      </motion.div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-12 text-center">
        <motion.div
          style={{ scale }}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </motion.div>
            <span className="text-sm text-cyan-400 font-medium">
              Start Your Free Trial
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
          >
            Install the{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Operating System
            </span>
            <br />
            <span className="bg-gradient-to-r from-green-400 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
              Your Compliance Deserves
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Stop managing compliance manually. FormaOS enforces controls,
            captures evidence, and keeps you audit-ready. Every single day.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.a
              ref={ctaButtonRef}
              href={`${appBase}/auth/signup?plan=pro`}
              whileHover={{
                scale: 1.05,
                boxShadow:
                  '0 0 40px rgba(6, 182, 212, 0.8), inset 0 0 20px rgba(255, 255, 255, 0.1)',
              }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg flex items-center gap-2 transition-all duration-300 shadow-lg shadow-cyan-500/25"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </motion.a>

            <motion.a
              href="/contact"
              whileHover={{
                scale: 1.05,
                boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)',
                backgroundColor: 'rgba(6, 182, 212, 0.05)',
              }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-full border-2 border-gray-600 text-white font-semibold text-lg hover:border-cyan-400 transition-all duration-300"
            >
              Schedule Demo
            </motion.a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-sm text-gray-500 mt-8"
          >
            No credit card required • 14-day free trial • Cancel anytime
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-16 pt-8 border-t border-white/5"
          >
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-center">
              {[
                { value: 'Audit-ready', label: 'Evidence workflows' },
                { value: 'Traceable', label: 'Evidence records' },
                { value: 'SOC 2-aligned', label: 'Trust framework' },
                { value: 'Priority', label: 'Support coverage' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="flex flex-col items-center min-w-0"
                >
                  <div className="text-lg sm:text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      <div className="fixed inset-0 bg-gradient-to-t from-[#0a0f1c]/50 via-transparent to-transparent pointer-events-none" />
    </section>
  );
}
