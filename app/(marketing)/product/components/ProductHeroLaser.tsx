'use client';

import { memo, useEffect, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { LaserFlow } from '@/components/motion/LaserFlow';

/**
 * ProductHeroLaser
 * ────────────────
 * ReactBits-inspired vertical laser with a clear landing zone at the
 * bottom of the Product hero section.
 */

function ProductHeroLaserInner() {
  const prefersReduced = useReducedMotion();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setIsDesktop(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const { scrollYProgress } = useScroll();
  const laserY = useTransform(scrollYProgress, [0, 1], [0, 48]);

  const showWebGL = isDesktop && !prefersReduced;
  const impactTop = '84%';

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }} aria-hidden>
      <motion.div className="absolute inset-0" style={prefersReduced ? undefined : { y: laserY }}>
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            width: '150vw',
            height: '130vh',
            top: '-18vh',
          }}
        >
          <div
            className="w-full h-full"
            style={{
              WebkitMaskImage:
                'radial-gradient(ellipse 58% 72% at 50% 62%, black 12%, rgba(0,0,0,0.78) 36%, rgba(0,0,0,0.2) 62%, transparent 82%)',
              maskImage:
                'radial-gradient(ellipse 58% 72% at 50% 62%, black 12%, rgba(0,0,0,0.78) 36%, rgba(0,0,0,0.2) 62%, transparent 82%)',
            }}
          >
            {showWebGL ? (
              <LaserFlow
                color="#A78BFA"
                horizontalBeamOffset={0}
                verticalBeamOffset={0.32}
                flowSpeed={0.18}
                verticalSizing={4.4}
                horizontalSizing={0.78}
                fogIntensity={0.72}
                fogScale={0.26}
                wispDensity={1.05}
                wispSpeed={9}
                wispIntensity={8.4}
                flowStrength={0.34}
                decay={1.18}
                falloffStart={1.34}
                fogFallSpeed={0.42}
              />
            ) : (
              <div
                className="w-full h-full"
                style={{
                  background: `
                    radial-gradient(ellipse 32% 58% at 50% 68%, rgba(167,139,250,0.26) 0%, rgba(167,139,250,0.08) 54%, transparent 78%),
                    radial-gradient(ellipse 52% 42% at 50% 72%, rgba(56,189,248,0.08) 0%, transparent 74%)
                  `,
                }}
              />
            )}
          </div>
        </div>
      </motion.div>

      {/* Core beam */}
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2"
        style={{
          width: '2px',
          height: '84%',
          background:
            'linear-gradient(180deg, rgba(233,213,255,0.92) 0%, rgba(196,181,253,0.82) 18%, rgba(167,139,250,0.7) 58%, rgba(167,139,250,0.05) 100%)',
          boxShadow:
            '0 0 18px rgba(196,181,253,0.9), 0 0 42px rgba(167,139,250,0.6), 0 0 82px rgba(167,139,250,0.34)',
          opacity: showWebGL ? 0.86 : 0.62,
        }}
      />

      {/* Atmospheric beam haze */}
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2"
        style={{
          width: '130px',
          height: '84%',
          background:
            'linear-gradient(180deg, rgba(167,139,250,0.2) 0%, rgba(167,139,250,0.12) 36%, rgba(167,139,250,0.04) 78%, transparent 100%)',
          filter: 'blur(14px)',
          opacity: showWebGL ? 0.8 : 0.45,
        }}
      />

      {/* Impact plume */}
      <div className="absolute left-0 right-0 -translate-y-1/2" style={{ top: impactTop }}>
        <div
          className="mx-auto"
          style={{
            width: '64%',
            height: '130px',
            background:
              'radial-gradient(ellipse 70% 100% at 50% 50%, rgba(233,213,255,0.56) 0%, rgba(167,139,250,0.3) 34%, rgba(56,189,248,0.12) 58%, transparent 82%)',
            filter: 'blur(18px)',
          }}
        />
        <div
          className="mx-auto -mt-[84px]"
          style={{
            width: '46%',
            height: '3px',
            background:
              'linear-gradient(90deg, transparent 0%, rgba(196,181,253,0.35) 18%, rgba(233,213,255,0.95) 50%, rgba(196,181,253,0.35) 82%, transparent 100%)',
            boxShadow: '0 0 28px rgba(216,180,254,0.7), 0 0 60px rgba(167,139,250,0.36)',
          }}
        />
      </div>

      {/* Ground line at section bottom */}
      <div
        className="absolute inset-x-0 bottom-[11%] mx-auto h-[1px] w-[78%]"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(167,139,250,0.2) 20%, rgba(233,213,255,0.64) 50%, rgba(167,139,250,0.2) 80%, transparent 100%)',
          boxShadow: '0 0 18px rgba(167,139,250,0.32)',
        }}
      />

      {/* Bottom blend */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[34%]"
        style={{
          background:
            'linear-gradient(to top, rgba(4,8,18,1) 0%, rgba(4,8,18,0.72) 44%, rgba(4,8,18,0.2) 74%, transparent 100%)',
        }}
      />
    </div>
  );
}

export const ProductHeroLaser = memo(ProductHeroLaserInner);
