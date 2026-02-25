'use client';

import { memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { easing, duration } from '@/config/motion';

const signatureEase = [...easing.signature] as [number, number, number, number];

/**
 * PricingHeroVisual
 * ─────────────────
 * Unique visual for the Pricing page hero:
 * - Three floating glass-morphism tier cards with depth stacking
 * - Subtle Y-axis rotation oscillation per card
 * - Center card highlighted with violet glow border
 *
 * Rendered in the midground DepthLayer of ImmersiveHero.
 * Desktop-only (hidden on mobile for performance).
 */
function PricingHeroVisualInner() {
  const shouldReduceMotion = useReducedMotion();
  const sa = !shouldReduceMotion;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {/* Pricing tier cards — desktop only */}
      <div className="hidden lg:block relative w-[600px] h-[600px] xl:w-[700px] xl:h-[700px]">
        {/* Ambient glow behind center card */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-56"
          animate={sa ? {
            opacity: [0.15, 0.3, 0.15],
            scale: [1, 1.08, 1],
          } : undefined}
          transition={sa ? {
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
          } : undefined}
        >
          <div className="w-full h-full rounded-3xl bg-violet-500/20 blur-3xl" />
        </motion.div>

        {/* Tier cards */}
        {TIER_CARDS.map((card, i) => (
          <motion.div
            key={card.tier}
            className="absolute"
            style={{
              left: card.left,
              top: card.top,
              zIndex: card.zIndex,
              perspective: '800px',
            }}
            initial={sa ? { opacity: 0, y: 30, scale: 0.9 } : false}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={sa ? {
              duration: duration.slower,
              delay: 0.5 + i * 0.18,
              ease: signatureEase,
            } : { duration: 0 }}
          >
            <motion.div
              className={`w-[140px] xl:w-[160px] h-[180px] xl:h-[200px] rounded-2xl p-4 flex flex-col
                ${card.isCenter
                  ? 'bg-white/[0.08] border border-violet-400/30 shadow-[0_0_30px_rgba(139,92,246,0.15)]'
                  : 'bg-white/[0.06] border border-white/[0.1]'
                }
                backdrop-blur-sm`}
              animate={sa ? {
                rotateY: [-3, 3, -3],
              } : undefined}
              transition={sa ? {
                duration: card.oscillationDuration,
                repeat: Infinity,
                ease: 'easeInOut',
              } : undefined}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Tier name */}
              <span className={`text-[11px] xl:text-xs font-semibold tracking-wide ${
                card.isCenter ? 'text-violet-300/90' : 'text-white/50'
              }`}>
                {card.tier}
              </span>

              {/* Price */}
              <span className={`mt-2 text-lg xl:text-xl font-bold ${
                card.isCenter ? 'text-white/90' : 'text-white/60'
              }`}>
                {card.price}
              </span>
              {card.period && (
                <span className="text-[9px] text-white/30 -mt-0.5">{card.period}</span>
              )}

              {/* Feature lines */}
              <div className="mt-3 flex flex-col gap-1.5">
                {card.features.map((width, fi) => (
                  <motion.div
                    key={fi}
                    className={`h-[3px] rounded-full ${
                      card.isCenter ? 'bg-violet-400/20' : 'bg-white/[0.08]'
                    }`}
                    style={{ width }}
                    initial={sa ? { scaleX: 0 } : false}
                    animate={{ scaleX: 1 }}
                    transition={sa ? {
                      duration: 0.6,
                      delay: 1.2 + i * 0.18 + fi * 0.1,
                      ease: signatureEase,
                    } : { duration: 0 }}
                  />
                ))}
              </div>

              {/* CTA bar placeholder */}
              <motion.div
                className={`mt-auto h-[22px] xl:h-[26px] rounded-lg ${
                  card.isCenter
                    ? 'bg-violet-500/20 border border-violet-400/20'
                    : 'bg-white/[0.05] border border-white/[0.08]'
                }`}
                initial={sa ? { opacity: 0 } : false}
                animate={{ opacity: 1 }}
                transition={sa ? {
                  duration: duration.slow,
                  delay: 1.5 + i * 0.15,
                } : { duration: 0 }}
              />
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Data ───

const TIER_CARDS = [
  {
    tier: 'STARTER',
    price: '$49',
    period: '/mo',
    left: 'calc(50% - 200px)',
    top: 'calc(50% - 75px)',
    zIndex: 1,
    isCenter: false,
    oscillationDuration: 7,
    features: ['70%', '55%', '40%'],
  },
  {
    tier: 'PROFESSIONAL',
    price: '$149',
    period: '/mo',
    left: 'calc(50% - 70px)',
    top: 'calc(50% - 100px)',
    zIndex: 3,
    isCenter: true,
    oscillationDuration: 6,
    features: ['80%', '65%', '50%'],
  },
  {
    tier: 'ENTERPRISE',
    price: 'Custom',
    period: null,
    left: 'calc(50% + 75px)',
    top: 'calc(50% - 65px)',
    zIndex: 2,
    isCenter: false,
    oscillationDuration: 8,
    features: ['75%', '60%'],
  },
];

export const PricingHeroVisual = memo(PricingHeroVisualInner);
export default PricingHeroVisual;
