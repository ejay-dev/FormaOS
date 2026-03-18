'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type HelpPanel = 'home' | 'bug';

type HelpAssistantContextValue = {
  isOpen: boolean;
  panel: HelpPanel;
  open: (panel?: HelpPanel) => void;
  close: () => void;
  toggle: () => void;
  setPanel: (panel: HelpPanel) => void;
};

const HelpAssistantContext = createContext<HelpAssistantContextValue | undefined>(
  undefined,
);

export function HelpAssistantProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [panel, setPanel] = useState<HelpPanel>('home');

  const open = useCallback((nextPanel: HelpPanel = 'home') => {
    setPanel(nextPanel);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const value = useMemo(
    () => ({ isOpen, panel, open, close, toggle, setPanel }),
    [isOpen, panel, open, close, toggle],
  );

  return (
    <HelpAssistantContext.Provider value={value}>
      {children}
    </HelpAssistantContext.Provider>
  );
}

export function useHelpAssistant() {
  const context = useContext(HelpAssistantContext);
  if (!context) {
    throw new Error('useHelpAssistant must be used within HelpAssistantProvider');
  }
  return context;
}
