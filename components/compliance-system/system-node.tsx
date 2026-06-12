'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Shield,
  FileCheck,
  FileText,
  CheckSquare,
  Lock as LockIcon,
  History,
  BarChart3,
  Database,
  Users,
  CreditCard,
  Settings,
  ShieldAlert,
  Loader2,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { ModuleId, NodeState } from '@/lib/system-state/types';
import { useSystemState } from '@/lib/system-state';

/**
 * =========================================================
 * SYSTEM NODE - Interactive Module Node Component
 * =========================================================
 * Represents a module in the FormaOS compliance graph.
 * Reflects real system state - locked, activating, active, restricted, error.
 */

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Shield,
  FileCheck,
  FileText,
  CheckSquare,
  Lock: LockIcon,
  History,
  BarChart3,
  Database,
  Users,
  CreditCard,
  Settings,
  ShieldAlert,
};

const STATE_STYLES: Record<
  NodeState,
  {
    container: string;
    icon: string;
    label: string;
    glow: string;
    pulse: boolean;
  }
> = {
  locked: {
    container: 'bg-surface-1 border-edge-2 opacity-50',
    icon: 'text-muted-foreground/60',
    label: 'text-muted-foreground/60',
    glow: '',
    pulse: false,
  },
  activating: {
    container: 'bg-info/10 border-info/40',
    icon: 'text-info',
    label: 'text-info',
    glow: 'shadow-lg',
    pulse: true,
  },
  active: {
    container: 'bg-success/10 border-success/40',
    icon: 'text-success',
    label: 'text-success',
    glow: 'shadow-lg',
    pulse: false,
  },
  restricted: {
    container: 'bg-warning/10 border-warning/40',
    icon: 'text-warning',
    label: 'text-warning',
    glow: 'shadow-lg',
    pulse: false,
  },
  error: {
    container: 'bg-destructive/10 border-destructive/40',
    icon: 'text-destructive',
    label: 'text-destructive',
    glow: 'shadow-lg',
    pulse: true,
  },
  processing: {
    container: 'bg-info/10 border-info/40',
    icon: 'text-info',
    label: 'text-info',
    glow: 'shadow-lg',
    pulse: true,
  },
};

interface SystemNodeProps {
  moduleId: ModuleId;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showTooltip?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
}

export function SystemNode({
  moduleId,
  size = 'md',
  showLabel = true,
  showTooltip = true,
  interactive = true,
  onClick,
  className,
}: SystemNodeProps) {
  const { state, getModuleState } = useSystemState();
  const [isHovered, setIsHovered] = useState(false);
  const [showUpgradeTooltip, setShowUpgradeTooltip] = useState(false);

  const moduleConfig = state.modules.get(moduleId);
  const nodeState = getModuleState(moduleId);
  const styles = STATE_STYLES[nodeState];

  if (!moduleConfig) return null;

  const IconComponent = ICON_MAP[moduleConfig.icon] || Shield;

  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16',
    lg: 'h-20 w-20',
  };

  const iconSizes = {
    sm: 'h-5 w-5',
    md: 'h-7 w-7',
    lg: 'h-9 w-9',
  };

  const handleClick = () => {
    if (nodeState === 'locked') {
      setShowUpgradeTooltip(true);
      setTimeout(() => setShowUpgradeTooltip(false), 2000);
      return;
    }
    onClick?.();
  };

  const isLocked = nodeState === 'locked';
  const isActivating = nodeState === 'activating' || nodeState === 'processing';

  return (
    <div className={cn('relative group', className)}>
      {/* Main Node */}
      <button
        onClick={handleClick}
        disabled={!interactive}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'relative rounded-2xl border-2 transition-all duration-300',
          'flex items-center justify-center',
          sizeClasses[size],
          styles.container,
          styles.glow,
          styles.pulse && 'animate-pulse',
          interactive &&
            !isLocked &&
            'motion-safe:hover:scale-110 motion-safe:active:scale-95 cursor-pointer',
          interactive && isLocked && 'cursor-not-allowed',
          !interactive && 'cursor-default',
        )}
      >
        {/* Activation Ring */}
        {isActivating && (
          <div className="absolute inset-0 rounded-2xl border-2 border-info/50 animate-ping" />
        )}

        {/* Icon */}
        {isActivating ? (
          <Loader2
            className={cn(iconSizes[size], 'text-info animate-spin')}
          />
        ) : nodeState === 'error' ? (
          <AlertCircle className={cn(iconSizes[size], styles.icon)} />
        ) : (
          <IconComponent className={cn(iconSizes[size], styles.icon)} />
        )}

        {/* Lock Overlay */}
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/80 rounded-2xl">
            <LockIcon className="h-4 w-4 text-muted-foreground/60" />
          </div>
        )}

        {/* Active Indicator */}
        {nodeState === 'active' && (
          <div className="absolute -top-1 -right-1 h-3 w-3 bg-success rounded-full border-2 border-card" />
        )}

        {/* Restricted Indicator */}
        {nodeState === 'restricted' && (
          <div className="absolute -top-1 -right-1 h-3 w-3 bg-warning rounded-full border-2 border-card" />
        )}
      </button>

      {/* Label */}
      {showLabel && (
        <div
          className={cn(
            'mt-2 text-center transition-colors duration-200',
            styles.label,
          )}
        >
          <p className="text-xs font-bold uppercase tracking-wider">
            {moduleConfig.label}
          </p>
        </div>
      )}

      {/* Upgrade Tooltip */}
      {(showUpgradeTooltip || (isHovered && isLocked)) && showTooltip && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-bold text-foreground/90">
                Upgrade to unlock
              </span>
            </div>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 h-2 w-2 bg-popover border-r border-b border-border" />
          </div>
        </div>
      )}

      {/* State Tooltip */}
      {isHovered && !isLocked && showTooltip && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-xl whitespace-nowrap">
            <p className="text-xs font-medium text-foreground/90">
              {moduleConfig.description}
            </p>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 h-2 w-2 bg-popover border-r border-b border-border" />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * System Node Grid - Display multiple modules in a grid layout
 */
interface SystemNodeGridProps {
  modules?: ModuleId[];
  columns?: number;
  size?: 'sm' | 'md' | 'lg';
  onModuleClick?: (moduleId: ModuleId) => void;
}

export function SystemNodeGrid({
  modules,
  columns = 4,
  size = 'md',
  onModuleClick,
}: SystemNodeGridProps) {
  const { state } = useSystemState();

  const displayModules = modules || Array.from(state.modules.keys());

  return (
    <div
      className="grid gap-6"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {displayModules.map((moduleId) => (
        <SystemNode
          key={moduleId}
          moduleId={moduleId}
          size={size}
          onClick={() => onModuleClick?.(moduleId)}
        />
      ))}
    </div>
  );
}
