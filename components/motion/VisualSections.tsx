"use client";

import { motion, useScroll, useTransform } from "framer-motion";
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
      style={{ opacity, scale, y }}
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
  return (
    <motion.div 
      initial={{ opacity: 0, scaleX: 0 }}
      whileInView={{ opacity: 1, scaleX: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
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
        <div className="h-px bg-white/10 backdrop-blur-sm" />
      )}
    </motion.div>
  );
}

// Section header with animated underline
interface SectionHeaderProps {
  badge?: string;
  badgeIcon?: ReactNode;
  title: ReactNode;
  subtitle?: string;
  alignment?: "left" | "center";
}

export function SectionHeader({ 
  badge, 
  badgeIcon,
  title, 
  subtitle,
  alignment = "center"
}: SectionHeaderProps) {
  const alignmentClasses = alignment === "center" ? "text-center items-center" : "text-left items-start";
  const maxWidthClass = alignment === "center" ? "mx-auto" : "";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7 }}
      className={`flex flex-col ${alignmentClasses} mb-16 lg:mb-24`}
    >
      {badge && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2.5 glass-panel-strong rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider mb-8 border border-primary/20 shadow-lg"
        >
          {badgeIcon && (
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              {badgeIcon}
            </motion.div>
          )}
          <span>{badge}</span>
        </motion.div>
      )}
      
      <h2 className={`text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold font-display mb-6 max-w-4xl ${maxWidthClass} leading-[1.1]`}>
        {title}
      </h2>
      
      {subtitle && (
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`text-lg sm:text-xl text-foreground/70 leading-relaxed max-w-3xl ${maxWidthClass}`}
        >
          {subtitle}
        </motion.p>
      )}

      {/* Animated underline with glow */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="relative h-1 w-28 mt-8"
        style={{ originX: alignment === "center" ? 0.5 : 0 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary rounded-full" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary rounded-full blur-md opacity-60" />
      </motion.div>
    </motion.div>
  );
}
