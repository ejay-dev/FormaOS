"use client"

import { useState } from "react"
import { Loader2, Calendar, RefreshCw, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { useComplianceAction } from "@/components/compliance-system"

interface BillingActionButtonsProps {
  orgId: string
}

/**
 * BillingActionButtons - Client-side admin billing actions
 * 
 * Replaces native form POST with fetch + proper loading states.
 * Uses compliance feedback system for success/error notifications.
 */
export function BillingActionButtons({ orgId }: BillingActionButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [days, setDays] = useState(14)
  const { reportSuccess, reportError } = useComplianceAction()

  async function handleExtendTrial() {
    setLoading("extend")

    try {
      const res = await fetch(`/api/admin/orgs/${orgId}/trial/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to extend trial")
      }

      reportSuccess({ title: "Trial extended", message: `Added ${days} days` })
      window.location.reload()
    } catch (error: any) {
      reportError({ title: "Extension failed", message: error.message || "Failed to extend trial" })
    } finally {
      setLoading(null)
    }
  }

  async function handleResetTrial() {
    setLoading("reset")

    try {
      const res = await fetch(`/api/admin/orgs/${orgId}/trial/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to reset trial")
      }

      reportSuccess({ title: "Trial reset", message: "Trial period has been reset" })
      window.location.reload()
    } catch (error: any) {
      reportError({ title: "Reset failed", message: error.message || "Failed to reset trial" })
    } finally {
      setLoading(null)
    }
  }

  async function handleResyncStripe() {
    setLoading("resync")

    try {
      const res = await fetch(`/api/admin/subscriptions/${orgId}/resync-stripe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to resync Stripe")
      }

      reportSuccess({ title: "Stripe resynced", message: "Subscription data updated" })
      window.location.reload()
    } catch (error: any) {
      reportError({ title: "Resync failed", message: error.message || "Failed to resync Stripe" })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Extend Trial */}
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          min={1}
          max={90}
          disabled={loading !== null}
          className={cn(
            "w-16 rounded-lg border border-white/10 bg-[hsl(var(--card))] px-2 py-1 text-xs text-slate-200",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        />
        <button
          onClick={handleExtendTrial}
          disabled={loading !== null}
          className={cn(
            "rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold",
            "text-slate-200 hover:bg-white/5 transition-all",
            "flex items-center gap-2",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "active:scale-95 disabled:active:scale-100"
          )}
        >
          {loading === "extend" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Calendar className="h-3 w-3" />
          )}
          Extend trial
        </button>
      </div>

      {/* Reset Trial */}
      <button
        onClick={handleResetTrial}
        disabled={loading !== null}
        className={cn(
          "rounded-lg border border-amber-400/30 px-3 py-1.5 text-xs font-bold",
          "text-amber-300 hover:bg-amber-500/20 transition-all",
          "flex items-center gap-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "active:scale-95 disabled:active:scale-100"
        )}
      >
        {loading === "reset" ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <RotateCcw className="h-3 w-3" />
        )}
        Reset trial
      </button>

      {/* Resync Stripe */}
      <button
        onClick={handleResyncStripe}
        disabled={loading !== null}
        className={cn(
          "rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold",
          "text-slate-200 hover:bg-white/5 transition-all",
          "flex items-center gap-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "active:scale-95 disabled:active:scale-100"
        )}
      >
        {loading === "resync" ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <RefreshCw className="h-3 w-3" />
        )}
        Resync Stripe
      </button>
    </div>
  )
}
