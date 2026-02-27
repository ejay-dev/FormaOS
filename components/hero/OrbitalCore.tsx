'use client';

import { memo, useMemo, useRef } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';

const STAGE_SIZE = 980;
const RING_INNER = 360;
const RING_MID = 540;
const RING_OUTER = 730;
const RING_SATELLITE = 860;

const RING_MASK_INNER =
  'radial-gradient(circle at center, transparent 45.5%, black 46.5% 49.5%, transparent 50.5%)';
const RING_MASK_MID =
  'radial-gradient(circle at center, transparent 46%, black 47% 49.5%, transparent 50.5%)';
const RING_MASK_OUTER =
  'radial-gradient(circle at center, transparent 47%, black 48% 49.5%, transparent 50%)';

type Dust = {
  x: number;
  y: number;
  sz: number;
  opacity: number;
  color: string;
  duration: number;
  delay: number;
  dx: number;
  dy: number;
};

const DUST_FIELD: Dust[] = [
  { x: 6, y: 12, sz: 1, opacity: 0.14, color: 'rgba(45,212,191,0.8)', duration: 22, delay: 0, dx: 10, dy: -18 },
  { x: 18, y: 26, sz: 1, opacity: 0.2, color: 'rgba(255,255,255,0.2)', duration: 29, delay: 1.8, dx: 18, dy: -24 },
  { x: 27, y: 8, sz: 2, opacity: 0.13, color: 'rgba(34,211,238,0.8)', duration: 31, delay: 0.9, dx: 13, dy: -19 },
  { x: 38, y: 18, sz: 1, opacity: 0.17, color: 'rgba(129,140,248,0.7)', duration: 24, delay: 3.1, dx: -11, dy: -28 },
  { x: 47, y: 30, sz: 1, opacity: 0.15, color: 'rgba(45,212,191,0.8)', duration: 35, delay: 4.2, dx: 12, dy: -22 },
  { x: 58, y: 15, sz: 1, opacity: 0.11, color: 'rgba(255,255,255,0.18)', duration: 27, delay: 2.6, dx: 8, dy: -16 },
  { x: 70, y: 10, sz: 2, opacity: 0.14, color: 'rgba(34,211,238,0.7)', duration: 38, delay: 5.7, dx: -14, dy: -34 },
  { x: 82, y: 20, sz: 1, opacity: 0.16, color: 'rgba(45,212,191,0.75)', duration: 23, delay: 7.5, dx: -19, dy: -18 },
  { x: 92, y: 34, sz: 1, opacity: 0.18, color: 'rgba(255,255,255,0.19)', duration: 40, delay: 2.7, dx: -21, dy: -26 },
  { x: 11, y: 42, sz: 1, opacity: 0.12, color: 'rgba(129,140,248,0.75)', duration: 28, delay: 8.2, dx: 13, dy: -29 },
  { x: 23, y: 50, sz: 2, opacity: 0.1, color: 'rgba(45,212,191,0.7)', duration: 36, delay: 4.8, dx: 15, dy: -23 },
  { x: 37, y: 57, sz: 1, opacity: 0.21, color: 'rgba(255,255,255,0.2)', duration: 25, delay: 3.5, dx: 9, dy: -27 },
  { x: 49, y: 47, sz: 1, opacity: 0.16, color: 'rgba(34,211,238,0.78)', duration: 33, delay: 9.3, dx: -10, dy: -21 },
  { x: 63, y: 52, sz: 1, opacity: 0.12, color: 'rgba(129,140,248,0.8)', duration: 30, delay: 7.1, dx: -15, dy: -25 },
  { x: 74, y: 63, sz: 2, opacity: 0.11, color: 'rgba(45,212,191,0.76)', duration: 42, delay: 1.3, dx: -8, dy: -19 },
  { x: 86, y: 58, sz: 1, opacity: 0.2, color: 'rgba(255,255,255,0.2)', duration: 26, delay: 5.6, dx: -16, dy: -28 },
  { x: 95, y: 46, sz: 1, opacity: 0.14, color: 'rgba(34,211,238,0.7)', duration: 32, delay: 6.4, dx: -20, dy: -15 },
  { x: 6, y: 70, sz: 1, opacity: 0.19, color: 'rgba(129,140,248,0.7)', duration: 39, delay: 3.2, dx: 10, dy: -33 },
  { x: 16, y: 82, sz: 2, opacity: 0.11, color: 'rgba(45,212,191,0.8)', duration: 27, delay: 0.6, dx: 12, dy: -20 },
  { x: 28, y: 90, sz: 1, opacity: 0.15, color: 'rgba(255,255,255,0.17)', duration: 36, delay: 11.3, dx: 7, dy: -34 },
  { x: 41, y: 86, sz: 1, opacity: 0.13, color: 'rgba(34,211,238,0.8)', duration: 24, delay: 4.9, dx: 13, dy: -26 },
  { x: 53, y: 78, sz: 1, opacity: 0.18, color: 'rgba(129,140,248,0.75)', duration: 28, delay: 9.4, dx: -9, dy: -18 },
  { x: 67, y: 84, sz: 2, opacity: 0.12, color: 'rgba(45,212,191,0.77)', duration: 31, delay: 2.1, dx: -15, dy: -29 },
  { x: 80, y: 91, sz: 1, opacity: 0.2, color: 'rgba(255,255,255,0.2)', duration: 35, delay: 6.6, dx: -11, dy: -32 },
  { x: 92, y: 80, sz: 1, opacity: 0.15, color: 'rgba(34,211,238,0.72)', duration: 41, delay: 5.2, dx: -19, dy: -23 },
  { x: 72, y: 38, sz: 1, opacity: 0.14, color: 'rgba(45,212,191,0.72)', duration: 30, delay: 4.4, dx: 13, dy: -30 },
  { x: 52, y: 6, sz: 1, opacity: 0.16, color: 'rgba(129,140,248,0.76)', duration: 27, delay: 1.7, dx: 8, dy: -22 },
  { x: 32, y: 68, sz: 1, opacity: 0.11, color: 'rgba(255,255,255,0.17)', duration: 43, delay: 8.8, dx: 14, dy: -37 },
  { x: 61, y: 66, sz: 2, opacity: 0.12, color: 'rgba(34,211,238,0.7)', duration: 34, delay: 10.4, dx: -13, dy: -24 },
  { x: 44, y: 40, sz: 1, opacity: 0.19, color: 'rgba(45,212,191,0.84)', duration: 29, delay: 12.2, dx: 15, dy: -18 },
];

