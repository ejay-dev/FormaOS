"use client";

import React from "react";
import { cn } from "@/lib/utils";

/**
 * =========================================================
 * PROGRESS INDICATOR COMPONENT
 * =========================================================
 * Shows processing state for async operations.
 * - If load > 300ms → show skeleton/shimmer
 * - If load > 2s → show explicit progress text
 */

interface ProgressIndicatorProps {
  /** Current phase message */
  message?: string;
  /** Progress percentage (0-100) */
  progress?: number;
  /** Specific compliance operation type */
  operation?: 
    | "linking-evidence"
    | "validating-compliance"
    | "generating-audit"
    | "evaluating-risk"
    | "creating-task"
    | "updating-control"
    | "syncing"
    | "processing";
  className?: string;
  size?: "sm" | "md" | "lg";
}

const OPERATION_MESSAGES: Record<string, string> = {
  "linking-evidence": "Linking evidence to control…",
  "validating-compliance": "Validating compliance posture…",
  "generating-audit": "Generating audit trace…",
  "evaluating-risk": "Evaluating risk impact…",
  "creating-task": "Creating remediation task…",
  "updating-control": "Updating control status…",
  "syncing": "Synchronizing compliance graph…",
  "processing": "Processing…",
};

export function ProgressIndicator({
  message,
  progress,
  operation = "processing",
  className,
  size = "md",
}: ProgressIndicatorProps) {
  const displayMessage = message || OPERATION_MESSAGES[operation];

  const sizeStyles = {
    sm: {
      container: "p-3",
      spinner: "h-4 w-4",
      text: "text-xs",
      bar: "h-1",
    },
    md: {
      container: "p-4",
      spinner: "h-5 w-5",
      text: "text-sm",
      bar: "h-1.5",
    },
    lg: {
      container: "p-6",
      spinner: "h-6 w-6",
      text: "text-base",
      bar: "h-2",
    },
  };

  const styles = sizeStyles[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl",
        "bg-white/5 border border-white/10 backdrop-blur-sm",
        styles.container,
        className
      )}
    >
      {/* Spinner */}
      <div className="relative">
        <div className={cn(
          "border-2 border-white/20 border-t-cyan-400 rounded-full animate-spin",
          styles.spinner
        )} />
        {/* Glow effect */}
        <div className={cn(
          "absolute inset-0 border-2 border-transparent border-t-cyan-400/30 rounded-full animate-spin blur-sm",
          styles.spinner
        )} />
      </div>

      {/* Message */}
      <p className={cn("text-slate-300 font-medium text-center", styles.text)}>
        {displayMessage}
      </p>

      {/* Progress bar (if percentage provided) */}
      {progress !== undefined && (
        <div className={cn(
          "w-full max-w-[200px] bg-white/10 rounded-full overflow-hidden",
          styles.bar
        )}>
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Inline progress spinner with text
 */
export function InlineProgress({
  message,
  operation = "processing",
  className,
}: {
  message?: string;
  operation?: string;
  className?: string;
}) {
  const displayMessage = message || OPERATION_MESSAGES[operation as keyof typeof OPERATION_MESSAGES] || "Processing…";

  return (
    <div className={cn("inline-flex items-center gap-2 text-sm text-slate-400", className)}>
      <div className="h-3.5 w-3.5 border-2 border-slate-500 border-t-cyan-400 rounded-full animate-spin" />
      <span>{displayMessage}</span>
    </div>
  );
}

/**
 * Full-screen loading overlay
 */
export function LoadingOverlay({
  message,
  operation = "processing",
}: {
  message?: string;
  operation?: string;
}) {
  const displayMessage = message || OPERATION_MESSAGES[operation as keyof typeof OPERATION_MESSAGES] || "Processing…";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-card border border-white/10 shadow-2xl">
        {/* Animated spinner */}
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 border-3 border-white/10 rounded-full" />
          <div className="absolute inset-0 border-3 border-transparent border-t-cyan-400 rounded-full animate-spin" />
          <div className="absolute inset-1 border-2 border-transparent border-t-blue-400 rounded-full animate-spin" style={{ animationDuration: "1.5s" }} />
        </div>
        
        {/* Message */}
        <p className="text-lg font-medium text-slate-200">{displayMessage}</p>
        
        {/* Shimmer bar */}
        <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-[shimmer_1.5s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for cards/content
 */
export function ComplianceSkeleton({
  variant = "card",
  className,
}: {
  variant?: "card" | "row" | "node" | "stat";
  className?: string;
}) {
  if (variant === "node") {
    return (
      <div className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/5 animate-pulse",
        className
      )}>
        <div className="h-8 w-8 rounded-lg bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 bg-white/10 rounded" />
          <div className="h-2 w-16 bg-white/5 rounded" />
        </div>
      </div>
    );
  }

  if (variant === "row") {
    return (
      <div className={cn(
        "flex items-center gap-4 px-4 py-3 animate-pulse",
        className
      )}>
        <div className="h-6 w-6 rounded bg-white/10" />
        <div className="flex-1 h-4 bg-white/10 rounded" />
        <div className="h-4 w-16 bg-white/5 rounded" />
      </div>
    );
  }

  if (variant === "stat") {
    return (
      <div className={cn(
        "p-5 rounded-2xl border border-white/10 bg-white/5 animate-pulse",
        className
      )}>
        <div className="h-3 w-20 bg-white/10 rounded mb-3" />
        <div className="h-8 w-16 bg-white/10 rounded mb-2" />
        <div className="h-2 w-24 bg-white/5 rounded" />
      </div>
    );
  }

  // Default card
  return (
    <div className={cn(
      "p-6 rounded-2xl border border-white/10 bg-white/5 animate-pulse",
      className
    )}>
      <div className="flex items-center gap-4 mb-4">
        <div className="h-10 w-10 rounded-xl bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-white/10 rounded" />
          <div className="h-3 w-24 bg-white/5 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-white/10 rounded" />
        <div className="h-3 w-3/4 bg-white/5 rounded" />
      </div>
    </div>
  );
}

export default ProgressIndicator;
