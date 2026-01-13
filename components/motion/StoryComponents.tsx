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
      initial={{ opacity: 0, x: position === "left" ? -30 : 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="relative flex gap-8 items-start"
    >
      {/* Timeline line and dot */}
      <div className="flex flex-col items-center flex-shrink-0">
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay }}
          className="h-14 w-14 rounded-full glass-intense flex items-center justify-center border-2 border-primary/30 shadow-premium-md"
        >
          {icon || (
            <div className="text-lg font-bold text-primary">{year}</div>
          )}
        </motion.div>
        
        {/* Vertical line */}
        <motion.div
          initial={{ scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: delay + 0.2 }}
          className="w-0.5 h-full bg-gradient-to-b from-primary/50 to-transparent origin-top mt-4"
        />
      </div>

      {/* Content */}
      <div className="glass-panel rounded-2xl p-8 flex-1 shadow-premium-md">
        {year && (
          <div className="text-xs uppercase tracking-wider text-primary font-semibold mb-2">
            {year}
          </div>
        )}
        <h3 className="text-2xl font-semibold font-display mb-3">{title}</h3>
        <p className="text-foreground/70 leading-relaxed">{description}</p>
      </div>
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
    default: "glass-panel",
    emphasis: "glass-panel-strong border-l-4 border-primary",
    quote: "glass-intense"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className={`${variantClasses[variant]} rounded-2xl p-8 lg:p-12 shadow-premium-lg`}
    >
      <h2 className="text-3xl lg:text-4xl font-bold font-display mb-6">
        {title}
      </h2>
      
      <div className="prose prose-invert max-w-none">
        {content}
      </div>
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
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="glass-panel rounded-2xl p-8 shadow-premium-md group"
    >
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center mb-6"
      >
        {icon}
      </motion.div>

      <h3 className="text-xl font-semibold font-display mb-3 group-hover:text-primary transition-colors">
        {title}
      </h3>

      <p className="text-sm text-foreground/70 leading-relaxed">
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
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay }}
      className="relative glass-intense rounded-3xl p-12 lg:p-16 shadow-premium-2xl overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 command-grid opacity-10" />
      <div className="absolute top-0 right-0 h-64 w-64 bg-primary/10 rounded-full blur-3xl" />
      
      <div className="relative">
        <div className="text-3xl lg:text-5xl font-bold font-display leading-tight mb-8">
          {statement}
        </div>

        {author && (
          <div className="flex items-center gap-4 pt-8 border-t border-border/30">
            <div>
              <div className="text-lg font-semibold text-foreground">{author}</div>
              {role && <div className="text-sm text-muted-foreground">{role}</div>}
            </div>
          </div>
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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="glass-panel rounded-2xl p-8 shadow-premium-lg"
    >
      <div className="mb-6">
        <h3 className="text-2xl font-bold font-display mb-1">{name}</h3>
        <div className="text-primary font-semibold mb-1">{role}</div>
        {location && (
          <div className="text-sm text-muted-foreground">{location}</div>
        )}
      </div>

      <p className="text-foreground/80 leading-relaxed">
        {bio}
      </p>
    </motion.div>
  );
}
