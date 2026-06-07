'use client';

import { Languages } from 'lucide-react';
import { useLabelToggle } from '@/lib/labels/use-label';

export function PlainEnglishToggle() {
  const { plainEnglish, setPlainEnglish } = useLabelToggle();

  return (
    <div className="bg-surface-1 border border-border rounded-[2.5rem] p-8 shadow-sm">
      <div className="flex items-center gap-4 mb-4">
        <div className="h-10 w-10 rounded-xl bg-surface-2 flex items-center justify-center text-muted-foreground border border-border">
          <Languages className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">
            Language & Accessibility
          </h3>
        </div>
      </div>

      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={plainEnglish}
          onChange={(e) => setPlainEnglish(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-border bg-surface-2 text-primary focus:ring-ring focus:ring-offset-0 cursor-pointer"
        />
        <div>
          <span className="text-sm font-semibold text-foreground">
            Use plain-English terms
          </span>
          <p className="text-xs text-muted-foreground mt-0.5">
            Translates regulator jargon into everyday language across the app.
          </p>
        </div>
      </label>
    </div>
  );
}
