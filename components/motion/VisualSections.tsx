"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef, ReactNode } from "react";

// Premium section wrapper with multi-layer backgrounds
interface CinematicSectionProps {
  children: ReactNode;
  className?: string;
  backgroundType?: "grid" | "flow" | "gradient" | "nodes" | "none";
  ambientColor?: "primary" | "secondary" | "accent";
}

export function CinematicSection({ 
  children, 
  className = "",
  backgroundType = "grid",
  ambientColor = "primary"
}: CinematicSectionProps) {
  const shouldReduceMotion = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.97, 1, 1, 0.97]);
  const y = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [30, 0, 0, -30]);

  const backgroundClasses = {
    grid: "command-grid",
    flow: "flow-lines",
    gradient: "gradient-glow",
    nodes: "security-grid",
    none: ""
  };

  const ambientConfigs = {
    primary: {
      position: "-right-32 top-20",
      color: "bg-primary/12",
      secondaryPosition: "-left-20 bottom-40",
      secondaryColor: "bg-secondary/8"
    },
    secondary: {
      position: "-left-32 top-40",
      color: "bg-secondary/12",
      secondaryPosition: "-right-20 bottom-20",
      secondaryColor: "bg-primary/8"
    },
    accent: {
      position: "left-1/2 -translate-x-1/2 top-0",
      color: "bg-accent/10",
      secondaryPosition: "-right-32 bottom-32",
      secondaryColor: "bg-primary/8"
    }
  };

  const config = ambientConfigs[ambientColor];

  return (
    <motion.section 
      ref={ref}
      style={shouldReduceMotion ? undefined : { opacity, scale, y }}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Background layer with subtle animation */}
      {backgroundType !== "none" && (
        <div className={`absolute inset-0 ${backgroundClasses[backgroundType]} opacity-40`} />
      )}
      
      {/* Primary ambient lighting */}
      <div className={`pointer-events-none absolute ${config.position} h-[600px] w-[600px] rounded-full ${config.color} blur-[100px]`} />
      
      {/* Secondary ambient lighting */}
      <div className={`pointer-events-none absolute ${config.secondaryPosition} h-[400px] w-[400px] rounded-full ${config.secondaryColor} blur-[80px]`} />
      
      {/* Cinematic vignette */}
      <div className="absolute inset-0 vignette pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.section>
  );
}

// Thin, elegant visual separator - premium minimal design
export function VisualDivider({ gradient = true }: { gradient?: boolean }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div 
      initial={shouldReduceMotion ? false : { opacity: 0, scaleX: 0 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, scaleX: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.6, ease: "easeOut" }}
      className="relative w-full my-12 sm:my-16"
    >
      {gradient ? (
        <>
          {/* Premium gradient line */}
          <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          {/* Subtle glass-style backing */}
          <div className="absolute inset-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent backdrop-blur-sm" />
          {/* Minimal center accent */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[2px] w-24 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 rounded-full blur-sm" />
        </>
      ) : (
        /* Simple minimal line */
        <div className="h-px bg-glass-strong backdrop-blur-sm" />
      )}
    </motion.div>
  );
}

// Section header with animated underline
interface SectionHeaderProps {
  badge?: string;
  /** Accepted and ignored — see the badge comment in the body. */
  badgeIcon?: ReactNode;
  title: ReactNode;
  subtitle?: string;
  alignment?: "left" | "center";
}

export function SectionHeader({
  badge,
  title,
  subtitle,
  alignment = "center"
}: SectionHeaderProps) {
  const shouldReduceMotion = useReducedMotion();
  const alignmentClasses = alignment === "center" ? "text-center items-center" : "text-left items-start";
  const maxWidthClass = alignment === "center" ? "mx-auto" : "";

  return (
    <motion.div 
      initial={shouldReduceMotion ? false : { opacity: 0, y: 30 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.7 }}
      className={`flex flex-col ${alignmentClasses} mb-16 lg:mb-24`}
    >
      {/* The badge was a glass pill in uppercase wide tracking whose icon
          rotated on an infinite loop, and this header is stamped several
          times per page by the landing templates — so a single page carried
          four identical pills, each with something wiggling in it. A label
          above a heading is only worth rendering when it says something the
          heading does not, and then it can be plain text. */}
      {badge && (
        <p className="mb-4 text-sm font-medium text-foreground/60">{badge}</p>
      )}

      <h2 className={`text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold font-display mb-6 max-w-4xl ${maxWidthClass} leading-[1.1]`}>
        {title}
      </h2>
      
      {subtitle && (
        <motion.p 
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.6, delay: shouldReduceMotion ? 0 : 0.2 }}
          className={`text-lg sm:text-xl text-foreground/70 leading-relaxed max-w-3xl ${maxWidthClass}`}
        >
          {subtitle}
        </motion.p>
      )}

    </motion.div>
  );
}
