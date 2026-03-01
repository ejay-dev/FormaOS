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

const NODE_COLORS: Record<NetworkNode['type'], { fill: string; glow: string; label: string }> = {
  framework: { fill: 'rgba(20, 184, 166, 0.9)', glow: 'rgba(20, 184, 166, 0.3)', label: 'rgba(20, 184, 166, 1)' },
  control: { fill: 'rgba(99, 102, 241, 0.85)', glow: 'rgba(99, 102, 241, 0.25)', label: 'rgba(139, 92, 246, 1)' },
  evidence: { fill: 'rgba(16, 185, 129, 0.85)', glow: 'rgba(16, 185, 129, 0.25)', label: 'rgba(52, 211, 153, 1)' },
  task: { fill: 'rgba(245, 158, 11, 0.85)', glow: 'rgba(245, 158, 11, 0.25)', label: 'rgba(251, 191, 36, 1)' },
};

const TYPE_ICONS: Record<NetworkNode['type'], string> = {
  framework: 'F',
  control: 'C',
  evidence: 'E',
  task: 'T',
};

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

  // Framework nodes (center-top cluster)
  const frameworks = [
    { id: 'iso27001', label: 'ISO 27001', type: 'framework', baseX: cx - xSpread * 0.34, baseY: cy - ySpread * 0.92, size: size(24), phase: 0 },
    { id: 'soc2', label: 'SOC 2', type: 'framework', baseX: cx + xSpread * 0.34, baseY: cy - ySpread * 0.84, size: size(23), phase: 0.5 },
    { id: 'nist', label: 'NIST CSF', type: 'framework', baseX: cx, baseY: cy - ySpread * 1.12, size: size(22), phase: 1 },
    { id: 'hipaa', label: 'HIPAA', type: 'framework', baseX: cx - xSpread * 0.9, baseY: cy - ySpread * 0.58, size: size(19), phase: 1.5 },
    { id: 'gdpr', label: 'GDPR', type: 'framework', baseX: cx + xSpread * 0.9, baseY: cy - ySpread * 0.54, size: size(19), phase: 2 },
  ];

  // Control nodes (middle ring)
  const controls = [
    { id: 'ac-mgmt', label: 'Access Mgmt', type: 'control', baseX: cx - xSpread * 0.9, baseY: cy - ySpread * 0.02, size: size(17), phase: 0.3 },
    { id: 'encrypt', label: 'Encryption', type: 'control', baseX: cx - xSpread * 0.3, baseY: cy + ySpread * 0.2, size: size(17), phase: 0.8 },
    { id: 'logging', label: 'Audit Logging', type: 'control', baseX: cx + xSpread * 0.3, baseY: cy, size: size(17), phase: 1.3 },
    { id: 'incident', label: 'Incident Resp', type: 'control', baseX: cx + xSpread * 0.92, baseY: cy + ySpread * 0.08, size: size(16), phase: 1.8 },
    { id: 'change', label: 'Change Mgmt', type: 'control', baseX: cx, baseY: cy + ySpread * 0.28, size: size(16), phase: 2.3 },
    { id: 'risk', label: 'Risk Assess', type: 'control', baseX: cx - xSpread * 0.56, baseY: cy + ySpread * 0.42, size: size(15), phase: 2.8 },
  ];

  // Evidence nodes (lower ring)
  const evidence = [
    { id: 'ev-policy', label: 'Policy Docs', type: 'evidence', baseX: cx - xSpread * 0.68, baseY: cy + ySpread * 0.72, size: size(15), phase: 0.4 },
    { id: 'ev-log', label: 'Audit Logs', type: 'evidence', baseX: cx - xSpread * 0.12, baseY: cy + ySpread * 0.82, size: size(15), phase: 1.1 },
    { id: 'ev-cert', label: 'Certificates', type: 'evidence', baseX: cx + xSpread * 0.34, baseY: cy + ySpread * 0.72, size: size(15), phase: 1.7 },
    { id: 'ev-screen', label: 'Screenshots', type: 'evidence', baseX: cx + xSpread * 0.86, baseY: cy + ySpread * 0.58, size: size(14), phase: 2.4 },
  ];

  // Task nodes (bottom)
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

  // Edges: frameworks → controls → evidence → tasks
  const edges: NetworkEdge[] = [
    // Frameworks to controls
    { from: 'iso27001', to: 'ac-mgmt' }, { from: 'iso27001', to: 'encrypt' }, { from: 'iso27001', to: 'logging' },
    { from: 'soc2', to: 'logging' }, { from: 'soc2', to: 'incident' }, { from: 'soc2', to: 'change' },
    { from: 'nist', to: 'ac-mgmt' }, { from: 'nist', to: 'risk' }, { from: 'nist', to: 'incident' },
    { from: 'hipaa', to: 'encrypt' }, { from: 'hipaa', to: 'ac-mgmt' },
    { from: 'gdpr', to: 'logging' }, { from: 'gdpr', to: 'encrypt' },
    // Controls to evidence
    { from: 'ac-mgmt', to: 'ev-policy' }, { from: 'encrypt', to: 'ev-cert' },
    { from: 'logging', to: 'ev-log' }, { from: 'incident', to: 'ev-screen' },
    { from: 'change', to: 'ev-log' }, { from: 'risk', to: 'ev-policy' },
    // Evidence to tasks
    { from: 'ev-policy', to: 'task-review' }, { from: 'ev-log', to: 'task-approve' },
    { from: 'ev-cert', to: 'task-upload' }, { from: 'ev-screen', to: 'task-approve' },
  ];

  return { nodes, edges };
}

