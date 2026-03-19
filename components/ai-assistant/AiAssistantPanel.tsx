'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { X, PanelLeftClose, PanelLeftOpen, Bot } from 'lucide-react';
import { useAiAssistant } from './AiAssistantContext';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { PromptTemplateSelector } from './PromptTemplateSelector';
import { ConversationSidebar } from './ConversationSidebar';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function AiAssistantPanel() {
  const {
    isOpen,
    open,
    close,
    activeConversationId,
    selectedTemplateId,
    setConversation,
    setTemplate,
    newConversation,
  } = useAiAssistant();

  const [showSidebar, setShowSidebar] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Listen for sidebar nav action to open the AI panel
  useEffect(() => {
    const handler = (e: Event) => {
      if ((e as CustomEvent).detail === 'ai-assistant') {
        open();
      }
    };
    window.addEventListener('app-action', handler);
    return () => window.removeEventListener('app-action', handler);
  }, [open]);

  // Load conversation messages when switching conversations
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    let cancelled = false;

    async function loadMessages() {
      try {
        const res = await fetch(`/api/v1/ai/conversations/${activeConversationId}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const msgs = (data.messages ?? []) as Array<Record<string, unknown>>;
        if (cancelled) return;
        setMessages(
          msgs
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .map((m) => ({
              id: (m.id as string) || String(Math.random()),
              role: m.role as 'user' | 'assistant',
              content: m.content as string,
            })),
        );
      } catch {
        // silently fail
      }
    }

    loadMessages();
    return () => { cancelled = true; };
  }, [activeConversationId]);

  const handleNewChat = useCallback(() => {
    newConversation();
    setMessages([]);
    setInput('');
  }, [newConversation]);

  const handleConversationSelect = useCallback(
    (id: string) => {
      setConversation(id);
    },
    [setConversation],
  );

  const handleConversationDelete = useCallback(
    (id: string) => {
      if (id === activeConversationId) {
        handleNewChat();
      }
    },
    [activeConversationId, handleNewChat],
  );

  const handleSubmit = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    // Add user message optimistically
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Add placeholder for assistant response
    const assistantId = `assistant-${Date.now()}`;
    setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          templateId: selectedTemplateId ?? undefined,
          conversationId: activeConversationId ?? undefined,
        }),
        signal: controller.signal,
      });

      // Capture conversation ID from response
      const convId = res.headers.get('X-Conversation-Id');
      if (convId && convId !== activeConversationId) {
        setConversation(convId);
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Request failed' }));
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: `Error: ${errorData.error || 'Request failed'}` }
              : m,
          ),
        );
        setIsLoading(false);
        return;
      }

      // Stream the response
      const reader = res.body?.getReader();
      if (!reader) {
        setIsLoading(false);
        return;
      }

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: fullText } : m,
          ),
        );
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // User cancelled
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}` }
              : m,
          ),
        );
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [input, isLoading, selectedTemplateId, activeConversationId, setConversation]);

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[49] bg-black/50 md:bg-black/30 transition-opacity"
          onClick={close}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[800px] flex-col bg-background border-l border-white/10 shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="hidden rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-colors md:inline-flex"
            >
              {showSidebar ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeftOpen className="h-4 w-4" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-cyan-400" />
              <span className="text-sm font-semibold text-slate-200">AI Compliance Assistant</span>
            </div>
          </div>
          <button
            onClick={close}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Conversation sidebar — hidden on mobile */}
          {showSidebar && (
            <div className="hidden md:block">
              <ConversationSidebar
                activeId={activeConversationId}
                onSelect={handleConversationSelect}
                onNew={handleNewChat}
                onDelete={handleConversationDelete}
              />
            </div>
          )}

          {/* Main chat area */}
          <div className="flex flex-1 flex-col min-w-0">
            <PromptTemplateSelector
              selectedId={selectedTemplateId}
              onSelect={setTemplate}
            />
            <MessageList messages={messages} isLoading={isLoading} />
            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </>
  );
}
