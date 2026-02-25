'use client';

import { memo } from 'react';
import { motion, useReducedMotion, useTransform } from 'framer-motion';
import { useCursorPosition } from '@/components/motion/CursorContext';
import { easing, duration } from '@/config/motion';

const signatureEase = [...easing.signature] as [number, number, number, number];

// ─── Tier card data ───

interface TierCard {
  tier: string;
  price: string;
  period: string | null;
  z: number;
  xOffset: number;
  yOffset: number;
  tiltIntensity: number;
  blur: number;
  isCenter: boolean;
  accentColor: string;
  borderColor: string;
  glowColor: string;
  features: Array<{ label: string; width: string }>;
}

const TIERS: TierCard[] = [
  {
    tier: 'STARTER',
    price: '$49',
    period: '/mo',
    z: -70,
    xOffset: -160,
    yOffset: 30,
    tiltIntensity: 2,
    blur: 2,
    isCenter: false,
    accentColor: 'text-cyan-400/70',
    borderColor: 'border-cyan-500/20',
    glowColor: '',
    features: [
      { label: 'Core compliance', width: '72%' },
      { label: 'Evidence vault', width: '58%' },
      { label: 'Basic reports', width: '44%' },
    ],
  },
  {
    tier: 'PROFESSIONAL',
    price: '$149',
    period: '/mo',
    z: 0,
    xOffset: 0,
    yOffset: -10,
    tiltIntensity: 4,
    blur: 0,
    isCenter: true,
    accentColor: 'text-violet-300',
    borderColor: 'border-violet-400/40',
    glowColor: '0 0 40px rgba(139,92,246,0.18), 0 0 80px rgba(139,92,246,0.08)',
    features: [
      { label: 'Full framework map', width: '82%' },
      { label: 'Evidence automation', width: '68%' },
      { label: 'Custom reporting', width: '55%' },
      { label: 'Priority support', width: '45%' },
    ],
  },
  {
    tier: 'ENTERPRISE',
    price: 'Custom',
    period: null,
    z: -40,
    xOffset: 155,
    yOffset: 15,
    tiltIntensity: 3,
    blur: 1,
    isCenter: false,
    accentColor: 'text-emerald-400/70',
    borderColor: 'border-emerald-500/20',
    glowColor: '',
    features: [
      { label: 'Unlimited controls', width: '76%' },
      { label: 'SSO + SAML', width: '60%' },
      { label: 'Dedicated CSM', width: '48%' },
    ],
  },
];

/**
 * PricingHeroVisual
 * ─────────────────
 * Three pricing tier cards in true CSS 3D depth space with cursor parallax.
 * Front (Pro) card is largest/brightest, back cards progressively blur.
 * Individual card hover lifts card forward.
 */
