"use client";

import { useSystemState } from "@/lib/system-state/context";
import { Clock, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";

export function TrialStatusBanner() {
  const { state } = useSystemState();

  // Don't show for non-trial users or if trial is not active
  if (!state.entitlements.trialActive || state.entitlements.plan !== "trial") {
    return null;
  }

  const daysRemaining = state.entitlements.trialDaysRemaining;
  const isExpiringSoon = daysRemaining <= 3;
  const isLastDay = daysRemaining <= 1;

  return (
    <div className={`
      border-b px-4 py-3 text-sm flex items-center justify-between gap-4
      ${isLastDay 
        ? 'bg-rose-500/10 border-rose-400/30 text-rose-200' 
        : isExpiringSoon 
        ? 'bg-amber-500/10 border-amber-400/30 text-amber-200'
        : 'bg-sky-500/10 border-sky-400/30 text-sky-200'
      }
    `}>
      <div className="flex items-center gap-3">
        {isLastDay ? (
          <AlertTriangle className="h-4 w-4 flex-shrink-0 animate-pulse" />
        ) : isExpiringSoon ? (
          <Clock className="h-4 w-4 flex-shrink-0" />
        ) : (
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
        )}
        
        <div>
          <span className="font-semibold">
            {isLastDay 
              ? "Trial expires today" 
              : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left in your free trial`
            }
          </span>
          {!isLastDay && (
            <span className="ml-2 text-xs opacity-75">
              Full access to all features
            </span>
          )}
        </div>
      </div>
      
      <Link 
        href="/app/billing"
        className={`
          px-4 py-2 rounded-lg font-semibold text-xs transition-all hover:scale-105
          ${isLastDay
            ? 'bg-rose-400 text-rose-950 hover:bg-rose-300'
            : 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white hover:from-sky-400 hover:to-indigo-400'
          }
        `}
      >
        {isLastDay ? "Activate Now" : "Choose Plan"}
      </Link>
    </div>
  );
}