"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback, ReactNode } from "react";
import { Check, Loader2, AlertCircle, X } from "lucide-react";

/**
 * =========================================================
 * INTERACTION FEEDBACK SYSTEM
 * =========================================================
 * Provides instant visual feedback for all interactions:
 * - Button states (hover, loading, success, error)
 * - Progress indicators
 * - Toast notifications
 * - Wire activity animations
 */

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
type ButtonState = "idle" | "loading" | "success" | "error";

interface InteractiveButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  onClick?: () => Promise<void> | void;
  disabled?: boolean;
  className?: string;
  successMessage?: string;
  errorMessage?: string;
  loadingText?: string;
  showFeedback?: boolean;
}

// Premium interactive button with state feedback
export function InteractiveButton({
  children,
  variant = "primary",
  onClick,
  disabled = false,
  className = "",
  successMessage = "Done!",
  errorMessage = "Error",
  loadingText = "Processing...",
  showFeedback = true,
}: InteractiveButtonProps) {
  const [state, setState] = useState<ButtonState>("idle");

  const handleClick = useCallback(async () => {
    if (!onClick || disabled || state !== "idle") return;

    setState("loading");
    try {
      await onClick();
      if (showFeedback) {
        setState("success");
        setTimeout(() => setState("idle"), 2000);
      } else {
        setState("idle");
      }
    } catch (error) {
      if (showFeedback) {
        setState("error");
        setTimeout(() => setState("idle"), 3000);
      } else {
        setState("idle");
      }
    }
  }, [onClick, disabled, state, showFeedback]);

  const variantStyles = {
    primary: "bg-primary text-primary-foreground shadow-[0_4px_14px_rgba(0,212,251,0.25)] hover:shadow-[0_6px_20px_rgba(0,212,251,0.35)]",
    secondary: "bg-transparent border border-white/10 text-foreground hover:bg-white/5",
    ghost: "bg-transparent text-foreground hover:bg-white/5",
    destructive: "bg-rose-500 text-white hover:bg-rose-600",
  };

  const stateStyles = {
    idle: "",
    loading: "opacity-90 cursor-wait",
    success: "!bg-emerald-500 !text-white",
    error: "!bg-rose-500 !text-white",
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled || state === "loading"}
      whileHover={state === "idle" ? { y: -2, scale: 1.02 } : undefined}
      whileTap={state === "idle" ? { scale: 0.98 } : undefined}
      className={`
        relative inline-flex items-center justify-center gap-2
        px-5 py-2.5 rounded-xl font-semibold text-sm
        transition-all duration-200 overflow-hidden
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${stateStyles[state]}
        ${className}
      `}
    >
      {/* Shimmer effect on hover */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
          backgroundSize: "200% 100%",
        }}
        animate={{ backgroundPosition: ["200% center", "-200% center"] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      />

      <AnimatePresence mode="wait">
        {state === "loading" && (
          <motion.span
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{loadingText}</span>
          </motion.span>
        )}
        {state === "success" && (
          <motion.span
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            <span>{successMessage}</span>
          </motion.span>
        )}
        {state === "error" && (
          <motion.span
            key="error"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2"
          >
            <AlertCircle className="h-4 w-4" />
            <span>{errorMessage}</span>
          </motion.span>
        )}
        {state === "idle" && (
          <motion.span
            key="idle"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// Progress bar with wire-style animation
interface ProgressWireProps {
  progress: number;
  label?: string;
  color?: string;
  showPercentage?: boolean;
}

export function ProgressWire({
  progress,
  label,
  color = "rgb(56, 189, 248)",
  showPercentage = true,
}: ProgressWireProps) {
  return (
    <div className="space-y-2">
      {(label || showPercentage) && (
        <div className="flex justify-between text-xs">
          {label && <span className="text-muted-foreground">{label}</span>}
          {showPercentage && (
            <span className="font-mono" style={{ color }}>
              {Math.round(progress)}%
            </span>
          )}
        </div>
      )}
      <div className="relative h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        {/* Animated glow */}
        <motion.div
          animate={{ x: ["0%", "100%", "0%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-y-0 w-1/4 opacity-60"
          style={{
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            filter: "blur(4px)",
          }}
        />
      </div>
    </div>
  );
}

// Toast notification system
type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastProviderProps {
  children: ReactNode;
}

const toastIcons = {
  success: <Check className="h-4 w-4" />,
  error: <AlertCircle className="h-4 w-4" />,
  info: <AlertCircle className="h-4 w-4" />,
  warning: <AlertCircle className="h-4 w-4" />,
};

const toastColors = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  error: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  info: "border-primary/30 bg-primary/10 text-primary",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
};

export function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-lg
        shadow-premium-lg min-w-[280px] max-w-[400px]
        ${toastColors[toast.type]}
      `}
    >
      {toastIcons[toast.type]}
      <span className="flex-1 text-sm font-medium">{toast.message}</span>
      <button
        onClick={onDismiss}
        className="p-1 rounded-lg hover:bg-white/10 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  );
}

// Loading skeleton with shimmer
interface SkeletonProps {
  className?: string;
  variant?: "text" | "circle" | "rect";
}

export function Skeleton({ className = "", variant = "rect" }: SkeletonProps) {
  const variantClasses = {
    text: "h-4 rounded",
    circle: "rounded-full aspect-square",
    rect: "rounded-xl",
  };

  return (
    <div
      className={`
        relative overflow-hidden bg-white/5
        ${variantClasses[variant]}
        ${className}
      `}
    >
      <motion.div
        animate={{ x: ["−100%", "100%"] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
        }}
      />
    </div>
  );
}

// Pulse dot indicator
interface PulseDotProps {
  color?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
}

export function PulseDot({ color = "rgb(56, 189, 248)", size = "md", label }: PulseDotProps) {
  const sizes = {
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-3 w-3",
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0.2, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`absolute inset-0 rounded-full`}
          style={{ backgroundColor: color }}
        />
        <div
          className={`relative ${sizes[size]} rounded-full`}
          style={{ backgroundColor: color }}
        />
      </div>
      {label && (
        <span className="text-xs text-muted-foreground">{label}</span>
      )}
    </div>
  );
}

// Card with hover interaction
interface InteractiveCardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  hoverEffect?: "lift" | "glow" | "border";
}

export function InteractiveCard({
  children,
  onClick,
  className = "",
  hoverEffect = "lift",
}: InteractiveCardProps) {
  const hoverStyles = {
    lift: "hover:-translate-y-2 hover:shadow-premium-xl",
    glow: "hover:shadow-[0_0_30px_rgba(56,189,248,0.15)]",
    border: "hover:border-primary/30",
  };

  return (
    <motion.div
      whileHover={{ scale: hoverEffect === "lift" ? 1.02 : 1 }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={`
        glass-panel rounded-2xl p-6 transition-all duration-300
        ${onClick ? "cursor-pointer" : ""}
        ${hoverStyles[hoverEffect]}
        ${className}
      `}
    >
      {/* Hover glow effect */}
      <motion.div
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: "radial-gradient(circle at center, rgba(56,189,248,0.1) 0%, transparent 70%)",
        }}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

// Node state change animation
interface NodeStateTransitionProps {
  from: "inactive" | "active" | "processing";
  to: "inactive" | "active" | "processing";
  onComplete?: () => void;
  children: ReactNode;
}

export function NodeStateTransition({
  from,
  to,
  onComplete,
  children,
}: NodeStateTransitionProps) {
  const stateColors = {
    inactive: "rgba(255,255,255,0.1)",
    active: "rgb(56, 189, 248)",
    processing: "rgb(245, 158, 11)",
  };

  return (
    <motion.div
      initial={{ 
        borderColor: stateColors[from],
        boxShadow: `0 0 0px ${stateColors[from]}`,
      }}
      animate={{
        borderColor: stateColors[to],
        boxShadow: to === "active" 
          ? `0 0 20px ${stateColors[to]}`
          : to === "processing"
          ? `0 0 10px ${stateColors[to]}`
          : "none",
      }}
      transition={{ duration: 0.5 }}
      onAnimationComplete={onComplete}
      className="border-2 rounded-xl p-4"
    >
      {children}
    </motion.div>
  );
}

export default {
  InteractiveButton,
  ProgressWire,
  ToastItem,
  Skeleton,
  PulseDot,
  InteractiveCard,
  NodeStateTransition,
};
