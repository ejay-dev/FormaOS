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
  ArrowRight 
} from "lucide-react";

/**
 * =========================================================
 * COMPLIANCE LIFECYCLE HEADER
 * =========================================================
 * Visualizes the compliance graph at a glance.
 * Shows: Policy → Control → Evidence → Audit → Risk → Task
 * 
 * Each node shows counts and status. Wires animate on hover
 * to show the flow of compliance data.
 */

interface LifecycleStats {
  policies: { total: number; active: number; draft: number };
  controls: { total: number; compliant: number; atRisk: number; nonCompliant: number };
  evidence: { total: number; approved: number; pending: number };
  audits: { total: number; completed: number; scheduled: number };
  risks: { total: number; high: number; medium: number; low: number };
  tasks: { total: number; open: number; completed: number; overdue: number };
}

interface ComplianceLifecycleHeaderProps {
  stats: LifecycleStats;
  className?: string;
  onNodeClick?: (nodeType: string) => void;
}

const NODES = [
  {
    type: "policy",
    label: "Policies",
    icon: FileText,
    color: "cyan",
    href: "/app/policies",
  },
  {
    type: "control",
    label: "Controls",
    icon: Shield,
    color: "teal",
    href: "/app/registers",
  },
  {
    type: "evidence",
    label: "Evidence",
    icon: FileCheck,
    color: "violet",
    href: "/app/vault",
  },
  {
    type: "audit",
    label: "Audits",
    icon: ClipboardCheck,
    color: "amber",
    href: "/app/audit",
  },
  {
    type: "risk",
    label: "Risks",
    icon: AlertTriangle,
    color: "rose",
    href: "/app/registers",
  },
  {
    type: "task",
    label: "Tasks",
    icon: CheckSquare,
    color: "emerald",
    href: "/app/tasks",
  },
] as const;

const WIRE_LABELS = [
  "requires",
  "generates",
  "supports",
  "reveals",
  "creates",
];

const COLOR_CLASSES: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  cyan: {
    bg: "bg-cyan-500/10",
    border: "border-cyan-400/40",
    text: "text-cyan-300",
    glow: "shadow-[0_0_20px_rgba(0,212,251,0.3)]",
  },
  teal: {
    bg: "bg-teal-500/10",
    border: "border-teal-400/40",
    text: "text-teal-300",
    glow: "shadow-[0_0_20px_rgba(20,184,166,0.3)]",
  },
  violet: {
    bg: "bg-violet-500/10",
    border: "border-violet-400/40",
    text: "text-violet-300",
    glow: "shadow-[0_0_20px_rgba(167,139,250,0.3)]",
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-400/40",
    text: "text-amber-300",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.3)]",
  },
  rose: {
    bg: "bg-rose-500/10",
    border: "border-rose-400/40",
    text: "text-rose-300",
    glow: "shadow-[0_0_20px_rgba(244,63,94,0.3)]",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-400/40",
    text: "text-emerald-300",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.3)]",
  },
};

