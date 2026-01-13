"use client"

import { useState } from "react"
import { Plus, Loader2, Mail, Shield, Eye, CheckCircle2, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useComplianceAction } from "@/components/compliance-system"

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
  const router = useRouter()
  const { nodeCreated, reportError, reportInfo } = useComplianceAction()

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
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

    // Show success state
    setSuccess(true)
    
    // Report to compliance system
    nodeCreated("entity", email)
    reportInfo(`Invitation sent to ${email}`)
    
    // Close after animation
    setTimeout(() => {
      setOpen(false)
      setEmail("")
      setRole("member")
      setSuccess(false)
      router.refresh()
    }, 1500)
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 overflow-hidden">
                {success ? (
                  <div className="p-12 flex flex-col items-center justify-center">
                    <div className="h-20 w-20 rounded-full bg-emerald-400/20 flex items-center justify-center mb-4 border-2 border-emerald-400/40">
                      <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-100">Invitation Sent</h3>
                    <p className="text-sm text-slate-400 mt-2 text-center">
                      {email} will receive an invitation email
                    </p>
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
                              <h3 className="text-lg font-bold text-slate-100">Invite User</h3>
                              <p className="text-sm text-slate-400">Add a team member or external auditor.</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setOpen(false)} 
                            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            ✕
                          </button>
                      </div>
                    </div>
                    
                    <form onSubmit={handleInvite} className="p-6 space-y-5">
                        {/* Email Input */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <input 
                                    type="email" 
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 p-3 rounded-xl border border-white/10 bg-white/5 outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition-all text-sm"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>

                        {/* Role Selector */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Access Level</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setRole("member")}
                                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all active:scale-[0.98] ${
                                      role === 'member' 
                                        ? 'border-blue-400/40 bg-blue-400/10 ring-1 ring-blue-400/30' 
                                        : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                                    }`}
                                >
                                    <span className="flex items-center gap-2 text-xs font-bold text-slate-100">
                                        <Shield className={`h-3 w-3 ${role === 'member' ? 'text-blue-400' : ''}`} /> Member
                                    </span>
                                    <span className="text-[10px] text-slate-400">Can view and edit documents.</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setRole("viewer")}
                                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all active:scale-[0.98] ${
                                      role === 'viewer' 
                                        ? 'border-blue-400/40 bg-blue-400/10 ring-1 ring-blue-400/30' 
                                        : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                                    }`}
                                >
                                    <span className="flex items-center gap-2 text-xs font-bold text-slate-100">
                                        <Eye className={`h-3 w-3 ${role === 'viewer' ? 'text-blue-400' : ''}`} /> Viewer
                                    </span>
                                    <span className="text-[10px] text-slate-400">Read-only access. No editing.</span>
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 pt-4">
                            <button 
                                type="button" 
                                onClick={() => setOpen(false)}
                                className="flex-1 py-3 rounded-xl font-bold text-slate-400 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-sm"
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
