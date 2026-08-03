'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DemoDataBannerProps {
  onClear?: () => void;
}

export function DemoDataBanner({ onClear }: DemoDataBannerProps) {
  const [isClearing, setIsClearing] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleClear = async () => {
    setIsClearing(true);
    try {
      const res = await fetch('/api/v1/organizations/seed-data', {
        method: 'DELETE',
      });
      if (res.ok) {
        onClear?.();
        setDismissed(true);
      }
    } catch {
      console.warn('Failed to clear demo data');
    }
    setIsClearing(false);
  };

  return (
    <div className="relative flex items-center justify-between gap-4 border-b border-warning/30 bg-warning/10 px-4 py-2 text-sm">
      <div className="flex items-center gap-2 text-warning">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>
          <strong>Demo data active</strong> &mdash; this is sample data only.
          Clear demo data in Settings &rarr; General
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleClear}
          disabled={isClearing}
          className="rounded px-3 py-1 text-xs font-medium text-warning border border-warning/30 hover:bg-warning/20 transition-colors disabled:opacity-50"
        >
          {isClearing ? 'Clearing...' : 'Clear Demo Data'}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
