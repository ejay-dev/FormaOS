'use client';

import { useState } from 'react';
import { ArrowRight, Loader2, FileCheck } from 'lucide-react';
import { generateAuditBundlePdf } from '@/app/app/actions/reports';

export function BundleGenerator({ disabled }: { disabled?: boolean }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    try {
      setIsGenerating(true);
      setError(null);

      const result = await generateAuditBundlePdf('ISO27001');

      if (!result?.success || !result?.signedUrl) {
        throw new Error('Failed to generate audit bundle');
      }

      window.open(result.signedUrl, '_blank');
    } catch (err: unknown) {
      console.error('Audit bundle failed:', err);
      setError(
        err instanceof Error ? err.message : 'Audit bundle generation failed',
      );
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleGenerate}
        disabled={disabled || isGenerating}
        className="flex items-center gap-2 bg-foreground text-background px-6 py-3 rounded-xl text-sm font-bold shadow-lg hover:opacity-90 transition-all motion-safe:active:scale-95 disabled:opacity-60"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Compiling Bundle…
          </>
        ) : (
          <>
            <FileCheck className="h-4 w-4" />
            Create Bundle
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}
