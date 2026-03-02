'use client';

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  memo,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { useReducedMotion } from 'framer-motion';

/* ── Data model: Compliance entities and their relationships ── */

interface NetworkNode {
  id: string;
  label: string;
  type: 'framework' | 'control' | 'evidence' | 'task';
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  phase: number;
}

interface NetworkEdge {
  from: string;
  to: string;
}

const NODE_COLORS: Record<NetworkNode['type'], { fill: string; glow: string; ring: string; label: string }> = {
  framework: {
    fill: 'rgba(20, 184, 166, 0.92)',
    glow: 'rgba(20, 184, 166, 0.35)',
    ring: 'rgba(20, 184, 166, 0.5)',
    label: 'rgba(94, 234, 212, 1)',
  },
  control: {
    fill: 'rgba(99, 102, 241, 0.88)',
    glow: 'rgba(99, 102, 241, 0.30)',
    ring: 'rgba(129, 140, 248, 0.5)',
    label: 'rgba(165, 180, 252, 1)',
  },
  evidence: {
    fill: 'rgba(16, 185, 129, 0.88)',
    glow: 'rgba(16, 185, 129, 0.30)',
    ring: 'rgba(52, 211, 153, 0.5)',
    label: 'rgba(110, 231, 183, 1)',
  },
  task: {
    fill: 'rgba(245, 158, 11, 0.88)',
    glow: 'rgba(245, 158, 11, 0.30)',
    ring: 'rgba(251, 191, 36, 0.5)',
    label: 'rgba(253, 224, 71, 1)',
  },
};

const TYPE_ICONS: Record<NetworkNode['type'], string> = {
  framework: 'F',
  control: 'C',
  evidence: 'E',
  task: 'T',
};

/* ── Ambient floating particle ── */
interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  phase: number;
}

function createAmbientParticles(w: number, h: number, count: number): AmbientParticle[] {
  const particles: AmbientParticle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.12,
      size: 0.5 + Math.random() * 1.2,
      alpha: 0.08 + Math.random() * 0.18,
      phase: Math.random() * Math.PI * 2,
    });
  }
  return particles;
}

