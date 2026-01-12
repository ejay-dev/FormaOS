"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Layers, Target, Zap, TrendingUp, ArrowRight } from "lucide-react";
import { AnimatedSystemGrid, ParallaxLayer, PulsingNode } from "@/components/motion";

export function ProductHero() {
  return (
    <section className="relative min-h-[75vh] flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
      <div className="absolute inset-0 opacity-50">
        <AnimatedSystemGrid />
      </div>
      
      {/* Ambient lights */}
      <div className="pointer-events-none absolute top-20 left-1/3 h-[500px] w-[500px] rounded-full bg-primary/15 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-20 right-1/3 h-[400px] w-[400px] rounded-full bg-secondary/10 blur-[80px]" />
      
      {/* Pulsing nodes */}
      <PulsingNode x="15%" y="25%" delay={0} />
      <PulsingNode x="85%" y="35%" delay={0.5} color="rgb(139, 92, 246)" />
      <PulsingNode x="50%" y="70%" delay={1} color="rgb(6, 182, 212)" />
      
      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 py-20">
        <ParallaxLayer speed={0.3}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center max-w-4xl mx-auto space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2.5 rounded-full glass-intense px-5 py-2.5 text-xs font-bold uppercase tracking-wider border border-primary/30"
            >
              <Layers className="h-4 w-4 text-primary" />
              Platform Architecture
            </motion.div>
            
            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] font-display tracking-tight">
              Compliance Infrastructure
              <br />
              <span className="relative">
                <span className="text-gradient">Built for Operations</span>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent rounded-full origin-left"
                />
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-foreground/80 leading-relaxed">
              From framework alignment to audit export—every workflow connected, 
              traced, and defensible in a single system of record.
            </p>
            
            {/* Feature pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap justify-center gap-4"
            >
              {[
                { icon: Target, label: "Model Obligations" },
                { icon: Zap, label: "Execute Tasks" },
                { icon: TrendingUp, label: "Prove Readiness" },
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  className="glass-panel rounded-full px-5 py-3 flex items-center gap-2 hover:glass-intense transition-all group"
                >
                  <item.icon className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-semibold">{item.label}</span>
                </motion.div>
              ))}
            </motion.div>
            
            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
            >
              <Link href="/auth/signup" className="btn btn-primary text-lg px-8 py-4 shadow-premium-xl group">
                <span>Start Free Trial</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/contact" className="btn btn-secondary text-lg px-8 py-4">
                Request Demo
              </Link>
            </motion.div>
          </motion.div>
        </ParallaxLayer>
      </div>
    </section>
  );
}
