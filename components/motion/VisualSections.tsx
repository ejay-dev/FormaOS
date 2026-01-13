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

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.95, 1, 1, 0.95]);

  const backgroundClasses = {
    grid: "command-grid",
    flow: "flow-lines",
    gradient: "gradient-glow",
    nodes: "security-grid",
    none: ""
  };

  const ambientPositions = {
    primary: "right-1/4 top-20",
    secondary: "left-1/4 top-40",
    accent: "left-1/2 top-1/4"
  };

  const ambientColors = {
    primary: "bg-primary/8",
    secondary: "bg-secondary/6",
    accent: "bg-accent/7"
  };

  return (
    <motion.section 
      ref={ref}
      style={{ opacity, scale }}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Background layer */}
      {backgroundType !== "none" && (
        <div className={`absolute inset-0 ${backgroundClasses[backgroundType]} opacity-30`} />
      )}
      
      {/* Ambient lighting */}
      <div className={`pointer-events-none absolute -${ambientPositions[ambientColor]} h-[500px] w-[500px] rounded-full ${ambientColors[ambientColor]} blur-3xl`} />
      
      {/* Vignette */}
      <div className="absolute inset-0 vignette" />
      
      {/* Content */}
      <div className="relative">
        {children}
      </div>
    </motion.section>
  );
}

// Visual separator with gradient and glow
export function VisualDivider({ gradient = true }: { gradient?: boolean }) {
  return (
    <div className="relative h-px w-full my-24">
      <div className={`absolute inset-0 ${gradient ? 'bg-gradient-to-r from-transparent via-primary/30 to-transparent' : 'bg-border/30'}`} />
      {gradient && (
        <>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-2 w-32 bg-primary/20 blur-xl" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-1 w-16 bg-primary/40 blur-sm" />
        </>
      )}
    </div>
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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={`flex flex-col ${alignmentClasses} mb-16 lg:mb-20`}
    >
      {badge && (
        <div className="inline-flex items-center gap-2.5 glass-panel rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider mb-6">
          {badgeIcon}
          <span>{badge}</span>
        </div>
      )}
      
      <h2 className={`text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold font-display mb-6 max-w-4xl ${maxWidthClass}`}>
        {title}
      </h2>
      
      {subtitle && (
        <p className={`text-lg sm:text-xl text-foreground/70 leading-relaxed max-w-3xl ${maxWidthClass}`}>
          {subtitle}
        </p>
      )}

      {/* Animated underline */}
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="h-1 w-24 bg-gradient-to-r from-primary via-secondary to-primary rounded-full mt-6"
        style={{ originX: alignment === "center" ? 0.5 : 0 }}
      />
    </motion.div>
  );
}
