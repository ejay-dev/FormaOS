"use client"

import { useState } from "react"
import { Loader2, Lock, Unlock, Mail, MoreVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { useComplianceAction } from "@/components/compliance-system"

type UserAction = "lock" | "unlock" | "resend-confirmation"

interface UserActionButtonsProps {
  userId: string
  initialLocked?: boolean
}

/**
 * UserActionButtons - Client-side admin user actions
 * 
 * Replaces native form POST with fetch + proper loading states.
 * Uses compliance feedback system for success/error notifications.
 */
export function UserActionButtons({ userId, initialLocked = false }: UserActionButtonsProps) {
  const [loading, setLoading] = useState<UserAction | null>(null)
  const { reportSuccess, reportError } = useComplianceAction()

  async function handleAction(action: UserAction) {
    setLoading(action)

    try {
      const endpoint = action === "resend-confirmation" 
        ? `/api/admin/users/${userId}/resend-confirmation`
        : `/api/admin/users/${userId}/lock`

      const body = action === "resend-confirmation" 
        ? {}
        : { locked: action === "lock" }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Action failed")
      }

      // Success feedback
      const messages: Record<UserAction, string> = {
        lock: "User access locked",
        unlock: "User access restored",
        "resend-confirmation": "Confirmation email sent",
      }
      reportSuccess({ title: messages[action] })
      
      // Trigger page refresh for state update
      window.location.reload()
    } catch (error: any) {
      reportError({ title: "Action failed", message: error.message || "Failed to perform action" })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => handleAction("lock")}
        disabled={loading !== null}
        className={cn(
          "rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold",
          "text-slate-200 hover:bg-white/5 transition-all",
          "flex items-center gap-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "active:scale-95 disabled:active:scale-100"
        )}
      >
        {loading === "lock" ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Lock className="h-3 w-3" />
        )}
        Lock
      </button>
      
      <button
        onClick={() => handleAction("unlock")}
        disabled={loading !== null}
        className={cn(
          "rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold",
          "text-slate-200 hover:bg-white/5 transition-all",
          "flex items-center gap-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "active:scale-95 disabled:active:scale-100"
        )}
      >
        {loading === "unlock" ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Unlock className="h-3 w-3" />
        )}
        Unlock
      </button>
      
      <button
        onClick={() => handleAction("resend-confirmation")}
        disabled={loading !== null}
        className={cn(
          "rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold",
          "text-slate-200 hover:bg-white/5 transition-all",
          "flex items-center gap-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "active:scale-95 disabled:active:scale-100"
        )}
      >
        {loading === "resend-confirmation" ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Mail className="h-3 w-3" />
        )}
        Resend confirmation
      </button>
    </div>
  )
}
