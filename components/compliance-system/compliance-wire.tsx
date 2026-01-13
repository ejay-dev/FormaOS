"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * =========================================================
 * COMPLIANCE WIRE COMPONENT
 * =========================================================
 * Visual representation of connections between compliance nodes.
 * Wires animate when data changes and show relationship types.
 * 
 * Wire Types:
 *  - Policy → Control: solid cyan
 *  - Control → Evidence: dotted teal
 *  - Evidence → Audit: dashed purple
 *  - Audit → Risk: alert amber/red
 *  - Risk → Task: zigzag red
 *  - Task → Control: green loop
 */

export type WireType = 
  | "policy-control"
  | "control-evidence"
  | "evidence-audit"
  | "audit-risk"
  | "risk-task"
  | "task-control";

export type WireState = 
  | "idle"
  | "active"      // Data flowing
  | "highlighted" // User focus
  | "error";      // Broken connection

interface ComplianceWireProps {
  type: WireType;
  state?: WireState;
  animate?: boolean;
  className?: string;
  thickness?: number;
  label?: string;
}

const WIRE_CONFIG: Record<WireType, {
  color: string;
  dashArray: string;
  glowColor: string;
  description: string;
}> = {
  "policy-control": {
    color: "#00d4fb", // cyan
    dashArray: "none", // solid
    glowColor: "rgba(0, 212, 251, 0.4)",
    description: "requires",
  },
  "control-evidence": {
    color: "#14b8a6", // teal
    dashArray: "4,4", // dotted
    glowColor: "rgba(20, 184, 166, 0.4)",
    description: "generates",
  },
  "evidence-audit": {
    color: "#a78bfa", // purple
    dashArray: "8,4", // dashed
    glowColor: "rgba(167, 139, 250, 0.4)",
    description: "supports",
  },
  "audit-risk": {
    color: "#f59e0b", // amber
    dashArray: "2,2", // alert dots
    glowColor: "rgba(245, 158, 11, 0.4)",
    description: "reveals",
  },
  "risk-task": {
    color: "#f43f5e", // red
    dashArray: "6,3,2,3", // zigzag effect
    glowColor: "rgba(244, 63, 94, 0.4)",
    description: "creates",
  },
  "task-control": {
    color: "#10b981", // green
    dashArray: "none", // solid loop
    glowColor: "rgba(16, 185, 129, 0.4)",
    description: "updates",
  },
};

/**
 * Horizontal wire connector for inline layouts
 */
export function ComplianceWire({
  type,
  state = "idle",
  animate = false,
  className,
  thickness = 2,
  label,
}: ComplianceWireProps) {
  const config = WIRE_CONFIG[type];
  
  const isAnimating = state === "active" || animate;

  return (
    <div className={cn(
      "relative flex items-center justify-center",
      className
    )}>
      {/* Wire line */}
      <svg 
        className="w-full h-8 overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Glow filter */}
          <filter id={`wire-glow-${type}`}>
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Animated gradient */}
          <linearGradient 
            id={`wire-flow-${type}`} 
            x1="0%" 
            y1="0%" 
            x2="100%" 
            y2="0%"
          >
            <stop offset="0%" stopColor={config.color} stopOpacity="0.3">
              {isAnimating && (
                <animate 
                  attributeName="offset" 
                  values="-0.5;1" 
                  dur="1.5s" 
                  repeatCount="indefinite" 
                />
              )}
            </stop>
            <stop offset="50%" stopColor={config.color} stopOpacity="1">
              {isAnimating && (
                <animate 
                  attributeName="offset" 
                  values="0;1.5" 
                  dur="1.5s" 
                  repeatCount="indefinite" 
                />
              )}
            </stop>
            <stop offset="100%" stopColor={config.color} stopOpacity="0.3">
              {isAnimating && (
                <animate 
                  attributeName="offset" 
                  values="0.5;2" 
                  dur="1.5s" 
                  repeatCount="indefinite" 
                />
              )}
            </stop>
          </linearGradient>

          {/* Arrow marker */}
          <marker
            id={`arrow-${type}`}
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="5"
            orient="auto"
          >
            <path 
              d="M0,0 L10,5 L0,10 L3,5 Z" 
              fill={config.color}
              className={isAnimating ? "animate-pulse" : ""}
            />
          </marker>
        </defs>

        {/* Glow line (background) */}
        {(state === "active" || state === "highlighted") && (
          <line
            x1="0"
            y1="16"
            x2="100%"
            y2="16"
            stroke={config.glowColor}
            strokeWidth={thickness + 4}
            filter={`url(#wire-glow-${type})`}
          />
        )}

        {/* Main wire */}
        <line
          x1="0"
          y1="16"
          x2="100%"
          y2="16"
          stroke={isAnimating ? `url(#wire-flow-${type})` : config.color}
          strokeWidth={thickness}
          strokeDasharray={config.dashArray === "none" ? undefined : config.dashArray}
          strokeLinecap="round"
          markerEnd={`url(#arrow-${type})`}
          className={cn(
            "transition-all duration-300",
            state === "error" && "opacity-50"
          )}
        />
      </svg>

      {/* Wire label */}
      {label && (
        <div 
          className={cn(
            "absolute top-full mt-1 text-[10px] font-medium uppercase tracking-wider whitespace-nowrap",
            "px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm",
          )}
          style={{ color: config.color }}
        >
          {label || config.description}
        </div>
      )}
    </div>
  );
}

