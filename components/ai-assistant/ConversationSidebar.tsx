'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, MessageSquare } from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
}

interface ConversationSidebarProps {
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ConversationSidebar({ activeId, onSelect, onNew, onDelete }: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/ai/conversations');
      if (!res.ok) return;
      const data = await res.json();
      const items = (data.conversations ?? data ?? []) as Array<Record<string, unknown>>;
      setConversations(
        items.map((c) => ({
          id: c.id as string,
          title: (c.title as string) || 'New conversation',
          updatedAt: (c.updated_at as string) || (c.created_at as string) || new Date().toISOString(),
        })),
      );
    } catch {
      // Silently fail — conversations are optional
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await fetch(`/api/v1/ai/conversations/${id}`, { method: 'DELETE' });
      setConversations((prev) => prev.filter((c) => c.id !== id));
      onDelete(id);
    } catch {
      // Silently fail
    }
  };

  return (
    <div className="flex h-full w-56 shrink-0 flex-col border-r border-white/10 bg-black/20">
      <div className="border-b border-white/10 p-3">
        <button
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-slate-600">
            No conversations yet
          </div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`group flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left transition-colors ${
                activeId === conv.id
                  ? 'bg-cyan-400/10 border border-cyan-400/20'
                  : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-slate-300">
                  {conv.title}
                </div>
                <div className="text-[10px] text-slate-600">
                  {formatRelativeDate(conv.updatedAt)}
                </div>
              </div>
              <button
                onClick={(e) => handleDelete(e, conv.id)}
                className="shrink-0 rounded p-0.5 opacity-0 hover:bg-rose-400/20 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3 w-3 text-rose-400" />
              </button>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
