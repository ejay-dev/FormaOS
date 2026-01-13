"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { 
  FileText, 
  Shield, 
  FileCheck, 
  ClipboardCheck, 
  AlertTriangle, 
  CheckSquare,
  Building2,
  LucideIcon
} from "lucide-react";

/**
 * =========================================================
 * COMPLIANCE NODE COMPONENT
 * =========================================================
 * Visual representation of compliance graph nodes.
 * Each node type has a distinct shape, color, and behavior.
 */

export type NodeType = 
  | "policy"      // Cyan pill/hex - governance documents
  | "control"     // Teal square - operational controls
  | "evidence"    // Purple circle - proof artifacts
  | "audit"       // Amber diamond - verification events
  | "risk"        // Red triangle - identified risks
  | "task"        // Green rounded rect - action items
  | "entity";     // Neutral container - organizational units

export type NodeState = 
  | "idle"        // Default resting state
  | "active"      // Currently selected/focused (glow)
  | "at-risk"     // Needs attention (red edge pulse)
  | "verified"    // Validated/complete (green shimmer)
  | "linked"      // Connected/related (edge highlight)
  | "processing"; // Async operation in progress

interface ComplianceNodeProps {
  type: NodeType;
  state?: NodeState;
  label: string;
  sublabel?: string;
  count?: number;
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  interactive?: boolean;
}

const NODE_CONFIG: Record<NodeType, {
  icon: LucideIcon;
  baseClass: string;
  activeGlow: string;
  shape: string;
  borderColor: string;
  bgGradient: string;
  iconColor: string;
}> = {
  policy: {
    icon: FileText,
    baseClass: "border-cyan-400/40 bg-cyan-500/10",
    activeGlow: "shadow-[0_0_24px_rgba(0,212,251,0.5)]",
    shape: "rounded-full", // Pill shape
    borderColor: "border-cyan-400/60",
    bgGradient: "bg-gradient-to-br from-cyan-500/20 via-cyan-500/10 to-transparent",
    iconColor: "text-cyan-300",
  },
  control: {
    icon: Shield,
    baseClass: "border-teal-400/40 bg-teal-500/10",
    activeGlow: "shadow-[0_0_24px_rgba(20,184,166,0.5)]",
    shape: "rounded-lg", // Square-ish
    borderColor: "border-teal-400/60",
    bgGradient: "bg-gradient-to-br from-teal-500/20 via-teal-500/10 to-transparent",
    iconColor: "text-teal-300",
  },
  evidence: {
    icon: FileCheck,
    baseClass: "border-violet-400/40 bg-violet-500/10",
    activeGlow: "shadow-[0_0_24px_rgba(139,92,246,0.5)]",
    shape: "rounded-full", // Circle
    borderColor: "border-violet-400/60",
    bgGradient: "bg-gradient-to-br from-violet-500/20 via-violet-500/10 to-transparent",
    iconColor: "text-violet-300",
  },
  audit: {
    icon: ClipboardCheck,
    baseClass: "border-amber-400/40 bg-amber-500/10",
    activeGlow: "shadow-[0_0_24px_rgba(245,158,11,0.5)]",
    shape: "rounded-xl rotate-45", // Diamond effect via transform
    borderColor: "border-amber-400/60",
    bgGradient: "bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent",
    iconColor: "text-amber-300",
  },
  risk: {
    icon: AlertTriangle,
    baseClass: "border-rose-400/40 bg-rose-500/10",
    activeGlow: "shadow-[0_0_24px_rgba(244,63,94,0.5)]",
    shape: "rounded-lg", // Will use clip-path for triangle
    borderColor: "border-rose-400/60",
    bgGradient: "bg-gradient-to-br from-rose-500/20 via-rose-500/10 to-transparent",
    iconColor: "text-rose-300",
  },
  task: {
    icon: CheckSquare,
    baseClass: "border-emerald-400/40 bg-emerald-500/10",
    activeGlow: "shadow-[0_0_24px_rgba(16,185,129,0.5)]",
    shape: "rounded-2xl", // Rounded rectangle
    borderColor: "border-emerald-400/60",
    bgGradient: "bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent",
    iconColor: "text-emerald-300",
  },
  entity: {
    icon: Building2,
    baseClass: "border-slate-400/40 bg-slate-500/10",
    activeGlow: "shadow-[0_0_24px_rgba(148,163,184,0.5)]",
    shape: "rounded-3xl", // Large container
    borderColor: "border-slate-400/60",
    bgGradient: "bg-gradient-to-br from-slate-500/20 via-slate-500/10 to-transparent",
    iconColor: "text-slate-300",
  },
};