/**
 * Vertical wire connector
 */
export function ComplianceWireVertical({
  type,
  state = "idle",
  animate = false,
  className,
  thickness = 2,
}: Omit<ComplianceWireProps, "label">) {
  const config = WIRE_CONFIG[type];
  const isAnimating = state === "active" || animate;

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      <svg 
        className="w-8 h-full min-h-[40px] overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient 
            id={`wire-flow-v-${type}`} 
            x1="0%" 
            y1="0%" 
            x2="0%" 
            y2="100%"
          >
            <stop offset="0%" stopColor={config.color} stopOpacity="0.3">
              {isAnimating && (
                <animate 
                  attributeName="offset" 
                  values="-0.5;1" 
                  dur="1.5s" 
                  repeatCount="indefinite" 
                />
              )}
            </stop>
            <stop offset="50%" stopColor={config.color} stopOpacity="1">
              {isAnimating && (
                <animate 
                  attributeName="offset" 
                  values="0;1.5" 
                  dur="1.5s" 
                  repeatCount="indefinite" 
                />
              )}
            </stop>
            <stop offset="100%" stopColor={config.color} stopOpacity="0.3">
              {isAnimating && (
                <animate 
                  attributeName="offset" 
                  values="0.5;2" 
                  dur="1.5s" 
                  repeatCount="indefinite" 
                />
              )}
            </stop>
          </linearGradient>
          
          <marker
            id={`arrow-v-${type}`}
            markerWidth="10"
            markerHeight="10"
            refX="5"
            refY="9"
            orient="auto"
          >
            <path 
              d="M0,0 L5,10 L10,0 L5,3 Z" 
              fill={config.color}
            />
          </marker>
        </defs>

        <line
          x1="16"
          y1="0"
          x2="16"
          y2="100%"
          stroke={isAnimating ? `url(#wire-flow-v-${type})` : config.color}
          strokeWidth={thickness}
          strokeDasharray={config.dashArray === "none" ? undefined : config.dashArray}
          strokeLinecap="round"
          markerEnd={`url(#arrow-v-${type})`}
        />
      </svg>
    </div>
  );
}

/**
 * Connection label badge
 */
export function WireLabel({ type, className }: { type: WireType; className?: string }) {
  const config = WIRE_CONFIG[type];
  
  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
        "bg-black/40 backdrop-blur-sm border",
        className
      )}
      style={{ 
        color: config.color,
        borderColor: `${config.color}40`
      }}
    >
      <span 
        className="w-2 h-0.5 rounded-full" 
        style={{ backgroundColor: config.color }}
      />
      {config.description}
    </span>
  );
}

export default ComplianceWire;