const rad = (deg: number) => (deg * Math.PI) / 180;

interface RingNode {
  angle: number;
  color: string;
  size: number;
  glow: number;
  delay: number;
}

function GlowNode({
  angle,
  radius,
  color,
  size,
  glow,
  delay,
  on,
}: RingNode & { radius: number; on: boolean }) {
  const x = Math.cos(rad(angle)) * radius;
  const y = Math.sin(rad(angle)) * radius;

  return (
    <div
      style={{
        position: 'absolute',
        left: `calc(50% + ${x}px - ${size / 2}px)`,
        top: `calc(50% + ${y}px - ${size / 2}px)`,
        width: size,
        height: size,
      }}
    >
      <motion.div
        style={{
          position: 'absolute',
          inset: -glow / 2,
          borderRadius: '999px',
          background: `radial-gradient(circle, ${color} 0%, transparent 75%)`,
          filter: `blur(${Math.round(glow / 3)}px)`,
        }}
        animate={on ? { opacity: [0.22, 0.7, 0.22] } : { opacity: 0.35 }}
        transition={
          on
            ? { duration: 7.5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut', delay }
            : undefined
        }
      />
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '999px',
          background: color,
          opacity: 0.92,
        }}
      />
    </div>
  );
}

function SweepScanner({ on }: { on: boolean }) {
  return (
    <motion.div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '50%',
        background:
          'conic-gradient(from 0deg, rgba(45,212,191,0.0) 0deg, rgba(45,212,191,0.0) 310deg, rgba(45,212,191,0.35) 340deg, rgba(56,189,248,0.42) 352deg, rgba(255,255,255,0.0) 360deg)',
        WebkitMaskImage:
          'radial-gradient(circle at center, transparent 34%, black 36% 65%, transparent 70%)',
        maskImage:
          'radial-gradient(circle at center, transparent 34%, black 36% 65%, transparent 70%)',
        mixBlendMode: 'screen',
      }}
      animate={on ? { rotateZ: 360 } : { rotateZ: 18 }}
      transition={
        on ? { duration: 9.5, repeat: Infinity, ease: 'linear' } : { duration: 0 }
      }
    />
  );
}

