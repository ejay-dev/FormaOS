'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  Sparkles,
  Building2,
  Shield,
  Zap,
  FileCheck,
  TrendingUp,
  Layers,
  ClipboardCheck,
  Lock,
  BookOpen,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type CategoryConfig = {
  gradient: string;
  accentGradient: string;
  glowColor: string;
  icon: LucideIcon;
  nodes?: { x: string; y: string; size: string; delay: number }[];
};

const categoryConfigs: Record<string, CategoryConfig> = {
  compliance: {
    gradient: 'from-emerald-500/20 via-cyan-500/10 to-blue-500/5',
    accentGradient: 'from-emerald-400 to-cyan-500',
    glowColor: 'rgba(16, 185, 129, 0.3)',
    icon: Sparkles,
    nodes: [
      { x: '15%', y: '25%', size: '8px', delay: 0 },
      { x: '85%', y: '30%', size: '6px', delay: 0.2 },
      { x: '45%', y: '65%', size: '10px', delay: 0.4 },
      { x: '70%', y: '70%', size: '7px', delay: 0.6 },
    ],
  },
  ndis: {
    gradient: 'from-purple-500/20 via-pink-500/10 to-rose-500/5',
    accentGradient: 'from-purple-400 to-pink-500',
    glowColor: 'rgba(168, 85, 247, 0.3)',
    icon: Building2,
    nodes: [
      { x: '20%', y: '30%', size: '9px', delay: 0.1 },
      { x: '80%', y: '25%', size: '7px', delay: 0.3 },
      { x: '50%', y: '60%', size: '11px', delay: 0.5 },
    ],
  },
  security: {
    gradient: 'from-red-500/20 via-orange-500/10 to-yellow-500/5',
    accentGradient: 'from-red-400 to-orange-500',
    glowColor: 'rgba(239, 68, 68, 0.3)',
    icon: Shield,
    nodes: [
      { x: '10%', y: '20%', size: '8px', delay: 0 },
      { x: '90%', y: '35%', size: '9px', delay: 0.2 },
      { x: '40%', y: '70%', size: '7px', delay: 0.4 },
      { x: '75%', y: '65%', size: '10px', delay: 0.6 },
    ],
  },
  technology: {
    gradient: 'from-blue-500/20 via-indigo-500/10 to-purple-500/5',
    accentGradient: 'from-blue-400 to-indigo-500',
    glowColor: 'rgba(59, 130, 246, 0.3)',
    icon: Zap,
    nodes: [
      { x: '25%', y: '28%', size: '10px', delay: 0.1 },
      { x: '75%', y: '32%', size: '8px', delay: 0.3 },
      { x: '55%', y: '68%', size: '9px', delay: 0.5 },
    ],
  },
  'product updates': {
    gradient: 'from-cyan-500/20 via-teal-500/10 to-emerald-500/5',
    accentGradient: 'from-cyan-400 to-teal-500',
    glowColor: 'rgba(6, 182, 212, 0.3)',
    icon: ClipboardCheck,
    nodes: [
      { x: '18%', y: '22%', size: '9px', delay: 0 },
      { x: '82%', y: '28%', size: '7px', delay: 0.2 },
      { x: '48%', y: '72%', size: '11px', delay: 0.4 },
    ],
  },
};

export function BlogHeroVisual({
  category,
  title,
}: {
  category: string;
  title: string;
}) {
  const config =
    categoryConfigs[category.toLowerCase()] || categoryConfigs.compliance;
  const reduceMotion = useReducedMotion();
  const Icon = config.icon;

  return (
    <div className="relative w-full h-[280px] sm:h-[360px] lg:h-[400px] overflow-hidden rounded-2xl bg-gradient-to-b from-[#0a0f1c] via-[#0d1421] to-[#0a0f1c] border border-white/10">
      {/* Background gradient orbs */}
      <motion.div
        className={`absolute -top-32 -left-32 w-[360px] h-[360px] sm:w-[520px] sm:h-[520px] lg:w-[600px] lg:h-[600px] bg-gradient-to-br ${config.gradient} rounded-full blur-2xl sm:blur-3xl`}
        animate={
          reduceMotion
            ? undefined
            : {
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3],
              }
        }
        transition={
          reduceMotion ? undefined : { duration: 8, repeat: Infinity, ease: 'easeInOut' }
        }
      />
      <motion.div
        className={`absolute -bottom-32 -right-32 w-[320px] h-[320px] sm:w-[440px] sm:h-[440px] lg:w-[500px] lg:h-[500px] bg-gradient-to-tl ${config.gradient} rounded-full blur-2xl sm:blur-3xl`}
        animate={
          reduceMotion
            ? undefined
            : {
                scale: [1, 1.15, 1],
                opacity: [0.2, 0.4, 0.2],
              }
        }
        transition={
          reduceMotion
            ? undefined
            : {
                duration: 10,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 2,
              }
        }
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.15) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Animated nodes */}
      {config.nodes?.map((node, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full"
          style={{
            left: node.x,
            top: node.y,
            width: node.size,
            height: node.size,
            boxShadow: `0 0 20px ${config.glowColor}`,
          }}
          initial={reduceMotion ? false : { opacity: 0, scale: 0 }}
          animate={
            reduceMotion
              ? undefined
              : {
                  opacity: [0.4, 0.8, 0.4],
                  scale: [1, 1.2, 1],
                }
          }
          transition={
            reduceMotion
              ? undefined
              : {
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: node.delay,
                }
          }
        >
          <div
            className={`w-full h-full rounded-full bg-gradient-to-r ${config.accentGradient}`}
          />
        </motion.div>
      ))}

      {/* Connection lines between nodes */}
      {config.nodes && config.nodes.length > 1 && (
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ opacity: 0.2 }}
        >
          {config.nodes.map((node, index) => {
            if (index === config.nodes!.length - 1) return null;
            const nextNode = config.nodes![index + 1];
            return (
              <motion.line
                key={index}
                x1={node.x}
                y1={node.y}
                x2={nextNode.x}
                y2={nextNode.y}
                stroke="url(#lineGradient)"
                strokeWidth="1"
                initial={reduceMotion ? false : { pathLength: 0 }}
                animate={reduceMotion ? undefined : { pathLength: 1 }}
                transition={
                  reduceMotion
                    ? undefined
                    : {
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: index * 0.3,
                      }
                }
              />
            );
          })}
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.3)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
            </linearGradient>
          </defs>
        </svg>
      )}

      {/* Center icon and title */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className={`mb-6 p-6 rounded-2xl bg-gradient-to-br ${config.gradient} border border-white/10 backdrop-blur-xl`}
          style={{
            boxShadow: `0 0 60px ${config.glowColor}`,
          }}
        >
          <Icon className={`w-12 h-12 bg-gradient-to-r ${config.accentGradient} bg-clip-text text-transparent`} style={{ filter: 'drop-shadow(0 0 10px currentColor)' }} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white text-center max-w-4xl leading-tight"
        >
          {title}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className={`mt-6 h-1 w-24 rounded-full bg-gradient-to-r ${config.accentGradient}`}
          style={{
            boxShadow: `0 0 20px ${config.glowColor}`,
          }}
        />
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0f1c] to-transparent" />
    </div>
  );
}
