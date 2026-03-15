"use client"

import { useState } from "react"
import { Loader2, Calendar, RefreshCw, RotateCcw, Banknote, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"
import { useComplianceAction } from "@/components/compliance-system"

interface BillingActionButtonsProps {
  orgId: string
}

/**
 * BillingActionButtons - Client-side admin billing actions
 *
 * Covers: trial extend/reset, Stripe resync, invoice retry (dunning rescue),
 * and full refund of the most recent charge.
 */
export function BillingActionButtons({ orgId }: BillingActionButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [days, setDays] = useState(14)
  const { reportSuccess, reportError } = useComplianceAction()

  function promptReason(message: string) {
    const reason = window.prompt(message)
    return reason?.trim() || null
  }

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
    } catch (error: unknown) {
      reportError({ title: "Extension failed", message: error instanceof Error ? error.message : "Failed to extend trial" })
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
    } catch (error: unknown) {
      reportError({ title: "Reset failed", message: error instanceof Error ? error.message : "Failed to reset trial" })
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
    } catch (error: unknown) {
      reportError({ title: "Resync failed", message: error instanceof Error ? error.message : "Failed to resync Stripe" })
    } finally {
      setLoading(null)
    }
  }

  async function handleRetryInvoice() {
    const reason = promptReason("Reason for manual invoice retry (dunning rescue)")
    if (!reason) return
    setLoading("retry-invoice")
    try {
      const res = await fetch(`/api/admin/orgs/${orgId}/billing/retry-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-reason": reason },
        body: JSON.stringify({ reason }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to retry invoice")
      reportSuccess({
        title: "Invoice payment attempted",
        message: `Invoice ${data.invoiceId ?? ''} — status: ${data.status ?? 'unknown'}`,
      })
      window.location.reload()
    } catch (error: unknown) {
      reportError({
        title: "Invoice retry failed",
        message: error instanceof Error ? error.message : "Failed to retry invoice",
      })
    } finally {
      setLoading(null)
    }
  }

  async function handleRefund() {
    const reason = promptReason("Reason for refund (this will issue a full refund of the most recent charge)")
    if (!reason) return
    const confirmed = window.confirm(
      "This will issue a FULL REFUND of the most recent successful charge. This cannot be undone. Continue?"
    )
    if (!confirmed) return
    setLoading("refund")
    try {
      const res = await fetch(`/api/admin/orgs/${orgId}/billing/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-reason": reason },
        body: JSON.stringify({ reason }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to issue refund")
      const amountFormatted = data.amount
        ? `${(data.amount / 100).toFixed(2)} ${(data.currency ?? 'usd').toUpperCase()}`
        : ''
      reportSuccess({
        title: "Refund issued",
        message: `Refund ${data.refundId ?? ''} ${amountFormatted} — status: ${data.status ?? 'unknown'}`,
      })
      window.location.reload()
    } catch (error: unknown) {
      reportError({
        title: "Refund failed",
        message: error instanceof Error ? error.message : "Failed to issue refund",
      })
    } finally {
      setLoading(null)
    }
  }

  const btnBase = cn(
    "rounded-lg border border-white/10 px-3 py-1.5 text-xs font-bold",
    "text-slate-200 hover:bg-white/5 transition-all",
    "flex items-center gap-2",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "active:scale-95 disabled:active:scale-100"
  )

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
        <button onClick={handleExtendTrial} disabled={loading !== null} className={btnBase}>
          {loading === "extend" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Calendar className="h-3 w-3" />}
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
        {loading === "reset" ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
        Reset trial
      </button>

      {/* Resync Stripe */}
      <button onClick={handleResyncStripe} disabled={loading !== null} className={btnBase}>
        {loading === "resync" ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
        Resync Stripe
      </button>

      {/* Retry Invoice (Dunning Rescue) */}
      <button
        onClick={handleRetryInvoice}
        disabled={loading !== null}
        className={cn(
          "rounded-lg border border-sky-400/30 px-3 py-1.5 text-xs font-bold",
          "text-sky-300 hover:bg-sky-500/20 transition-all",
          "flex items-center gap-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "active:scale-95 disabled:active:scale-100"
        )}
      >
        {loading === "retry-invoice" ? <Loader2 className="h-3 w-3 animate-spin" /> : <CreditCard className="h-3 w-3" />}
        Retry invoice
      </button>

      {/* Refund */}
      <button
        onClick={handleRefund}
        disabled={loading !== null}
        className={cn(
          "rounded-lg border border-rose-400/30 px-3 py-1.5 text-xs font-bold",
          "text-rose-300 hover:bg-rose-500/20 transition-all",
          "flex items-center gap-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "active:scale-95 disabled:active:scale-100"
        )}
      >
        {loading === "refund" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Banknote className="h-3 w-3" />}
        Issue refund
      </button>
    </div>
  )
}
