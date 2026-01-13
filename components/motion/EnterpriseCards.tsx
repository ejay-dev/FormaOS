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
    default: "glass-panel",
    intense: "glass-intense",
    frosted: "glass-frosted"
  };

  const accentColors = {
    primary: "text-primary bg-primary/10",
    secondary: "text-secondary bg-secondary/10",
    accent: "text-accent bg-accent/10"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -5, scale: 1.02 }}
      className={`${variantClasses[variant]} rounded-2xl p-8 h-full shadow-premium-lg group cursor-pointer`}
    >
      <motion.div 
        className={`rounded-xl ${accentColors[accentColor]} p-3.5 w-fit mb-6`}
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        <Icon className="h-6 w-6" />
      </motion.div>
      
      <h3 className="text-xl font-semibold font-display mb-3 group-hover:text-primary transition-colors">
        {title}
      </h3>
      
      <p className="text-sm text-foreground/70 leading-relaxed">
        {description}
      </p>

      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent" />
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
    up: "text-emerald-400",
    down: "text-rose-400",
    neutral: "text-muted-foreground"
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="glass-panel-strong rounded-2xl p-6 shadow-premium-md"
    >
      <div className="flex items-start justify-between mb-4">
        {Icon && (
          <div className="rounded-lg bg-primary/10 p-2.5">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
        {trend && (
          <div className={`text-xs font-semibold ${trendColors[trend]}`}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
          </div>
        )}
      </div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: delay + 0.2 }}
        className="text-4xl font-bold font-display mb-2"
      >
        {value}
      </motion.div>
      
      <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">
        {label}
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
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="relative"
    >
      <div className="glass-panel rounded-2xl p-8 shadow-premium-md group hover:shadow-premium-lg transition-all duration-300">
        <div className="flex items-start gap-6">
          {/* Number badge */}
          <div className="flex-shrink-0">
            <motion.div 
              className="h-14 w-14 rounded-xl glass-intense flex items-center justify-center text-2xl font-bold font-display text-primary"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              {number}
            </motion.div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-lg font-semibold font-display group-hover:text-primary transition-colors">
                {title}
              </h3>
            </div>
            <p className="text-sm text-foreground/70 leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </div>

      {/* Connector line */}
      {showConnector && (
        <motion.div
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: delay + 0.3 }}
          className="absolute left-7 top-full h-8 w-0.5 bg-gradient-to-b from-primary/50 to-transparent origin-top"
        />
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
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="glass-panel-strong rounded-2xl p-10 shadow-premium-lg relative"
    >
      {/* Quote mark */}
      <div className="absolute top-6 left-6 text-6xl font-serif text-primary/20 leading-none">
        "
      </div>

      <div className="relative pl-8">
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
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="glass-intense rounded-2xl p-8 shadow-premium-lg group"
    >
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border/30">
        <div className="rounded-xl bg-primary/10 p-3">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-xl font-semibold font-display">{title}</h3>
      </div>

      <div className="space-y-3">
        {components.map((component, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: delay + (idx * 0.1) }}
            className="flex items-center gap-3 text-sm"
          >
            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-foreground/80">{component}</span>
          </motion.div>
        ))}
      </div>

      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
      </div>
    </motion.div>
  );
}
