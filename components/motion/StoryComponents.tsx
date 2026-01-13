"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

// Timeline item for story/narrative sections
interface TimelineItemProps {
  year?: string;
  title: string;
  description: string;
  icon?: ReactNode;
  delay?: number;
  position?: "left" | "right";
}

export function TimelineItem({ 
  year, 
  title, 
  description, 
  icon, 
  delay = 0,
  position = "right"
}: TimelineItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: position === "left" ? -40 : 40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay }}
      className="relative flex gap-8 items-start group"
    >
      {/* Timeline line and dot */}
      <div className="flex flex-col items-center flex-shrink-0">
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay, type: "spring", stiffness: 200 }}
          whileHover={{ scale: 1.1 }}
          className="relative h-16 w-16 rounded-full glass-intense flex items-center justify-center border-2 border-primary/30 shadow-premium-lg overflow-hidden"
        >
          {/* Inner glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/10" />
          
          <div className="relative">
            {icon || (
              <div className="text-lg font-bold text-primary">{year}</div>
            )}
          </div>
        </motion.div>
        
        {/* Vertical line with glow */}
        <motion.div
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: delay + 0.2 }}
          className="relative w-px h-full origin-top mt-4"
        >
          <div className="absolute inset-0 w-0.5 bg-gradient-to-b from-primary/60 via-primary/30 to-transparent" />
          <div className="absolute inset-0 w-1 bg-gradient-to-b from-primary/30 to-transparent blur-sm -translate-x-0.5" />
        </motion.div>
      </div>

      {/* Content */}
      <motion.div 
        whileHover={{ x: 5 }}
        transition={{ duration: 0.3 }}
        className="relative glass-panel rounded-2xl p-8 lg:p-10 flex-1 shadow-premium-lg border border-white/5 overflow-hidden"
      >
        {/* Top edge highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent group-hover:via-primary/40 transition-colors duration-300" />
        
        {/* Hover ambient glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative">
          {year && (
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: delay + 0.1 }}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-primary font-bold mb-3 glass-panel-strong px-3 py-1 rounded-full"
            >
              {year}
            </motion.div>
          )}
          <h3 className="text-2xl lg:text-3xl font-semibold font-display mb-4 group-hover:text-primary/90 transition-colors duration-300">{title}</h3>
          <p className="text-foreground/70 leading-relaxed text-lg">{description}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Narrative section with visual emphasis
interface NarrativeBlockProps {
  title: string;
  content: ReactNode;
  delay?: number;
  variant?: "default" | "emphasis" | "quote";
}

export function NarrativeBlock({ 
  title, 
  content, 
  delay = 0,
  variant = "default"
}: NarrativeBlockProps) {
  const variantClasses = {
    default: "glass-panel border border-white/5",
    emphasis: "glass-panel-strong border-l-4 border-primary/80",
    quote: "glass-intense border border-primary/20"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay }}
      className={`relative ${variantClasses[variant]} rounded-2xl lg:rounded-3xl p-8 lg:p-14 shadow-premium-lg overflow-hidden group`}
    >
      {/* Top edge highlight */}
      {variant !== "emphasis" && (
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      )}
      
      {/* Ambient corner glow on hover */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <motion.h2 
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: delay + 0.1 }}
        className="relative text-3xl lg:text-4xl xl:text-5xl font-bold font-display mb-8 leading-tight"
      >
        {title}
      </motion.h2>
      
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: delay + 0.2 }}
        className="relative prose prose-invert prose-lg max-w-none"
      >
        {content}
      </motion.div>
    </motion.div>
  );
}

// Value proposition card with icon
interface ValuePropProps {
  icon: ReactNode;
  title: string;
  description: string;
  delay?: number;
}

export function ValueProp({ icon, title, description, delay = 0 }: ValuePropProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="relative glass-panel rounded-2xl p-8 lg:p-10 shadow-premium-lg group overflow-hidden border border-white/5"
    >
      {/* Top edge highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-primary/30 transition-colors duration-300" />
      
      {/* Hover ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative h-16 w-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 border border-primary/20 group-hover:border-primary/40 transition-colors duration-300"
      >
        {/* Icon glow */}
        <div className="absolute inset-0 bg-primary/10 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative">
          {icon}
        </div>
      </motion.div>

      <h3 className="relative text-xl lg:text-2xl font-semibold font-display mb-4 group-hover:text-primary transition-colors duration-300">
        {title}
      </h3>

      <p className="relative text-sm lg:text-base text-foreground/70 leading-relaxed group-hover:text-foreground/80 transition-colors duration-300">
        {description}
      </p>
    </motion.div>
  );
}

// Mission statement block
interface MissionStatementProps {
  statement: string;
  author?: string;
  role?: string;
  delay?: number;
}

export function MissionStatement({ statement, author, role, delay = 0 }: MissionStatementProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, delay }}
      className="relative glass-intense rounded-3xl p-12 lg:p-20 shadow-premium-2xl overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 command-grid opacity-5" />
      
      {/* Multiple ambient glows */}
      <div className="absolute top-0 right-0 h-80 w-80 bg-primary/15 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 left-0 h-64 w-64 bg-secondary/10 rounded-full blur-[80px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 bg-accent/5 rounded-full blur-[120px]" />
      
      {/* Quote marks decoration */}
      <div className="absolute top-8 left-8 text-8xl font-serif text-primary/10 leading-none">"</div>
      
      <div className="relative">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: delay + 0.1 }}
          className="text-3xl lg:text-5xl xl:text-6xl font-bold font-display leading-[1.15] mb-10"
        >
          {statement}
        </motion.div>

        {author && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: delay + 0.3 }}
            className="flex items-center gap-4 pt-8 border-t border-border/20"
          >
            {/* Decorative line */}
            <div className="w-12 h-px bg-gradient-to-r from-primary to-transparent" />
            <div>
              <div className="text-lg font-semibold text-foreground">{author}</div>
              {role && <div className="text-sm text-muted-foreground">{role}</div>}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// Founder/team card
interface TeamMemberProps {
  name: string;
  role: string;
  location?: string;
  bio: string;
  image?: string;
  delay?: number;
}

export function TeamMember({ name, role, location, bio, delay = 0 }: TeamMemberProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.7, delay }}
      whileHover={{ y: -8 }}
      className="relative glass-panel rounded-2xl lg:rounded-3xl p-8 lg:p-10 shadow-premium-lg group overflow-hidden border border-white/5"
    >
      {/* Top edge highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-primary/30 transition-colors duration-300" />
      
      {/* Ambient glow on hover */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative mb-6">
        <motion.h3 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: delay + 0.1 }}
          className="text-2xl lg:text-3xl font-bold font-display mb-2 group-hover:text-gradient transition-all duration-300"
        >
          {name}
        </motion.h3>
        <div className="text-primary font-semibold text-lg mb-1">{role}</div>
        {location && (
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: delay + 0.2 }}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground glass-panel-strong px-3 py-1 rounded-full"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
            {location}
          </motion.div>
        )}
      </div>

      <motion.p 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: delay + 0.2 }}
        className="relative text-foreground/80 leading-relaxed text-lg group-hover:text-foreground/90 transition-colors duration-300"
      >
        {bio}
      </motion.p>
    </motion.div>
  );
}
