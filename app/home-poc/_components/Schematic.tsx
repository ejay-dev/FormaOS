'use client';

import { motion, useReducedMotion } from 'framer-motion';

/**
 * The compliance graph drawn as an engineering schematic / patent figure:
 * boxed nodes, orthogonal (right-angle) bus wiring, callout numbers, crop
 * marks and coordinate ticks on the frame. Wires draw on scroll. The
 * evidence run carries the red signal. Deliberately technical, not floaty.
 */

type Box = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  n: string;
  label: string;
  sub: string;
  accent?: boolean;
};

const BOXES: Box[] = [
  { id: 'obl', x: 40, y: 70, w: 210, h: 72, n: '01', label: 'OBLIGATION', sub: 'NDIS Std 4.2' },
  { id: 'ctl', x: 375, y: 40, w: 230, h: 130, n: '02', label: 'CONTROL', sub: 'Enforced · scored' },
  { id: 'own', x: 730, y: 28, w: 210, h: 64, n: '03', label: 'OWNER', sub: 'Named · accountable' },
  { id: 'evd', x: 730, y: 120, w: 210, h: 64, n: '04', label: 'EVIDENCE', sub: 'Immutable chain', accent: true },
  { id: 'aud', x: 375, y: 270, w: 230, h: 64, n: '05', label: 'AUDIT', sub: 'Continuous readout' },
];

// orthogonal wire (right-angle) from box A right-edge to box B left-edge
function busPath(a: Box, b: Box) {
  const ax = a.x + a.w;
  const ay = a.y + a.h / 2;
  const bx = b.x;
  const by = b.y + b.h / 2;
  const midx = ax + (bx - ax) / 2;
  return `M ${ax} ${ay} H ${midx} V ${by} H ${bx}`;
}
// vertical drop from control bottom to audit
function dropPath(a: Box, b: Box) {
  const ax = a.x + a.w / 2;
  const ay = a.y + a.h;
  const by = b.y;
  return `M ${ax} ${ay} V ${by}`;
}

const WIRES = [
  { d: busPath(BOXES[0], BOXES[1]), accent: false },
  { d: busPath(BOXES[1], BOXES[2]), accent: false },
  { d: busPath(BOXES[1], BOXES[3]), accent: true },
  { d: dropPath(BOXES[1], BOXES[4]), accent: false },
];

export function Schematic() {
  const reduce = useReducedMotion();

  return (
    <svg
      viewBox="0 0 980 370"
      width="100%"
      role="img"
      aria-label="Schematic: an obligation wires into an enforced control, which wires to its owner, its evidence chain and a continuous audit readout."
      style={{ display: 'block' }}
    >
      {/* frame + coordinate ticks */}
      <rect x="6" y="6" width="968" height="358" fill="none" stroke="var(--line)" strokeWidth="1" />
      {['A', 'B', 'C', 'D'].map((c, i) => (
        <text key={c} x={6 + 240 * i + 120} y="22" textAnchor="middle" className="bru-schem-sub">
          {c}
        </text>
      ))}
      {[1, 2, 3].map((r, i) => (
        <text key={r} x="20" y={70 + 110 * i} className="bru-schem-sub">
          {r}
        </text>
      ))}

      {/* wiring */}
      {WIRES.map((w, i) => (
        <motion.path
          key={`w-${i}`}
          d={w.d}
          fill="none"
          stroke={w.accent ? 'var(--red)' : 'var(--line-2)'}
          strokeWidth={w.accent ? 2 : 1.25}
          initial={reduce ? false : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.9, delay: 0.3 + i * 0.16, ease: [0.65, 0, 0.35, 1] }}
        />
      ))}

      {/* signal pulse along the evidence wire */}
      {!reduce && (
        <circle r="3.5" fill="var(--red)">
          <animateMotion dur="1.3s" begin="1.2s" repeatCount="1" fill="freeze" path={WIRES[2].d} />
        </circle>
      )}

      {/* boxes */}
      {BOXES.map((b, i) => (
        <motion.g
          key={b.id}
          initial={reduce ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.35, delay: 0.15 + i * 0.12 }}
        >
          {/* crop ticks at corners */}
          {[
            [b.x, b.y, 1, 1],
            [b.x + b.w, b.y, -1, 1],
            [b.x, b.y + b.h, 1, -1],
            [b.x + b.w, b.y + b.h, -1, -1],
          ].map(([cx, cy, dx, dy], k) => (
            <path
              key={k}
              d={`M ${cx} ${cy + (dy as number) * 7} V ${cy} H ${cx + (dx as number) * 7}`}
              stroke={b.accent ? 'var(--red)' : 'var(--line-2)'}
              strokeWidth="1.25"
              fill="none"
            />
          ))}
          <rect
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            fill={b.id === 'ctl' ? '#141416' : 'transparent'}
            stroke={b.accent ? 'var(--red)' : 'var(--line-2)'}
            strokeWidth={b.id === 'ctl' ? 1.5 : 1}
          />
          <text x={b.x + 14} y={b.y + 26} className="bru-schem-sub" fill="var(--ink-faint)">
            FIG.{b.n}
          </text>
          <text x={b.x + 14} y={b.y + (b.h > 90 ? 64 : 44)} className="bru-schem-label">
            {b.label}
          </text>
          <text x={b.x + 14} y={b.y + (b.h > 90 ? 84 : 60)} className="bru-schem-sub">
            {b.sub}
          </text>
        </motion.g>
      ))}
    </svg>
  );
}
