'use client';

import { useEffect, useRef } from 'react';

/**
 * Accessibility helper for ad-hoc (non-Radix) modal/dialog overlays.
 *
 * Many surfaces in the app are hand-rolled `fixed inset-0` panels rather
 * than the shared Radix `Dialog` primitive (`components/ui/dialog.tsx`).
 * Rewriting them onto Radix risks layout/state regressions, so this hook
 * adds the missing dialog behaviours additively:
 *
 *  - Escape closes the dialog (calls `onClose`).
 *  - Focus moves into the panel on open and is restored to the previously
 *    focused element on close.
 *  - Tab/Shift+Tab are trapped within the panel.
 *
 * It does NOT add `role="dialog"`/`aria-modal`/`aria-labelledby` — those are
 * static markup attributes and should be set directly on the panel element.
 *
 * Usage:
 *   const panelRef = useModalA11y<HTMLDivElement>(isOpen, onClose);
 *   ...
 *   <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="...">
 */
export function useModalA11y<T extends HTMLElement = HTMLElement>(
  isOpen: boolean,
  onClose: () => void,
) {
  const panelRef = useRef<T | null>(null);
  // Keep the latest onClose without re-subscribing the listener every render.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const panel = panelRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    const getFocusable = (): HTMLElement[] => {
      if (!panel) return [];
      return Array.from(
        panel.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
    };

    // Move focus into the dialog on open.
    const focusables = getFocusable();
    if (focusables.length > 0) {
      focusables[0].focus();
    } else if (panel) {
      // Fall back to focusing the panel itself so screen readers land here.
      if (!panel.hasAttribute('tabindex')) panel.setAttribute('tabindex', '-1');
      panel.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key !== 'Tab' || !panel) return;

      const items = getFocusable();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === first || !panel.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !panel.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      // Restore focus to whatever was focused before the dialog opened.
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus();
      }
    };
  }, [isOpen]);

  return panelRef;
}
