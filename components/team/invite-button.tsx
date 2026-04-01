"use client"

import { useState } from "react"
import { Plus, Loader2, Mail, Shield, Eye, CheckCircle2, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useComplianceAction } from "@/components/compliance-system"
import { z } from "zod"

const inviteButtonSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  role: z.enum(["member", "viewer"]),
})

/**
 * =========================================================
 * INVITE BUTTON
 * Node Type: Entity (neutral)
 * Adds a new member entity to the organization graph
 * =========================================================
 */

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
      body: JSON.stringify({
        organizationId: orgId,
        email,
        role,
      }),
    })

    setLoading(false)

    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      reportError(payload?.error || "Failed to send invitation")
      return
    }

    const payload = await response.json().catch(() => null)
    const result = payload?.data ?? null

    // Show success state
    setSuccess(true)
    setDelivery(result?.delivery === "manual_share_required" ? "manual_share_required" : "sent")
    setManualShareUrl(typeof result?.inviteUrl === "string" ? result.inviteUrl : "")
    setCopied(false)
    
    // Report to compliance system
    nodeCreated("entity", email)
    reportInfo({
      title: result?.delivery === "manual_share_required" ? "Invitation created" : "Invitation sent",
      message:
        result?.delivery === "manual_share_required"
          ? `Share the secure invite link with ${email}`
          : `Sent to ${email}`,
    })
    
    // Close after animation
    if (result?.delivery !== "manual_share_required") {
      setTimeout(() => {
        setOpen(false)
        setEmail("")
        setRole("member")
        setSuccess(false)
        setDelivery("sent")
        setManualShareUrl("")
        setCopied(false)
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
    <>
      <button 
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="group flex items-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:brightness-110 transition-all shadow-[0_10px_30px_rgba(59,130,246,0.35)] disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
      >
        <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
        Invite Member
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 overflow-hidden max-h-[92vh] overflow-y-auto">
                {success ? (
                  <div className="p-12 flex flex-col items-center justify-center">
                    <div className="h-20 w-20 rounded-full bg-emerald-400/20 flex items-center justify-center mb-4 border-2 border-emerald-400/40">
                      <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">
                      {delivery === "sent" ? "Invitation Sent" : "Invitation Created"}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      {delivery === "sent"
                        ? `${email} will receive an invitation email`
                        : "Email delivery is unavailable. Share the secure invite link manually."}
                    </p>
                    {delivery === "manual_share_required" && manualShareUrl ? (
                      <>
                        <div className="mt-5 w-full rounded-xl border border-glass-border bg-glass-subtle p-3 text-left">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            Manual Share Link
                          </p>
                          <p className="mt-2 break-all text-sm text-foreground/90">
                            {manualShareUrl}
                          </p>
                        </div>
                        <div className="mt-4 flex w-full gap-3">
                          <button
                            type="button"
                            onClick={handleCopyLink}
                            className="flex-1 rounded-xl bg-glass-strong px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-white/15"
                          >
                            {copied ? "Copied" : "Copy Link"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpen(false)
                              setEmail("")
                              setRole("member")
                              setSuccess(false)
                              setDelivery("sent")
                              setManualShareUrl("")
                              setCopied(false)
                              router.refresh()
                            }}
                            className="flex-1 rounded-xl border border-glass-border px-4 py-2 text-sm font-bold text-foreground transition-colors hover:bg-white/5"
                          >
                            Close
                          </button>
                        </div>
                      </>
                    ) : null}
                  </div>
                ) : (
                  <>
                    <div className="p-6 border-b border-white/10">
                      <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                              <UserPlus className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-foreground">Invite User</h3>
                              <p className="text-sm text-muted-foreground">Add a team member or external auditor.</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setOpen(false)} 
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-glass-strong rounded-lg transition-colors"
                          >
                            ✕
                          </button>
                      </div>
                    </div>
                    
                    <form onSubmit={handleInvite} className="p-6 space-y-5">
                        {validationError && (
                          <div className="p-3 rounded-xl border border-red-400/30 bg-red-400/10 text-sm text-red-400">
                            {validationError}
                          </div>
                        )}
                        {/* Email Input */}
                        <div className="space-y-2">
                            <label htmlFor="field-100" className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <input id="field-100" 
                                    type="email" 
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 p-3 rounded-xl border border-glass-border bg-glass-subtle outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition-all text-sm"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>

                        {/* Role Selector */}
                        <div className="space-y-2">
                            <label htmlFor="field-99" className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Access Level</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setRole("member")}
                                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all active:scale-[0.98] ${
                                      role === 'member' 
                                        ? 'border-blue-400/40 bg-blue-400/10 ring-1 ring-blue-400/30' 
                                        : 'border-glass-border hover:border-glass-border-strong hover:bg-white/5'
                                    }`}
                                >
                                    <span className="flex items-center gap-2 text-xs font-bold text-foreground">
                                        <Shield className={`h-3 w-3 ${role === 'member' ? 'text-blue-400' : ''}`} /> Member
                                    </span>
                                    <span className="text-xs text-muted-foreground">Can view and edit documents.</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setRole("viewer")}
                                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all active:scale-[0.98] ${
                                      role === 'viewer' 
                                        ? 'border-blue-400/40 bg-blue-400/10 ring-1 ring-blue-400/30' 
                                        : 'border-glass-border hover:border-glass-border-strong hover:bg-white/5'
                                    }`}
                                >
                                    <span className="flex items-center gap-2 text-xs font-bold text-foreground">
                                        <Eye className={`h-3 w-3 ${role === 'viewer' ? 'text-blue-400' : ''}`} /> Viewer
                                    </span>
                                    <span className="text-xs text-muted-foreground">Read-only access. No editing.</span>
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 pt-4">
                            <button 
                                type="button" 
                                onClick={() => setOpen(false)}
                                className="flex-1 py-3 rounded-xl font-bold text-muted-foreground bg-glass-subtle hover:bg-glass-strong border border-glass-border transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white hover:brightness-110 transition-all flex items-center justify-center gap-2 text-sm shadow-[0_10px_30px_rgba(59,130,246,0.35)] active:scale-[0.98]"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Invite"}
                            </button>
                        </div>
                    </form>
                  </>
                )}
            </div>
        </div>
      )}
    </>
  )
}
