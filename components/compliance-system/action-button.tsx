"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Loader2, Check, X, AlertTriangle } from "lucide-react";

/**
 * =========================================================
 * ACTION BUTTON COMPONENT
 * =========================================================
 * Every button must respond visually on click and show
 * processing state if async. No dead or silent UI elements.
 */

export type ActionResult = {
  success: boolean;
  message?: string;
  nodeChanged?: string;
  wireUpdated?: string;
};

type ButtonState = "idle" | "loading" | "success" | "error";

interface ActionButtonProps {
  children: React.ReactNode;
  onClick?: () => Promise<ActionResult> | ActionResult | void;
  onSuccess?: (result: ActionResult) => void;
  onError?: (error: Error | ActionResult) => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  showResultDuration?: number;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const VARIANT_STYLES = {
  primary: {
    idle: "bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white shadow-[0_8px_24px_rgba(0,212,251,0.3)] hover:shadow-[0_12px_32px_rgba(0,212,251,0.4)] hover:brightness-110",
    loading: "bg-gradient-to-r from-cyan-500/80 via-blue-500/80 to-indigo-500/80 text-white/80",
    success: "bg-emerald-500 text-white shadow-[0_8px_24px_rgba(16,185,129,0.4)]",
    error: "bg-rose-500 text-white shadow-[0_8px_24px_rgba(244,63,94,0.4)]",
  },
  secondary: {
    idle: "bg-white/5 border border-white/20 text-slate-100 hover:bg-white/10 hover:border-white/30",
    loading: "bg-white/5 border border-white/20 text-slate-300",
    success: "bg-emerald-500/20 border border-emerald-400/40 text-emerald-300",
    error: "bg-rose-500/20 border border-rose-400/40 text-rose-300",
  },
  ghost: {
    idle: "bg-transparent text-slate-300 hover:bg-white/5 hover:text-slate-100",
    loading: "bg-white/5 text-slate-400",
    success: "bg-emerald-500/10 text-emerald-300",
    error: "bg-rose-500/10 text-rose-300",
  },
  danger: {
    idle: "bg-rose-500/10 border border-rose-400/30 text-rose-300 hover:bg-rose-500/20 hover:border-rose-400/50",
    loading: "bg-rose-500/10 border border-rose-400/30 text-rose-300/80",
    success: "bg-emerald-500/20 border border-emerald-400/40 text-emerald-300",
    error: "bg-rose-500 text-white",
  },
};

const SIZE_STYLES = {
  sm: "h-8 px-3 text-xs font-semibold rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm font-semibold rounded-xl gap-2",
  lg: "h-12 px-6 text-base font-semibold rounded-xl gap-2",
};

export function ActionButton({
  children,
  onClick,
  onSuccess,
  onError,
  variant = "primary",
  size = "md",
  disabled = false,
  className,
  loadingText,
  successText = "Done",
  errorText = "Failed",
  showResultDuration = 2000,
  fullWidth = false,
  icon,
}: ActionButtonProps) {
  const [state, setState] = useState<ButtonState>("idle");

  const handleClick = useCallback(async () => {
    if (state !== "idle" || disabled || !onClick) return;

    setState("loading");

    try {
      const result = await onClick();
      
      if (result && typeof result === "object") {
        if (result.success) {
          setState("success");
          onSuccess?.(result);
        } else {
          setState("error");
          onError?.(result);
        }
      } else {
        setState("success");
        onSuccess?.({ success: true });
      }
    } catch (error) {
      setState("error");
      onError?.(error instanceof Error ? error : new Error("Unknown error"));
    }

    // Reset after duration
    setTimeout(() => setState("idle"), showResultDuration);
  }, [onClick, onSuccess, onError, state, disabled, showResultDuration]);

  const variantStyles = VARIANT_STYLES[variant];

  return (
    <button
      onClick={handleClick}
      disabled={disabled || state !== "idle"}
      className={cn(
        // Base styles
        "relative inline-flex items-center justify-center transition-all duration-200",
        "active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
        // Size
        SIZE_STYLES[size],
        // State-specific variant
        variantStyles[state],
        // Width
        fullWidth && "w-full",
        className
      )}
    >
      {/* Content based on state */}
      {state === "idle" && (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          {children}
        </>
      )}
      
      {state === "loading" && (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText && <span>{loadingText}</span>}
        </>
      )}
      
      {state === "success" && (
        <>
          <Check className="h-4 w-4" />
          <span>{successText}</span>
        </>
      )}
      
      {state === "error" && (
        <>
          <X className="h-4 w-4" />
          <span>{errorText}</span>
        </>
      )}

      {/* Ripple effect on click */}
      {state === "loading" && (
        <span className="absolute inset-0 rounded-inherit overflow-hidden">
          <span className="absolute inset-0 animate-pulse bg-white/10" />
        </span>
      )}
    </button>
  );
}

/**
 * Simple icon-only action button
 */
export function IconActionButton({
  icon,
  onClick,
  tooltip,
  variant = "ghost",
  size = "md",
  disabled = false,
  className,
}: {
  icon: React.ReactNode;
  onClick?: () => Promise<void> | void;
  tooltip?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading || disabled || !onClick) return;
    setIsLoading(true);
    try {
      await onClick();
    } finally {
      setIsLoading(false);
    }
  };

  const sizeStyles = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-11 w-11",
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      title={tooltip}
      className={cn(
        "inline-flex items-center justify-center rounded-lg transition-all duration-200",
        "active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
        sizeStyles[size],
        VARIANT_STYLES[variant].idle,
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        icon
      )}
    </button>
  );
}

export default ActionButton;
