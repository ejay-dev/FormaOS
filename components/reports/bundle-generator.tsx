"use client";

import { useState } from "react";
import { ArrowRight, Loader2, FileCheck } from "lucide-react";
import { generateAuditBundlePdf } from "@/app/app/actions/reports";

export function BundleGenerator({ disabled }: { disabled?: boolean }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    try {
      setIsGenerating(true);
      setError(null);

      const result = await generateAuditBundlePdf("ISO27001");

      if (!result?.success || !result?.signedUrl) {
        throw new Error("Failed to generate audit bundle");
      }

      window.open(result.signedUrl, "_blank");
    } catch (err: any) {
      console.error("Audit bundle failed:", err);
      setError(err.message || "Audit bundle generation failed");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleGenerate}
        disabled={disabled || isGenerating}
        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-[0_10px_30px_rgba(59,130,246,0.35)] hover:brightness-110 transition-all active:scale-95 disabled:opacity-60"
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

      {error && (
        <p className="text-xs text-red-600 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