function PricingHeroVisualInner() {
  const shouldReduceMotion = useReducedMotion();
  const sa = !shouldReduceMotion;
  const cursor = useCursorPosition();

  // Per-card cursor transforms are derived inside the card render

  if (shouldReduceMotion) {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="hidden lg:block relative w-[500px] h-[400px] xl:w-[560px] xl:h-[440px]">
          {TIERS.map((card) => (
            <div
              key={card.tier}
              className={`absolute rounded-2xl p-5 backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border ${card.borderColor}`}
              style={{
                width: card.isCenter ? 180 : 160,
                height: card.isCenter ? 240 : 210,
                left: `calc(50% + ${card.xOffset}px - ${card.isCenter ? 90 : 80}px)`,
                top: `calc(50% + ${card.yOffset}px - ${card.isCenter ? 120 : 105}px)`,
              }}
            >
              <span className={`text-[11px] font-semibold tracking-wider ${card.accentColor}`}>{card.tier}</span>
              <div className="mt-2">
                <span className="text-2xl font-bold text-white/90">{card.price}</span>
                {card.period && <span className="text-xs text-white/40 ml-0.5">{card.period}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      <div className="hidden lg:block relative w-[500px] h-[400px] xl:w-[560px] xl:h-[440px]">
        {/* Ambient glow behind Pro card */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-64"
          animate={{ opacity: [0.12, 0.25, 0.12], scale: [1, 1.06, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-full h-full rounded-3xl bg-violet-500/20 blur-3xl" />
        </motion.div>

        {/* 3D perspective container */}
        <div style={{ perspective: 1000, transformStyle: 'preserve-3d' }} className="absolute inset-0">
          {/* Floating group animation */}
          <motion.div
            animate={sa ? { y: [0, -8, 0] } : undefined}
            transition={sa ? { duration: 6, repeat: Infinity, ease: 'easeInOut' } : undefined}
            className="absolute inset-0"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {TIERS.map((card, i) => (
              <TierCardVisual key={card.tier} card={card} index={i} cursor={cursor} sa={sa} />
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/** Individual tier card with cursor-reactive 3D tilt */
function TierCardVisual({
  card,
  index,
  cursor,
  sa,
}: {
  card: TierCard;
  index: number;
  cursor: ReturnType<typeof useCursorPosition>;
  sa: boolean;
}) {
  const intensity = card.tiltIntensity;
  const rotateX = useTransform(cursor.mouseY, [0, 1], [-intensity, intensity]);
  const rotateY = useTransform(cursor.mouseX, [0, 1], [intensity, -intensity]);

  const cardWidth = card.isCenter ? 180 : 160;
  const cardHeight = card.isCenter ? 240 : 210;

  return (
    <motion.div
      className="absolute"
      style={{
        left: `calc(50% + ${card.xOffset}px - ${cardWidth / 2}px)`,
        top: `calc(50% + ${card.yOffset}px - ${cardHeight / 2}px)`,
        width: cardWidth,
        height: cardHeight,
        translateZ: card.z,
        ...(cursor.isActive ? { rotateX, rotateY } : {}),
        transformStyle: 'preserve-3d',
        filter: card.blur > 0 ? `blur(${card.blur}px)` : undefined,
      }}
      initial={sa ? { opacity: 0, scale: 0.85, filter: 'blur(10px)' } : false}
      animate={{ opacity: 1, scale: 1, filter: card.blur > 0 ? `blur(${card.blur}px)` : 'blur(0px)' }}
      transition={sa ? {
        duration: duration.slower,
        delay: 0.3 + index * 0.2,
        ease: signatureEase,
      } : { duration: 0 }}
    >
      <div
        className={`w-full h-full rounded-2xl p-5 backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border ${card.borderColor} flex flex-col`}
        style={{ boxShadow: card.glowColor || undefined }}
      >
        {/* Tier badge */}
        <span className={`text-[11px] font-semibold tracking-wider ${card.accentColor}`}>
          {card.tier}
        </span>

        {/* Price */}
        <div className="mt-2.5">
          <span className={`text-2xl xl:text-3xl font-bold ${card.isCenter ? 'text-white/95' : 'text-white/70'}`}>
            {card.price}
          </span>
          {card.period && (
            <span className="text-xs text-white/35 ml-0.5">{card.period}</span>
          )}
        </div>

        {/* Feature lines */}
        <div className="mt-4 flex flex-col gap-2">
          {card.features.map((feat, fi) => (
            <div key={fi} className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${card.isCenter ? 'bg-violet-400/50' : 'bg-white/20'}`} />
              <motion.div
                className={`h-[3px] rounded-full ${card.isCenter ? 'bg-violet-400/25' : 'bg-white/[0.08]'}`}
                style={{ width: feat.width }}
                initial={sa ? { scaleX: 0, transformOrigin: 'left' } : false}
                animate={{ scaleX: 1 }}
                transition={sa ? {
                  duration: 0.6,
                  delay: 0.8 + index * 0.2 + fi * 0.08,
                  ease: signatureEase,
                } : { duration: 0 }}
              />
            </div>
          ))}
        </div>

        {/* CTA bar */}
        <motion.div
          className={`mt-auto h-[28px] rounded-lg flex items-center justify-center ${
            card.isCenter
              ? 'bg-violet-500/25 border border-violet-400/25'
              : 'bg-white/[0.05] border border-white/[0.08]'
          }`}
          initial={sa ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={sa ? { duration: 0.5, delay: 1.2 + index * 0.15 } : { duration: 0 }}
        >
          <div className={`w-10 h-[3px] rounded-full ${card.isCenter ? 'bg-violet-400/30' : 'bg-white/10'}`} />
        </motion.div>
      </div>
    </motion.div>
  );
}

export const PricingHeroVisual = memo(PricingHeroVisualInner);
export default PricingHeroVisual;
