/**
 * ScrollShowcase - Ready.so-style scroll storytelling component
 * Features sticky media column with scroll-driven animations
 */

'use client';

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import { useRef, useState, useCallback } from 'react';
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
  duration: duration.slow,
  ease: easing.signature,
};

const sceneContentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.slow,
      ease: easing.signature,
    },
  },
};

// =============================================================================
// Sub-components
// =============================================================================

function SectionHeader({
  badge,
  title,
  subtitle,
}: {
  badge?: string;
  title?: string;
  subtitle?: string;
}) {
  if (!title && !subtitle && !badge) return null;

  return (
    <div className="text-center mb-16 md:mb-20 px-6">
      {badge && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: duration.normal, ease: easing.signature }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] mb-6"
        >
          <span className="text-sm font-medium text-cyan-400">{badge}</span>
        </motion.div>
      )}
      {title && (
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{
            duration: duration.slow,
            ease: easing.signature,
            delay: 0.1,
          }}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4"
        >
          {title}
        </motion.h2>
      )}
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{
            duration: duration.slow,
            ease: easing.signature,
            delay: 0.2,
          }}
          className="text-lg text-slate-400 max-w-2xl mx-auto"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}

function SceneContent({
  scene,
  index,
  isActive,
  onInView,
}: {
  scene: ScrollScene;
  index: number;
  isActive: boolean;
  onInView: (index: number) => void;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={sceneContentVariants}
      onViewportEnter={() => onInView(index)}
      className="min-h-[60vh] flex flex-col justify-center"
    >
      {/* Scene number indicator */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300 ${
            isActive
              ? 'bg-cyan-500 text-white'
              : 'bg-white/[0.05] text-slate-500'
          }`}
        >
          {index + 1}
        </div>
        <div
          className={`h-px flex-1 max-w-16 transition-colors duration-300 ${
            isActive ? 'bg-cyan-500/50' : 'bg-white/[0.08]'
          }`}
        />
      </div>

      {/* Title */}
      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">
        {scene.title}
      </h3>

      {/* Description */}
      <p className="text-lg text-slate-400 mb-6 leading-relaxed">
        {scene.description}
      </p>

      {/* Features list */}
      {scene.features && scene.features.length > 0 && (
        <ul className="space-y-3">
          {scene.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
              </div>
              <span className="text-slate-300">{feature}</span>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}

function StickyMedia({
  scenes,
  activeIndex,
}: {
  scenes: ScrollScene[];
  activeIndex: number;
}) {
  const activeScene = scenes[activeIndex];

  return (
    <div className="sticky top-28 h-[calc(100vh-8rem)]">
      <div className="relative h-full flex items-center">
        {/* Glow effect behind image */}
        <div
          className={`absolute inset-0 rounded-3xl opacity-30 blur-3xl transition-colors duration-700 ${
            activeScene.accentColor
              ? `bg-gradient-to-br ${activeScene.accentColor}`
              : 'bg-gradient-to-br from-cyan-500 to-blue-600'
          }`}
          style={{ transform: 'scale(0.9)' }}
        />

        {/* Image container with glass effect */}
        <div
          className={`relative w-full aspect-[16/10] ${radius.cardLarge} overflow-hidden ${depth.glass.strong} ${depth.border.glow}`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeScene.id}
              initial={{ opacity: 0, scale: 0.98, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.02, filter: 'blur(4px)' }}
              transition={mediaTransition}
              className="absolute inset-0"
            >
              {activeScene.media.type === 'image' ? (
                <Image
                  src={activeScene.media.src}
                  alt={activeScene.media.alt}
                  fill
                  className="object-cover object-top"
                  priority={activeIndex === 0}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <video
                  src={activeScene.media.src}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

function MobileSceneCard({
  scene,
  index,
  shouldReduceMotion,
}: {
  scene: ScrollScene;
  index: number;
  shouldReduceMotion: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: shouldReduceMotion ? 0 : duration.slow,
        ease: easing.signature,
      }}
      className="space-y-6"
    >
      {/* Media */}
      <div
        className={`relative aspect-[16/10] ${radius.card} overflow-hidden ${depth.glass.normal} ${depth.border.subtle}`}
      >
        {scene.media.type === 'image' ? (
          <Image
            src={scene.media.src}
            alt={scene.media.alt}
            fill
            className="object-cover object-top"
            priority={index === 0}
            sizes="100vw"
          />
        ) : (
          <video
            src={scene.media.src}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Content */}
      <div>
        {/* Scene number */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-7 h-7 rounded-full bg-cyan-500 flex items-center justify-center text-sm font-semibold text-white">
            {index + 1}
          </div>
        </div>

        <h3 className="text-xl font-bold text-white mb-3">{scene.title}</h3>
        <p className="text-slate-400 mb-4">{scene.description}</p>

        {scene.features && scene.features.length > 0 && (
          <ul className="space-y-2">
            {scene.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <div className="w-4 h-4 rounded-full bg-cyan-500/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                </div>
                <span className="text-slate-300">{feature}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}

function StaticShowcase({
  scenes,
  sectionTitle,
  sectionSubtitle,
  badge,
  className = '',
}: ScrollShowcaseProps) {
  // Reduced motion fallback - simple static layout
  return (
    <section
      data-testid="scroll-showcase"
      className={`relative py-24 sm:py-32 bg-gradient-to-b from-[#0a0f1c] to-[#0d1421] overflow-hidden ${className}`}
    >
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          badge={badge}
          title={sectionTitle}
          subtitle={sectionSubtitle}
        />

        <div className="space-y-16 px-6">
          {scenes.map((scene) => (
            <div key={scene.id} className="space-y-6">
              <div
                className={`relative aspect-[16/10] ${radius.card} overflow-hidden max-w-3xl mx-auto`}
              >
                <Image
                  src={scene.media.src}
                  alt={scene.media.alt}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 800px"
                />
              </div>
              <div className="max-w-3xl mx-auto text-center">
                <h3 className="text-2xl font-bold text-white mb-3">
                  {scene.title}
                </h3>
                <p className="text-slate-400">{scene.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
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
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSceneInView = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  // Reduced motion fallback
  if (shouldReduceMotion) {
    return (
      <StaticShowcase
        scenes={scenes}
        sectionTitle={sectionTitle}
        sectionSubtitle={sectionSubtitle}
        badge={badge}
        className={className}
      />
    );
  }

  return (
    <section
      ref={containerRef}
      data-testid="scroll-showcase"
      className={`relative py-24 sm:py-32 bg-gradient-to-b from-[#0a0f1c] to-[#0d1421] overflow-hidden ${className}`}
    >
      {/* Background ambient elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-cyan-500/[0.03] blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-blue-500/[0.03] blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto">
        <SectionHeader
          badge={badge}
          title={sectionTitle}
          subtitle={sectionSubtitle}
        />

        {/* Desktop: Two-column sticky layout */}
        <div className="hidden md:grid md:grid-cols-2 gap-8 lg:gap-16 px-6 lg:px-12">
          {/* Left: Scrolling text content */}
          <div className="space-y-8">
            {scenes.map((scene, index) => (
              <SceneContent
                key={scene.id}
                scene={scene}
                index={index}
                isActive={index === activeIndex}
                onInView={handleSceneInView}
              />
            ))}
          </div>

          {/* Right: Sticky media column */}
          <StickyMedia scenes={scenes} activeIndex={activeIndex} />
        </div>

        {/* Mobile: Stacked layout */}
        <div className="md:hidden space-y-12 px-6">
          {scenes.map((scene, index) => (
            <MobileSceneCard
              key={scene.id}
              scene={scene}
              index={index}
              shouldReduceMotion={!!shouldReduceMotion}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default ScrollShowcase;
