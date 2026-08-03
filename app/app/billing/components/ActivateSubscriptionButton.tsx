"use client";

import { useState, useTransition } from "react";
import { Loader2, CreditCard, ArrowRight } from "lucide-react";
import { startCheckout } from "@/app/app/actions/billing";

interface ActivateSubscriptionButtonProps {
  planKey: string;
  planName: string;
  disabled?: boolean;
}

export function ActivateSubscriptionButton({ 
  planKey, 
  planName, 
  disabled = false 
}: ActivateSubscriptionButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleActivate = () => {
    setError(null);
    
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("plan", planKey);
        const result = await startCheckout(formData);
        if (result.success) {
          window.location.href = result.url;
          return;
        }
        setError(result.error);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start checkout");
      }
    });
  };

  return (
    <div>
      <button
        onClick={handleActivate}
        disabled={disabled || isPending}
        className="relative overflow-hidden inline-flex min-h-[44px] items-center justify-center rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-background transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        {/* Loading overlay */}
        {isPending && (
          <div className="absolute inset-0 bg-surface-3 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
        
        {/* Button content */}
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          <span>
            {isPending ? "Starting checkout..." : `Activate ${planName}`}
          </span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </button>

      {/* Error state */}
      {error && (
        <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <div className="font-medium">Checkout failed</div>
          <div className="mt-1 text-xs opacity-80">{error}</div>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-xs underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
