"use client"

import { useState } from "react"
import { Loader2, Lock, Unlock, Calendar, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"
import { useComplianceAction } from "@/components/compliance-system"

interface OrgActionButtonsProps {
  orgId: string
  currentPlan: string | null
  currentStatus: string
}

/**
 * OrgActionButtons - Client-side admin organization actions
 * 
 * Replaces native form POST with fetch + proper loading states.
 * Uses compliance feedback system for success/error notifications.
 */
export function OrgActionButtons({ orgId, currentPlan, currentStatus }: OrgActionButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState(currentPlan || "basic")
  const [days, setDays] = useState(14)
  const { reportSuccess, reportError } = useComplianceAction()

  async function handlePlanUpdate() {
    setLoading("plan")

    try {
      const res = await fetch(`/api/admin/orgs/${orgId}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to update plan")
      }

      reportSuccess({ title: "Plan updated", message: `Changed to ${selectedPlan}` })
      window.location.reload()
    } catch (error: any) {
      reportError({ title: "Update failed", message: error.message || "Failed to update plan" })
    } finally {
      setLoading(null)
    }
  }

  async function handleExtendTrial() {
    setLoading("trial")

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

  async function handleToggleLock() {
    const action = currentStatus === "blocked" ? "unblock" : "block"
    setLoading("lock")

    try {
      const res = await fetch(`/api/admin/orgs/${orgId}/lock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locked: currentStatus !== "blocked" }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Failed to ${action} organization`)
      }

      reportSuccess({ title: `Organization ${action}ed` })
      window.location.reload()
    } catch (error: any) {
      reportError({ title: "Action failed", message: error.message || `Failed to ${action} organization` })
    } finally {
      setLoading(null)
    }
  }

  const isBlocked = currentStatus === "blocked"

  return (
    <div className="flex flex-col gap-2">
      {/* Plan Update */}
      <div className="flex items-center gap-2">
        <select
          value={selectedPlan}
          onChange={(e) => setSelectedPlan(e.target.value)}
          disabled={loading !== null}
          className={cn(
            "rounded-lg border border-white/10 bg-[hsl(var(--card))] px-2 py-1 text-xs text-slate-200",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <option value="basic">Starter</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <button
          onClick={handlePlanUpdate}
          disabled={loading !== null}
          className={cn(
            "rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold",
            "text-slate-200 hover:bg-white/5 transition-all",
            "flex items-center gap-2",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "active:scale-95 disabled:active:scale-100"
          )}
        >
          {loading === "plan" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <CreditCard className="h-3 w-3" />
          )}
          Update
        </button>
      </div>

      {/* Trial Extension */}
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
          {loading === "trial" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Calendar className="h-3 w-3" />
          )}
          Extend trial
        </button>
      </div>

      {/* Block/Unblock */}
      <button
        onClick={handleToggleLock}
        disabled={loading !== null}
        className={cn(
          "rounded-lg border px-3 py-1.5 text-xs font-bold",
          "transition-all flex items-center gap-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "active:scale-95 disabled:active:scale-100",
          isBlocked 
            ? "border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/20" 
            : "border-rose-400/30 text-rose-300 hover:bg-rose-500/20"
        )}
      >
        {loading === "lock" ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : isBlocked ? (
          <Unlock className="h-3 w-3" />
        ) : (
          <Lock className="h-3 w-3" />
        )}
        {isBlocked ? "Unblock" : "Block"}
      </button>
    </div>
  )
}
