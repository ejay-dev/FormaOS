/**
 * ScrollShowcase - Premium product tour section
 * Dense layout with primary + secondary screenshots, scene tabs, feature strip
 */

'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import { useState, useCallback } from 'react';
import { easing, duration, depth, radius } from '@/config/motion';

// =============================================================================
// Types
// =============================================================================

export interface ScrollScene {
  id: string;
  title: string;
  description: string;
  media: {
    type: 'image' | 'video';
    src: string;
    alt: string;
  };
  accentColor?: string;
  features?: string[];
}

interface ScrollShowcaseProps {
  scenes: ScrollScene[];
  sectionTitle?: string;
  sectionSubtitle?: string;
  badge?: string;
  className?: string;
}

// =============================================================================
// Animation Config
// =============================================================================

const mediaTransition = {
  duration: duration.normal,
  ease: easing.signature,
};

// =============================================================================
// Sub-components
// =============================================================================

function SceneTab({
  scene,
  index,
  isActive,
  onClick,
}: {
  scene: ScrollScene;
  index: number;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group w-full text-left p-4 rounded-xl border transition-all duration-300 ${
        isActive
          ? `${depth.glass.strong} border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.08)]`
          : 'bg-transparent border-white/[0.05] hover:border-white/[0.12] hover:bg-white/[0.02]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5 transition-colors duration-300 ${
            isActive
              ? 'bg-cyan-500 text-white'
              : 'bg-white/[0.06] text-slate-500 group-hover:text-slate-400'
          }`}
        >
          {index + 1}
        </div>
        <div className="min-w-0">
          <h3
            className={`font-semibold transition-colors duration-300 ${
              isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
            }`}
          >
            {scene.title}
          </h3>
          <p
            className={`text-sm mt-1 leading-relaxed transition-all duration-300 ${
              isActive
                ? 'text-slate-400 max-h-20 opacity-100'
                : 'text-slate-500 max-h-0 opacity-0 overflow-hidden'
            }`}
          >
            {scene.description}
          </p>
        </div>
      </div>
    </button>
  );
}

function PrimaryMedia({
  scene,
  shouldAnimate,
}: {
  scene: ScrollScene;
  shouldAnimate: boolean;
}) {
  return (
    <div className="relative">
      {/* Glow effect */}
      <div
        className={`absolute -inset-4 rounded-3xl opacity-20 blur-2xl transition-colors duration-700 ${
          scene.accentColor
            ? `bg-gradient-to-br ${scene.accentColor}`
            : 'bg-gradient-to-br from-cyan-500 to-blue-600'
        }`}
      />

      {/* Main image */}
      <div
        className={`relative aspect-[16/10] ${radius.cardLarge} overflow-hidden ${depth.border.glow} ${depth.shadow.strong}`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={scene.id}
            initial={
              shouldAnimate
                ? { opacity: 0, scale: 0.98, filter: 'blur(6px)' }
                : false
            }
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={
              shouldAnimate
                ? { opacity: 0, scale: 1.01, filter: 'blur(4px)' }
                : undefined
            }
            transition={mediaTransition}
            className="absolute inset-0"
          >
            <Image
              src={scene.media.src}
              alt={scene.media.alt}
              fill
              className="object-cover object-top"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 700px"
            />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent pointer-events-none" />
      </div>
    </div>
  );
}

function ThumbnailStrip({
  scenes,
  activeIndex,
  onSelect,
}: {
  scenes: ScrollScene[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  if (scenes.length < 2) return null;

  return (
    <div className="flex gap-3 mt-4">
      {scenes.map((scene, index) => (
        <button
          key={scene.id}
          onClick={() => onSelect(index)}
          className={`relative flex-1 aspect-[16/10] rounded-xl overflow-hidden border-2 transition-all duration-300 ${
            index === activeIndex
              ? 'border-cyan-500/60 ring-1 ring-cyan-500/20'
              : 'border-white/[0.06] hover:border-white/[0.15] opacity-60 hover:opacity-80'
          }`}
        >
          <Image
            src={scene.media.src}
            alt={scene.media.alt}
            fill
            className="object-cover object-top"
            sizes="200px"
          />
          {index !== activeIndex && (
            <div className="absolute inset-0 bg-black/30" />
          )}
        </button>
      ))}
    </div>
  );
}

function FeatureStrip({ features }: { features: string[] }) {
  if (features.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3 justify-center mt-10">
      {features.map((feature, i) => (
        <div
          key={i}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${depth.glass.normal} ${depth.border.subtle}`}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span className="text-sm text-slate-300">{feature}</span>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Mobile Layout
// =============================================================================

function MobileShowcase({
  scenes,
  activeIndex,
  onSelect,
  shouldAnimate,
}: {
  scenes: ScrollScene[];
  activeIndex: number;
  onSelect: (index: number) => void;
  shouldAnimate: boolean;
}) {
  const scene = scenes[activeIndex];

  return (
    <div className="md:hidden px-5 space-y-6">
      {/* Scene pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 scrollbar-hide">
        {scenes.map((s, i) => (
          <button
            key={s.id}
            onClick={() => onSelect(i)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              i === activeIndex
                ? 'bg-cyan-500 text-white'
                : 'bg-white/[0.05] text-slate-400 border border-white/[0.08]'
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* Primary image */}
      <PrimaryMedia scene={scene} shouldAnimate={shouldAnimate} />

      {/* Description */}
      <div>
        <p className="text-slate-400 leading-relaxed">{scene.description}</p>
        {scene.features && scene.features.length > 0 && (
          <ul className="mt-4 space-y-2">
            {scene.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                <span className="text-slate-300">{feature}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function ScrollShowcase({
  scenes,
  sectionTitle,
  sectionSubtitle,
  badge,
  className = '',
}: ScrollShowcaseProps) {
  const shouldReduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const shouldAnimate = !shouldReduceMotion;

  const handleSelect = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  // Collect all unique features for the feature strip
  const allFeatures = scenes.flatMap((s) => s.features ?? []);

  return (
    <section
      data-testid="scroll-showcase"
      className={`relative py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-[#0a0f1c] to-[#0d1421] overflow-hidden ${className}`}
    >
      {/* Background ambient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-80 h-80 rounded-full bg-cyan-500/[0.03] blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full bg-blue-500/[0.03] blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Section header - compact */}
        <div className="text-center mb-10 md:mb-12 px-6">
          {badge && (
            <motion.div
              initial={shouldAnimate ? { opacity: 0, y: 10 } : false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: duration.normal,
                ease: easing.signature,
              }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] mb-4"
            >
              <span className="text-sm font-medium text-cyan-400">
                {badge}
              </span>
            </motion.div>
          )}
          {sectionTitle && (
            <motion.h2
              initial={shouldAnimate ? { opacity: 0, y: 16 } : false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: duration.slow,
                ease: easing.signature,
                delay: 0.05,
              }}
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3"
            >
              {sectionTitle}
            </motion.h2>
          )}
          {sectionSubtitle && (
            <motion.p
              initial={shouldAnimate ? { opacity: 0, y: 16 } : false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: duration.slow,
                ease: easing.signature,
                delay: 0.1,
              }}
              className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto"
            >
              {sectionSubtitle}
            </motion.p>
          )}
        </div>

        {/* Desktop: Two-column dense layout */}
        <div className="hidden md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6 lg:gap-10 px-6 lg:px-12 items-start">
          {/* Left: Scene tabs */}
          <div className="space-y-3 sticky top-28">
            {scenes.map((scene, index) => (
              <SceneTab
                key={scene.id}
                scene={scene}
                index={index}
                isActive={index === activeIndex}
                onClick={() => handleSelect(index)}
              />
            ))}
          </div>

          {/* Right: Primary screenshot + thumbnails */}
          <div>
            <PrimaryMedia
              scene={scenes[activeIndex]}
              shouldAnimate={shouldAnimate}
            />
            <ThumbnailStrip
              scenes={scenes}
              activeIndex={activeIndex}
              onSelect={handleSelect}
            />
          </div>
        </div>

        {/* Mobile layout */}
        <MobileShowcase
          scenes={scenes}
          activeIndex={activeIndex}
          onSelect={handleSelect}
          shouldAnimate={shouldAnimate}
        />

        {/* Feature strip */}
        <motion.div
          initial={shouldAnimate ? { opacity: 0, y: 12 } : false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: duration.slow,
            ease: easing.signature,
            delay: 0.15,
          }}
          className="px-6 lg:px-12"
        >
          <FeatureStrip features={allFeatures} />
        </motion.div>
      </div>
    </section>
  );
}

export default ScrollShowcase;