function RingLayer({
  diameter,
  tilt,
  borderColor,
  arcGradient,
  mask,
  duration,
  reverse,
  nodes,
  on,
}: {
  diameter: number;
  tilt: number;
  borderColor: string;
  arcGradient: string;
  mask: string;
  duration: number;
  reverse?: boolean;
  nodes: RingNode[];
  on: boolean;
}) {
  const rotationValue = reverse ? -360 : 360;
  return (
    <motion.div
      style={{
        position: 'absolute',
        width: diameter,
        height: diameter,
        top: '50%',
        left: '50%',
        marginLeft: -diameter / 2,
        marginTop: -diameter / 2,
        rotateX: tilt,
        willChange: 'transform',
      }}
      animate={on ? { rotateZ: rotationValue } : { rotateZ: reverse ? -14 : 14 }}
      transition={on ? { duration, repeat: Infinity, ease: 'linear' } : { duration: 0 }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: `1px solid ${borderColor}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: arcGradient,
          WebkitMaskImage: mask,
          maskImage: mask,
        }}
      />
      {nodes.map((node) => (
        <GlowNode
          key={`${diameter}-${node.angle}`}
          {...node}
          radius={diameter / 2}
          on={on}
        />
      ))}
    </motion.div>
  );
}

function SatelliteOrbit({
  diameter,
  color,
  duration,
  delay,
  on,
}: {
  diameter: number;
  color: string;
  duration: number;
  delay: number;
  on: boolean;
}) {
  return (
    <motion.div
      style={{
        position: 'absolute',
        width: diameter,
        height: diameter,
        top: '50%',
        left: '50%',
        marginLeft: -diameter / 2,
        marginTop: -diameter / 2,
        rotateX: 72,
      }}
      animate={on ? { rotateZ: 360 } : { rotateZ: 0 }}
      transition={
        on
          ? { duration, repeat: Infinity, ease: 'linear', delay }
          : { duration: 0 }
      }
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          width: 8,
          height: 8,
          marginLeft: -4,
          borderRadius: 999,
          background: color,
          boxShadow: `0 0 16px ${color}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: -12,
          left: '50%',
          width: 1,
          height: 22,
          marginLeft: -0.5,
          background: `linear-gradient(to top, ${color}, transparent)`,
          opacity: 0.7,
        }}
      />
    </motion.div>
  );
}

function DustField({ on }: { on: boolean }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {DUST_FIELD.map((particle, index) => (
        <motion.div
          key={index}
          style={{
            position: 'absolute',
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.sz,
            height: particle.sz,
            borderRadius: '50%',
            background: particle.color,
          }}
          animate={
            on
              ? { x: particle.dx, y: particle.dy, opacity: [particle.opacity, particle.opacity * 0.25, particle.opacity] }
              : { opacity: particle.opacity * 0.45 }
          }
          initial={{ x: 0, y: 0, opacity: particle.opacity }}
          transition={
            on
              ? {
                  duration: particle.duration,
                  delay: particle.delay,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  ease: 'easeInOut',
                }
              : undefined
          }
        />
      ))}
    </div>
  );
}

