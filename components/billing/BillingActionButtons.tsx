"use client";

import { useState, useTransition } from "react";
import { startCheckout, openCustomerPortal } from "@/app/app/actions/billing";
import { Loader2, CreditCard, Settings, AlertCircle } from "lucide-react";

interface BillingActionButtonsProps {
  planKey: string | null;
  canSelfServe: boolean;
  canManagePortal: boolean;
}

export function BillingActionButtons({
  planKey,
  canSelfServe,
  canManagePortal,
}: BillingActionButtonsProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleActivate = async () => {
    setError(null);
    
    startTransition(async () => {
      try {
        // Create a FormData object with the plan
        const formData = new FormData();
        formData.set("plan", planKey ?? "");
        
        // Call the server action
        const result = await startCheckout(formData);
        
        // If result is a URL, redirect to Stripe
        if (typeof result === 'string' && result.startsWith('http')) {
          window.location.href = result;
        }
      } catch (err) {
        console.error("Activation failed:", err);
        setError(err instanceof Error ? err.message : "Failed to start checkout. Please try again.");
      }
    });
  };

  const handleManagePortal = async () => {
    setError(null);
    
    startTransition(async () => {
      try {
        // Call the server action
        const result = await openCustomerPortal();
        
        // If result is a URL, redirect to Stripe portal
        if (typeof result === 'string' && result.startsWith('http')) {
          window.location.href = result;
        }
      } catch (err) {
        console.error("Portal access failed:", err);
        setError(err instanceof Error ? err.message : "Failed to open billing portal. Please try again.");
      }
    });
  };

  return (
    <>
      {error && (
        <div className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="mt-6 flex flex-wrap gap-3">
        {!canSelfServe ? (
          <button
            onClick={handleActivate}
            disabled={isPending}
            className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none flex items-center gap-2"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            {isPending ? "Starting checkout..." : "Activate subscription"}
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000" />
          </button>
        ) : null}
        
        {canManagePortal ? (
          <button
            onClick={handleManagePortal}
            disabled={isPending}
            className="group relative overflow-hidden rounded-lg border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-100 transition-all duration-300 hover:bg-white/10 hover:border-white/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Settings className="h-4 w-4" />
            )}
            {isPending ? "Opening portal..." : "Manage billing"}
            {/* Subtle glow effect on hover */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent group-hover:translate-x-full transition-transform duration-700" />
          </button>
        ) : null}
      </div>
    </>
  );
}