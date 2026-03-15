"use client"

import { useState } from "react"
import { Loader2, RotateCcw, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useComplianceAction } from "@/components/compliance-system"

interface ExportActionButtonsProps {
  jobId: string
  jobType: "compliance" | "report"
  status: string
}

/**
 * ExportActionButtons - Operator retry/cancel controls for export jobs.
 *
 * retry  — available for failed/error jobs
 * cancel — available for queued/processing jobs
 */
export function ExportActionButtons({ jobId, jobType, status }: ExportActionButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const { reportSuccess, reportError } = useComplianceAction()

  const canRetry = status === "failed" || status === "error"
  const canCancel = status === "queued" || status === "processing"

  if (!canRetry && !canCancel) return null

  async function handleAction(action: "retry" | "cancel") {
    setLoading(action)
    try {
      const res = await fetch(`/api/admin/exports/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, type: jobType }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Failed to ${action} export`)
      reportSuccess({
        title: action === "retry" ? "Export re-queued" : "Export cancelled",
        message: action === "retry"
          ? "Job has been reset to queued status"
          : "Job has been marked as cancelled",
      })
      window.location.reload()
    } catch (error: unknown) {
      reportError({
        title: `${action === "retry" ? "Retry" : "Cancel"} failed`,
        message: error instanceof Error ? error.message : `Failed to ${action} export`,
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {canRetry && (
        <button
          onClick={() => handleAction("retry")}
          disabled={loading !== null}
          className={cn(
            "inline-flex items-center gap-1 rounded-md border border-sky-400/30 px-2 py-1",
            "text-[11px] font-semibold text-sky-300 hover:bg-sky-500/20 transition-all",
            "disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          )}
        >
          {loading === "retry" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RotateCcw className="h-3 w-3" />
          )}
          Retry
        </button>
      )}
      {canCancel && (
        <button
          onClick={() => handleAction("cancel")}
          disabled={loading !== null}
          className={cn(
            "inline-flex items-center gap-1 rounded-md border border-rose-400/30 px-2 py-1",
            "text-[11px] font-semibold text-rose-300 hover:bg-rose-500/20 transition-all",
            "disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          )}
        >
          {loading === "cancel" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <XCircle className="h-3 w-3" />
          )}
          Cancel
        </button>
      )}
    </div>
  )
}