function OrbitalCoreInner({ shouldAnimate = true, className }: OrbitalCoreProps) {
  const prefersReduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const on = shouldAnimate && !prefersReduced;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const stageY = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const stageRotZ = useTransform(scrollYProgress, [0, 1], [0, 3.4]);
  const stageScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);

  const ringMidTicks = useMemo(() => {
    const tickCount = 16;
    const gap = 360 / tickCount;
    const width = 4;
    const stops: string[] = [];
    for (let i = 0; i < tickCount; i++) {
      const start = i * gap;
      const end = start + width;
      stops.push(
        `rgba(125,211,252,0.24) ${start}deg ${end}deg`,
        `transparent ${end}deg ${(i + 1) * gap}deg`,
      );
    }
    return `conic-gradient(from 0deg, ${stops.join(',')})`;
  }, []);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 z-0 pointer-events-none ${className ?? ''}`}
      aria-hidden
    >
      <DustField on={on} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 65% 44% at 50% 35%, rgba(56,189,248,0.14) 0%, transparent 76%)',
          opacity: 0.88,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 48% 36% at 50% 60%, rgba(45,212,191,0.1) 0%, transparent 80%)',
          opacity: 0.7,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(to right, rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.05) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          WebkitMaskImage:
            'radial-gradient(ellipse 78% 66% at 50% 45%, black 30%, transparent 78%)',
          maskImage:
            'radial-gradient(ellipse 78% 66% at 50% 45%, black 30%, transparent 78%)',
          opacity: 0.22,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 760,
          height: 380,
          marginLeft: -380,
          marginTop: -190,
          background:
            'radial-gradient(ellipse 70% 62% at 50% 50%, rgba(10,15,28,0.28) 0%, rgba(10,15,28,0.68) 70%, transparent 92%)',
        }}
      />

      <div
        className="orbital-core-stage"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: STAGE_SIZE,
          height: STAGE_SIZE,
          marginLeft: -STAGE_SIZE / 2,
          marginTop: -STAGE_SIZE / 2,
        }}
      >
        <motion.div
          style={{
            width: '100%',
            height: '100%',
            perspective: '1300px',
            isolation: 'isolate',
            willChange: 'transform',
            ...(prefersReduced
              ? {}
              : { y: stageY, rotateZ: stageRotZ, scale: stageScale }),
          }}
          animate={
            on
              ? {
                  rotateY: [0, 1.4, -0.9, 1.1, -0.7, 0],
                  rotateX: [0, 0.35, -0.25, 0.45, -0.28, 0],
                }
              : undefined
          }
          transition={
            on
              ? {
                  duration: 24,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  times: [0, 0.2, 0.4, 0.62, 0.84, 1],
                }
              : undefined
          }
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse 64% 56% at 50% 50%, rgba(255,255,255,0.05) 0%, transparent 76%)',
              filter: 'blur(18px)',
            }}
          />

          <SweepScanner on={on} />

          <RingLayer
            diameter={RING_OUTER}
            tilt={70}
            borderColor="rgba(34,211,238,0.14)"
            arcGradient="conic-gradient(from 200deg, rgba(34,211,238,0.0) 0deg 308deg, rgba(34,211,238,0.36) 330deg 352deg, rgba(255,255,255,0.08) 352deg 360deg)"
            mask={RING_MASK_OUTER}
            duration={54}
            nodes={[
              { angle: 42, color: 'rgba(34,211,238,0.92)', size: 5, glow: 16, delay: 2.2 },
              { angle: 186, color: 'rgba(45,212,191,0.92)', size: 6, glow: 18, delay: 5.8 },
              { angle: 298, color: 'rgba(147,197,253,0.9)', size: 5, glow: 14, delay: 9.1 },
            ]}
            on={on}
          />

          <RingLayer
            diameter={RING_MID}
            tilt={64}
            borderColor="rgba(129,140,248,0.16)"
            arcGradient={ringMidTicks}
            mask={RING_MASK_MID}
            duration={34}
            reverse
            nodes={[
              { angle: 25, color: 'rgba(129,140,248,0.92)', size: 6, glow: 18, delay: 1.4 },
              { angle: 117, color: 'rgba(255,255,255,0.85)', size: 5, glow: 16, delay: 4.2 },
              { angle: 214, color: 'rgba(34,211,238,0.9)', size: 6, glow: 18, delay: 7.3 },
              { angle: 305, color: 'rgba(45,212,191,0.92)', size: 5, glow: 16, delay: 10.2 },
            ]}
            on={on}
          />

          <RingLayer
            diameter={RING_INNER}
            tilt={76}
            borderColor="rgba(45,212,191,0.22)"
            arcGradient="conic-gradient(from 35deg, rgba(45,212,191,0.55) 0deg 18deg, transparent 18deg 150deg, rgba(56,189,248,0.46) 150deg 166deg, transparent 166deg 360deg)"
            mask={RING_MASK_INNER}
            duration={22}
            nodes={[
              { angle: 0, color: 'rgba(45,212,191,0.94)', size: 7, glow: 22, delay: 0.2 },
              { angle: 123, color: 'rgba(56,189,248,0.95)', size: 7, glow: 20, delay: 3.4 },
              { angle: 240, color: 'rgba(129,140,248,0.92)', size: 6, glow: 20, delay: 6.1 },
            ]}
            on={on}
          />

          <SatelliteOrbit
            diameter={RING_SATELLITE}
            color="rgba(56,189,248,0.85)"
            duration={68}
            delay={0}
            on={on}
          />
          <SatelliteOrbit
            diameter={RING_SATELLITE - 86}
            color="rgba(45,212,191,0.82)"
            duration={49}
            delay={1.8}
            on={on}
          />

          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 620,
              height: 1,
              marginLeft: -310,
              background:
                'linear-gradient(to right, transparent, rgba(148,163,184,0.32), transparent)',
              opacity: 0.4,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 1,
              height: 620,
              marginTop: -310,
              background:
                'linear-gradient(to bottom, transparent, rgba(148,163,184,0.28), transparent)',
              opacity: 0.35,
            }}
          />

          <motion.div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 870,
              height: 470,
              marginLeft: -435,
              marginTop: -235,
              borderRadius: '50%',
              background:
                'radial-gradient(ellipse 64% 48% at 50% 50%, rgba(45,212,191,0.14) 0%, rgba(56,189,248,0.11) 34%, rgba(129,140,248,0.08) 56%, transparent 76%)',
              filter: 'blur(36px)',
            }}
            animate={on ? { opacity: [0.42, 0.95, 0.42] } : { opacity: 0.6 }}
            transition={on ? { duration: 8, repeat: Infinity, ease: 'easeInOut' } : undefined}
          />

          <motion.div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 254,
              height: 254,
              marginLeft: -127,
              marginTop: -127,
              borderRadius: '50%',
              background:
                'radial-gradient(circle, rgba(45,212,191,0.92) 0%, rgba(56,189,248,0.56) 24%, rgba(129,140,248,0.36) 48%, rgba(129,140,248,0.14) 66%, transparent 82%)',
              filter: 'blur(8px)',
            }}
            animate={
              on
                ? { scale: [0.96, 1.06, 0.96], opacity: [0.78, 1, 0.78] }
                : { scale: 1, opacity: 0.9 }
            }
            transition={on ? { duration: 7, repeat: Infinity, ease: 'easeInOut' } : undefined}
          />

          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 144,
              height: 144,
              marginLeft: -72,
              marginTop: -72,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.26)',
              background:
                'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.04) 48%, rgba(15,23,42,0.4) 100%)',
              boxShadow:
                'inset 0 0 42px rgba(255,255,255,0.09), 0 0 48px rgba(45,212,191,0.22)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 64,
              height: 64,
              marginLeft: -32,
              marginTop: -32,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.28)',
              background:
                'radial-gradient(circle at 36% 30%, rgba(255,255,255,0.35) 0%, rgba(56,189,248,0.2) 42%, rgba(15,23,42,0.84) 100%)',
            }}
          />

          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 180,
              height: 80,
              marginLeft: -90,
              marginTop: -40,
              borderRadius: '999px',
              background:
                'linear-gradient(128deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.03) 62%, transparent 100%)',
              transform: 'rotate(-24deg)',
              opacity: 0.8,
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}

export interface OrbitalCoreProps {
  shouldAnimate?: boolean;
  className?: string;
}

export const OrbitalCore = memo(OrbitalCoreInner);
