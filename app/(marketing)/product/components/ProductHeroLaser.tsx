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
  const impactTop = '82%';

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
                'radial-gradient(ellipse 62% 74% at 50% 68%, black 14%, rgba(0,0,0,0.82) 38%, rgba(0,0,0,0.22) 64%, transparent 84%)',
              maskImage:
                'radial-gradient(ellipse 62% 74% at 50% 68%, black 14%, rgba(0,0,0,0.82) 38%, rgba(0,0,0,0.22) 64%, transparent 84%)',
            }}
          >
            {showWebGL ? (
              <LaserFlow
                color="#C4B5FD"
                horizontalBeamOffset={0}
                verticalBeamOffset={0.26}
                flowSpeed={0.35}
                verticalSizing={2}
                horizontalSizing={0.5}
                fogIntensity={0.45}
                fogScale={0.3}
                wispDensity={1}
                wispSpeed={15}
                wispIntensity={5}
                flowStrength={0.25}
                decay={1.1}
                falloffStart={1.2}
                fogFallSpeed={0.6}
              />
            ) : (
              <div
                className="w-full h-full"
                style={{
                  background: `
                    radial-gradient(ellipse 20% 68% at 50% 56%, rgba(196,181,253,0.32) 0%, rgba(196,181,253,0.11) 48%, transparent 74%),
                    radial-gradient(ellipse 48% 44% at 50% 70%, rgba(56,189,248,0.09) 0%, transparent 74%)
                  `,
                }}
              />
            )}
          </div>
        </div>
      </motion.div>

      {/* Wide volumetric beam haze */}
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2"
        style={{
          width: '184px',
          height: '82%',
          background:
            'linear-gradient(180deg, rgba(196,181,253,0.24) 0%, rgba(196,181,253,0.18) 16%, rgba(167,139,250,0.1) 50%, rgba(167,139,250,0.03) 76%, transparent 100%)',
          filter: 'blur(20px)',
          opacity: showWebGL ? 0.88 : 0.5,
        }}
      />

      {/* Mid beam glow */}
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2"
        style={{
          width: '54px',
          height: '82%',
          background:
            'linear-gradient(180deg, rgba(233,213,255,0.72) 0%, rgba(196,181,253,0.6) 18%, rgba(167,139,250,0.34) 56%, rgba(167,139,250,0.08) 80%, transparent 100%)',
          filter: 'blur(9px)',
          opacity: showWebGL ? 0.96 : 0.72,
        }}
      />

      {/* Core beam */}
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2"
        style={{
          width: '8px',
          height: '82%',
          background:
            'linear-gradient(180deg, rgba(255,245,255,0.98) 0%, rgba(233,213,255,0.96) 20%, rgba(196,181,253,0.8) 56%, rgba(167,139,250,0.2) 82%, transparent 100%)',
          boxShadow:
            '0 0 24px rgba(233,213,255,0.94), 0 0 54px rgba(196,181,253,0.74), 0 0 110px rgba(167,139,250,0.44)',
          opacity: showWebGL ? 0.98 : 0.82,
        }}
      />

      {/* Impact plume */}
      <div className="absolute left-0 right-0 -translate-y-1/2" style={{ top: impactTop }}>
        <div
          className="mx-auto"
          style={{
            width: '68%',
            height: '156px',
            background:
              'radial-gradient(ellipse 72% 100% at 50% 50%, rgba(255,244,255,0.72) 0%, rgba(233,213,255,0.44) 24%, rgba(167,139,250,0.24) 48%, rgba(56,189,248,0.1) 64%, transparent 84%)',
            filter: 'blur(22px)',
          }}
        />
        <div
          className="mx-auto -mt-[98px]"
          style={{
            width: '52%',
            height: '4px',
            background:
              'linear-gradient(90deg, transparent 0%, rgba(196,181,253,0.42) 14%, rgba(255,243,255,0.98) 50%, rgba(196,181,253,0.42) 86%, transparent 100%)',
            boxShadow: '0 0 32px rgba(233,213,255,0.86), 0 0 76px rgba(167,139,250,0.5)',
          }}
        />
      </div>

      {/* Ground line at section bottom */}
      <div
        className="absolute inset-x-0 mx-auto h-[1px] w-[80%]"
        style={{
          top: `calc(${impactTop} + 2px)`,
          background:
            'linear-gradient(90deg, transparent 0%, rgba(167,139,250,0.26) 18%, rgba(233,213,255,0.72) 50%, rgba(167,139,250,0.26) 82%, transparent 100%)',
          boxShadow: '0 0 20px rgba(167,139,250,0.42)',
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
