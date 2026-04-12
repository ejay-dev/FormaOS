'use client';

/**
 * Section Background Visuals
 *
 * Reusable SVG patterns, grids, and micro-animations for marketing sections.
 * All backgrounds are pointer-events-none, absolutely positioned, and
 * designed to layer behind section content at low opacity.
 */

import { motion, useReducedMotion } from 'framer-motion';

/* ─── Shared wrapper ─────────────────────────────────────── */

function BgLayer({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}

/* ─── 1. Topographic Contour Map ─────────────────────────── */
/* Used on: Industries section - signals "coverage across regulated territory" */

export function TopographicPattern({
  color = 'rgba(45, 212, 191, 0.03)',
  className = '',
}: {
  color?: string;
  className?: string;
}) {
  return (
    <BgLayer className={className}>
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <radialGradient id="topo-mask" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="topo-fade">
            <rect width="1200" height="800" fill="url(#topo-mask)" />
          </mask>
        </defs>
        <g mask="url(#topo-fade)" stroke={color} strokeWidth="1.2" fill="none">
          <ellipse cx="600" cy="400" rx="520" ry="320" />
          <ellipse cx="600" cy="400" rx="440" ry="260" />
          <ellipse cx="600" cy="400" rx="360" ry="200" />
          <ellipse cx="600" cy="400" rx="280" ry="150" />
          <ellipse cx="600" cy="400" rx="200" ry="100" />
          <ellipse cx="600" cy="400" rx="120" ry="60" />
          {/* Offset contours for organic feel */}
          <ellipse cx="520" cy="350" rx="300" ry="180" />
          <ellipse cx="680" cy="450" rx="280" ry="160" />
          <ellipse cx="520" cy="350" rx="200" ry="110" />
          <ellipse cx="680" cy="450" rx="160" ry="90" />
        </g>
      </svg>
    </BgLayer>
  );
}

/* ─── 2. Radar Pulse Ring ────────────────────────────────── */
/* Used on: Outcome Proof section - "measurable outcomes" */

export function RadarPulse({
  color = 'rgba(45, 212, 191, 0.12)',
  className = '',
}: {
  color?: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <BgLayer className={className}>
      <svg
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        width="700"
        height="700"
        viewBox="0 0 700 700"
        fill="none"
      >
        <defs>
          <radialGradient id="radar-fade" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="40%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="radar-mask">
            <rect width="700" height="700" fill="url(#radar-fade)" />
          </mask>
        </defs>
        <g mask="url(#radar-mask)">
          {/* Static rings */}
          <circle cx="350" cy="350" r="80" stroke={color} strokeWidth="0.8" />
          <circle cx="350" cy="350" r="160" stroke={color} strokeWidth="0.6" />
          <circle cx="350" cy="350" r="240" stroke={color} strokeWidth="0.5" />
          <circle cx="350" cy="350" r="320" stroke={color} strokeWidth="0.4" />
          {/* Cross hairs */}
          <line x1="350" y1="30" x2="350" y2="670" stroke={color} strokeWidth="0.4" />
          <line x1="30" y1="350" x2="670" y2="350" stroke={color} strokeWidth="0.4" />
          {/* Animated sweep */}
          {!reduced && (
            <motion.line
              x1="350"
              y1="350"
              x2="350"
              y2="30"
              stroke={color}
              strokeWidth="1.5"
              style={{ transformOrigin: '350px 350px' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />
          )}
        </g>
      </svg>
    </BgLayer>
  );
}

/* ─── 3. Decision Tree / Conversation Thread ─────────────── */
/* Used on: Objection Handling / FAQ sections - visual structure for Q&A */

export function DecisionTreePattern({
  color = 'rgba(148, 163, 184, 0.06)',
  nodeColor = 'rgba(45, 212, 191, 0.15)',
  count = 6,
  className = '',
}: {
  color?: string;
  nodeColor?: string;
  count?: number;
  className?: string;
}) {
  const nodes = Array.from({ length: count }, (_, i) => ({
    y: 80 + i * 120,
    branchLeft: i % 2 === 0,
  }));

  return (
    <BgLayer className={className}>
      <svg
        className="absolute right-12 top-0 hidden h-full lg:block"
        width="120"
        viewBox="0 0 120 800"
        preserveAspectRatio="xMidYMin slice"
        fill="none"
      >
        <defs>
          <linearGradient id="tree-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="15%" stopColor="white" stopOpacity="1" />
            <stop offset="85%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="tree-mask">
            <rect width="120" height="800" fill="url(#tree-fade)" />
          </mask>
        </defs>
        <g mask="url(#tree-mask)">
          {/* Main trunk */}
          <line x1="60" y1="0" x2="60" y2="800" stroke={color} strokeWidth="1.5" strokeDasharray="4 6" />
          {/* Branches and nodes */}
          {nodes.map((node, i) => (
            <g key={i}>
              <line
                x1="60"
                y1={node.y}
                x2={node.branchLeft ? 20 : 100}
                y2={node.y}
                stroke={color}
                strokeWidth="1"
              />
              <circle cx="60" cy={node.y} r="3.5" fill={nodeColor} />
              <circle
                cx={node.branchLeft ? 20 : 100}
                cy={node.y}
                r="2.5"
                fill={nodeColor}
              />
            </g>
          ))}
        </g>
      </svg>
    </BgLayer>
  );
}

/* ─── 4. Circuit Board / Node Diagram ────────────────────── */
/* Used on: Product "What Is FormaOS" - abstract connected system */

export function CircuitPattern({
  color = 'rgba(20, 184, 166, 0.04)',
  nodeColor = 'rgba(45, 212, 191, 0.1)',
  className = '',
}: {
  color?: string;
  nodeColor?: string;
  className?: string;
}) {
  return (
    <BgLayer className={className}>
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1200 600"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <radialGradient id="circuit-mask-grad" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="circuit-mask">
            <rect width="1200" height="600" fill="url(#circuit-mask-grad)" />
          </mask>
        </defs>
        <g mask="url(#circuit-mask)" stroke={color} strokeWidth="1">
          {/* Horizontal lines */}
          <line x1="100" y1="150" x2="500" y2="150" />
          <line x1="700" y1="150" x2="1100" y2="150" />
          <line x1="200" y1="300" x2="600" y2="300" />
          <line x1="600" y1="300" x2="1000" y2="300" />
          <line x1="100" y1="450" x2="500" y2="450" />
          <line x1="700" y1="450" x2="1100" y2="450" />
          {/* Vertical connections */}
          <line x1="500" y1="150" x2="500" y2="300" />
          <line x1="700" y1="150" x2="700" y2="300" />
          <line x1="500" y1="300" x2="500" y2="450" />
          <line x1="700" y1="300" x2="700" y2="450" />
          <line x1="300" y1="150" x2="300" y2="450" />
          <line x1="900" y1="150" x2="900" y2="450" />
          {/* Right angles */}
          <polyline points="400,150 400,220 600,220 600,300" />
          <polyline points="800,150 800,220 600,220" />
          <polyline points="400,450 400,380 600,380 600,300" />
          <polyline points="800,450 800,380 600,380" />
        </g>
        {/* Nodes at intersections */}
        <g fill={nodeColor}>
          <circle cx="500" cy="150" r="4" />
          <circle cx="700" cy="150" r="4" />
          <circle cx="600" cy="300" r="5" />
          <circle cx="500" cy="450" r="4" />
          <circle cx="700" cy="450" r="4" />
          <circle cx="300" cy="300" r="3.5" />
          <circle cx="900" cy="300" r="3.5" />
          <circle cx="400" cy="220" r="3" />
          <circle cx="800" cy="220" r="3" />
          <circle cx="400" cy="380" r="3" />
          <circle cx="800" cy="380" r="3" />
        </g>
      </svg>
    </BgLayer>
  );
}

/* ─── 5. Animated Flow Path ──────────────────────────────── */
/* Used on: Product "Obligation to Execution" - directional process flow */

export function FlowPath({
  color = 'rgba(45, 212, 191, 0.08)',
  className = '',
}: {
  color?: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <BgLayer className={className}>
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1200 400"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <linearGradient id="flow-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity="0" />
            <stop offset="30%" stopColor={color} stopOpacity="1" />
            <stop offset="70%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M 0 200 C 200 200 250 100 400 100 S 600 300 800 200 S 1000 100 1200 200"
          stroke="url(#flow-grad)"
          strokeWidth="1.5"
          strokeDasharray={reduced ? 'none' : '8 12'}
          fill="none"
        >
          {!reduced && (
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="-40"
              dur="3s"
              repeatCount="indefinite"
            />
          )}
        </path>
        <path
          d="M 0 250 C 200 250 300 150 500 200 S 700 350 900 250 S 1100 150 1200 250"
          stroke="url(#flow-grad)"
          strokeWidth="1"
          strokeDasharray={reduced ? 'none' : '6 10'}
          opacity="0.6"
          fill="none"
        >
          {!reduced && (
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="-32"
              dur="4s"
              repeatCount="indefinite"
            />
          )}
        </path>
      </svg>
    </BgLayer>
  );
}

/* ─── 6. Concentric Shield Rings ─────────────────────────── */
/* Used on: Enterprise Security Layers, Security page - layered defense */

export function ShieldRings({
  color = 'rgba(45, 212, 191, 0.04)',
  className = '',
}: {
  color?: string;
  className?: string;
}) {
  return (
    <BgLayer className={className}>
      <svg
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        width="900"
        height="700"
        viewBox="0 0 900 700"
        fill="none"
      >
        <defs>
          <radialGradient id="shield-fade" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="shield-mask">
            <rect width="900" height="700" fill="url(#shield-fade)" />
          </mask>
        </defs>
        <g mask="url(#shield-mask)" stroke={color} strokeWidth="1" fill="none">
          <rect x="150" y="100" width="600" height="500" rx="40" />
          <rect x="200" y="140" width="500" height="420" rx="32" />
          <rect x="250" y="180" width="400" height="340" rx="24" />
          <rect x="310" y="230" width="280" height="240" rx="16" />
        </g>
      </svg>
    </BgLayer>
  );
}

/* ─── 7. Hexagonal Grid ──────────────────────────────────── */
/* Used on: Enterprise Trust Badges - trust infrastructure pattern */

export function HexGrid({
  color = 'rgba(45, 212, 191, 0.025)',
  className = '',
}: {
  color?: string;
  className?: string;
}) {
  const size = 40;
  const h = size * Math.sqrt(3);
  return (
    <BgLayer className={className}>
      <svg className="absolute inset-0 h-full w-full" width="100%" height="100%">
        <defs>
          <pattern
            id="hex-pattern"
            width={size * 3}
            height={h}
            patternUnits="userSpaceOnUse"
          >
            <polygon
              points={`${size},0 ${size * 2},0 ${size * 2.5},${h / 2} ${size * 2},${h} ${size},${h} ${size * 0.5},${h / 2}`}
              fill="none"
              stroke={color}
              strokeWidth="0.8"
            />
            <polygon
              points={`${size * 2.5},${h / 2} ${size * 3},${h / 2} ${size * 3 + size * 0.5},${h} ${size * 3},${h + h / 2} ${size * 2.5},${h + h / 2} ${size * 2},${h}`}
              fill="none"
              stroke={color}
              strokeWidth="0.8"
              transform={`translate(${-size * 1.5}, ${-h / 2})`}
            />
          </pattern>
          <radialGradient id="hex-mask-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="hex-mask">
            <rect width="100%" height="100%" fill="url(#hex-mask-grad)" />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="url(#hex-pattern)"
          mask="url(#hex-mask)"
        />
      </svg>
    </BgLayer>
  );
}

/* ─── 8. Evidence Chain Links ────────────────────────────── */
/* Used on: Security Evidence Chain - visualizes chain of custody */

export function ChainLinks({
  color = 'rgba(45, 212, 191, 0.06)',
  lockColor = 'rgba(45, 212, 191, 0.12)',
  className = '',
}: {
  color?: string;
  lockColor?: string;
  className?: string;
}) {
  return (
    <BgLayer className={className}>
      <svg
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block"
        width="800"
        height="120"
        viewBox="0 0 800 120"
        fill="none"
      >
        {/* Chain segment 1 */}
        <rect x="60" y="30" width="100" height="60" rx="30" stroke={color} strokeWidth="1.5" />
        <rect x="140" y="30" width="100" height="60" rx="30" stroke={color} strokeWidth="1.5" />
        {/* Lock node 1 */}
        <circle cx="280" cy="60" r="8" fill={lockColor} />
        <rect x="276" y="48" width="8" height="8" rx="2" stroke={lockColor} strokeWidth="1.2" fill="none" />
        {/* Chain segment 2 */}
        <rect x="320" y="30" width="100" height="60" rx="30" stroke={color} strokeWidth="1.5" />
        <rect x="400" y="30" width="100" height="60" rx="30" stroke={color} strokeWidth="1.5" />
        {/* Lock node 2 */}
        <circle cx="540" cy="60" r="8" fill={lockColor} />
        <rect x="536" y="48" width="8" height="8" rx="2" stroke={lockColor} strokeWidth="1.2" fill="none" />
        {/* Chain segment 3 */}
        <rect x="580" y="30" width="100" height="60" rx="30" stroke={color} strokeWidth="1.5" />
        <rect x="660" y="30" width="100" height="60" rx="30" stroke={color} strokeWidth="1.5" />
      </svg>
    </BgLayer>
  );
}

/* ─── 9. Dot Grid Pattern ────────────────────────────────── */
/* Used on: FAQ, Compare pages - subtle texture and depth */

export function DotGrid({
  color = 'rgba(148, 163, 184, 0.04)',
  spacing = 32,
  radius = 1,
  className = '',
}: {
  color?: string;
  spacing?: number;
  radius?: number;
  className?: string;
}) {
  return (
    <BgLayer className={className}>
      <svg className="absolute inset-0 h-full w-full" width="100%" height="100%">
        <defs>
          <pattern
            id={`dot-grid-${spacing}`}
            width={spacing}
            height={spacing}
            patternUnits="userSpaceOnUse"
          >
            <circle cx={spacing / 2} cy={spacing / 2} r={radius} fill={color} />
          </pattern>
          <radialGradient id="dot-mask-grad" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="dot-mask">
            <rect width="100%" height="100%" fill="url(#dot-mask-grad)" />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill={`url(#dot-grid-${spacing})`}
          mask="url(#dot-mask)"
        />
      </svg>
    </BgLayer>
  );
}

/* ─── 10. Versus Divider Glow ────────────────────────────── */
/* Used on: Compare pages - visual tension between columns */

export function VersusDivider({
  color = 'rgba(45, 212, 191, 0.15)',
  className = '',
}: {
  color?: string;
  className?: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 ${className}`}
      aria-hidden="true"
      style={{ width: '2px', height: '100%' }}
    >
      <div
        className="h-full w-full"
        style={{
          background: `linear-gradient(180deg, transparent 0%, ${color} 30%, ${color} 70%, transparent 100%)`,
          boxShadow: `0 0 20px 4px ${color}`,
        }}
      />
    </div>
  );
}

/* ─── 11. Scan Line Sweep ────────────────────────────────── */
/* Used on: Trust Assurance Modules - continuous verification signal */

export function ScanLine({
  color = 'rgba(45, 212, 191, 0.04)',
  className = '',
}: {
  color?: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  if (reduced) return null;

  return (
    <BgLayer className={className}>
      <motion.div
        className="absolute inset-x-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${color} 20%, ${color} 80%, transparent 100%)`,
          boxShadow: `0 0 12px 2px ${color}`,
        }}
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      />
    </BgLayer>
  );
}

/* ─── 12. Procurement Stamp Pattern ──────────────────────── */
/* Used on: Pricing Procurement section - abstract procurement artifacts */

export function StampPattern({
  color = 'rgba(52, 211, 153, 0.03)',
  className = '',
}: {
  color?: string;
  className?: string;
}) {
  return (
    <BgLayer className={className}>
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1200 600"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          <radialGradient id="stamp-fade" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="stamp-mask">
            <rect width="1200" height="600" fill="url(#stamp-fade)" />
          </mask>
        </defs>
        <g mask="url(#stamp-mask)" stroke={color} strokeWidth="1">
          {/* Document outlines */}
          <rect x="180" y="120" width="160" height="200" rx="8" />
          <line x1="200" y1="160" x2="320" y2="160" strokeDasharray="4 3" />
          <line x1="200" y1="185" x2="300" y2="185" strokeDasharray="4 3" />
          <line x1="200" y1="210" x2="310" y2="210" strokeDasharray="4 3" />
          {/* Approval stamp */}
          <circle cx="290" cy="280" r="28" strokeWidth="2" strokeDasharray="3 2" />
          <line x1="272" y1="280" x2="308" y2="280" strokeWidth="1.5" />
          {/* Second document */}
          <rect x="860" y="180" width="160" height="200" rx="8" />
          <line x1="880" y1="220" x2="1000" y2="220" strokeDasharray="4 3" />
          <line x1="880" y1="245" x2="980" y2="245" strokeDasharray="4 3" />
          <line x1="880" y1="270" x2="990" y2="270" strokeDasharray="4 3" />
          {/* Checkmark */}
          <polyline
            points="940,340 955,358 985,320"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </BgLayer>
  );
}

/* ─── 13. Active Monitoring Nodes ────────────────────────── */
/* Used on: Trust Modules - signals live monitoring across trust surface */

export function MonitoringNodes({
  color = 'rgba(45, 212, 191, 0.08)',
  pulseColor = 'rgba(45, 212, 191, 0.2)',
  className = '',
}: {
  color?: string;
  pulseColor?: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const nodes = [
    { cx: '15%', cy: '20%' },
    { cx: '85%', cy: '25%' },
    { cx: '25%', cy: '75%' },
    { cx: '75%', cy: '80%' },
    { cx: '50%', cy: '50%' },
    { cx: '10%', cy: '50%' },
    { cx: '90%', cy: '50%' },
  ];

  return (
    <BgLayer className={className}>
      <svg className="absolute inset-0 h-full w-full" width="100%" height="100%">
        {/* Connection lines */}
        <line x1="15%" y1="20%" x2="50%" y2="50%" stroke={color} strokeWidth="0.5" />
        <line x1="85%" y1="25%" x2="50%" y2="50%" stroke={color} strokeWidth="0.5" />
        <line x1="25%" y1="75%" x2="50%" y2="50%" stroke={color} strokeWidth="0.5" />
        <line x1="75%" y1="80%" x2="50%" y2="50%" stroke={color} strokeWidth="0.5" />
        <line x1="10%" y1="50%" x2="50%" y2="50%" stroke={color} strokeWidth="0.5" />
        <line x1="90%" y1="50%" x2="50%" y2="50%" stroke={color} strokeWidth="0.5" />
        {/* Nodes */}
        {nodes.map((node, i) => (
          <g key={i}>
            <circle cx={node.cx} cy={node.cy} r="3" fill={pulseColor} />
            {!reduced && (
              <circle cx={node.cx} cy={node.cy} r="3" fill="none" stroke={pulseColor} strokeWidth="0.8">
                <animate
                  attributeName="r"
                  values="3;12;3"
                  dur={`${3 + i * 0.5}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.6;0;0.6"
                  dur={`${3 + i * 0.5}s`}
                  repeatCount="indefinite"
                />
              </circle>
            )}
          </g>
        ))}
      </svg>
    </BgLayer>
  );
}
