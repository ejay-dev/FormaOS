'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquarePlus, X, Send, ThumbsUp, ThumbsDown, Meh } from 'lucide-react';
import { cn } from '@/lib/utils';

type Sentiment = 'positive' | 'neutral' | 'negative';
type State = 'idle' | 'open' | 'submitting' | 'done';

const SENTIMENT_OPTIONS: { value: Sentiment; icon: typeof ThumbsUp; label: string }[] = [
  { value: 'positive', icon: ThumbsUp, label: 'Loving it' },
  { value: 'neutral', icon: Meh, label: 'It\'s okay' },
  { value: 'negative', icon: ThumbsDown, label: 'Something\'s off' },
];

export function FeedbackWidget() {
  const [state, setState] = useState<State>('idle');
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [message, setMessage] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Close on outside click
  useEffect(() => {
    if (state !== 'open') return;
    function onPointerDown(e: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setState('idle');
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [state]);

  // Focus textarea when panel opens
  useEffect(() => {
    if (state === 'open') {
      setTimeout(() => textareaRef.current?.focus(), 60);
    }
  }, [state]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sentiment) return;
    setState('submitting');
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentiment, message: message.trim() }),
      });
    } catch {
      // Fail silently — feedback is best-effort
    }
    setState('done');
    setTimeout(() => {
      setState('idle');
      setSentiment(null);
      setMessage('');
    }, 3000);
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Panel */}
      {state === 'open' && (
        <div
          ref={panelRef}
          className={cn(
            'w-80 rounded-2xl border border-white/[0.08] bg-[#0d1424] shadow-2xl',
            'backdrop-blur-xl',
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <span className="text-sm font-semibold text-white">Share feedback</span>
            <button
              onClick={() => setState('idle')}
              className="rounded-lg p-1 text-slate-500 transition hover:bg-white/[0.06] hover:text-slate-300"
              aria-label="Close feedback"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5">
            {/* Sentiment picker */}
            <p className="mb-3 text-xs font-medium text-slate-400">How is FormaOS feeling?</p>
            <div className="mb-4 flex gap-2">
              {SENTIMENT_OPTIONS.map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSentiment(value)}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-1.5 rounded-xl border py-2.5 text-[10px] font-semibold uppercase tracking-wide transition',
                    sentiment === value
                      ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400'
                      : 'border-white/[0.06] text-slate-500 hover:border-white/[0.12] hover:text-slate-300',
                  )}
                  aria-pressed={sentiment === value}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Message */}
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us more (optional)..."
              rows={3}
              className={cn(
                'w-full resize-none rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3',
                'text-sm text-slate-200 placeholder:text-slate-600',
                'focus:border-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/20',
              )}
            />

            <button
              type="submit"
              disabled={!sentiment || state === 'submitting'}
              className={cn(
                'mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition',
                sentiment
                  ? 'bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/20 hover:bg-cyan-500/20'
                  : 'cursor-not-allowed bg-white/[0.03] text-slate-600',
              )}
            >
              <Send className="h-4 w-4" />
              {state === 'submitting' ? 'Sending…' : 'Send feedback'}
            </button>
          </form>
        </div>
      )}

      {/* Done state */}
      {state === 'done' && (
        <div className="rounded-2xl border border-emerald-500/20 bg-[#0d1424] px-5 py-4 shadow-xl backdrop-blur-xl">
          <p className="text-sm font-semibold text-emerald-400">Thanks for the feedback!</p>
          <p className="mt-0.5 text-xs text-slate-500">We read every response.</p>
        </div>
      )}

      {/* Trigger button */}
      {(state === 'idle' || state === 'open') && (
        <button
          onClick={() => setState(state === 'open' ? 'idle' : 'open')}
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition',
            'bg-[#0d1424] ring-1 ring-white/[0.08] hover:ring-white/[0.16]',
            state === 'open' && 'ring-cyan-500/40',
          )}
          aria-label="Share feedback"
          aria-expanded={state === 'open'}
        >
          <MessageSquarePlus className="h-5 w-5 text-slate-400" />
        </button>
      )}
    </div>
  );
}