function createNetworkData(width: number, height: number): { nodes: NetworkNode[]; edges: NetworkEdge[] } {
  const isCompact = width < 900;
  const isPhone = width < 640;
  const scale = isPhone ? 0.82 : isCompact ? 0.9 : 1;
  const horizontalInset = isPhone ? 28 : isCompact ? 36 : 52;
  const topInset = isPhone ? 58 : 50;
  const bottomInset = isPhone ? 92 : 78;
  const usableWidth = Math.max(width - horizontalInset * 2, width * 0.52);
  const usableHeight = Math.max(height - topInset - bottomInset, height * 0.5);
  const cx = horizontalInset + usableWidth / 2;
  const cy = topInset + usableHeight * (isPhone ? 0.46 : 0.48);
  const xSpread = Math.min(usableWidth * 0.4, isPhone ? 176 : 300);
  const ySpread = Math.min(usableHeight * 0.43, isPhone ? 118 : 150);
  const taskDepth = isPhone ? 0.86 : isCompact ? 0.92 : 1.02;
  const size = (value: number) => Math.max(Math.round(value * scale), 10);

  const frameworks = [
    { id: 'iso27001', label: 'ISO 27001', type: 'framework', baseX: cx - xSpread * 0.34, baseY: cy - ySpread * 0.92, size: size(24), phase: 0 },
    { id: 'soc2', label: 'SOC 2', type: 'framework', baseX: cx + xSpread * 0.34, baseY: cy - ySpread * 0.84, size: size(23), phase: 0.5 },
    { id: 'nist', label: 'NIST CSF', type: 'framework', baseX: cx, baseY: cy - ySpread * 1.12, size: size(22), phase: 1 },
    { id: 'hipaa', label: 'HIPAA', type: 'framework', baseX: cx - xSpread * 0.9, baseY: cy - ySpread * 0.58, size: size(19), phase: 1.5 },
    { id: 'gdpr', label: 'GDPR', type: 'framework', baseX: cx + xSpread * 0.9, baseY: cy - ySpread * 0.54, size: size(19), phase: 2 },
  ];

  const controls = [
    { id: 'ac-mgmt', label: 'Access Mgmt', type: 'control', baseX: cx - xSpread * 0.9, baseY: cy - ySpread * 0.02, size: size(17), phase: 0.3 },
    { id: 'encrypt', label: 'Encryption', type: 'control', baseX: cx - xSpread * 0.3, baseY: cy + ySpread * 0.2, size: size(17), phase: 0.8 },
    { id: 'logging', label: 'Audit Logging', type: 'control', baseX: cx + xSpread * 0.3, baseY: cy, size: size(17), phase: 1.3 },
    { id: 'incident', label: 'Incident Resp', type: 'control', baseX: cx + xSpread * 0.92, baseY: cy + ySpread * 0.08, size: size(16), phase: 1.8 },
    { id: 'change', label: 'Change Mgmt', type: 'control', baseX: cx, baseY: cy + ySpread * 0.28, size: size(16), phase: 2.3 },
    { id: 'risk', label: 'Risk Assess', type: 'control', baseX: cx - xSpread * 0.56, baseY: cy + ySpread * 0.42, size: size(15), phase: 2.8 },
  ];

  const evidence = [
    { id: 'ev-policy', label: 'Policy Docs', type: 'evidence', baseX: cx - xSpread * 0.68, baseY: cy + ySpread * 0.72, size: size(15), phase: 0.4 },
    { id: 'ev-log', label: 'Audit Logs', type: 'evidence', baseX: cx - xSpread * 0.12, baseY: cy + ySpread * 0.82, size: size(15), phase: 1.1 },
    { id: 'ev-cert', label: 'Certificates', type: 'evidence', baseX: cx + xSpread * 0.34, baseY: cy + ySpread * 0.72, size: size(15), phase: 1.7 },
    { id: 'ev-screen', label: 'Screenshots', type: 'evidence', baseX: cx + xSpread * 0.86, baseY: cy + ySpread * 0.58, size: size(14), phase: 2.4 },
  ];

  const tasks = [
    { id: 'task-review', label: 'Review', type: 'task', baseX: cx - xSpread * 0.42, baseY: cy + ySpread * taskDepth, size: size(14), phase: 0.6 },
    { id: 'task-approve', label: 'Approve', type: 'task', baseX: cx + xSpread * 0.06, baseY: cy + ySpread * (taskDepth + 0.06), size: size(14), phase: 1.4 },
    { id: 'task-upload', label: 'Upload', type: 'task', baseX: cx + xSpread * 0.48, baseY: cy + ySpread * (taskDepth - 0.06), size: size(14), phase: 2.1 },
  ];

  const nodes: NetworkNode[] = [...frameworks, ...controls, ...evidence, ...tasks].map(n => ({
    ...n,
    type: n.type as NetworkNode['type'],
    x: n.baseX,
    y: n.baseY,
  }));

  const edges: NetworkEdge[] = [
    { from: 'iso27001', to: 'ac-mgmt' }, { from: 'iso27001', to: 'encrypt' }, { from: 'iso27001', to: 'logging' },
    { from: 'soc2', to: 'logging' }, { from: 'soc2', to: 'incident' }, { from: 'soc2', to: 'change' },
    { from: 'nist', to: 'ac-mgmt' }, { from: 'nist', to: 'risk' }, { from: 'nist', to: 'incident' },
    { from: 'hipaa', to: 'encrypt' }, { from: 'hipaa', to: 'ac-mgmt' },
    { from: 'gdpr', to: 'logging' }, { from: 'gdpr', to: 'encrypt' },
    { from: 'ac-mgmt', to: 'ev-policy' }, { from: 'encrypt', to: 'ev-cert' },
    { from: 'logging', to: 'ev-log' }, { from: 'incident', to: 'ev-screen' },
    { from: 'change', to: 'ev-log' }, { from: 'risk', to: 'ev-policy' },
    { from: 'ev-policy', to: 'task-review' }, { from: 'ev-log', to: 'task-approve' },
    { from: 'ev-cert', to: 'task-upload' }, { from: 'ev-screen', to: 'task-approve' },
  ];

  return { nodes, edges };
}

