'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface AiAssistantContextValue {
  isOpen: boolean;
  activeConversationId: string | null;
  selectedTemplateId: string | null;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setConversation: (id: string | null) => void;
  setTemplate: (id: string | null) => void;
  newConversation: () => void;
}

const AiAssistantContext = createContext<AiAssistantContextValue | undefined>(undefined);

export function AiAssistantProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const setConversation = useCallback((id: string | null) => {
    setActiveConversationId(id);
  }, []);

  const setTemplate = useCallback((id: string | null) => {
    setSelectedTemplateId(id);
  }, []);

  const newConversation = useCallback(() => {
    setActiveConversationId(null);
    setSelectedTemplateId(null);
  }, []);

  const value = useMemo(
    () => ({
      isOpen,
      activeConversationId,
      selectedTemplateId,
      open,
      close,
      toggle,
      setConversation,
      setTemplate,
      newConversation,
    }),
    [isOpen, activeConversationId, selectedTemplateId, open, close, toggle, setConversation, setTemplate, newConversation],
  );

  return (
    <AiAssistantContext.Provider value={value}>
      {children}
    </AiAssistantContext.Provider>
  );
}

export function useAiAssistant() {
  const context = useContext(AiAssistantContext);
  if (!context) {
    throw new Error('useAiAssistant must be used within AiAssistantProvider');
  }
  return context;
}
