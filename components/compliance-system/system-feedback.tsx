'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  Loader2,
  ArrowRight,
  Zap,
  Shield,
  FileCheck,
  X,
} from 'lucide-react';

/**
 * =========================================================
 * SYSTEM FEEDBACK COMPONENT
 * =========================================================
 * Provides contextual feedback for all compliance operations.
 * Shows what node changed, what wires were updated, and
 * the impact on compliance posture.
 */

export type FeedbackType =
  | 'success'
  | 'error'
  | 'info'
  | 'warning'
  | 'processing';

interface NodeChange {
  type:
    | 'policy'
    | 'control'
    | 'evidence'
    | 'audit'
    | 'risk'
    | 'task'
    | 'entity';
  name: string;
  action: 'created' | 'updated' | 'deleted' | 'linked' | 'verified';
}

interface WireChange {
  from: string;
  to: string;
  action: 'connected' | 'strengthened' | 'broken';
}

interface ComplianceImpact {
  area: string;
  change: 'improved' | 'degraded' | 'unchanged';
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

const FEEDBACK_CONFIG: Record<
  FeedbackType,
  {
    icon: LucideIcon;
    bgClass: string;
    borderClass: string;
    iconClass: string;
    titleClass: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    bgClass: 'bg-success/10',
    borderClass: 'border-success/40',
    iconClass: 'text-success',
    titleClass: 'text-success',
  },
  error: {
    icon: AlertCircle,
    bgClass: 'bg-destructive/10',
    borderClass: 'border-destructive/40',
    iconClass: 'text-destructive',
    titleClass: 'text-destructive',
  },
  info: {
    icon: Info,
    bgClass: 'bg-info/10',
    borderClass: 'border-info/40',
    iconClass: 'text-info',
    titleClass: 'text-info',
  },
  warning: {
    icon: AlertCircle,
    bgClass: 'bg-warning/10',
    borderClass: 'border-warning/40',
    iconClass: 'text-warning',
    titleClass: 'text-warning',
  },
  processing: {
    icon: Loader2,
    bgClass: 'bg-info/10',
    borderClass: 'border-info/40',
    iconClass: 'text-info animate-spin',
    titleClass: 'text-info',
  },
};

const NODE_ICONS: Record<string, LucideIcon> = {
  policy: FileCheck,
  control: Shield,
  evidence: FileCheck,
  audit: FileCheck,
  risk: AlertCircle,
  task: CheckCircle2,
  entity: Shield,
};

const NODE_COLORS: Record<string, string> = {
  policy: 'text-muted-foreground',
  control: 'text-muted-foreground',
  evidence: 'text-muted-foreground',
  audit: 'text-muted-foreground',
  risk: 'text-muted-foreground',
  task: 'text-muted-foreground',
  entity: 'text-muted-foreground',
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
          'flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm',
          config.bgClass,
          config.borderClass,
          'animate-in fade-in slide-in-from-top-2 duration-300',
          className,
        )}
      >
        <Icon className={cn('h-5 w-5 shrink-0', config.iconClass)} />
        <span className={cn('text-sm font-medium', config.titleClass)}>
          {title}
        </span>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-auto p-1 rounded-lg hover:bg-surface-2 transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border backdrop-blur-sm',
        config.bgClass,
        config.borderClass,
        'animate-in fade-in slide-in-from-top-4 duration-500',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-4 p-4 border-b border-edge-2">
        <div
          className={cn(
            'flex items-center justify-center h-10 w-10 rounded-xl',
            config.bgClass,
            'border',
            config.borderClass,
          )}
        >
          <Icon className={cn('h-5 w-5', config.iconClass)} />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className={cn('text-sm font-semibold', config.titleClass)}>
            {title}
          </h4>
          {message && <p className="text-xs text-muted-foreground mt-1">{message}</p>}
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-lg hover:bg-surface-2 transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Node Changes */}
      {nodeChanges && nodeChanges.length > 0 && (
        <div className="px-4 py-3 border-b border-edge-2">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 mb-2">
            Node Changes
          </div>
          <div className="space-y-1.5">
            {nodeChanges.map((change, i) => {
              const NodeIcon = NODE_ICONS[change.type] || Shield;
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <NodeIcon
                    className={cn('h-3.5 w-3.5', NODE_COLORS[change.type])}
                  />
                  <span className="text-foreground/70 font-medium">
                    {change.name}
                  </span>
                  <span className="text-muted-foreground/60">•</span>
                  <span
                    className={cn(
                      'text-xs font-bold uppercase',
                      change.action === 'created' && 'text-success',
                      change.action === 'updated' && 'text-info',
                      change.action === 'deleted' && 'text-destructive',
                      change.action === 'linked' && 'text-muted-foreground',
                      change.action === 'verified' && 'text-success',
                    )}
                  >
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
        <div className="px-4 py-3 border-b border-edge-2">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 mb-2">
            Connections Updated
          </div>
          <div className="space-y-1.5">
            {wireChanges.map((change, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="text-foreground/70">{change.from}</span>
                <ArrowRight
                  className={cn(
                    'h-3 w-3',
                    change.action === 'connected' && 'text-muted-foreground',
                    change.action === 'strengthened' && 'text-success',
                    change.action === 'broken' && 'text-destructive',
                  )}
                />
                <span className="text-foreground/70">{change.to}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compliance Impact */}
      {complianceImpact && complianceImpact.length > 0 && (
        <div className="px-4 py-3">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 mb-2">
            Compliance Impact
          </div>
          <div className="flex flex-wrap gap-2">
            {complianceImpact.map((impact, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold',
                  impact.change === 'improved' &&
                    'bg-success/10 text-success border border-success/20',
                  impact.change === 'degraded' &&
                    'bg-destructive/10 text-destructive border border-destructive/20',
                  impact.change === 'unchanged' &&
                    'bg-muted text-muted-foreground border border-border',
                )}
              >
                {impact.change === 'improved' && <Zap className="h-3 w-3" />}
                {impact.change === 'degraded' && (
                  <AlertCircle className="h-3 w-3" />
                )}
                <span>{impact.area}</span>
                {impact.delta !== undefined && (
                  <span className="opacity-70">
                    {impact.change === 'improved' ? '+' : ''}
                    {impact.delta}%
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
