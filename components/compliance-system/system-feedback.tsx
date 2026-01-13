"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Loader2,
  ArrowRight,
  Zap,
  Shield,
  FileCheck,
  X
} from "lucide-react";

/**
 * =========================================================
 * SYSTEM FEEDBACK COMPONENT
 * =========================================================
 * Provides contextual feedback for all compliance operations.
 * Shows what node changed, what wires were updated, and
 * the impact on compliance posture.
 */

export type FeedbackType = 
  | "success"
  | "error"
  | "info"
  | "warning"
  | "processing";

interface NodeChange {
  type: "policy" | "control" | "evidence" | "audit" | "risk" | "task" | "entity";
  name: string;
  action: "created" | "updated" | "deleted" | "linked" | "verified";
}

interface WireChange {
  from: string;
  to: string;
  action: "connected" | "strengthened" | "broken";
}

interface ComplianceImpact {
  area: string;
  change: "improved" | "degraded" | "unchanged";
  delta?: number; // percentage change
}

export interface SystemFeedbackData {
  title: string;
  message?: string;
  nodeChanges?: NodeChange[];
  wireChanges?: WireChange[];
  complianceImpact?: ComplianceImpact[];
  duration?: number; // auto-dismiss after ms
}

interface SystemFeedbackProps extends SystemFeedbackData {
  type: FeedbackType;
  onDismiss?: () => void;
  className?: string;
  compact?: boolean;
}

const FEEDBACK_CONFIG: Record<FeedbackType, {
  icon: React.ElementType;
  bgClass: string;
  borderClass: string;
  iconClass: string;
  titleClass: string;
}> = {
  success: {
    icon: CheckCircle2,
    bgClass: "bg-emerald-500/10",
    borderClass: "border-emerald-400/40",
    iconClass: "text-emerald-400",
    titleClass: "text-emerald-200",
  },
  error: {
    icon: AlertCircle,
    bgClass: "bg-rose-500/10",
    borderClass: "border-rose-400/40",
    iconClass: "text-rose-400",
    titleClass: "text-rose-200",
  },
  info: {
    icon: Info,
    bgClass: "bg-sky-500/10",
    borderClass: "border-sky-400/40",
    iconClass: "text-sky-400",
    titleClass: "text-sky-200",
  },
  warning: {
    icon: AlertCircle,
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-400/40",
    iconClass: "text-amber-400",
    titleClass: "text-amber-200",
  },
  processing: {
    icon: Loader2,
    bgClass: "bg-blue-500/10",
    borderClass: "border-blue-400/40",
    iconClass: "text-blue-400 animate-spin",
    titleClass: "text-blue-200",
  },
};

const NODE_ICONS: Record<string, React.ElementType> = {
  policy: FileCheck,
  control: Shield,
  evidence: FileCheck,
  audit: FileCheck,
  risk: AlertCircle,
  task: CheckCircle2,
  entity: Shield,
};

const NODE_COLORS: Record<string, string> = {
  policy: "text-cyan-300",
  control: "text-teal-300",
  evidence: "text-violet-300",
  audit: "text-amber-300",
  risk: "text-rose-300",
  task: "text-emerald-300",
  entity: "text-slate-300",
};

export function SystemFeedback({
  type,
  title,
  message,
  nodeChanges,
  wireChanges,
  complianceImpact,
  onDismiss,
  duration,
  className,
  compact = false,
}: SystemFeedbackProps) {
  const config = FEEDBACK_CONFIG[type];
  const Icon = config.icon;

  // Auto-dismiss
  useEffect(() => {
    if (duration && onDismiss) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  if (compact) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm",
          config.bgClass,
          config.borderClass,
          "animate-in fade-in slide-in-from-top-2 duration-300",
          className
        )}
      >
        <Icon className={cn("h-5 w-5 shrink-0", config.iconClass)} />
        <span className={cn("text-sm font-medium", config.titleClass)}>
          {title}
        </span>
        {onDismiss && (
          <button 
            onClick={onDismiss}
            className="ml-auto p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4 text-slate-400" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border backdrop-blur-sm",
        config.bgClass,
        config.borderClass,
        "animate-in fade-in slide-in-from-top-4 duration-500",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-4 p-4 border-b border-white/10">
        <div className={cn(
          "flex items-center justify-center h-10 w-10 rounded-xl",
          config.bgClass,
          "border",
          config.borderClass
        )}>
          <Icon className={cn("h-5 w-5", config.iconClass)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className={cn("text-sm font-semibold", config.titleClass)}>
            {title}
          </h4>
          {message && (
            <p className="text-xs text-slate-400 mt-1">{message}</p>
          )}
        </div>

        {onDismiss && (
          <button 
            onClick={onDismiss}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4 text-slate-400" />
          </button>
        )}
      </div>

      {/* Node Changes */}
      {nodeChanges && nodeChanges.length > 0 && (
        <div className="px-4 py-3 border-b border-white/10">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Node Changes
          </div>
          <div className="space-y-1.5">
            {nodeChanges.map((change, i) => {
              const NodeIcon = NODE_ICONS[change.type] || Shield;
              return (
                <div 
                  key={i}
                  className="flex items-center gap-2 text-xs"
                >
                  <NodeIcon className={cn("h-3.5 w-3.5", NODE_COLORS[change.type])} />
                  <span className="text-slate-300 font-medium">{change.name}</span>
                  <span className="text-slate-500">•</span>
                  <span className={cn(
                    "text-[10px] font-bold uppercase",
                    change.action === "created" && "text-emerald-400",
                    change.action === "updated" && "text-sky-400",
                    change.action === "deleted" && "text-rose-400",
                    change.action === "linked" && "text-violet-400",
                    change.action === "verified" && "text-emerald-400",
                  )}>
                    {change.action}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Wire Changes */}
      {wireChanges && wireChanges.length > 0 && (
        <div className="px-4 py-3 border-b border-white/10">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Connections Updated
          </div>
          <div className="space-y-1.5">
            {wireChanges.map((change, i) => (
              <div 
                key={i}
                className="flex items-center gap-2 text-xs"
              >
                <span className="text-slate-300">{change.from}</span>
                <ArrowRight className={cn(
                  "h-3 w-3",
                  change.action === "connected" && "text-cyan-400",
                  change.action === "strengthened" && "text-emerald-400",
                  change.action === "broken" && "text-rose-400",
                )} />
                <span className="text-slate-300">{change.to}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compliance Impact */}
      {complianceImpact && complianceImpact.length > 0 && (
        <div className="px-4 py-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Compliance Impact
          </div>
          <div className="flex flex-wrap gap-2">
            {complianceImpact.map((impact, i) => (
              <div 
                key={i}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold",
                  impact.change === "improved" && "bg-emerald-500/10 text-emerald-300 border border-emerald-400/30",
                  impact.change === "degraded" && "bg-rose-500/10 text-rose-300 border border-rose-400/30",
                  impact.change === "unchanged" && "bg-slate-500/10 text-slate-400 border border-slate-400/30",
                )}
              >
                {impact.change === "improved" && <Zap className="h-3 w-3" />}
                {impact.change === "degraded" && <AlertCircle className="h-3 w-3" />}
                <span>{impact.area}</span>
                {impact.delta !== undefined && (
                  <span className="opacity-70">
                    {impact.change === "improved" ? "+" : ""}{impact.delta}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SystemFeedback;