/* ── Canvas renderer ── */

interface ComplianceNetworkVizProps {
  className?: string;
  /** Scroll progress 0-1 to control which layer is highlighted */
  scrollProgress?: number;
}

function ComplianceNetworkVizInner({ className = '' }: ComplianceNetworkVizProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isInView, setIsInView] = useState(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const dataRef = useRef<ReturnType<typeof createNetworkData> | null>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const sizeRef = useRef({ width: 0, height: 0 });

  // Intersection observer for performance
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

  // Mouse tracking
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

  // Main animation loop
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
    }
    sizeRef.current = { width: w, height: h };

    const { nodes, edges } = dataRef.current;

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

    const animate = (timestamp: number) => {
      animRef.current = requestAnimationFrame(animate);

      if (timestamp - lastFrame < interval) return;
      lastFrame = timestamp;
      timeRef.current += 16;
      const t = timeRef.current;

      ctx.clearRect(0, 0, w, h);
      const centerX = w / 2;
      const centerY = h / 2 + 8;
      const unit = Math.min(w, h);

      const halo = ctx.createRadialGradient(centerX, centerY, 24, centerX, centerY, unit * 0.56);
      halo.addColorStop(0, 'rgba(56, 189, 248, 0.16)');
      halo.addColorStop(0.45, 'rgba(20, 184, 166, 0.1)');
      halo.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, w, h);

      const orbitRadii = [unit * 0.22, unit * 0.3, unit * 0.38];
      orbitRadii.forEach((radius, index) => {
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radius * 1.18, radius, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(148, 163, 184, ${mousePos ? 0.08 : 0.15 - index * 0.03})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Subtle breathing movement on nodes
      if (!shouldReduceMotion) {
        for (const node of nodes) {
          node.x = node.baseX + Math.sin(t * 0.001 + node.phase) * 3;
          node.y = node.baseY + Math.cos(t * 0.0008 + node.phase * 1.3) * 2.5;
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

      // Draw edges
      for (const edge of edges) {
        const fromNode = nodes.find(n => n.id === edge.from);
        const toNode = nodes.find(n => n.id === edge.to);
        if (!fromNode || !toNode) continue;

        const isHighlighted = hoveredNode && (connectedIds.has(edge.from) && connectedIds.has(edge.to));
        const baseAlpha = isHighlighted ? 0.5 : hoveredNode ? 0.06 : 0.15;

        // Animated flow pulse along edge
        const flowPhase = ((t * 0.001 + fromNode.phase) % 1);
        const flowX = fromNode.x + (toNode.x - fromNode.x) * flowPhase;
        const flowY = fromNode.y + (toNode.y - fromNode.y) * flowPhase;

        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.strokeStyle = `rgba(148, 163, 184, ${baseAlpha})`;
        ctx.lineWidth = isHighlighted ? 1.8 : hoveredNode ? 0.9 : 1.15;
        ctx.stroke();

        // Flow particle on edge
        if (!shouldReduceMotion && (isHighlighted || !hoveredNode)) {
          const flowAlpha = isHighlighted ? 0.7 : 0.25;
          const colors = NODE_COLORS[fromNode.type];
          const flowGradient = ctx.createRadialGradient(flowX, flowY, 0, flowX, flowY, 4);
          flowGradient.addColorStop(0, colors.fill.replace(/[\d.]+\)$/, `${flowAlpha})`));
          flowGradient.addColorStop(1, colors.glow.replace(/[\d.]+\)$/, '0)'));
          ctx.fillStyle = flowGradient;
          ctx.beginPath();
          ctx.arc(flowX, flowY, isHighlighted ? 3.8 : 2.9, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw nodes
      for (const node of nodes) {
        const colors = NODE_COLORS[node.type];
        const isHovered = hoveredNode?.id === node.id;
        const isConnected = connectedIds.has(node.id);
        const isDimmed = hoveredNode && !isConnected;

        const nodeAlpha = isDimmed ? 0.2 : 1;
        const nodeSize = isHovered ? node.size * 1.28 : isConnected ? node.size * 1.12 : node.size;

        // Glow ring
        if ((isHovered || isConnected) && !shouldReduceMotion) {
          const glowSize = nodeSize + (isHovered ? 18 : 10);
          const glowGradient = ctx.createRadialGradient(node.x, node.y, nodeSize * 0.5, node.x, node.y, glowSize);
          glowGradient.addColorStop(0, colors.glow);
          glowGradient.addColorStop(1, colors.glow.replace(/[\d.]+\)$/, '0)'));
          ctx.fillStyle = glowGradient;
          ctx.beginPath();
          ctx.arc(node.x, node.y, glowSize, 0, Math.PI * 2);
          ctx.fill();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeSize, 0, Math.PI * 2);
        ctx.fillStyle = colors.fill.replace(/[\d.]+\)$/, `${nodeAlpha * 0.85})`);
        ctx.fill();

        // Node border
        ctx.strokeStyle = colors.fill.replace(/[\d.]+\)$/, `${nodeAlpha * 0.6})`);
        ctx.lineWidth = isHovered ? 2 : 1;
        ctx.stroke();

        // Type letter inside node
        ctx.fillStyle = `rgba(255, 255, 255, ${nodeAlpha * 0.9})`;
        ctx.font = `${isHovered ? 'bold ' : ''}${Math.round(nodeSize * 0.75)}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(TYPE_ICONS[node.type], node.x, node.y);

        // Label (show on hover/connected or always for frameworks)
        if (isHovered || (isConnected && hoveredNode) || (node.type === 'framework' && !isDimmed)) {
          ctx.fillStyle = `rgba(255, 255, 255, ${isHovered ? 0.95 : isDimmed ? 0.3 : 0.7})`;
          const labelFontSize = w < 640 ? 10 : 12;
          ctx.font = `${isHovered ? 'bold ' : ''}${labelFontSize}px system-ui, -apple-system, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(node.label, node.x, node.y + nodeSize + 16);
        }
      }

    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [isInView, shouldReduceMotion, mousePos]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      dataRef.current = null; // Force recreation on next frame
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
