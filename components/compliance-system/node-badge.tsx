'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import {
  FileText,
  Shield,
  FileCheck,
  ClipboardCheck,
  AlertTriangle,
  CheckSquare,
  Building2,
} from 'lucide-react';

/**
 * =========================================================
 * NODE BADGE COMPONENT
 * =========================================================
 * Compact badge representing a compliance node type.
 * Used in lists, tables, and inline references.
 */

type NodeType =
  | 'policy'
  | 'control'
  | 'evidence'
  | 'audit'
  | 'risk'
  | 'task'
  | 'entity';

interface NodeBadgeProps {
  type: NodeType;
  label?: string;
  count?: number;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
  showIcon?: boolean;
}

const NODE_CONFIG: Record<
  NodeType,
  {
    icon: LucideIcon;
    label: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
  }
> = {
  policy: {
    icon: FileText,
    label: 'Policy',
    bgClass: 'bg-cyan-500/10',
    textClass: 'text-cyan-300',
    borderClass: 'border-cyan-400/30',
  },
  control: {
    icon: Shield,
    label: 'Control',
    bgClass: 'bg-teal-500/10',
    textClass: 'text-teal-300',
    borderClass: 'border-teal-400/30',
  },
  evidence: {
    icon: FileCheck,
    label: 'Evidence',
    bgClass: 'bg-violet-500/10',
    textClass: 'text-violet-300',
    borderClass: 'border-violet-400/30',
  },
  audit: {
    icon: ClipboardCheck,
    label: 'Audit',
    bgClass: 'bg-amber-500/10',
    textClass: 'text-amber-300',
    borderClass: 'border-amber-400/30',
  },
  risk: {
    icon: AlertTriangle,
    label: 'Risk',
    bgClass: 'bg-rose-500/10',
    textClass: 'text-rose-300',
    borderClass: 'border-rose-400/30',
  },
  task: {
    icon: CheckSquare,
    label: 'Task',
    bgClass: 'bg-emerald-500/10',
    textClass: 'text-emerald-300',
    borderClass: 'border-emerald-400/30',
  },
  entity: {
    icon: Building2,
    label: 'Entity',
    bgClass: 'bg-slate-500/10',
    textClass: 'text-slate-300',
    borderClass: 'border-slate-400/30',
  },
};

const SIZE_CONFIG = {
  xs: {
    container: 'px-1.5 py-0.5 gap-1 text-[9px]',
    icon: 'h-2.5 w-2.5',
  },
  sm: {
    container: 'px-2 py-0.5 gap-1 text-[10px]',
    icon: 'h-3 w-3',
  },
  md: {
    container: 'px-2.5 py-1 gap-1.5 text-xs',
    icon: 'h-3.5 w-3.5',
  },
};

export function NodeBadge({
  type,
  label,
  count,
  className,
  size = 'sm',
  showIcon = true,
}: NodeBadgeProps) {
  const config = NODE_CONFIG[type];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;
  const displayLabel = label || config.label;

  return (
    <span
      className={cn(
        'inline-flex items-center font-bold uppercase tracking-wider rounded-full border',
        config.bgClass,
        config.textClass,
        config.borderClass,
        sizeConfig.container,
        className,
      )}
    >
      {showIcon && <Icon className={sizeConfig.icon} />}
      <span>{displayLabel}</span>
      {count !== undefined && <span className="opacity-70">({count})</span>}
    </span>
  );
}

/**
 * Status badge for node states
 */
export function StatusBadge({
  status,
  className,
  size = 'sm',
}: {
  status: 'active' | 'verified' | 'at-risk' | 'pending' | 'draft' | 'archived';
  className?: string;
  size?: 'xs' | 'sm' | 'md';
}) {
  const statusConfig: Record<
    string,
    { bg: string; text: string; border: string; label: string }
  > = {
    active: {
      bg: 'bg-sky-500/10',
      text: 'text-sky-300',
      border: 'border-sky-400/30',
      label: 'Active',
    },
    verified: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-300',
      border: 'border-emerald-400/30',
      label: 'Verified',
    },
    'at-risk': {
      bg: 'bg-rose-500/10',
      text: 'text-rose-300',
      border: 'border-rose-400/30',
      label: 'At Risk',
    },
    pending: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-300',
      border: 'border-amber-400/30',
      label: 'Pending',
    },
    draft: {
      bg: 'bg-slate-500/10',
      text: 'text-slate-300',
      border: 'border-slate-400/30',
      label: 'Draft',
    },
    archived: {
      bg: 'bg-slate-500/10',
      text: 'text-slate-400',
      border: 'border-slate-400/20',
      label: 'Archived',
    },
  };

  const config = statusConfig[status];
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <span
      className={cn(
        'inline-flex items-center font-bold uppercase tracking-wider rounded-full border',
        config.bg,
        config.text,
        config.border,
        sizeConfig.container,
        className,
      )}
    >
      {/* Status indicator dot */}
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          status === 'active' && 'bg-sky-400 animate-pulse',
          status === 'verified' && 'bg-emerald-400',
          status === 'at-risk' && 'bg-rose-400 animate-pulse',
          status === 'pending' && 'bg-amber-400',
          status === 'draft' && 'bg-slate-400',
          status === 'archived' && 'bg-slate-500',
        )}
      />
      <span>{config.label}</span>
    </span>
  );
}

export default NodeBadge;
