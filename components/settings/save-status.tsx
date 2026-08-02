'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * One save-feedback convention for the settings cluster.
 *
 * - Single toggles save instantly and show a transient "Saved".
 * - Multi-field forms keep an explicit Save button and show the same inline
 *   status beside it.
 */

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function SaveStatus({
  state,
  errorMessage,
  className,
}: {
  state: SaveState;
  errorMessage?: string | null;
  className?: string;
}) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={`text-sm ${
        state === 'error' ? 'text-destructive' : 'text-muted-foreground'
      } ${className ?? ''}`}
    >
      {state === 'saving' ? 'Saving…' : null}
      {state === 'saved' ? 'Saved' : null}
      {state === 'error'
        ? (errorMessage ?? 'Could not save. Try again.')
        : null}
    </p>
  );
}

export function useSaveStatus(resetAfterMs = 3000) {
  const [state, setState] = useState<SaveState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const markSaving = useCallback(() => {
    clearTimer();
    setErrorMessage(null);
    setState('saving');
  }, [clearTimer]);

  const markSaved = useCallback(() => {
    clearTimer();
    setErrorMessage(null);
    setState('saved');
    timer.current = setTimeout(() => setState('idle'), resetAfterMs);
  }, [clearTimer, resetAfterMs]);

  const markError = useCallback(
    (message?: string) => {
      clearTimer();
      setErrorMessage(message ?? null);
      setState('error');
    },
    [clearTimer],
  );

  return { state, errorMessage, markSaving, markSaved, markError };
}