export function ComplianceLifecycleHeader({
  stats,
  className,
  onNodeClick,
}: ComplianceLifecycleHeaderProps) {
  const getNodeStats = (type: string) => {
    switch (type) {
      case "policy":
        return { 
          primary: stats.policies.total, 
          secondary: stats.policies.active,
          label: `${stats.policies.active} active`
        };
      case "control":
        return { 
          primary: stats.controls.total, 
          secondary: stats.controls.compliant,
          label: `${stats.controls.compliant} compliant`
        };
      case "evidence":
        return { 
          primary: stats.evidence.total, 
          secondary: stats.evidence.approved,
          label: `${stats.evidence.approved} approved`
        };
      case "audit":
        return { 
          primary: stats.audits.total, 
          secondary: stats.audits.completed,
          label: `${stats.audits.completed} completed`
        };
      case "risk":
        return { 
          primary: stats.risks.total, 
          secondary: stats.risks.high,
          label: `${stats.risks.high} critical`
        };
      case "task":
        return { 
          primary: stats.tasks.total, 
          secondary: stats.tasks.open,
          label: `${stats.tasks.open} open`
        };
      default:
        return { primary: 0, secondary: 0, label: "" };
    }
  };

  const hasRisks = stats.risks.high > 0;
  const hasOverdue = stats.tasks.overdue > 0;

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border border-white/10",
      "bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--panel-2))] to-[hsl(var(--panel-2))]",
      "shadow-[0_20px_60px_rgba(0,0,0,0.35)]",
      className
    )}>
      {/* Header glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-cyan-500/10 via-transparent to-violet-500/10 blur-2xl" />
      
      {/* Header content */}
      <div className="relative px-6 py-5 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold tracking-tight text-slate-100">
              Compliance Lifecycle
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Real-time view of your compliance graph
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasRisks && (
              <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-400/30 animate-pulse">
                {stats.risks.high} Critical Risks
              </span>
            )}
            {hasOverdue && (
              <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-400/30">
                {stats.tasks.overdue} Overdue
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Lifecycle Flow */}
      <div className="relative px-6 py-6">
        {/* Desktop: Horizontal flow */}
        <div className="hidden lg:flex items-center justify-between gap-1">
          {NODES.map((node, i) => {
            const colors = COLOR_CLASSES[node.color];
            const nodeStats = getNodeStats(node.type);
            const Icon = node.icon;
            const isRiskNode = node.type === "risk" && stats.risks.high > 0;
            const isTaskNode = node.type === "task" && stats.tasks.overdue > 0;

            return (
              <React.Fragment key={node.type}>
                {/* Node */}
                <a
                  href={node.href}
                  onClick={(e) => {
                    if (onNodeClick) {
                      e.preventDefault();
                      onNodeClick(node.type);
                    }
                  }}
                  className={cn(
                    "group relative flex flex-col items-center gap-2 p-3 rounded-xl border backdrop-blur-sm",
                    "transition-all duration-300 hover:scale-105 cursor-pointer",
                    colors.bg,
                    colors.border,
                    isRiskNode && "ring-2 ring-rose-500/50 animate-pulse",
                    isTaskNode && "ring-2 ring-amber-500/50"
                  )}
                >
                  {/* Icon */}
                  <div className={cn(
                    "flex items-center justify-center h-10 w-10 rounded-lg border",
                    colors.bg,
                    colors.border,
                    "group-hover:" + colors.glow,
                    "transition-all duration-300"
                  )}>
                    <Icon className={cn("h-5 w-5", colors.text)} />
                  </div>

                  {/* Stats */}
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-100">
                      {nodeStats.primary}
                    </div>
                    <div className={cn("text-[10px] font-bold uppercase tracking-wider", colors.text)}>
                      {node.label}
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      {nodeStats.label}
                    </div>
                  </div>

                  {/* Hover glow */}
                  <div className={cn(
                    "absolute inset-0 -z-10 rounded-xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity",
                    colors.bg
                  )} />
                </a>

                {/* Wire */}
                {i < NODES.length - 1 && (
                  <div className="flex-1 flex items-center justify-center min-w-[40px] max-w-[80px]">
                    <div className="relative w-full">
                      {/* Wire line */}
                      <div className="h-px bg-gradient-to-r from-white/20 via-white/40 to-white/20" />
                      
                      {/* Arrow */}
                      <ArrowRight className="absolute top-1/2 right-0 -translate-y-1/2 h-3 w-3 text-white/40" />
                      
                      {/* Label */}
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] text-slate-500 font-medium whitespace-nowrap">
                        {WIRE_LABELS[i]}
                      </div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Mobile: Grid layout */}
        <div className="lg:hidden grid grid-cols-2 gap-3">
          {NODES.map((node) => {
            const colors = COLOR_CLASSES[node.color];
            const nodeStats = getNodeStats(node.type);
            const Icon = node.icon;

            return (
              <a
                key={node.type}
                href={node.href}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border backdrop-blur-sm",
                  "transition-all duration-300 active:scale-95",
                  colors.bg,
                  colors.border
                )}
              >
                <div className={cn(
                  "flex items-center justify-center h-10 w-10 rounded-lg border shrink-0",
                  colors.bg,
                  colors.border
                )}>
                  <Icon className={cn("h-5 w-5", colors.text)} />
                </div>
                <div className="min-w-0">
                  <div className="text-lg font-bold text-slate-100">
                    {nodeStats.primary}
                  </div>
                  <div className={cn("text-[10px] font-bold uppercase tracking-wider truncate", colors.text)}>
                    {node.label}
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* Loop-back indicator (Task → Control) */}
        <div className="hidden lg:block absolute right-4 top-1/2 -translate-y-1/2">
          <div className="relative h-20 w-12">
            <div className="absolute right-0 top-0 w-8 h-10 border-r-2 border-t-2 border-emerald-400/40 rounded-tr-xl" />
            <div className="absolute right-0 bottom-0 w-8 h-10 border-r-2 border-b-2 border-emerald-400/40 rounded-br-xl" />
            <div className="absolute top-1/2 -left-4 text-[8px] text-emerald-400/60 font-medium -rotate-90 origin-center whitespace-nowrap">
              updates
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComplianceLifecycleHeader;
