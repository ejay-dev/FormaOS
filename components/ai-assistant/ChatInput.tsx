'use client';

import { useRef, useCallback } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatInput({ value, onChange, onSubmit, isLoading, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (value.trim() && !isLoading && !disabled) {
          onSubmit();
        }
      }
    },
    [value, isLoading, disabled, onSubmit],
  );

  const handleInput = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  }, []);

  return (
    <div className="border-t border-border p-4">
      <div className="flex items-end gap-2 rounded-xl border border-border bg-surface-1 p-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            handleInput();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask about compliance..."
          disabled={isLoading || disabled}
          rows={1}
          className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-foreground/90 placeholder:text-muted-foreground/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={!value.trim() || isLoading || disabled}
          aria-label="Send message"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-30 disabled:hover:bg-primary"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-1 flex items-center justify-between px-1">
        <span className="text-[10px] text-muted-foreground">Shift+Enter for new line</span>
        <span className="text-[10px] text-muted-foreground tabular-nums">{value.length}</span>
      </div>
    </div>
  );
}
