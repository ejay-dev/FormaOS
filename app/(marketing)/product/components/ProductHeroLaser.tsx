'use client';

import { memo, useEffect, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { LaserFlow } from '@/components/motion/LaserFlow';

/**
 * ProductHeroLaser
 * ────────────────
 * ReactBits-style laser composition:
 * - LaserFlow with reference parameters
 * - Bottom target surface where laser lands
 * - Strong impact bloom at target edge
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
  const laserY = useTransform(scrollYProgress, [0, 1], [0, 52]);
  const showWebGL = isDesktop && !prefersReduced;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }} aria-hidden>
      <motion.div className="absolute inset-0" style={prefersReduced ? undefined : { y: laserY }}>
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            width: '150vw',
            height: '120vh',
            top: '-10vh',
          }}
        >
          <div
            className="w-full h-full"
            style={{
              WebkitMaskImage:
                'radial-gradient(ellipse 70% 68% at 50% 56%, black 10%, rgba(0,0,0,0.78) 32%, rgba(0,0,0,0.24) 58%, transparent 80%)',
              maskImage:
                'radial-gradient(ellipse 70% 68% at 50% 56%, black 10%, rgba(0,0,0,0.78) 32%, rgba(0,0,0,0.24) 58%, transparent 80%)',
            }}
          >
            {showWebGL ? (
              <LaserFlow
                color="#CF9EFF"
                horizontalBeamOffset={0.1}
                verticalBeamOffset={0.0}
                horizontalSizing={0.5}
                verticalSizing={2}
                wispDensity={1}
                wispSpeed={15}
                wispIntensity={5}
                flowSpeed={0.35}
                flowStrength={0.25}
                fogIntensity={0.45}
                fogScale={0.3}
                fogFallSpeed={0.6}
                decay={1.1}
                falloffStart={1.2}
              />
            ) : (
              <div
                className="w-full h-full"
                style={{
                  background: `
                    radial-gradient(ellipse 16% 64% at 50% 56%, rgba(207,158,255,0.42) 0%, rgba(207,158,255,0.15) 46%, transparent 72%),
                    radial-gradient(ellipse 58% 44% at 50% 72%, rgba(207,158,255,0.14) 0%, transparent 70%)
                  `,
                }}
              />
            )}
          </div>
        </div>
      </motion.div>

      {/* Impact plume right above the surface edge */}
      <div className="absolute left-1/2 top-[56%] -translate-x-1/2 w-[62%] h-[138px]">
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 58% 100% at 50% 60%, rgba(245,221,255,0.88) 0%, rgba(207,158,255,0.42) 36%, rgba(207,158,255,0.16) 58%, transparent 82%)',
            filter: 'blur(18px)',
          }}
        />
        <div
          className="absolute left-1/2 top-[52%] -translate-x-1/2 h-[3px] w-[58%]"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(207,158,255,0.36) 14%, rgba(255,244,255,0.96) 50%, rgba(207,158,255,0.36) 86%, transparent 100%)',
            boxShadow: '0 0 26px rgba(207,158,255,0.72), 0 0 64px rgba(207,158,255,0.46)',
          }}
        />
      </div>

      {/* Noise overlay for smoother gradients */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
          mixBlendMode: 'overlay',
        }}
      />

      <div
        className="absolute bottom-0 left-0 right-0 h-[34%]"
        style={{
          background:
            'linear-gradient(to top, rgba(4,8,18,1) 0%, rgba(4,8,18,0.7) 48%, rgba(4,8,18,0.18) 76%, transparent 100%)',
        }}
      />
    </div>
  );
}

export const ProductHeroLaser = memo(ProductHeroLaserInner);
