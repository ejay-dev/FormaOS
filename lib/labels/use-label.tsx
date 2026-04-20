'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { PLAIN_ENGLISH } from './plain-english';

interface LabelContextValue {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
  translate: (key: string) => string;
}

const LabelContext = createContext<LabelContextValue>({
  enabled: true,
  setEnabled: () => {},
  translate: (k) => k,
});

export function LabelProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(true);
  const [loaded, setLoaded] = useState(false);

  // Load preference from user_profiles on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/v1/preferences/plain-english');
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && typeof data.enabled === 'boolean') {
            setEnabled(data.enabled);
          }
        }
      } catch {
        // Default stays true
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist changes
  const handleSetEnabled = useCallback((v: boolean) => {
    setEnabled(v);
    fetch('/api/v1/preferences/plain-english', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: v }),
    }).catch(() => {});
  }, []);

  const translate = useCallback(
    (key: string) => {
      if (!enabled) return key;
      return PLAIN_ENGLISH[key] ?? key;
    },
    [enabled],
  );

  // Render children immediately — don't block on pref load
  return (
    <LabelContext.Provider
      value={{
        enabled: loaded ? enabled : true,
        setEnabled: handleSetEnabled,
        translate,
      }}
    >
      {children}
    </LabelContext.Provider>
  );
}

/**
 * Hook to translate a label key.
 * Returns plain-English if toggle is on, original key if off.
 */
export function useLabel(key: string): string {
  const { translate } = useContext(LabelContext);
  return translate(key);
}

/**
 * Hook to access the toggle state + setter.
 */
export function useLabelToggle() {
  const { enabled, setEnabled } = useContext(LabelContext);
  return { plainEnglish: enabled, setPlainEnglish: setEnabled };
}
