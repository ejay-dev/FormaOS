'use client';

import { useEffect, useRef, useState, useCallback, memo } from 'react';

// ─── Data model ──────────────────────────────────────────────────────────────

interface FrameworkNode {
  id: string;
  label: string;
  color: string;
  glowColor: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  type: 'framework';
  controls: string[];
  description: string;
  controlCount: number;
  phaseOffset: number;
}

interface ControlNode {
  id: string;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  type: 'control';
  phaseOffset: number;
}

type GraphNode = FrameworkNode | ControlNode;

const FRAMEWORKS: Omit<FrameworkNode, 'x' | 'y' | 'vx' | 'vy' | 'phaseOffset'>[] = [
  {
    id: 'iso27001',
    label: 'ISO 27001',
    color: '#3b82f6',
    glowColor: 'rgba(59,130,246,0.4)',
    radius: 32,
    type: 'framework',
    controls: ['access-ctrl', 'data-protect', 'incident', 'risk', 'audit', 'vendor'],
    description: 'International standard for information security management systems.',
    controlCount: 114,
  },
  {
    id: 'soc2',
    label: 'SOC 2',
    color: '#06b6d4',
    glowColor: 'rgba(6,182,212,0.4)',
    radius: 32,
    type: 'framework',
    controls: ['access-ctrl', 'data-protect', 'incident', 'audit'],
    description: 'AICPA trust services criteria for service organisations.',
    controlCount: 64,
  },
  {
    id: 'hipaa',
    label: 'HIPAA',
    color: '#a855f7',
    glowColor: 'rgba(168,85,247,0.4)',
    radius: 30,
    type: 'framework',
    controls: ['access-ctrl', 'data-protect', 'incident', 'audit'],
    description: 'US regulation for protecting patient health information.',
    controlCount: 78,
  },
  {
    id: 'ndis',
    label: 'NDIS',
    color: '#22c55e',
    glowColor: 'rgba(34,197,94,0.4)',
    radius: 28,
    type: 'framework',
    controls: ['access-ctrl', 'incident', 'risk', 'vendor'],
    description: 'Australian National Disability Insurance Scheme quality standards.',
    controlCount: 45,
  },
  {
    id: 'pcidss',
    label: 'PCI-DSS',
    color: '#f59e0b',
    glowColor: 'rgba(245,158,11,0.4)',
    radius: 28,
    type: 'framework',
    controls: ['access-ctrl', 'data-protect', 'risk', 'audit', 'vendor'],
    description: 'Payment Card Industry Data Security Standard.',
    controlCount: 89,
  },
  {
    id: 'nistcsf',
    label: 'NIST CSF',
    color: '#f43f5e',
    glowColor: 'rgba(244,63,94,0.4)',
    radius: 28,
    type: 'framework',
    controls: ['incident', 'risk', 'access-ctrl', 'data-protect', 'vendor'],
    description: 'NIST Cybersecurity Framework for critical infrastructure.',
    controlCount: 108,
  },
];

const CONTROLS: Omit<ControlNode, 'x' | 'y' | 'vx' | 'vy' | 'phaseOffset'>[] = [
  { id: 'access-ctrl', label: 'Access Control', radius: 20, type: 'control' },
  { id: 'data-protect', label: 'Data Protection', radius: 20, type: 'control' },
  { id: 'incident', label: 'Incident Response', radius: 20, type: 'control' },
  { id: 'risk', label: 'Risk Management', radius: 20, type: 'control' },
  { id: 'audit', label: 'Audit Logging', radius: 20, type: 'control' },
  { id: 'vendor', label: 'Vendor Management', radius: 20, type: 'control' },
];

const FILTER_OPTIONS = ['All Frameworks', 'ISO 27001', 'SOC 2', 'HIPAA', 'NDIS'];

// Map filter label → framework id
const FILTER_MAP: Record<string, string> = {
  'ISO 27001': 'iso27001',
  'SOC 2': 'soc2',
  HIPAA: 'hipaa',
  NDIS: 'ndis',
};

// ─── Layout helpers ───────────────────────────────────────────────────────────

function initNodes(w: number, h: number): { frameworks: FrameworkNode[]; controls: ControlNode[] } {
  const cx = w / 2;
  const cy = h / 2;
  const fRadius = Math.min(w, h) * 0.32;
  const cRadius = Math.min(w, h) * 0.16;

  const frameworks = FRAMEWORKS.map((f, i) => {
    const angle = (i / FRAMEWORKS.length) * Math.PI * 2 - Math.PI / 2;
    return {
      ...f,
      x: cx + Math.cos(angle) * fRadius,
      y: cy + Math.sin(angle) * fRadius,
      vx: 0,
      vy: 0,
      phaseOffset: Math.random() * Math.PI * 2,
    } as FrameworkNode;
  });

  const controls = CONTROLS.map((c, i) => {
    const angle = (i / CONTROLS.length) * Math.PI * 2 - Math.PI / 2;
    return {
      ...c,
      x: cx + Math.cos(angle) * cRadius,
      y: cy + Math.sin(angle) * cRadius,
      vx: 0,
      vy: 0,
      phaseOffset: Math.random() * Math.PI * 2,
    } as ControlNode;
  });

  return { frameworks, controls };
}

