"use client";

import { useState, useTransition } from "react";
import { Loader2, Settings, ExternalLink } from "lucide-react";
import { openCustomerPortal } from "@/app/app/actions/billing";

export function ManageBillingButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleManageBilling = () => {
    setError(null);
    
    startTransition(async () => {
      try {
        await openCustomerPortal();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to open billing portal");
      }
    });
  };

  return (
    <div>
      <button
        onClick={handleManageBilling}
        disabled={isPending}
        className="relative overflow-hidden inline-flex min-h-[44px] items-center justify-center rounded-lg border border-edge-2 px-6 py-3 text-sm font-semibold text-foreground transition-all hover:bg-surface-1 disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        {/* Loading overlay */}
        {isPending && (
          <div className="absolute inset-0 bg-surface-2 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
        
        {/* Button content */}
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span>
            {isPending ? "Opening portal..." : "Manage billing"}
          </span>
          <ExternalLink className="h-3 w-3 opacity-60" />
        </div>
      </button>

      {/* Error state */}
      {error && (
        <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <div className="font-medium">Portal access failed</div>
          <div className="mt-1 text-xs opacity-80">{error}</div>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-xs underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}