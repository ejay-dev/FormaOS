"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useSystemState } from "@/lib/system-state";
import { ModuleId, WireState, SystemFlow } from "@/lib/system-state/types";

/**
 * =========================================================
 * SYSTEM WIRE - Animated Connection Component
 * =========================================================
 * Visualizes data/permission flows between modules.
 * Reflects real-time system operations.
 */

const WIRE_STYLES: Record<WireState, {
  stroke: string;
  strokeWidth: number;
  dashArray?: string;
  glowFilter: string;
  particleColor: string;
}> = {
  none: {
    stroke: "transparent",
    strokeWidth: 0,
    glowFilter: "",
    particleColor: "transparent",
  },
  animating: {
    stroke: "url(#wireGradientAnimating)",
    strokeWidth: 3,
    dashArray: "8 4",
    glowFilter: "url(#wireGlow)",
    particleColor: "#22d3ee",
  },
  connected: {
    stroke: "url(#wireGradientConnected)",
    strokeWidth: 2,
    glowFilter: "url(#wireGlowSubtle)",
    particleColor: "#34d399",
  },
  partial: {
    stroke: "url(#wireGradientPartial)",
    strokeWidth: 2,
    dashArray: "4 4",
    glowFilter: "",
    particleColor: "#fbbf24",
  },
  broken: {
    stroke: "#ef4444",
    strokeWidth: 2,
    dashArray: "2 6",
    glowFilter: "",
    particleColor: "#ef4444",
  },
};

interface SystemWireProps {
  flowId?: string;
  sourceModule: ModuleId;
  targetModule: ModuleId;
  state?: WireState;
  progress?: number;
  className?: string;
}

export function SystemWire({
  flowId,
  sourceModule,
  targetModule,
  state: propState,
  progress: propProgress,
  className,
}: SystemWireProps) {
  const { state: systemState } = useSystemState();
  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(0);
  const [particlePosition, setParticlePosition] = useState({ x: 0, y: 0 });

  // Get flow from system state if flowId provided
  const flow = flowId 
    ? systemState.activeFlows.find(f => f.id === flowId) 
    : undefined;
  
  const wireState = flow?.state || propState || "none";
  const progress = flow?.progress ?? propProgress ?? 0;
  const styles = WIRE_STYLES[wireState];

  // Animate particle along path
  useEffect(() => {
    if (!pathRef.current || wireState === "none") return;
    
    const length = pathRef.current.getTotalLength();
    setPathLength(length);

    if (wireState === "animating") {
      const animateParticle = () => {
        const t = (Date.now() % 2000) / 2000;
        const point = pathRef.current?.getPointAtLength(t * length);
        if (point) {
          setParticlePosition({ x: point.x, y: point.y });
        }
      };

      const interval = setInterval(animateParticle, 16);
      return () => clearInterval(interval);
    }
  }, [wireState]);

  if (wireState === "none") return null;

  return (
    <svg className={cn("absolute inset-0 w-full h-full pointer-events-none", className)}>
      <defs>
        {/* Gradients */}
        <linearGradient id="wireGradientAnimating" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
          <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.3" />
        </linearGradient>
        
        <linearGradient id="wireGradientConnected" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
        </linearGradient>
        
        <linearGradient id="wireGradientPartial" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.6" />
        </linearGradient>

        {/* Glow filters */}
        <filter id="wireGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        <filter id="wireGlowSubtle" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Main Wire Path - Example curved path */}
      <path
        ref={pathRef}
        d="M 50,100 C 100,100 150,150 200,150"
        fill="none"
        stroke={styles.stroke}
        strokeWidth={styles.strokeWidth}
        strokeDasharray={styles.dashArray}
        filter={styles.glowFilter}
        strokeLinecap="round"
        className={wireState === "animating" ? "animate-pulse" : ""}
        style={{
          strokeDashoffset: wireState === "animating" 
            ? pathLength * (1 - progress / 100)
            : 0,
          transition: "stroke-dashoffset 0.3s ease-out",
        }}
      />

      {/* Animated Particle */}
      {wireState === "animating" && (
        <circle
          cx={particlePosition.x}
          cy={particlePosition.y}
          r={4}
          fill={styles.particleColor}
          filter={styles.glowFilter}
        >
          <animate
            attributeName="r"
            values="3;5;3"
            dur="0.5s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.8;1;0.8"
            dur="0.5s"
            repeatCount="indefinite"
          />
        </circle>
      )}
    </svg>
  );
}

/**
 * System Wire Canvas - Container for multiple wires
 * Positions wires between actual node elements
 */
interface WireCanvasProps {
  children: React.ReactNode;
  className?: string;
}

export function WireCanvas({ children, className }: WireCanvasProps) {
  const { state } = useSystemState();
  const containerRef = useRef<HTMLDivElement>(null);
  const [wires, setWires] = useState<{ 
    id: string; 
    path: string; 
    state: WireState;
    progress: number;
  }[]>([]);

  // Update wire positions based on active flows
  useEffect(() => {
    if (!containerRef.current) return;

    const updateWires = () => {
      const newWires = state.activeFlows.map(flow => {
        // Find source and target elements
        const sourceEl = containerRef.current?.querySelector(`[data-module="${flow.sourceModule}"]`);
        const targetEl = containerRef.current?.querySelector(`[data-module="${flow.targetModule}"]`);

        if (!sourceEl || !targetEl) {
          return {
            id: flow.id,
            path: "",
            state: flow.state,
            progress: flow.progress,
          };
        }

        const containerRect = containerRef.current!.getBoundingClientRect();
        const sourceRect = sourceEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();

        // Calculate center points relative to container
        const sx = sourceRect.left + sourceRect.width / 2 - containerRect.left;
        const sy = sourceRect.top + sourceRect.height / 2 - containerRect.top;
        const tx = targetRect.left + targetRect.width / 2 - containerRect.left;
        const ty = targetRect.top + targetRect.height / 2 - containerRect.top;

        // Create curved path
        const midX = (sx + tx) / 2;
        const midY = (sy + ty) / 2;
        const curvature = Math.abs(tx - sx) * 0.3;
        
        const path = `M ${sx},${sy} Q ${midX},${midY - curvature} ${tx},${ty}`;

        return {
          id: flow.id,
          path,
          state: flow.state,
          progress: flow.progress,
        };
      });

      setWires(newWires);
    };

    updateWires();
    window.addEventListener("resize", updateWires);
    return () => window.removeEventListener("resize", updateWires);
  }, [state.activeFlows]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Wire Layer */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <defs>
          <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.3" />
          </linearGradient>
          <filter id="flowGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {wires.map(wire => wire.path && (
          <g key={wire.id}>
            <path
              d={wire.path}
              fill="none"
              stroke="url(#flowGradient)"
              strokeWidth={3}
              strokeDasharray={wire.state === "animating" ? "8 4" : undefined}
              filter="url(#flowGlow)"
              strokeLinecap="round"
              className={wire.state === "animating" ? "animate-pulse" : ""}
            />
          </g>
        ))}
      </svg>

      {/* Content Layer */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
