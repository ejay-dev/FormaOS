'use client';

import React, { type ReactNode } from 'react';
import { ScrollReveal } from './ScrollReveal';

type ChoreographyPattern =
  | 'stagger-wave'
  | 'center-burst'
  | 'cascade'
  | 'alternating'
  | 'depth-reveal'
  | 'split-screen';

interface SectionChoreographyProps {
  children: ReactNode;
  /** Reveal choreography pattern */
  pattern?: ChoreographyPattern;
  /** Base stagger delay between items (seconds) */
  stagger?: number;
  /** Scroll range for each item [start, end] */
  range?: [number, number];
  /** Additional className on wrapper */
  className?: string;
}

type RevealVariant =
  | 'fadeUp' | 'fadeDown' | 'fadeLeft' | 'fadeRight'
  | 'scaleUp' | 'blurIn' | 'slideUp' | 'clipUp' | 'rotateIn' | 'staggerFade'
  | 'depthScale' | 'depthSlide' | 'perspectiveUp' | 'splitLeft' | 'splitRight';

interface ChildConfig {
  variant: RevealVariant;
  rangeOffset: number;
}

/**
 * Computes per-child variant + timing based on the pattern.
 */
function getChildConfig(
  pattern: ChoreographyPattern,
  index: number,
  total: number,
  stagger: number,
): ChildConfig {
  switch (pattern) {
    case 'stagger-wave':
      return { variant: 'depthSlide', rangeOffset: index * stagger };

    case 'center-burst': {
      const center = (total - 1) / 2;
      const distFromCenter = Math.abs(index - center);
      return { variant: 'depthScale', rangeOffset: distFromCenter * stagger };
    }

    case 'cascade':
      return { variant: 'depthScale', rangeOffset: index * stagger * 0.8 };

    case 'alternating':
      return {
        variant: index % 2 === 0 ? 'splitLeft' : 'splitRight',
        rangeOffset: index * stagger,
      };

    case 'depth-reveal':
      return { variant: 'depthScale', rangeOffset: index * stagger * 0.8 };

    case 'split-screen':
      return {
        variant: index % 2 === 0 ? 'splitLeft' : 'splitRight',
        rangeOffset: Math.floor(index / 2) * stagger,
      };

    default:
      return { variant: 'fadeUp', rangeOffset: index * stagger };
  }
}

export function SectionChoreography({
  children,
  pattern = 'stagger-wave',
  stagger = 0.04,
  range = [0, 0.4],
  className = '',
}: SectionChoreographyProps) {
  const items = React.Children.toArray(children);
  const total = items.length;

  return (
    <div className={className}>
      {items.map((child, index) => {
        const config = getChildConfig(pattern, index, total, stagger);
        const maxOffset = Math.min(0.2, Math.max(0.12, (total - 1) * stagger * 0.45));
        const boundedOffset = Math.min(config.rangeOffset, maxOffset);
        const offsetRange: [number, number] = [
          Math.min(range[0] + boundedOffset, 0.75),
          Math.min(range[1] + boundedOffset, 0.9),
        ];

        return (
          <ScrollReveal
            key={index}
            variant={config.variant}
            range={offsetRange}
          >
            {child}
          </ScrollReveal>
        );
      })}
    </div>
  );
}

export default SectionChoreography;