// ─── Mobile card grid ─────────────────────────────────────────────────────────

function MobileFrameworkGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {FRAMEWORKS.map((f) => (
        <div
          key={f.id}
          className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-2"
        >
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ background: f.color }}
          />
          <span className="text-sm font-semibold text-white">{f.label}</span>
          <span className="text-xs text-gray-400">{f.controlCount} controls</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

function FrameworkMapInner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const nodesRef = useRef<{ frameworks: FrameworkNode[]; controls: ControlNode[] } | null>(null);
  const hoveredRef = useRef<string | null>(null);
  const selectedRef = useRef<string | null>(null);
  const pausedRef = useRef<boolean>(false);
  const timeRef = useRef<number>(0);

  const [filter, setFilter] = useState('All Frameworks');
  const [selectedFramework, setSelectedFramework] = useState<typeof FRAMEWORKS[number] | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; count: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);

  // ── Resize & mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── Sync filter → selected framework
  useEffect(() => {
    const fid = FILTER_MAP[filter] ?? null;
    selectedRef.current = fid;
    if (fid) {
      const fw = FRAMEWORKS.find((f) => f.id === fid) ?? null;
      setSelectedFramework(fw);
      setPanelVisible(!!fw);
    } else {
      setSelectedFramework(null);
      setPanelVisible(false);
    }
  }, [filter]);

  // ── Draw loop
  const draw = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas || pausedRef.current) return;

    // 30 fps cap
    if (timestamp - lastFrameRef.current < 33) {
      rafRef.current = requestAnimationFrame(draw);
      return;
    }
    lastFrameRef.current = timestamp;
    timeRef.current += 0.016;

    const ctx = canvas.getContext('2d');
    if (!ctx || !nodesRef.current) return;

    const { frameworks, controls } = nodesRef.current;
    const w = canvas.width;
    const h = canvas.height;
    const t = timeRef.current;

    ctx.clearRect(0, 0, w, h);

    const hovered = hoveredRef.current;
    const selected = selectedRef.current;

    // Apply gentle float
    const allNodes: GraphNode[] = [...frameworks, ...controls];
    for (const n of allNodes) {
      n.x += Math.sin(t * 0.4 + n.phaseOffset) * 0.12;
      n.y += Math.cos(t * 0.3 + n.phaseOffset * 1.3) * 0.08;
    }

    // ── Draw edges
    for (const fw of frameworks) {
      const isActive = !selected || selected === fw.id;
      const isHovered = hovered === fw.id;

      for (const cid of fw.controls) {
        const ctrl = controls.find((c) => c.id === cid);
        if (!ctrl) continue;

        const highlight = isHovered || (selected === fw.id);
        const alpha = isActive ? (highlight ? 0.7 : 0.15) : 0.03;
        const strokeColor = highlight ? `rgba(6,182,212,${alpha})` : `rgba(${hexToRgb(fw.color)},${alpha})`;

        ctx.beginPath();
        ctx.moveTo(fw.x, fw.y);
        ctx.lineTo(ctrl.x, ctrl.y);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = highlight ? 1.5 : 0.8;
        ctx.stroke();
      }
    }

    // ── Draw control nodes
    for (const ctrl of controls) {
      // Check if any active framework connects here
      const connectedFws = frameworks.filter((f) => f.controls.includes(ctrl.id));
      const isActive = !selected || connectedFws.some((f) => f.id === selected);
      const alpha = isActive ? 0.9 : 0.12;

      ctx.beginPath();
      ctx.arc(ctrl.x, ctrl.y, ctrl.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(15,23,42,${alpha})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(100,116,139,${isActive ? 0.4 : 0.1})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      if (isActive) {
        ctx.fillStyle = `rgba(148,163,184,${alpha})`;
        ctx.font = '9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const words = ctrl.label.split(' ');
        if (words.length === 1) {
          ctx.fillText(ctrl.label, ctrl.x, ctrl.y);
        } else {
          ctx.fillText(words[0], ctrl.x, ctrl.y - 5);
          ctx.fillText(words.slice(1).join(' '), ctrl.x, ctrl.y + 6);
        }
      }
    }

    // ── Draw framework nodes
    for (const fw of frameworks) {
      const isHovered = hovered === fw.id;
      const isSelected = selected === fw.id;
      const isActive = !selected || isSelected;
      const alpha = isActive ? 1 : 0.15;

      // Glow
      if (isActive && (isHovered || isSelected)) {
        const grd = ctx.createRadialGradient(fw.x, fw.y, fw.radius * 0.5, fw.x, fw.y, fw.radius * 2.2);
        grd.addColorStop(0, fw.glowColor);
        grd.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(fw.x, fw.y, fw.radius * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }

      // Circle
      ctx.beginPath();
      ctx.arc(fw.x, fw.y, fw.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${hexToRgb(fw.color)},${isActive ? (isHovered || isSelected ? 0.25 : 0.15) : 0.04})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(${hexToRgb(fw.color)},${isActive ? (isHovered || isSelected ? 1 : 0.5) : 0.1})`;
      ctx.lineWidth = isHovered || isSelected ? 2 : 1.2;
      ctx.stroke();

      // Label
      ctx.fillStyle = `rgba(${isActive ? '255,255,255' : '148,163,184'},${alpha})`;
      ctx.font = `${isHovered || isSelected ? 'bold ' : ''}11px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(fw.label, fw.x, fw.y);
    }

    rafRef.current = requestAnimationFrame(draw);
  }, []);

  // ── Init canvas & loop
  useEffect(() => {
    if (isMobile) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const setSize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      nodesRef.current = initNodes(rect.width, rect.height);
    };

    setSize();

    const ro = new ResizeObserver(setSize);
    ro.observe(container);

    // IntersectionObserver pause
    const io = new IntersectionObserver(
      ([entry]) => { pausedRef.current = !entry.isIntersecting; },
      { threshold: 0.1 }
    );
    io.observe(canvas);

    // document.hidden pause
    const onVisChange = () => { pausedRef.current = document.hidden; };
    document.addEventListener('visibilitychange', onVisChange);

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisChange);
    };
  }, [isMobile, draw]);

  // ── Mouse handlers
  const getHoveredNode = useCallback((cx: number, cy: number): FrameworkNode | null => {
    if (!nodesRef.current) return null;
    for (const fw of nodesRef.current.frameworks) {
      const dx = cx - fw.x;
      const dy = cy - fw.y;
      if (Math.sqrt(dx * dx + dy * dy) <= fw.radius + 4) return fw;
    }
    return null;
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const node = getHoveredNode(cx, cy);
    hoveredRef.current = node ? node.id : null;
    if (node) {
      setTooltip({ x: cx, y: cy, label: node.label, count: node.controlCount });
      canvasRef.current!.style.cursor = 'pointer';
    } else {
      setTooltip(null);
      canvasRef.current!.style.cursor = 'default';
    }
  }, [getHoveredNode]);

  const onMouseLeave = useCallback(() => {
    hoveredRef.current = null;
    setTooltip(null);
  }, []);

  const onClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const node = getHoveredNode(cx, cy);
    if (node) {
      const already = selectedRef.current === node.id;
      selectedRef.current = already ? null : node.id;
      setSelectedFramework(already ? null : node);
      setPanelVisible(!already);
      setFilter(already ? 'All Frameworks' : node.label);
    }
  }, [getHoveredNode]);

  return (
    <section className="mk-section relative overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        {/* Heading */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            7 Frameworks • 200+ Controls
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            Compliance Framework{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Coverage
            </span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            See how FormaOS maps to every major framework
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setFilter(opt)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                filter === opt
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-200'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* Mobile fallback */}
        {isMobile ? (
          <MobileFrameworkGrid />
        ) : (
          /* Canvas + Detail Panel */
          <div className="relative flex gap-4 rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
            {/* Canvas */}
            <div
              ref={containerRef}
              className="relative flex-1 min-h-[480px]"
            >
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                onMouseMove={onMouseMove}
                onMouseLeave={onMouseLeave}
                onClick={onClick}
              />
              {/* Tooltip */}
              {tooltip && (
                <div
                  className="pointer-events-none absolute z-20 px-3 py-1.5 rounded-lg bg-gray-900/90 border border-white/10 text-xs text-white whitespace-nowrap shadow-xl"
                  style={{ left: tooltip.x + 12, top: tooltip.y - 28 }}
                >
                  <span className="font-semibold">{tooltip.label}</span>
                  <span className="text-gray-400 ml-1">— {tooltip.count} controls</span>
                </div>
              )}
            </div>

            {/* Detail Panel */}
            <div
              className={`transition-all duration-300 overflow-hidden ${
                panelVisible ? 'w-72 opacity-100' : 'w-0 opacity-0'
              }`}
            >
              {selectedFramework && (
                <div className="w-72 p-6 h-full flex flex-col gap-4 border-l border-white/10">
                  <div>
                    <span
                      className="inline-block w-3 h-3 rounded-full mb-3"
                      style={{ background: selectedFramework.color }}
                    />
                    <h3 className="text-xl font-bold text-white">{selectedFramework.label}</h3>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {selectedFramework.description}
                  </p>
                  <div className="mt-auto">
                    <div className="text-3xl font-bold text-white">
                      {selectedFramework.controlCount}
                    </div>
                    <div className="text-sm text-gray-400">controls mapped</div>
                  </div>
                  <button
                    onClick={() => { setFilter('All Frameworks'); setPanelVisible(false); setSelectedFramework(null); }}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors text-left"
                  >
                    ← Back to all frameworks
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Hex → "r,g,b" helper
function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

export const FrameworkMap = memo(FrameworkMapInner);
export default FrameworkMap;
