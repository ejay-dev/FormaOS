"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { startCheckout, openCustomerPortal } from "@/app/app/actions/billing";
import { Loader2, CreditCard, Settings, AlertCircle } from "lucide-react";
import {
  CHECKOUT_INTENT_COOKIE,
  parseCheckoutIntent,
} from "@/lib/billing/checkout-intent";

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
  const searchParams = useSearchParams();
  const autoCheckoutTriggered = useRef(false);

  const runCheckout = (plan: string) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("plan", plan);
        const result = await startCheckout(formData);
        if (typeof result === "string" && result.startsWith("http")) {
          window.location.href = result;
        }
      } catch (err) {
        console.error("Activation failed:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to start checkout. Please try again.",
        );
      }
    });
  };

  // Self-serve pricing-page flow: Foundation CTA routes new buyers through
  // signup → /app → /app/billing?autoCheckout=basic. Only triggers once, and
  // only when the org has no active subscription yet.
  useEffect(() => {
    if (autoCheckoutTriggered.current) return;
    if (canSelfServe) return;
    const autoPlan = parseCheckoutIntent(searchParams.get("autoCheckout"));
    if (!autoPlan) return;
    autoCheckoutTriggered.current = true;
    if (typeof document !== "undefined") {
      document.cookie = `${CHECKOUT_INTENT_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    }
    runCheckout(autoPlan);
  }, [searchParams, canSelfServe]);

  const handleActivate = async () => {
    setError(null);
    runCheckout(planKey ?? "");
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
            className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 transition-all duration-300 motion-safe:hover:scale-[1.02] hover:shadow-lg hover:shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none flex items-center gap-2"
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
            className="group relative overflow-hidden rounded-lg border border-white/15 bg-glass-subtle px-6 py-3 text-sm font-semibold text-foreground transition-all duration-300 hover:bg-glass-strong hover:border-white/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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