'use client';

import { cn } from '@/lib/utils';
import { useId, useEffect, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import type { Container } from '@tsparticles/engine';
import { loadSlim } from '@tsparticles/slim';
import { motion, useAnimation } from 'framer-motion';

type SparklesCoreProps = {
  id?: string;
  className?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleColor?: string;
  particleDensity?: number;
};

export function SparklesCore({
  id,
  className,
  background = '#030712',
  minSize = 0.8,
  maxSize = 2.6,
  speed = 3.2,
  particleColor = '#7dd3fc',
  particleDensity = 140,
}: SparklesCoreProps) {
  const [init, setInit] = useState(false);
  const controls = useAnimation();
  const generatedId = useId();

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesLoaded = async (container?: Container) => {
    if (container) {
      controls.start({
        opacity: 1,
        transition: { duration: 0.9 },
      });
    }
  };

  return (
    <motion.div
      animate={controls}
      className={cn('opacity-0', className)}
    >
      {init && (
        <Particles
          id={id || generatedId}
          className="h-full w-full"
          particlesLoaded={particlesLoaded}
          options={{
            background: {
              color: { value: background },
            },
            fullScreen: {
              enable: false,
              zIndex: 1,
            },
            fpsLimit: 90,
            interactivity: {
              events: {
                onClick: {
                  enable: true,
                  mode: 'push',
                },
                onHover: {
                  enable: false,
                  mode: 'repulse',
                },
                resize: {
                  enable: true,
                },
              },
              modes: {
                push: { quantity: 3 },
                repulse: { distance: 180, duration: 0.4 },
              },
            },
            particles: {
              color: {
                value: particleColor,
              },
              move: {
                enable: true,
                direction: 'none',
                outModes: {
                  default: 'out',
                },
                speed: {
                  min: 0.1,
                  max: 0.9,
                },
              },
              number: {
                density: {
                  enable: true,
                  width: 500,
                  height: 500,
                },
                value: particleDensity,
              },
              opacity: {
                value: { min: 0.08, max: 0.9 },
                animation: {
                  enable: true,
                  speed,
                  sync: false,
                },
              },
              shape: { type: 'circle' },
              size: {
                value: { min: minSize, max: maxSize },
              },
              links: { enable: false },
              collisions: { enable: false },
            },
            detectRetina: true,
          }}
        />
      )}
    </motion.div>
  );
}

export default SparklesCore;
