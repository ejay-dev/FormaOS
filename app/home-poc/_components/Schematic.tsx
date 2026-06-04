'use client';

import { motion, useReducedMotion } from 'framer-motion';

/**
 * The compliance graph as a full engineering figure: title block, coordinate
 * ruler, boxed nodes with crop ticks, orthogonal bus wiring with junction
 * dots, dimension lines, and a legend. Wires draw on scroll; the evidence run
 * carries the red signal. Reads like a patent drawing, not a floaty diagram.
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
  hub?: boolean;
  accent?: boolean;
};

const BOX: Record<string, Box> = {
  obl: { id: 'obl', x: 40, y: 232, w: 236, h: 92, n: '1.0', label: 'OBLIGATION', sub: 'NDIS Std 4.2' },
  ctl: { id: 'ctl', x: 486, y: 196, w: 300, h: 164, n: '2.0', label: 'CONTROL', sub: 'Enforced · evaluated · scored', hub: true },
  fwk: { id: 'fwk', x: 996, y: 150, w: 252, h: 80, n: '3.0', label: 'FRAMEWORK', sub: 'ISO · SOC 2 · maps' },
  own: { id: 'own', x: 996, y: 248, w: 252, h: 80, n: '4.0', label: 'OWNER', sub: 'Named · accountable' },
  evd: { id: 'evd', x: 996, y: 346, w: 252, h: 80, n: '5.0', label: 'EVIDENCE', sub: 'Immutable chain', accent: true },
  aud: { id: 'aud', x: 486, y: 432, w: 300, h: 78, n: '6.0', label: 'AUDIT', sub: 'Continuous readout' },
};

const ORDER = ['obl', 'ctl', 'fwk', 'own', 'evd', 'aud'];

function rightTo(a: Box, b: Box) {
  const ax = a.x + a.w;
  const ay = a.y + a.h / 2;
  const bx = b.x;
  const by = b.y + b.h / 2;
  const midx = ax + (bx - ax) / 2;
  return { d: `M ${ax} ${ay} H ${midx} V ${by} H ${bx}`, jx: midx, jy: ay };
}
function drop(a: Box, b: Box) {
  const ax = a.x + a.w / 2;
  const ay = a.y + a.h;
  const by = b.y;
  return { d: `M ${ax} ${ay} V ${by}`, jx: ax, jy: ay };
}

const W_OBL = rightTo(BOX.obl, BOX.ctl);
const W_FWK = rightTo(BOX.ctl, BOX.fwk);
const W_OWN = rightTo(BOX.ctl, BOX.own);
const W_EVD = rightTo(BOX.ctl, BOX.evd);
const W_AUD = drop(BOX.ctl, BOX.aud);
const WIRES = [
  { ...W_OBL, accent: false },
  { ...W_FWK, accent: false },
  { ...W_OWN, accent: false },
  { ...W_EVD, accent: true },
  { ...W_AUD, accent: false },
];

export function Schematic() {
  const reduce = useReducedMotion();

  return (
    <svg
      viewBox="0 0 1280 560"
      width="100%"
      role="img"
      aria-label="Engineering figure: an obligation maps into an enforced control, which wires out to its framework mappings, named owner, immutable evidence chain, and a continuous audit readout."
      style={{ display: 'block' }}
    >
      {/* outer frame + registration marks */}
      <rect x="8" y="8" width="1264" height="544" fill="none" stroke="var(--line)" strokeWidth="1" />
      {[[8, 8], [1272, 8], [8, 552], [1272, 552]].map(([cx, cy], i) => (
        <g key={i} stroke="var(--line-2)" strokeWidth="1">
          <line x1={cx - 9} y1={cy} x2={cx + 9} y2={cy} />
          <line x1={cx} y1={cy - 9} x2={cx} y2={cy + 9} />
        </g>
      ))}

      {/* coordinate ruler ticks */}
      {Array.from({ length: 12 }).map((_, i) => (
        <line key={`tx${i}`} x1={8 + (i + 1) * 105} y1="8" x2={8 + (i + 1) * 105} y2="18" stroke="var(--line)" strokeWidth="1" />
      ))}

      {/* engineering title block */}
      <g>
        <rect x="40" y="40" width="300" height="92" fill="none" stroke="var(--line-2)" strokeWidth="1" />
        <line x1="40" y1="70" x2="340" y2="70" stroke="var(--line)" />
        <line x1="220" y1="70" x2="220" y2="132" stroke="var(--line)" />
        <text x="52" y="60" className="bru-schem-label">FIG.01 — COMPLIANCE GRAPH</text>
        <text x="52" y="92" className="bru-schem-sub">PROJECT</text>
        <text x="52" y="112" className="bru-schem-label" fontSize="12">FORMAOS</text>
        <text x="232" y="92" className="bru-schem-sub">REV.</text>
        <text x="232" y="112" className="bru-schem-label" fontSize="12">A / 2026</text>
      </g>

      {/* dimension line under the obligation→control span */}
      <g stroke="var(--line)" strokeWidth="1" fill="var(--ink-faint)">
        <line x1={BOX.obl.x} y1="350" x2={BOX.obl.x} y2="362" />
        <line x1={BOX.ctl.x} y1="384" x2={BOX.ctl.x} y2="396" />
        <line x1={BOX.obl.x} y1="356" x2={BOX.ctl.x} y2="356" strokeDasharray="3 3" />
        <text x={(BOX.obl.x + BOX.ctl.x) / 2} y="350" textAnchor="middle" className="bru-schem-sub">MAPPED 1:1</text>
      </g>

      {/* wiring */}
      {WIRES.map((w, i) => (
        <g key={`wire-${i}`}>
          <motion.path
            d={w.d}
            fill="none"
            stroke={w.accent ? 'var(--red)' : 'var(--line-2)'}
            strokeWidth={w.accent ? 2 : 1.25}
            initial={reduce ? false : { pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.85, delay: 0.25 + i * 0.14, ease: [0.65, 0, 0.35, 1] }}
          />
          {/* junction dot */}
          <motion.rect
            x={w.jx - 3}
            y={w.jy - 3}
            width="6"
            height="6"
            fill={w.accent ? 'var(--red)' : 'var(--ink-dim)'}
            initial={reduce ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ delay: 0.6 + i * 0.14 }}
          />
        </g>
      ))}

      {/* signal pulse along evidence wire */}
      {!reduce && (
        <circle r="4" fill="var(--red)">
          <animateMotion dur="1.3s" begin="1.3s" repeatCount="1" fill="freeze" path={W_EVD.d} />
        </circle>
      )}

      {/* boxes */}
      {ORDER.map((id, i) => {
        const b = BOX[id];
        const tall = b.h > 100;
        return (
          <motion.g
            key={id}
            initial={reduce ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.3, delay: 0.15 + i * 0.1 }}
          >
            {[
              [b.x, b.y, 1, 1],
              [b.x + b.w, b.y, -1, 1],
              [b.x, b.y + b.h, 1, -1],
              [b.x + b.w, b.y + b.h, -1, -1],
            ].map(([cx, cy, dx, dy], k) => (
              <path
                key={k}
                d={`M ${cx} ${(cy as number) + (dy as number) * 8} V ${cy} H ${(cx as number) + (dx as number) * 8}`}
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
              fill={b.hub ? '#141416' : 'transparent'}
              stroke={b.accent ? 'var(--red)' : 'var(--line-2)'}
              strokeWidth={b.hub ? 1.5 : 1}
            />
            <text x={b.x + 16} y={b.y + 28} className="bru-schem-sub" fill="var(--ink-faint)">FIG.01.{b.n}</text>
            <text x={b.x + 16} y={b.y + (tall ? 96 : 56)} className="bru-schem-label" fontSize={b.hub ? 18 : 14}>
              {b.label}
            </text>
            <text x={b.x + 16} y={b.y + (tall ? 122 : 74)} className="bru-schem-sub">{b.sub}</text>
          </motion.g>
        );
      })}

      {/* legend */}
      <g transform="translate(40, 524)">
        <line x1="0" y1="-4" x2="34" y2="-4" stroke="var(--line-2)" strokeWidth="1.25" />
        <text x="44" y="0" className="bru-schem-sub">ACTION WIRE</text>
        <line x1="190" y1="-4" x2="224" y2="-4" stroke="var(--red)" strokeWidth="2" />
        <text x="234" y="0" className="bru-schem-sub" fill="var(--red)">EVIDENCE / SIGNAL</text>
        <rect x="420" y="-9" width="10" height="10" fill="none" stroke="var(--line-2)" />
        <text x="440" y="0" className="bru-schem-sub">NODE</text>
        <rect x="520" y="-7" width="6" height="6" fill="var(--ink-dim)" />
        <text x="536" y="0" className="bru-schem-sub">JUNCTION</text>
      </g>
    </svg>
  );
}
