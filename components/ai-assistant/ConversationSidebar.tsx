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
      const items = (
        Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.conversations)
            ? data.conversations
            : Array.isArray(data)
              ? data
              : []
      ) as Array<Record<string, unknown>>;
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
      const res = await fetch(`/api/v1/ai/conversations/${id}`, {
        method: 'DELETE',
      });
      // Only drop it from the list if the server actually deleted it —
      // otherwise it reappears on reload and the user is misled.
      if (!res.ok) return;
      setConversations((prev) => prev.filter((c) => c.id !== id));
      onDelete(id);
    } catch {
      // Network error — leave the conversation in the list.
    }
  };

  return (
    <div className="flex h-full w-56 shrink-0 flex-col border-r border-border bg-surface-1">
      <div className="border-b border-border p-3">
        <button
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-medium text-foreground/70 hover:bg-surface-3 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-surface-2 animate-pulse" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
            No conversations yet
          </div>
        ) : (
          conversations.map((conv) => (
            // Row is a container, not a control: delete cannot be nested
            // inside the select button.
            <div
              key={conv.id}
              className={`group flex w-full items-start gap-2 rounded-lg px-3 py-2 transition-colors ${
                activeId === conv.id
                  ? 'bg-primary/10 border border-primary/20'
                  : 'hover:bg-surface-2 border border-transparent'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(conv.id)}
                aria-current={activeId === conv.id ? 'true' : undefined}
                className="flex min-w-0 flex-1 items-start gap-2 text-left"
              >
                <MessageSquare
                  aria-hidden="true"
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-foreground/70">
                    {conv.title}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {formatRelativeDate(conv.updatedAt)}
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={(e) => handleDelete(e, conv.id)}
                aria-label={`Delete conversation ${conv.title}`}
                className="shrink-0 rounded p-0.5 opacity-0 hover:bg-destructive/20 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
              >
                <Trash2 aria-hidden="true" className="h-3 w-3 text-destructive" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
