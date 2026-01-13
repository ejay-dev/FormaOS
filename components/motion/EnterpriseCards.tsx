"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

// Feature card with icon, title, description and hover effects
interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
  variant?: "default" | "intense" | "frosted";
  accentColor?: "primary" | "secondary" | "accent";
}

export function FeatureCard({ 
  icon: Icon, 
  title, 
  description, 
  delay = 0,
  variant = "default",
  accentColor = "primary"
}: FeatureCardProps) {
  const variantClasses = {
    default: "glass-panel hover:border-primary/30",
    intense: "glass-intense hover:border-primary/40",
    frosted: "glass-frosted hover:border-secondary/30"
  };

  const accentColors = {
    primary: "text-primary bg-gradient-to-br from-primary/20 to-primary/5",
    secondary: "text-secondary bg-gradient-to-br from-secondary/20 to-secondary/5",
    accent: "text-accent bg-gradient-to-br from-accent/20 to-accent/5"
  };

  const glowColors = {
    primary: "from-primary/15 via-transparent to-secondary/10",
    secondary: "from-secondary/15 via-transparent to-primary/10",
    accent: "from-accent/15 via-transparent to-primary/10"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -8, scale: 1.02 }}
      className={`${variantClasses[variant]} relative rounded-2xl p-8 h-full shadow-premium-lg group cursor-pointer transition-all duration-300 overflow-hidden`}
    >
      {/* Ambient background glow */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${glowColors[accentColor]} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      {/* Top edge highlight */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        <motion.div 
          className={`rounded-xl ${accentColors[accentColor]} p-3.5 w-fit mb-6 shadow-lg`}
          whileHover={{ scale: 1.15, rotate: 8 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          <Icon className="h-6 w-6" />
        </motion.div>
        
        <h3 className="text-xl font-semibold font-display mb-3 group-hover:text-primary transition-colors duration-300">
          {title}
        </h3>
        
        <p className="text-sm text-foreground/70 leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

// Metric card with animated number and context
interface MetricCardProps {
  value: string;
  label: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  delay?: number;
}

export function MetricCard({ value, label, icon: Icon, trend, delay = 0 }: MetricCardProps) {
  const trendColors = {
    up: "text-emerald-400 bg-emerald-500/10",
    down: "text-rose-400 bg-rose-500/10",
    neutral: "text-muted-foreground bg-muted/20"
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -6, scale: 1.03 }}
      className="glass-panel-strong rounded-2xl p-6 shadow-premium-lg group relative overflow-hidden"
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Edge highlight */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          {Icon && (
            <motion.div 
              className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-3 shadow-lg"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <Icon className="h-5 w-5 text-primary" />
            </motion.div>
          )}
          {trend && (
            <motion.div 
              className={`text-xs font-bold ${trendColors[trend]} px-2.5 py-1 rounded-full`}
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: delay + 0.3, type: "spring" }}
            >
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
            </motion.div>
          )}
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: delay + 0.2, type: "spring" }}
          className="text-4xl font-bold font-display mb-2 group-hover:text-gradient transition-all duration-300"
        >
          {value}
        </motion.div>
        
        <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">
          {label}
        </div>
      </div>
    </motion.div>
  );
}

// Process step card with connection line
interface ProcessStepProps {
  number: number;
  title: string;
  description: string;
  icon: LucideIcon;
  delay?: number;
  showConnector?: boolean;
}

export function ProcessStep({ 
  number, 
  title, 
  description, 
  icon: Icon, 
  delay = 0,
  showConnector = true
}: ProcessStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay }}
      className="relative"
    >
      <motion.div 
        className="glass-panel rounded-2xl p-8 shadow-premium-lg group hover:shadow-premium-xl hover:border-primary/30 transition-all duration-300 relative overflow-hidden"
        whileHover={{ x: 10 }}
      >
        {/* Ambient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/8 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Edge glow */}
        <div className="absolute left-0 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="flex items-start gap-6 relative z-10">
          {/* Number badge */}
          <div className="flex-shrink-0">
            <motion.div 
              className="h-14 w-14 rounded-xl glass-intense flex items-center justify-center text-2xl font-bold font-display text-primary shadow-lg border border-primary/20"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              {number}
            </motion.div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <motion.div 
                className="rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 p-2 shadow-lg"
                whileHover={{ scale: 1.15, rotate: 8 }}
              >
                <Icon className="h-4 w-4 text-primary" />
              </motion.div>
              <h3 className="text-lg font-semibold font-display group-hover:text-primary transition-colors duration-300">
                {title}
              </h3>
            </div>
            <p className="text-sm text-foreground/70 leading-relaxed group-hover:text-foreground/80 transition-colors">
              {description}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Connector line with glow */}
      {showConnector && (
        <motion.div
          initial={{ scaleY: 0, opacity: 0 }}
          whileInView={{ scaleY: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: delay + 0.3 }}
          className="absolute left-7 top-full h-8 w-0.5 origin-top"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-primary/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/40 to-transparent blur-sm" />
        </motion.div>
      )}
    </motion.div>
  );
}

// Testimonial/quote card with elegant styling
interface QuoteCardProps {
  quote: string;
  author?: string;
  role?: string;
  delay?: number;
}

export function QuoteCard({ quote, author, role, delay = 0 }: QuoteCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay }}
      className="glass-panel-strong rounded-2xl p-10 shadow-premium-xl relative overflow-hidden group"
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Quote mark with glow */}
      <div className="absolute top-6 left-6 text-6xl font-serif text-primary/30 leading-none">
        "
        <div className="absolute inset-0 text-primary/10 blur-xl">
          "
        </div>
      </div>

      <div className="relative pl-8 z-10">
        <p className="text-lg md:text-xl text-foreground/90 leading-relaxed mb-6 italic">
          {quote}
        </p>

        {author && (
          <div className="border-t border-border/30 pt-4">
            <div className="text-base font-semibold text-foreground">{author}</div>
            {role && <div className="text-sm text-muted-foreground mt-1">{role}</div>}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// System architecture card showing components
interface ArchitectureCardProps {
  title: string;
  components: string[];
  icon: LucideIcon;
  delay?: number;
}

export function ArchitectureCard({ title, components, icon: Icon, delay = 0 }: ArchitectureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -8, scale: 1.01 }}
      className="glass-intense rounded-2xl p-8 shadow-premium-xl group relative overflow-hidden"
    >
      {/* Multi-layer ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-transparent to-secondary/8 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      {/* Top edge highlight */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border/30">
          <motion.div 
            className="rounded-xl bg-gradient-to-br from-primary/25 to-primary/5 p-3 shadow-lg border border-primary/20"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Icon className="h-6 w-6 text-primary" />
          </motion.div>
          <h3 className="text-xl font-semibold font-display group-hover:text-primary transition-colors duration-300">{title}</h3>
        </div>

        <div className="space-y-3">
          {components.map((component, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: delay + (idx * 0.08) }}
              className="flex items-center gap-3 text-sm group/item"
            >
              <motion.div 
                className="h-2 w-2 rounded-full bg-gradient-to-r from-primary to-secondary shadow-lg"
                whileHover={{ scale: 1.5 }}
              />
              <span className="text-foreground/80 group-hover/item:text-foreground transition-colors">{component}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
