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
    bgClass: 'bg-muted',
    textClass: 'text-muted-foreground',
    borderClass: 'border-border',
  },
  control: {
    icon: Shield,
    label: 'Control',
    bgClass: 'bg-muted',
    textClass: 'text-muted-foreground',
    borderClass: 'border-border',
  },
  evidence: {
    icon: FileCheck,
    label: 'Evidence',
    bgClass: 'bg-muted',
    textClass: 'text-muted-foreground',
    borderClass: 'border-border',
  },
  audit: {
    icon: ClipboardCheck,
    label: 'Audit',
    bgClass: 'bg-muted',
    textClass: 'text-muted-foreground',
    borderClass: 'border-border',
  },
  risk: {
    icon: AlertTriangle,
    label: 'Risk',
    bgClass: 'bg-muted',
    textClass: 'text-muted-foreground',
    borderClass: 'border-border',
  },
  task: {
    icon: CheckSquare,
    label: 'Task',
    bgClass: 'bg-muted',
    textClass: 'text-muted-foreground',
    borderClass: 'border-border',
  },
  entity: {
    icon: Building2,
    label: 'Entity',
    bgClass: 'bg-muted',
    textClass: 'text-muted-foreground',
    borderClass: 'border-border',
  },
};

const SIZE_CONFIG = {
  xs: {
    container: 'px-1.5 py-0.5 gap-1 text-[9px]',
    icon: 'h-2.5 w-2.5',
  },
  sm: {
    container: 'px-2 py-0.5 gap-1 text-xs',
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
      bg: 'bg-info/10',
      text: 'text-info',
      border: 'border-info/20',
      label: 'Active',
    },
    verified: {
      bg: 'bg-success/10',
      text: 'text-success',
      border: 'border-success/20',
      label: 'Verified',
    },
    'at-risk': {
      bg: 'bg-destructive/10',
      text: 'text-destructive',
      border: 'border-destructive/20',
      label: 'At Risk',
    },
    pending: {
      bg: 'bg-warning/10',
      text: 'text-warning',
      border: 'border-warning/20',
      label: 'Pending',
    },
    draft: {
      bg: 'bg-muted',
      text: 'text-foreground/70',
      border: 'border-border',
      label: 'Draft',
    },
    archived: {
      bg: 'bg-muted',
      text: 'text-muted-foreground',
      border: 'border-border',
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
          status === 'active' && 'bg-info',
          status === 'verified' && 'bg-success',
          status === 'at-risk' && 'bg-destructive',
          status === 'pending' && 'bg-warning',
          status === 'draft' && 'bg-muted-foreground',
          status === 'archived' && 'bg-muted-foreground/60',
        )}
      />
      <span>{config.label}</span>
    </span>
  );
}

export default NodeBadge;
