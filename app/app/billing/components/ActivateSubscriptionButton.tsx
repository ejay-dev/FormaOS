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
        await startCheckout(formData);
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
        className="relative overflow-hidden rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed group"
      >
        {/* Loading overlay */}
        {isPending && (
          <div className="absolute inset-0 bg-white/20 flex items-center justify-center">
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
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      </button>

      {/* Error state */}
      {error && (
        <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
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