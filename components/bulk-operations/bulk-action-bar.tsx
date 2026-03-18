'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  CheckSquare,
  Square,
  MinusSquare,
  X,
  Download,
  Trash2,
  UserPlus,
  CheckCircle,
  type LucideIcon,
} from 'lucide-react';

/**
 * =========================================================
 * BULK ACTION BAR
 * =========================================================
 *
 * Floating action bar that appears when items are selected.
 * Provides contextual bulk operations.
 *
 * Usage:
 * ```tsx
 * <BulkActionBar
 *   count={selection.count}
 *   onClear={selection.clearSelection}
 *   actions={[
 *     { label: "Verify", icon: CheckCircle, onClick: handleBulkVerify },
 *     { label: "Export", icon: Download, onClick: handleBulkExport },
 *   ]}
 * />
 * ```
 */

export interface BulkAction {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline';
  disabled?: boolean;
}

export interface BulkActionBarProps {
  count: number;
  onClear: () => void;
  actions: BulkAction[];
  className?: string;
}

export function BulkActionBar({
  count,
  onClear,
  actions,
  className,
}: BulkActionBarProps) {
  if (count === 0) return null;

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
        'bg-card border border-border rounded-2xl shadow-premium-xl',
        'flex items-center gap-3 px-5 py-3',
        'animate-in slide-in-from-bottom-4 fade-in duration-200',
        className,
      )}
      role="toolbar"
      aria-label={`Bulk actions for ${count} selected items`}
    >
      <span className="text-sm font-semibold text-foreground whitespace-nowrap">
        {count} selected
      </span>

      <div className="h-5 w-px bg-border" aria-hidden="true" />

      <div className="flex items-center gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              size="sm"
              variant={
                action.variant === 'destructive' ? 'destructive' : 'outline'
              }
              onClick={action.onClick}
              disabled={action.disabled}
              className="gap-1.5"
            >
              {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
              {action.label}
            </Button>
          );
        })}
      </div>

      <div className="h-5 w-px bg-border" aria-hidden="true" />

      <button
        onClick={onClear}
        className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md"
        aria-label="Clear selection"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

/**
 * Checkbox for bulk selection in table rows
 */
export interface BulkCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  label?: string;
  className?: string;
}

export function BulkCheckbox({
  checked,
  indeterminate = false,
  onChange,
  label,
  className,
}: BulkCheckboxProps) {
  const Icon = indeterminate ? MinusSquare : checked ? CheckSquare : Square;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={cn(
        'flex items-center justify-center p-1 rounded transition-colors',
        'text-muted-foreground hover:text-foreground',
        checked && 'text-primary',
        className,
      )}
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-label={label || (checked ? 'Deselect item' : 'Select item')}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

/**
 * Pre-configured bulk actions for common modules
 */
export const EVIDENCE_BULK_ACTIONS = (handlers: {
  onVerifyAction?: () => void;
  onExportAction?: () => void;
  onAssignAction?: () => void;
  onDeleteAction?: () => void;
}): BulkAction[] =>
  [
    handlers.onVerifyAction && {
      label: 'Verify',
      icon: CheckCircle,
      onClick: handlers.onVerifyAction,
    },
    handlers.onAssignAction && {
      label: 'Assign',
      icon: UserPlus,
      onClick: handlers.onAssignAction,
    },
    handlers.onExportAction && {
      label: 'Export',
      icon: Download,
      onClick: handlers.onExportAction,
    },
    handlers.onDeleteAction && {
      label: 'Delete',
      icon: Trash2,
      onClick: handlers.onDeleteAction,
      variant: 'destructive' as const,
    },
  ].filter(Boolean) as BulkAction[];

export const TASK_BULK_ACTIONS = (handlers: {
  onCompleteAction?: () => void;
  onAssignAction?: () => void;
  onExportAction?: () => void;
  onDeleteAction?: () => void;
}): BulkAction[] =>
  [
    handlers.onCompleteAction && {
      label: 'Mark Complete',
      icon: CheckCircle,
      onClick: handlers.onCompleteAction,
    },
    handlers.onAssignAction && {
      label: 'Reassign',
      icon: UserPlus,
      onClick: handlers.onAssignAction,
    },
    handlers.onExportAction && {
      label: 'Export',
      icon: Download,
      onClick: handlers.onExportAction,
    },
    handlers.onDeleteAction && {
      label: 'Delete',
      icon: Trash2,
      onClick: handlers.onDeleteAction,
      variant: 'destructive' as const,
    },
  ].filter(Boolean) as BulkAction[];

export const POLICY_BULK_ACTIONS = (handlers: {
  onApproveAction?: () => void;
  onExportAction?: () => void;
  onArchiveAction?: () => void;
}): BulkAction[] =>
  [
    handlers.onApproveAction && {
      label: 'Approve',
      icon: CheckCircle,
      onClick: handlers.onApproveAction,
    },
    handlers.onExportAction && {
      label: 'Export',
      icon: Download,
      onClick: handlers.onExportAction,
    },
    handlers.onArchiveAction && {
      label: 'Archive',
      icon: Trash2,
      onClick: handlers.onArchiveAction,
      variant: 'destructive' as const,
    },
  ].filter(Boolean) as BulkAction[];
