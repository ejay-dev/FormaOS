import { useId } from 'react';

interface FoShieldMarkProps {
  size?: number;
  className?: string;
  title?: string;
  animated?: boolean;
}

const SHIELD_PATH = 'M64 8L108 28V66C108 89 92 109 64 120C36 109 20 89 20 66V28L64 8Z';

export function FoShieldMark({
  size = 32,
  className = '',
  title = 'FormaOS',
  animated = true,
}: FoShieldMarkProps) {
  const id = useId().replace(/:/g, '');
  const titleId = `${id}-title`;
  const shellGradientId = `${id}-shell-gradient`;
  const shellInnerGradientId = `${id}-shell-inner-gradient`;
  const edgeGradientId = `${id}-edge-gradient`;
  const letterGradientId = `${id}-letter-gradient`;
  const letterShadowGradientId = `${id}-letter-shadow-gradient`;
  const sweepGradientId = `${id}-sweep-gradient`;
  const clipId = `${id}-clip`;

  const visualScaleClass = size >= 24 ? 'fo-logo-visual-scale' : '';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
      fill="none"
      role={title ? 'img' : 'presentation'}
      aria-labelledby={title ? titleId : undefined}
      aria-hidden={title ? undefined : true}
      className={`fo-logo-root ${visualScaleClass} ${animated ? 'fo-logo-motion' : ''} ${className}`.trim()}
    >
      {title ? <title id={titleId}>{title}</title> : null}

      <defs>
        <linearGradient
          id={shellGradientId}
          x1="24"
          y1="16"
          x2="108"
          y2="112"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="var(--space-900)" />
          <stop offset="55%" stopColor="var(--space-800)" />
          <stop offset="100%" stopColor="var(--space-700)" />
        </linearGradient>
        <linearGradient
          id={shellInnerGradientId}
          x1="30"
          y1="24"
          x2="96"
          y2="102"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="hsl(var(--primary) / 0.14)" />
          <stop offset="100%" stopColor="hsl(var(--secondary) / 0.05)" />
        </linearGradient>
        <linearGradient
          id={edgeGradientId}
          x1="20"
          y1="12"
          x2="108"
          y2="120"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="var(--cyan-300)" />
          <stop offset="50%" stopColor="var(--blue-400)" />
          <stop offset="100%" stopColor="var(--cyan-400)" />
        </linearGradient>
        <linearGradient
          id={letterGradientId}
          x1="36"
          y1="32"
          x2="100"
          y2="96"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="var(--cyan-100)" />
          <stop offset="45%" stopColor="var(--cyan-300)" />
          <stop offset="100%" stopColor="var(--blue-300)" />
        </linearGradient>
        <linearGradient
          id={letterShadowGradientId}
          x1="38"
          y1="34"
          x2="88"
          y2="92"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="var(--blue-700)" />
          <stop offset="100%" stopColor="var(--space-900)" />
        </linearGradient>
        <linearGradient
          id={sweepGradientId}
          x1="0"
          y1="0"
          x2="1"
          y2="0"
          gradientUnits="objectBoundingBox"
        >
          <stop offset="0%" stopColor="hsl(var(--primary) / 0)" />
          <stop offset="50%" stopColor="hsl(var(--primary) / 0.34)" />
          <stop offset="100%" stopColor="hsl(var(--primary) / 0)" />
        </linearGradient>
        <clipPath id={clipId}>
          <path d={SHIELD_PATH} />
        </clipPath>
      </defs>

      <g className={animated ? 'fo-logo-breathe' : undefined}>
        <path
          d={SHIELD_PATH}
          fill={`url(#${shellGradientId})`}
          stroke={`url(#${edgeGradientId})`}
          strokeWidth="3"
        />
        <path
          d="M64 18L99 33V65C99 83 87 98 64 106C41 98 29 83 29 65V33L64 18Z"
          fill={`url(#${shellInnerGradientId})`}
        />
        <path
          d="M64 15L102 32.5V65.3C102 86 87.5 103.3 64 111.4C40.5 103.3 26 86 26 65.3V32.5L64 15Z"
          stroke="hsl(var(--primary))"
          strokeOpacity="0.34"
          strokeWidth="1.5"
        />
        <path
          d="M36 38C36 35.8 37.8 34 40 34H71C73.2 34 75 35.8 75 38V40C75 42.2 73.2 44 71 44H48V57H66C68.2 57 70 58.8 70 61V63C70 65.2 68.2 67 66 67H48V88C48 90.2 46.2 92 44 92H40C37.8 92 36 90.2 36 88V38Z"
          fill={`url(#${letterGradientId})`}
        />
        <path
          d="M38 40C38 38.9 38.9 38 40 38H68V40H44V90H40C38.9 90 38 89.1 38 88V40Z"
          fill={`url(#${letterShadowGradientId})`}
          opacity="0.22"
        />
        <circle
          cx="81"
          cy="63"
          r="20"
          stroke={`url(#${letterGradientId})`}
          strokeWidth="10"
        />
        <circle
          cx="81"
          cy="63"
          r="14.5"
          stroke={`url(#${letterShadowGradientId})`}
          strokeWidth="1.8"
          opacity="0.35"
        />
        <path
          d="M66 84L93 69.5"
          stroke="hsl(var(--primary))"
          strokeOpacity="0.38"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </g>

      {animated ? (
        <g className="fo-logo-sweep" clipPath={`url(#${clipId})`}>
          <rect
            x="-60"
            y="-18"
            width="30"
            height="180"
            rx="12"
            transform="rotate(22 64 64)"
            fill={`url(#${sweepGradientId})`}
          />
        </g>
      ) : null}
    </svg>
  );
}
