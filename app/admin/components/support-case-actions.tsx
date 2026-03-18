"use client"

import { useState } from "react"
import { Loader2, UserCheck, CheckCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useComplianceAction } from "@/components/compliance-system"

interface SupportCaseActionsProps {
  requestId: string
  currentStatus: string
}

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
] as const

/**
 * SupportCaseActions - Operator controls for a single support case.
 *
 * Allows updating status, assigning to an operator, and adding handoff notes.
 */
export function SupportCaseActions({ requestId, currentStatus }: SupportCaseActionsProps) {
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [status, setStatus] = useState(currentStatus)
  const [assignedTo, setAssignedTo] = useState("")
  const [notes, setNotes] = useState("")
  const { reportSuccess, reportError } = useComplianceAction()

  async function handleUpdate() {
    const hasChanges =
      status !== currentStatus ||
      assignedTo.trim() !== "" ||
      notes.trim() !== ""

    if (!hasChanges) {
      reportError({ title: "No changes", message: "Nothing to update" })
      return
    }

    setLoading(true)
    try {
      const body: Record<string, string> = {}
      if (status !== currentStatus) body.status = status
      if (assignedTo.trim()) body.assignedTo = assignedTo.trim()
      if (notes.trim()) body.notes = notes.trim()

      const res = await fetch(`/api/admin/support/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to update case")

      reportSuccess({ title: "Case updated", message: `Status: ${status}` })
      setExpanded(false)
      window.location.reload()
    } catch (error: unknown) {
      reportError({
        title: "Update failed",
        message: error instanceof Error ? error.message : "Failed to update case",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className={cn(
          "inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1",
          "text-[11px] font-semibold text-slate-300 hover:bg-white/5 transition-all",
          "active:scale-95"
        )}
      >
        <UserCheck className="h-3 w-3" />
        Manage
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2 min-w-[200px]">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        disabled={loading}
        className={cn(
          "rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-xs text-slate-200",
          "disabled:opacity-50"
        )}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Assign to (email)"
        value={assignedTo}
        onChange={(e) => setAssignedTo(e.target.value)}
        disabled={loading}
        className={cn(
          "rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-xs text-slate-200",
          "placeholder:text-slate-500 disabled:opacity-50"
        )}
      />

      <textarea
        placeholder="Handoff notes..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        disabled={loading}
        rows={2}
        className={cn(
          "rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-xs text-slate-200",
          "placeholder:text-slate-500 disabled:opacity-50 resize-none"
        )}
      />

      <div className="flex items-center gap-2">
        <button
          onClick={handleUpdate}
          disabled={loading}
          className={cn(
            "flex items-center gap-1 rounded-md border border-emerald-400/30 px-2 py-1",
            "text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-all",
            "disabled:opacity-50 active:scale-95"
          )}
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
          Save
        </button>
        <button
          onClick={() => setExpanded(false)}
          disabled={loading}
          className={cn(
            "flex items-center gap-1 rounded-md border border-white/10 px-2 py-1",
            "text-[11px] font-semibold text-slate-400 hover:bg-white/5 transition-all",
            "disabled:opacity-50 active:scale-95"
          )}
        >
          <XCircle className="h-3 w-3" />
          Cancel
        </button>
      </div>
    </div>
  )
}
