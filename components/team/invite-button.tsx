"use client"

// Audit Sprint 8a (2026-05-24): migrated from ad-hoc `fixed inset-0`
// modal to the shared Dialog primitive (Sprint 4c). Gains focus trap,
// ESC, aria-modal, scroll lock. Cyan trigger-button gradient stripped
// per the stored enterprise-aesthetic preference; trigger is now
// neutral white.

import { useState } from "react"
import { Plus, Loader2, Mail, Shield, Eye, CheckCircle2, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useComplianceAction } from "@/components/compliance-system"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const inviteButtonSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  role: z.enum(["member", "viewer"]),
})

export function InviteButton({ orgId, disabled }: { orgId: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("member")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [delivery, setDelivery] = useState<"sent" | "manual_share_required">("sent")
  const [manualShareUrl, setManualShareUrl] = useState("")
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const { nodeCreated, reportError, reportInfo } = useComplianceAction()

  const [validationError, setValidationError] = useState<string | null>(null)

  const resetState = () => {
    setOpen(false)
    setEmail("")
    setRole("member")
    setSuccess(false)
    setDelivery("sent")
    setManualShareUrl("")
    setCopied(false)
    setValidationError(null)
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    const parsed = inviteButtonSchema.safeParse({ email, role })
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? "Invalid input")
      return
    }

    setLoading(true)

    const response = await fetch("/app/api/invitations/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId: orgId, email, role }),
    })

    setLoading(false)

    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      reportError(payload?.error || "Failed to send invitation")
      return
    }

    const payload = await response.json().catch(() => null)
    const result = payload?.data ?? null

    setSuccess(true)
    setDelivery(result?.delivery === "manual_share_required" ? "manual_share_required" : "sent")
    setManualShareUrl(typeof result?.inviteUrl === "string" ? result.inviteUrl : "")
    setCopied(false)

    nodeCreated("entity", email)
    reportInfo({
      title: result?.delivery === "manual_share_required" ? "Invitation created" : "Invitation sent",
      message:
        result?.delivery === "manual_share_required"
          ? `Share the secure invite link with ${email}`
          : `Sent to ${email}`,
    })

    // Auto-close + refresh on the happy path; manual-share requires the
    // user to copy the link before dismissing.
    if (result?.delivery !== "manual_share_required") {
      setTimeout(() => {
        resetState()
        router.refresh()
      }, 1500)
    }
  }

  const handleCopyLink = async () => {
    if (!manualShareUrl) return
    try {
      await navigator.clipboard.writeText(manualShareUrl)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetState()
        else setOpen(true)
      }}
    >
      <button
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="group flex items-center gap-2 rounded-md bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-900 transition-colors hover:bg-white disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
        Invite member
      </button>

      <DialogContent>
        {success ? (
          <>
            <DialogHeader>
              <DialogTitle>
                {delivery === "sent" ? "Invitation sent" : "Invitation created"}
              </DialogTitle>
              <DialogDescription>
                {delivery === "sent"
                  ? `${email} will receive an invitation email.`
                  : "Email delivery is unavailable. Share the secure invite link manually."}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            </div>
            {delivery === "manual_share_required" && manualShareUrl ? (
              <>
                <div className="rounded-md border border-slate-700 bg-slate-950 p-3 text-left">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Manual share link
                  </p>
                  <p className="mt-2 break-all text-sm text-slate-100">
                    {manualShareUrl}
                  </p>
                </div>
                <DialogFooter>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200"
                  >
                    {copied ? "Copied" : "Copy link"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetState()
                      router.refresh()
                    }}
                    className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-900"
                  >
                    Close
                  </button>
                </DialogFooter>
              </>
            ) : null}
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-slate-400" />
                Invite user
              </DialogTitle>
              <DialogDescription>
                Add a team member or external auditor.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleInvite} className="space-y-4">
              {validationError ? (
                <div className="rounded-md border border-red-700/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                  {validationError}
                </div>
              ) : null}

              <label className="block text-sm">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Email address
                </span>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full rounded-md border border-slate-700 bg-slate-950 pl-9 pr-3 py-2 text-sm text-slate-100 focus:border-slate-500 focus:outline-none"
                  />
                </div>
              </label>

              <div className="space-y-2">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Access level
                </span>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setRole("member")}
                    className={`rounded-md border p-3 text-left transition-colors ${
                      role === "member"
                        ? "border-slate-400 bg-slate-800"
                        : "border-slate-700 hover:bg-slate-800/50"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                      <Shield className="h-3.5 w-3.5" /> Member
                    </span>
                    <span className="mt-1 block text-xs text-slate-400">
                      Can view and edit documents.
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("viewer")}
                    className={`rounded-md border p-3 text-left transition-colors ${
                      role === "viewer"
                        ? "border-slate-400 bg-slate-800"
                        : "border-slate-700 hover:bg-slate-800/50"
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                      <Eye className="h-3.5 w-3.5" /> Viewer
                    </span>
                    <span className="mt-1 block text-xs text-slate-400">
                      Read-only access. No editing.
                    </span>
                  </button>
                </div>
              </div>

              <DialogFooter>
                <button
                  type="button"
                  onClick={resetState}
                  disabled={loading}
                  className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-900 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Send invite"
                  )}
                </button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
