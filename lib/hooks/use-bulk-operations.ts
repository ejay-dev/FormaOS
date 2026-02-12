'use client';

import { useState, useCallback } from 'react';

/**
 * =========================================================
 * BULK OPERATIONS HOOK
 * =========================================================
 *
 * Provides selection state management and batch action
 * execution for any list/table in the app.
 *
 * Usage:
 * ```tsx
 * const { selectedIds, toggleItem, selectAll, clearSelection, isSelected, count } =
 *   useBulkSelection(items.map(i => i.id))
 *
 * const { execute, isExecuting } = useBulkAction(async (ids) => {
 *   await api.bulkVerifyEvidence(ids)
 * })
 * ```
 */

export interface BulkSelectionState<T extends string | number = string> {
  selectedIds: Set<T>;
  toggleItem: (id: T) => void;
  selectAll: () => void;
  clearSelection: () => void;
  isSelected: (id: T) => boolean;
  count: number;
  isAllSelected: boolean;
  isSomeSelected: boolean;
}

export function useBulkSelection<T extends string | number = string>(
  allIds: T[],
): BulkSelectionState<T> {
  const [selectedIds, setSelectedIds] = useState<Set<T>>(new Set());

  const toggleItem = useCallback((id: T) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(allIds));
  }, [allIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((id: T) => selectedIds.has(id), [selectedIds]);

  const count = selectedIds.size;
  const isAllSelected = allIds.length > 0 && count === allIds.length;
  const isSomeSelected = count > 0 && count < allIds.length;

  return {
    selectedIds,
    toggleItem,
    selectAll,
    clearSelection,
    isSelected,
    count,
    isAllSelected,
    isSomeSelected,
  };
}

export interface BulkActionResult {
  success: number;
  failed: number;
  errors: Array<{ id: string | number; error: string }>;
}

export interface BulkActionState {
  execute: (ids: Set<string | number>) => Promise<BulkActionResult>;
  isExecuting: boolean;
  result: BulkActionResult | null;
  reset: () => void;
}

export function useBulkAction(
  action: (ids: Array<string | number>) => Promise<void>,
  options?: {
    batchSize?: number;
    onSuccess?: (result: BulkActionResult) => void;
    onError?: (error: Error) => void;
  },
): BulkActionState {
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<BulkActionResult | null>(null);
  const batchSize = options?.batchSize ?? 50;

  const execute = useCallback(
    async (ids: Set<string | number>): Promise<BulkActionResult> => {
      setIsExecuting(true);
      const allIds = Array.from(ids);
      const actionResult: BulkActionResult = {
        success: 0,
        failed: 0,
        errors: [],
      };

      try {
        // Process in batches to avoid overwhelming the API
        for (let i = 0; i < allIds.length; i += batchSize) {
          const batch = allIds.slice(i, i + batchSize);
          try {
            await action(batch);
            actionResult.success += batch.length;
          } catch (err) {
            actionResult.failed += batch.length;
            batch.forEach((id) => {
              actionResult.errors.push({
                id,
                error: err instanceof Error ? err.message : 'Unknown error',
              });
            });
          }
        }

        setResult(actionResult);
        options?.onSuccess?.(actionResult);
        return actionResult;
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Bulk action failed');
        options?.onError?.(error);
        throw error;
      } finally {
        setIsExecuting(false);
      }
    },
    [action, batchSize, options],
  );

  const reset = useCallback(() => {
    setResult(null);
  }, []);

  return { execute, isExecuting, result, reset };
}
