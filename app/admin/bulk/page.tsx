"use client"

import { useState } from "react"
import { Loader2, AlertTriangle, CheckCircle, XCircle, Eye, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { useComplianceAction } from "@/components/compliance-system"

type BlastRadiusEntry = {
  orgId: string
  found: boolean
  name?: string | null
  currentStatus?: string | null
  planKey?: string | null
  willBeAffected: boolean
  previewOutcome?: string
  reason?: string
}

type BulkResult = {
  dryRun: boolean
  action: string
  totalTargeted: number
  willAffect?: number
  willSkip?: number
  affected?: number
  skipped?: number
  blastRadius: BlastRadiusEntry[]
  message?: string
}

const ACTION_OPTIONS = [
  { value: "suspend", label: "Suspend orgs", danger: true },
  { value: "restore", label: "Restore orgs", danger: false },
  { value: "cancel_trials", label: "Cancel trials", danger: true },
  { value: "tag", label: "Tag orgs (admin note)", danger: false },
]

/**
 * Bulk Operator Actions page.
 *
 * Always performs a dry-run preview first. The operator must explicitly
 * click "Execute" after reviewing the blast-radius summary.
 */
export default function AdminBulkPage() {
  const [orgIdsInput, setOrgIdsInput] = useState("")
  const [action, setAction] = useState("restore")
  const [tag, setTag] = useState("")
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<BulkResult | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const { reportSuccess, reportError } = useComplianceAction()

  const selectedAction = ACTION_OPTIONS.find((a) => a.value === action)

  function parseOrgIds() {
    return orgIdsInput
      .split(/[\n,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
  }

  async function handleDryRun() {
    const orgIds = parseOrgIds()
    if (orgIds.length === 0) {
      reportError({ title: "No org IDs", message: "Paste at least one org UUID" })
      return
    }
    setLoading(true)
    setResult(null)
    setConfirmed(false)
    try {
      const body: Record<string, unknown> = { dryRun: true, action, orgIds }
      if (action === "tag") body.tag = tag
      const res = await fetch("/api/admin/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Dry run failed")
      setResult(data)
    } catch (error: unknown) {
      reportError({ title: "Dry run failed", message: error instanceof Error ? error.message : "Unknown error" })
    } finally {
      setLoading(false)
    }
  }

  async function handleExecute() {
    const orgIds = parseOrgIds()
    if (orgIds.length === 0 || !result) return
    if (!reason.trim()) {
      reportError({ title: "Reason required", message: "Enter a reason before executing" })
      return
    }
    setLoading(true)
    try {
      const body: Record<string, unknown> = { dryRun: false, action, orgIds, reason }
      if (action === "tag") body.tag = tag
      const res = await fetch("/api/admin/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Execution failed")
      reportSuccess({
        title: "Bulk action completed",
        message: `${data.affected ?? 0} orgs affected by "${action}"`,
      })
      setResult(data)
      setConfirmed(false)
    } catch (error: unknown) {
      reportError({ title: "Execution failed", message: error instanceof Error ? error.message : "Unknown error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Bulk Operator Actions</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Apply actions to multiple organizations at once. Always preview the blast radius before executing.
        </p>
      </div>

      {/* Warning */}
      <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-4 flex items-start gap-3">
        <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-300">
          Bulk actions are irreversible for some operations. Always run a dry-run preview first
          and review every row before confirming execution. All actions are logged to the admin audit trail.
        </p>
      </div>

      {/* Configuration */}
      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Action</label>
            <select
              value={action}
              onChange={(e) => { setAction(e.target.value); setResult(null); setConfirmed(false) }}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {action === "tag" && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Tag value</label>
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="e.g. churn-risk, enterprise-prospect"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Org IDs <span className="text-slate-500">(one per line, comma, or space separated — max 100)</span>
          </label>
          <textarea
            value={orgIdsInput}
            onChange={(e) => { setOrgIdsInput(e.target.value); setResult(null); setConfirmed(false) }}
            placeholder="Paste org UUIDs here..."
            rows={5}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground resize-none"
          />
          <p className="mt-1 text-xs text-muted-foreground">{parseOrgIds().length} org ID(s) detected</p>
        </div>

        <button
          onClick={handleDryRun}
          disabled={loading || parseOrgIds().length === 0}
          className={cn(
            "flex items-center gap-2 rounded-lg border border-sky-400/30 px-4 py-2",
            "text-sm font-semibold text-sky-300 hover:bg-sky-500/20 transition-all",
            "disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          )}
        >
          {loading && !result ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
          Preview blast radius (dry run)
        </button>
      </div>

      {/* Blast Radius Preview */}
      {result && (
        <div className="rounded-lg border border-border bg-card space-y-4">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-semibold text-foreground">
                {result.dryRun ? "Dry-run preview" : "Execution result"} — {result.action}
              </span>
              <span className="text-xs text-muted-foreground">
                {result.totalTargeted} targeted ·{" "}
                <span className="text-emerald-400">{result.willAffect ?? result.affected ?? 0} will be affected</span>
                {" · "}
                <span className="text-slate-500">{result.willSkip ?? result.skipped ?? 0} skipped</span>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-left">Org</th>
                  <th className="px-4 py-2 text-left">Current status</th>
                  <th className="px-4 py-2 text-left">Plan</th>
                  <th className="px-4 py-2 text-left">Will be affected?</th>
                  <th className="px-4 py-2 text-left">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.blastRadius.map((entry) => (
                  <tr key={entry.orgId} className={cn(!entry.found && "opacity-40")}>
                    <td className="px-4 py-2">
                      <div className="font-medium text-foreground">{entry.name ?? "Unknown"}</div>
                      <div className="font-mono text-muted-foreground">{entry.orgId.split("-")[0]}…</div>
                    </td>
                    <td className="px-4 py-2 capitalize text-muted-foreground">{entry.currentStatus ?? "—"}</td>
                    <td className="px-4 py-2 text-muted-foreground">{entry.planKey ?? "—"}</td>
                    <td className="px-4 py-2">
                      {!entry.found ? (
                        <span className="text-rose-400">Not found</span>
                      ) : entry.willBeAffected ? (
                        <span className="flex items-center gap-1 text-amber-400">
                          <AlertTriangle className="h-3 w-3" /> Yes
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-500">
                          <XCircle className="h-3 w-3" /> No
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{entry.previewOutcome ?? entry.reason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Execute section */}
          {result.dryRun && (result.willAffect ?? 0) > 0 && (
            <div className="p-4 border-t border-border space-y-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Reason for this bulk action <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Clearing stale trials after Q1 audit"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="rounded"
                />
                I have reviewed the blast radius and confirm this action on{" "}
                <strong>{result.willAffect}</strong> organization(s)
              </label>

              {selectedAction?.danger && (
                <div className="flex items-start gap-2 text-xs text-rose-300">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  This is a destructive action. It will affect real organizations immediately.
                </div>
              )}

              <button
                onClick={handleExecute}
                disabled={loading || !confirmed || !reason.trim()}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-4 py-2",
                  "text-sm font-semibold transition-all active:scale-95",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  selectedAction?.danger
                    ? "border-rose-400/30 text-rose-300 hover:bg-rose-500/20"
                    : "border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/20"
                )}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                Execute on {result.willAffect} org(s)
              </button>
            </div>
          )}

          {!result.dryRun && (
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <CheckCircle className="h-4 w-4" />
                Bulk action executed — {result.affected ?? 0} orgs updated, {result.skipped ?? 0} skipped
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
