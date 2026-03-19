'use client';

import { useEffect, useRef } from 'react';
import { Bot, User } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'data';
  content: string;
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderMarkdown(text: string): string {
  // Escape all HTML entities first to prevent XSS, then apply markdown formatting
  return escapeHtml(text)
    .replace(/```([\s\S]*?)```/g, '<pre class="my-2 rounded-lg bg-black/30 p-3 text-xs overflow-x-auto"><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-200">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h3 class="mt-3 mb-1 text-sm font-semibold text-slate-200">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="mt-3 mb-1 text-base font-semibold text-slate-200">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="mt-3 mb-1 text-lg font-bold text-slate-100">$1</h1>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-slate-400">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-slate-400">$1</li>')
    .replace(/\n/g, '<br/>');
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const chatMessages = messages.filter((m) => m.role === 'user' || m.role === 'assistant');

  if (chatMessages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
            <Bot className="h-7 w-7 text-cyan-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-200">AI Compliance Assistant</h3>
          <p className="mt-2 max-w-sm text-sm text-slate-400">
            Ask about controls, draft policies, get evidence guidance, or analyze compliance gaps.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {chatMessages.map((message) => (
        <div
          key={message.id}
          className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
        >
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            message.role === 'user'
              ? 'bg-cyan-400/20'
              : 'border border-white/10 bg-white/5'
          }`}>
            {message.role === 'user' ? (
              <User className="h-4 w-4 text-cyan-300" />
            ) : (
              <Bot className="h-4 w-4 text-slate-400" />
            )}
          </div>

          <div
            className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              message.role === 'user'
                ? 'bg-cyan-500/20 text-slate-200 border border-cyan-400/20'
                : 'bg-white/5 text-slate-300 border border-white/10'
            }`}
          >
            {message.role === 'assistant' ? (
              <div
                className="prose-sm prose-invert"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
              />
            ) : (
              <p className="whitespace-pre-wrap">{message.content}</p>
            )}
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <Bot className="h-4 w-4 text-slate-400" />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse [animation-delay:0.2s]" />
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse [animation-delay:0.4s]" />
            </div>
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}
