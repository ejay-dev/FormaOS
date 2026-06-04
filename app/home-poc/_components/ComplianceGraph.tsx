'use client';

import { motion, useReducedMotion } from 'framer-motion';

/**
 * Signature visual: the FormaOS compliance graph. A central Control hub
 * wired to its obligation, owner, evidence and audit nodes. Wires draw
 * themselves (pathLength) as the section enters view; the evidence wire
 * carries the single vermilion accent. Pure SVG, scales to any width.
 */

type Node = {
  id: string;
  x: number;
  y: number;
  label: string;
  sub: string;
  accent?: boolean;
};

const CENTER = { x: 480, y: 235 };

const NODES: Node[] = [
  { id: 'obligation', x: 150, y: 110, label: 'OBLIGATION', sub: 'NDIS Practice Std 4.2' },
  { id: 'framework', x: 810, y: 110, label: 'FRAMEWORK', sub: 'ISO 27001 · SOC 2' },
  { id: 'owner', x: 150, y: 360, label: 'OWNER', sub: 'Named · accountable' },
  { id: 'evidence', x: 810, y: 360, label: 'EVIDENCE', sub: 'Immutable chain', accent: true },
];

const NODE_W = 196;
const NODE_H = 58;

function curve(a: { x: number; y: number }, b: { x: number; y: number }) {
  const mx = (a.x + b.x) / 2;
  return `M ${a.x} ${a.y} Q ${mx} ${a.y} ${mx} ${(a.y + b.y) / 2} T ${b.x} ${b.y}`;
}

export function ComplianceGraph() {
  const reduce = useReducedMotion();

  return (
    <svg
      viewBox="0 0 960 470"
      width="100%"
      role="img"
      aria-label="The FormaOS compliance graph: a central control wired to its obligation, framework, owner and evidence."
      style={{ display: 'block' }}
    >
      {/* wires (drawn first, behind nodes) */}
      {NODES.map((n, i) => (
        <motion.path
          key={`wire-${n.id}`}
          d={curve(CENTER, n)}
          fill="none"
          stroke={n.accent ? 'var(--accent)' : 'rgba(28,30,31,0.32)'}
          strokeWidth={n.accent ? 1.6 : 1.1}
          initial={reduce ? false : { pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1, delay: 0.2 + i * 0.18, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}

      {/* travelling pulse along the evidence wire */}
      {!reduce && (
        <motion.circle
          r="3"
          fill="var(--accent)"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: [0, 1, 1, 0] }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1.4, delay: 1.1, ease: 'easeInOut' }}
        >
          <animateMotion dur="1.4s" begin="1.1s" fill="freeze" path={curve(CENTER, NODES[3])} />
        </motion.circle>
      )}

      {/* center hub */}
      <motion.g
        initial={reduce ? false : { opacity: 0, scale: 0.92 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <rect
          x={CENTER.x - 92}
          y={CENTER.y - 34}
          width={184}
          height={68}
          rx={5}
          fill="#1c1e1f"
        />
        <text x={CENTER.x} y={CENTER.y - 6} textAnchor="middle" className="poc-node-label" fill="#f6f4ef">
          CONTROL
        </text>
        <text x={CENTER.x} y={CENTER.y + 14} textAnchor="middle" className="poc-node-sub" fill="#9a9d9f">
          Enforced · evaluated · scored
        </text>
      </motion.g>

      {/* satellite nodes */}
      {NODES.map((n, i) => (
        <motion.g
          key={`node-${n.id}`}
          initial={reduce ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, delay: 0.5 + i * 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          <rect
            x={n.x - NODE_W / 2}
            y={n.y - NODE_H / 2}
            width={NODE_W}
            height={NODE_H}
            rx={5}
            fill="#fbfaf7"
            stroke={n.accent ? 'var(--accent)' : 'rgba(28,30,31,0.28)'}
            strokeWidth={n.accent ? 1.4 : 1}
          />
          <text x={n.x} y={n.y - 6} textAnchor="middle" className="poc-node-label">
            {n.label}
          </text>
          <text x={n.x} y={n.y + 13} textAnchor="middle" className="poc-node-sub">
            {n.sub}
          </text>
        </motion.g>
      ))}
    </svg>
  );
}
