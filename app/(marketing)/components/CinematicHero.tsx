"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Zap, Shield, Activity } from "lucide-react";
import { 
  AnimatedSystemGrid, 
  FloatingUIPanel, 
  ParallaxLayer,
  PulsingNode 
} from "@/components/motion";
import { 
  Floating3DPanel, 
  FloatingWorkflowDiagram, 
  FloatingSecurityModule 
} from "@/components/motion";

export function CinematicHero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Multi-layer animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      
      {/* Animated system grid layer */}
      <div className="absolute inset-0 opacity-60">
        <AnimatedSystemGrid />
      </div>
      
      {/* Pulsing nodes */}
      <PulsingNode x="10%" y="20%" delay={0} />
      <PulsingNode x="90%" y="30%" delay={0.5} color="rgb(139, 92, 246)" />
      <PulsingNode x="15%" y="70%" delay={1} color="rgb(6, 182, 212)" />
      <PulsingNode x="85%" y="80%" delay={1.5} />
      
      {/* Radial gradient overlays */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[600px] rounded-full bg-primary/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 left-1/4 h-[500px] w-[500px] rounded-full bg-secondary/15 blur-[100px]" />
      <div className="pointer-events-none absolute top-1/2 right-1/4 h-[400px] w-[400px] rounded-full bg-accent/10 blur-[80px]" />
      
      {/* Vignette */}
      <div className="absolute inset-0 vignette pointer-events-none" />
      
      {/* Content container */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-28">
        <div className="grid lg:grid-cols-[0.9fr_1fr] gap-16 items-center">
          
          {/* Left: Text content */}
          <ParallaxLayer speed={0.3}>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-10 max-w-lg"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="inline-flex items-center gap-2.5 rounded-full glass-intense px-5 py-2.5 text-xs font-bold uppercase tracking-wider border border-primary/30"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                </motion.div>
                Enterprise Compliance OS
              </motion.div>
              
              {/* Main headline */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="space-y-3"
              >
                <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] font-display tracking-tight">
                  Operational
                </div>
                <span className="relative block">
                  <span className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-extrabold leading-[1.05] font-display tracking-tight text-gradient">
                    Compliance
                  </span>
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.8, duration: 0.8 }}
                    className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent rounded-full origin-left"
                  />
                </span>
                <div className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-bold leading-[1.15] font-display tracking-tight text-foreground/90 pt-1">
                  Operating System
                </div>
              </motion.h1>
              
              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="text-xl md:text-2xl text-foreground/80 leading-relaxed pt-4"
              >
                Transform regulatory obligations into{" "}
                <span className="font-semibold text-primary">executable controls</span>,{" "}
                <span className="font-semibold text-secondary">traceable evidence</span>, and{" "}
                <span className="font-semibold text-accent">audit-ready governance</span>.
              </motion.p>
              
              {/* Stats row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="flex flex-wrap gap-5 pt-6 pb-6"
              >
                {[
                  { icon: Activity, value: "94%", label: "Avg. Posture" },
                  { icon: Shield, value: "127", label: "Active Controls" },
                  { icon: Zap, value: "< 2min", label: "Audit Export" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + i * 0.1, duration: 0.5 }}
                    className="glass-panel rounded-xl px-4 py-3 flex items-center gap-3 hover:glass-intense transition-all group"
                  >
                    <div className="rounded-lg bg-primary/10 p-2 group-hover:scale-110 transition-transform">
                      <stat.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-lg font-bold font-display">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
              
              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="flex flex-col sm:flex-row gap-4 pt-8"
              >
                <Link
                  href="/auth/signup"
                  className="btn btn-primary text-lg px-8 py-5 shadow-premium-2xl hover:shadow-[0_0_40px_rgba(56,189,248,0.4)] transition-all group"
                >
                  <span>Start Free Trial</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/contact"
                  className="btn btn-secondary text-lg px-8 py-5"
                >
                  Request Demo
                </Link>
              </motion.div>
              
              {/* Trust indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
                className="flex flex-wrap gap-3 text-sm text-foreground/60"
              >
                <span className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  14-day free trial
                </span>
                <span className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
                  No credit card
                </span>
                <span className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                  Australian-hosted
                </span>
              </motion.div>
            </motion.div>
          </ParallaxLayer>
          
          {/* Right: 3D floating modules */}
          <ParallaxLayer speed={0.5}>
            <div className="relative h-[650px]">
              {/* Connection lines between modules */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ filter: "drop-shadow(0 0 10px rgba(56, 189, 248, 0.35))" }}>
                <motion.path
                  d="M 200 120 Q 280 220 200 340"
                  stroke="url(#moduleGradient)"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="5,5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.5 }}
                  transition={{ delay: 1.5, duration: 1.5 }}
                />
                <motion.path
                  d="M 240 160 L 300 420"
                  stroke="url(#moduleGradient)"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="5,5"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.5 }}
                  transition={{ delay: 1.7, duration: 1.5 }}
                />
                <defs>
                  <linearGradient id="moduleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgb(56, 189, 248)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="rgb(139, 92, 246)" stopOpacity="0.4" />
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Floating 3D modules - fixed positioning, opacity-only animation */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-8 right-0 w-[340px]"
              >
                <FloatingUIPanel delay={0.6} className="shadow-[0_0_50px_rgba(56,189,248,0.2)]">
                  <Floating3DPanel delay={0.6} />
                </FloatingUIPanel>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-[42%] -left-8 w-[320px]"
              >
                <FloatingUIPanel delay={0.8} className="shadow-[0_0_45px_rgba(139,92,246,0.2)]">
                  <FloatingWorkflowDiagram delay={0.8} />
                </FloatingUIPanel>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-4 right-16 w-[310px]"
              >
                <FloatingUIPanel delay={1.0} className="shadow-[0_0_48px_rgba(6,182,212,0.2)]">
                  <FloatingSecurityModule delay={1.0} />
                </FloatingUIPanel>
              </motion.div>
            </div>
          </ParallaxLayer>
        </div>
      </div>
    </section>
  );
}
