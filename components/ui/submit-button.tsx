"use client"

import { useFormStatus } from "react-dom"
import { Loader2, ArrowRight, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type SubmitButtonVariant = "primary" | "secondary" | "danger" | "ghost"
type SubmitButtonSize = "sm" | "md" | "lg"

interface SubmitButtonProps {
  children?: React.ReactNode
  className?: string
  variant?: SubmitButtonVariant
  size?: SubmitButtonSize
  loadingText?: string
  showArrow?: boolean
  disabled?: boolean
  fullWidth?: boolean
}

/**
 * SubmitButton - Server Action Form Submit with Loading State
 * 
 * Uses React's useFormStatus hook to automatically detect pending state
 * when used inside a <form action={serverAction}>.
 * 
 * Node-wire design language:
 * - Primary: Neutral dark with gradient hover
 * - Secondary: Transparent with border
 * - Danger: Rose tones for destructive actions
 * 
 * Features:
 * - Automatic loading spinner during server action
 * - Disabled state with reduced opacity
 * - Active scale effect for tactile feedback
 * - Arrow animation on hover (optional)
 */
export function SubmitButton({
  children = "Continue",
  className,
  variant = "primary",
  size = "lg",
  loadingText,
  showArrow = true,
  disabled = false,
  fullWidth = true,
}: SubmitButtonProps) {
  const { pending } = useFormStatus()
  
  const isDisabled = disabled || pending

  const sizeClasses: Record<SubmitButtonSize, string> = {
    sm: "py-2.5 px-4 text-[10px]",
    md: "py-3.5 px-6 text-xs",
    lg: "py-5 px-8 text-xs",
  }

  const variantClasses: Record<SubmitButtonVariant, string> = {
    primary: cn(
      "bg-[hsl(var(--card))] text-white",
      "hover:brightness-110",
      "shadow-xl",
      "disabled:opacity-70"
    ),
    secondary: cn(
      "bg-transparent text-slate-200 border border-white/10",
      "hover:bg-white/5 hover:border-white/20",
      "disabled:opacity-60"
    ),
    danger: cn(
      "bg-rose-500/20 text-rose-300 border border-rose-400/30",
      "hover:bg-rose-500/30",
      "disabled:opacity-60"
    ),
    ghost: cn(
      "bg-transparent text-slate-400",
      "hover:text-slate-200 hover:bg-white/5",
      "disabled:opacity-60"
    ),
  }

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className={cn(
        // Base styles
        "rounded-2xl font-black uppercase tracking-[0.2em]",
        "flex items-center justify-center gap-3",
        "transition-all duration-200",
        "active:scale-95 disabled:active:scale-100",
        "group",
        
        // Width
        fullWidth && "w-full",
        
        // Size
        sizeClasses[size],
        
        // Variant
        variantClasses[variant],
        
        // Custom
        className
      )}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{loadingText || "Processing..."}</span>
        </>
      ) : (
        <>
          <span>{children}</span>
          {showArrow && (
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          )}
        </>
      )}
    </button>
  )
}

/**
 * AdminActionButton - For admin panel native form submissions
 * 
 * Smaller variant for table action buttons
 */
export function AdminActionButton({
  children,
  className,
  variant = "secondary",
  disabled = false,
}: {
  children: React.ReactNode
  className?: string
  variant?: "secondary" | "danger"
  disabled?: boolean
}) {
  const { pending } = useFormStatus()
  
  const isDisabled = disabled || pending

  const variantClasses: Record<string, string> = {
    secondary: "border-white/10 text-slate-200 hover:bg-white/5",
    danger: "border-rose-400/30 text-rose-300 hover:bg-rose-500/20",
  }

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className={cn(
        "rounded-lg border px-3 py-1.5 text-xs font-bold",
        "transition-all duration-200",
        "active:scale-95 disabled:active:scale-100",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "flex items-center gap-2",
        variantClasses[variant],
        className
      )}
    >
      {pending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : null}
      <span>{children}</span>
    </button>
  )
}

/**
 * SaveButton - For settings/profile form submissions
 * 
 * Shows success state briefly after successful save
 */
interface SaveButtonProps {
  className?: string
  disabled?: boolean
}

export function SaveButton({ className, disabled = false }: SaveButtonProps) {
  const { pending } = useFormStatus()
  
  const isDisabled = disabled || pending

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className={cn(
        "w-full bg-white/5 text-slate-100 py-4 rounded-2xl",
        "font-black text-xs uppercase tracking-[0.2em]",
        "flex items-center justify-center gap-3",
        "hover:bg-white/10 transition-all shadow-xl",
        "active:scale-95 disabled:active:scale-100",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        "relative z-10 group/btn",
        className
      )}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Saving...</span>
        </>
      ) : (
        <>
          <Check className="h-4 w-4 transition-transform group-hover/btn:scale-110" />
          <span>Commit Profile</span>
        </>
      )}
    </button>
  )
}