/* ── Bezier curve helpers ── */

function getBezierControlPoint(
  x1: number, y1: number,
  x2: number, y2: number,
  cx: number, cy: number,
): { cpx: number; cpy: number } {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const pull = 0.15;
  return {
    cpx: mx + (cx - mx) * pull,
    cpy: my + (cy - my) * pull,
  };
}

function getQuadraticPoint(
  t: number,
  x1: number, y1: number,
  cpx: number, cpy: number,
  x2: number, y2: number,
): { x: number; y: number } {
  const u = 1 - t;
  return {
    x: u * u * x1 + 2 * u * t * cpx + t * t * x2,
    y: u * u * y1 + 2 * u * t * cpy + t * t * y2,
  };
}

/* ── Canvas renderer ── */

interface ComplianceNetworkVizProps {
  className?: string;
  scrollProgress?: number;
}

function ComplianceNetworkVizInner({ className = '' }: ComplianceNetworkVizProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isInView, setIsInView] = useState(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const dataRef = useRef<ReturnType<typeof createNetworkData> | null>(null);
  const particlesRef = useRef<AmbientParticle[]>([]);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const sizeRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { rootMargin: '200px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handlePointerMove = useCallback((e: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) * (canvas.width / rect.width / (window.devicePixelRatio || 1)),
      y: (e.clientY - rect.top) * (canvas.height / rect.height / (window.devicePixelRatio || 1)),
    });
  }, []);

  const clearPointer = useCallback(() => setMousePos(null), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !isInView) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (
      !dataRef.current ||
      Math.abs(sizeRef.current.width - w) > 12 ||
      Math.abs(sizeRef.current.height - h) > 12
    ) {
      dataRef.current = createNetworkData(w, h);
      particlesRef.current = createAmbientParticles(w, h, w < 640 ? 30 : 55);
    }
    sizeRef.current = { width: w, height: h };

    const { nodes, edges } = dataRef.current;
    const particles = particlesRef.current;

    let lastFrame = 0;
    const FPS = 30;
    const interval = 1000 / FPS;

    const findNearestNode = (mx: number, my: number): NetworkNode | null => {
      let nearest: NetworkNode | null = null;
      let minDist = w < 640 ? 72 : 96;
      for (const node of nodes) {
        const dx = node.x - mx;
        const dy = node.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          nearest = node;
        }
      }
      return nearest;
    };

    const centerX = w / 2;
    const centerY = h / 2 + 8;

    const animate = (timestamp: number) => {
      animRef.current = requestAnimationFrame(animate);

      if (timestamp - lastFrame < interval) return;
      lastFrame = timestamp;
      timeRef.current += 16;
      const t = timeRef.current;
      const tSec = t * 0.001;

      ctx.clearRect(0, 0, w, h);
      const unit = Math.min(w, h);

      /* ── BG: Multi-layer radial halos ── */
      const halo1 = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, unit * 0.6);
      halo1.addColorStop(0, 'rgba(20, 184, 166, 0.12)');
      halo1.addColorStop(0.3, 'rgba(56, 189, 248, 0.06)');
      halo1.addColorStop(0.6, 'rgba(99, 102, 241, 0.04)');
      halo1.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = halo1;
      ctx.fillRect(0, 0, w, h);

      /* ── BG: Animated ambient particles ── */
      for (const p of particles) {
        if (!shouldReduceMotion) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = w;
          if (p.x > w) p.x = 0;
          if (p.y < 0) p.y = h;
          if (p.y > h) p.y = 0;
        }
        const pAlpha = p.alpha * (0.6 + 0.4 * Math.sin(tSec * 0.5 + p.phase));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(148, 163, 184, ${pAlpha})`;
        ctx.fill();
      }

      /* ── BG: Concentric orbit rings (dashed, animated) ── */
      const orbitRadii = [unit * 0.18, unit * 0.27, unit * 0.36, unit * 0.46];
      ctx.save();
      orbitRadii.forEach((radius, index) => {
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radius * 1.2, radius, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(148, 163, 184, ${0.06 - index * 0.01})`;
        ctx.lineWidth = 0.8;
        const dashOffset = shouldReduceMotion ? 0 : tSec * (6 + index * 2) * (index % 2 === 0 ? 1 : -1);
        ctx.setLineDash([4, 12 + index * 4]);
        ctx.lineDashOffset = dashOffset;
        ctx.stroke();
      });
      ctx.setLineDash([]);
      ctx.restore();

      /* ── BG: Scanning sweep line ── */
      if (!shouldReduceMotion) {
        const sweepAngle = tSec * 0.3;
        const sweepLen = unit * 0.55;
        const sx = centerX + Math.cos(sweepAngle) * sweepLen;
        const sy = centerY + Math.sin(sweepAngle) * sweepLen;
        const sweepGrad = ctx.createLinearGradient(centerX, centerY, sx, sy);
        sweepGrad.addColorStop(0, 'rgba(20, 184, 166, 0)');
        sweepGrad.addColorStop(0.5, 'rgba(20, 184, 166, 0.04)');
        sweepGrad.addColorStop(1, 'rgba(20, 184, 166, 0)');
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = sweepGrad;
        ctx.lineWidth = unit * 0.15;
        ctx.stroke();
      }

      /* ── Breathing movement on nodes ── */
      if (!shouldReduceMotion) {
        for (const node of nodes) {
          node.x = node.baseX + Math.sin(tSec + node.phase) * 3.5;
          node.y = node.baseY + Math.cos(tSec * 0.8 + node.phase * 1.3) * 2.8;
        }
      }

      const hoveredNode = mousePos ? findNearestNode(mousePos.x, mousePos.y) : null;
      const connectedIds = new Set<string>();
      if (hoveredNode) {
        connectedIds.add(hoveredNode.id);
        for (const edge of edges) {
          if (edge.from === hoveredNode.id || edge.to === hoveredNode.id) {
            connectedIds.add(edge.from);
            connectedIds.add(edge.to);
          }
        }
      }

      /* ── Edges: Curved bezier paths with animated data packets ── */
      for (const edge of edges) {
        const fromNode = nodes.find(n => n.id === edge.from);
        const toNode = nodes.find(n => n.id === edge.to);
        if (!fromNode || !toNode) continue;

        const isHighlighted = hoveredNode != null && connectedIds.has(edge.from) && connectedIds.has(edge.to);
        const isDimmed = hoveredNode != null && !isHighlighted;
        const baseAlpha = isHighlighted ? 0.55 : isDimmed ? 0.04 : 0.12;

        const cp = getBezierControlPoint(fromNode.x, fromNode.y, toNode.x, toNode.y, centerX, centerY);

        // Edge path
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.quadraticCurveTo(cp.cpx, cp.cpy, toNode.x, toNode.y);
        if (isHighlighted) {
          const edgeGrad = ctx.createLinearGradient(fromNode.x, fromNode.y, toNode.x, toNode.y);
          const fromColor = NODE_COLORS[fromNode.type];
          const toColor = NODE_COLORS[toNode.type];
          edgeGrad.addColorStop(0, fromColor.ring);
          edgeGrad.addColorStop(1, toColor.ring);
          ctx.strokeStyle = edgeGrad;
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = `rgba(148, 163, 184, ${baseAlpha})`;
          ctx.lineWidth = isDimmed ? 0.5 : 1;
        }
        ctx.stroke();

        // Animated data packets along edge
        if (!shouldReduceMotion && !isDimmed) {
          const packetCount = isHighlighted ? 3 : 1;
          for (let p = 0; p < packetCount; p++) {
            const flowPhase = ((tSec * 0.4 + fromNode.phase + p * (1 / packetCount)) % 1);
            const pos = getQuadraticPoint(flowPhase, fromNode.x, fromNode.y, cp.cpx, cp.cpy, toNode.x, toNode.y);
            const packetSize = isHighlighted ? 4 : 2.5;
            const packetAlpha = isHighlighted ? 0.8 : 0.3;
            const colors = NODE_COLORS[fromNode.type];

            // Packet glow
            const pgGrad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, packetSize * 3);
            pgGrad.addColorStop(0, colors.fill.replace(/[\d.]+\)$/, `${packetAlpha * 0.6})`));
            pgGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = pgGrad;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, packetSize * 3, 0, Math.PI * 2);
            ctx.fill();

            // Packet core
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, packetSize, 0, Math.PI * 2);
            ctx.fillStyle = colors.fill.replace(/[\d.]+\)$/, `${packetAlpha})`);
            ctx.fill();

            // Trail (3 fading dots behind)
            if (isHighlighted) {
              for (let tr = 1; tr <= 3; tr++) {
                const trailT = Math.max(0, flowPhase - tr * 0.025);
                const trPos = getQuadraticPoint(trailT, fromNode.x, fromNode.y, cp.cpx, cp.cpy, toNode.x, toNode.y);
                ctx.beginPath();
                ctx.arc(trPos.x, trPos.y, packetSize * (1 - tr * 0.2), 0, Math.PI * 2);
                ctx.fillStyle = colors.fill.replace(/[\d.]+\)$/, `${packetAlpha * (1 - tr * 0.3)})`);
                ctx.fill();
              }
            }
          }
        }
      }

      /* ── Hover ripple effect ── */
      if (hoveredNode && !shouldReduceMotion) {
        const ripplePhase = (tSec * 2) % 1;
        const rippleRadius = hoveredNode.size * (1.5 + ripplePhase * 2.5);
        const rippleAlpha = (1 - ripplePhase) * 0.25;
        const colors = NODE_COLORS[hoveredNode.type];
        ctx.beginPath();
        ctx.arc(hoveredNode.x, hoveredNode.y, rippleRadius, 0, Math.PI * 2);
        ctx.strokeStyle = colors.ring.replace(/[\d.]+\)$/, `${rippleAlpha})`);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      /* ── Nodes: Multi-ring enterprise rendering ── */
      for (const node of nodes) {
        const colors = NODE_COLORS[node.type];
        const isHovered = hoveredNode?.id === node.id;
        const isConnected = connectedIds.has(node.id);
        const isDimmed = hoveredNode != null && !isConnected;

        const nodeAlpha = isDimmed ? 0.15 : 1;
        const nodeSize = isHovered ? node.size * 1.3 : isConnected ? node.size * 1.15 : node.size;

        // Outer glow halo (large, soft)
        if (!isDimmed) {
          const haloSize = nodeSize * (isHovered ? 3.5 : 2.2);
          const pulse = shouldReduceMotion ? 1 : 0.85 + 0.15 * Math.sin(tSec * 1.5 + node.phase);
          const haloGrad = ctx.createRadialGradient(node.x, node.y, nodeSize * 0.4, node.x, node.y, haloSize * pulse);
          haloGrad.addColorStop(0, colors.glow.replace(/[\d.]+\)$/, `${isHovered ? 0.35 : 0.15})`));
          haloGrad.addColorStop(0.6, colors.glow.replace(/[\d.]+\)$/, `${isHovered ? 0.12 : 0.04})`));
          haloGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = haloGrad;
          ctx.beginPath();
          ctx.arc(node.x, node.y, haloSize * pulse, 0, Math.PI * 2);
          ctx.fill();
        }

        // Outer ring (dashed, spinning)
        if (!isDimmed && !shouldReduceMotion) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(node.x, node.y, nodeSize + 5, 0, Math.PI * 2);
          ctx.strokeStyle = colors.ring.replace(/[\d.]+\)$/, `${isHovered ? 0.6 : 0.2})`);
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 5]);
          ctx.lineDashOffset = tSec * 8 * (node.phase > 1 ? -1 : 1);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }

        // Inner ring (solid)
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeSize + 1.5, 0, Math.PI * 2);
        ctx.strokeStyle = colors.ring.replace(/[\d.]+\)$/, `${nodeAlpha * (isHovered ? 0.7 : 0.3)})`);
        ctx.lineWidth = 1;
        ctx.stroke();

        // Node fill — gradient from center
        const fillGrad = ctx.createRadialGradient(
          node.x - nodeSize * 0.2, node.y - nodeSize * 0.2, 0,
          node.x, node.y, nodeSize,
        );
        fillGrad.addColorStop(0, colors.fill.replace(/[\d.]+\)$/, `${nodeAlpha * 0.95})`));
        fillGrad.addColorStop(1, colors.fill.replace(/[\d.]+\)$/, `${nodeAlpha * 0.65})`));
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeSize, 0, Math.PI * 2);
        ctx.fillStyle = fillGrad;
        ctx.fill();

        // Node border (solid)
        ctx.strokeStyle = colors.fill.replace(/[\d.]+\)$/, `${nodeAlpha * 0.7})`);
        ctx.lineWidth = isHovered ? 2 : 1.2;
        ctx.stroke();

        // Inner icon text
        ctx.fillStyle = `rgba(255, 255, 255, ${nodeAlpha * 0.92})`;
        ctx.font = `${isHovered ? '600 ' : '500 '}${Math.round(nodeSize * 0.72)}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(TYPE_ICONS[node.type], node.x, node.y + 0.5);

        // Label
        if (isHovered || (isConnected && hoveredNode) || (node.type === 'framework' && !isDimmed)) {
          const labelAlpha = isHovered ? 0.95 : isDimmed ? 0.2 : 0.65;
          const labelFontSize = w < 640 ? 10 : 12;
          ctx.fillStyle = colors.label.replace(/[\d.]+\)$/, `${labelAlpha})`);
          ctx.font = `${isHovered ? '600 ' : '400 '}${labelFontSize}px system-ui, -apple-system, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(node.label, node.x, node.y + nodeSize + 18);
        }
      }

      /* ── HUD: Corner brackets ── */
      const bracketSize = 16;
      const bracketInset = 6;
      const bracketColor = `rgba(148, 163, 184, 0.12)`;
      ctx.strokeStyle = bracketColor;
      ctx.lineWidth = 1;
      // Top-left
      ctx.beginPath();
      ctx.moveTo(bracketInset, bracketInset + bracketSize);
      ctx.lineTo(bracketInset, bracketInset);
      ctx.lineTo(bracketInset + bracketSize, bracketInset);
      ctx.stroke();
      // Top-right
      ctx.beginPath();
      ctx.moveTo(w - bracketInset - bracketSize, bracketInset);
      ctx.lineTo(w - bracketInset, bracketInset);
      ctx.lineTo(w - bracketInset, bracketInset + bracketSize);
      ctx.stroke();
      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(bracketInset, h - bracketInset - bracketSize);
      ctx.lineTo(bracketInset, h - bracketInset);
      ctx.lineTo(bracketInset + bracketSize, h - bracketInset);
      ctx.stroke();
      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(w - bracketInset - bracketSize, h - bracketInset);
      ctx.lineTo(w - bracketInset, h - bracketInset);
      ctx.lineTo(w - bracketInset, h - bracketInset - bracketSize);
      ctx.stroke();

    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [isInView, shouldReduceMotion, mousePos]);

  useEffect(() => {
    const handleResize = () => {
      dataRef.current = null;
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (shouldReduceMotion) {
    return (
      <div ref={containerRef} className={`relative ${className}`}>
        <div className="flex items-center justify-center h-full text-gray-500 text-sm">
          Interactive compliance network (motion reduced)
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={clearPointer}
        onPointerUp={clearPointer}
        onPointerCancel={clearPointer}
        className="h-full w-full cursor-default md:cursor-crosshair"
      />
    </div>
  );
}

export const ComplianceNetworkViz = memo(ComplianceNetworkVizInner);
export default ComplianceNetworkViz;
