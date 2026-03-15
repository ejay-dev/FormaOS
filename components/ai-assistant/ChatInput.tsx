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
    <div className="border-t border-white/10 p-4">
      <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-white/5 p-2">
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
          className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none disabled:opacity-50"
        />
        <button
          onClick={onSubmit}
          disabled={!value.trim() || isLoading || disabled}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-500 text-white hover:bg-cyan-600 transition-colors disabled:opacity-30 disabled:hover:bg-cyan-500"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-1 flex items-center justify-between px-1">
        <span className="text-[10px] text-slate-600">Shift+Enter for new line</span>
        <span className="text-[10px] text-slate-600 tabular-nums">{value.length}</span>
      </div>
    </div>
  );
}