const SIZE_CONFIG = {
  sm: {
    container: "min-w-[100px] px-3 py-2",
    icon: "h-4 w-4",
    label: "text-xs",
    sublabel: "text-[10px]",
  },
  md: {
    container: "min-w-[140px] px-4 py-3",
    icon: "h-5 w-5",
    label: "text-sm",
    sublabel: "text-xs",
  },
  lg: {
    container: "min-w-[180px] px-5 py-4",
    icon: "h-6 w-6",
    label: "text-base",
    sublabel: "text-sm",
  },
};

export function ComplianceNode({
  type,
  state = "idle",
  label,
  sublabel,
  count,
  onClick,
  className,
  size = "md",
  showIcon = true,
  interactive = true,
}: ComplianceNodeProps) {
  const config = NODE_CONFIG[type];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;

  const stateClasses = {
    idle: "",
    active: cn(config.activeGlow, "ring-2 ring-offset-2 ring-offset-background", config.borderColor),
    "at-risk": "ring-2 ring-rose-500/50 animate-pulse",
    verified: cn("ring-2 ring-emerald-400/50", "after:absolute after:inset-0 after:rounded-inherit after:animate-shimmer after:bg-gradient-to-r after:from-transparent after:via-emerald-400/20 after:to-transparent"),
    linked: cn("ring-1", config.borderColor, "scale-105"),
    processing: "animate-pulse opacity-75",
  };

  return (
    <div
      onClick={interactive ? onClick : undefined}
      className={cn(
        // Base structure
        "relative group flex items-center gap-3 border backdrop-blur-sm transition-all duration-300",
        config.baseClass,
        config.bgGradient,
        config.shape,
        sizeConfig.container,
        // State-specific styles
        stateClasses[state],
        // Interactive styles
        interactive && onClick && "cursor-pointer hover:scale-[1.02] hover:border-opacity-80 active:scale-[0.98]",
        className
      )}
    >
      {/* Ambient glow layer */}
      <div 
        className={cn(
          "absolute inset-0 -z-10 blur-xl opacity-0 transition-opacity duration-500",
          config.bgGradient,
          (state === "active" || state === "linked") && "opacity-60"
        )} 
      />

      {/* Icon container */}
      {showIcon && (
        <div className={cn(
          "flex items-center justify-center rounded-lg border p-1.5",
          config.baseClass,
          config.iconColor
        )}>
          <Icon className={sizeConfig.icon} />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={cn(
          "font-semibold text-slate-100 truncate",
          sizeConfig.label
        )}>
          {label}
        </div>
        {sublabel && (
          <div className={cn(
            "text-slate-400 truncate mt-0.5",
            sizeConfig.sublabel
          )}>
            {sublabel}
          </div>
        )}
      </div>

      {/* Count badge */}
      {count !== undefined && (
        <div className={cn(
          "flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-bold",
          config.baseClass,
          config.iconColor
        )}>
          {count}
        </div>
      )}

      {/* Processing spinner overlay */}
      {state === "processing" && (
        <div className="absolute inset-0 flex items-center justify-center rounded-inherit bg-black/30 backdrop-blur-sm">
          <div className="h-5 w-5 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

export default ComplianceNode;
