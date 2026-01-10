"use client"

import { useState } from "react"
import { Plus, Loader2, Mail, Shield, Eye } from "lucide-react"
import { useRouter } from "next/navigation"

export function InviteButton({ orgId, disabled }: { orgId: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("member") // Default role
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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
      alert(payload?.error || "Failed to invite user.")
      return
    }

    setOpen(false)
    setEmail("")
    setRole("member")
    router.refresh()
  }

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:brightness-110 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Plus className="h-4 w-4" />
        Invite Member
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500/40 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-slate-100">Invite User</h3>
                        <p className="text-sm text-slate-400">Add a team member or external auditor.</p>
                    </div>
                    <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-100">✕</button>
                </div>
                
                <form onSubmit={handleInvite} className="space-y-4">
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
                                className="w-full pl-10 p-3 rounded-xl border border-white/10 outline-none focus:border-white/20 transition-colors text-sm"
                                placeholder="name@company.com"
                            />
                        </div>
                    </div>

                    {/* Role Selector (The Upgrade) */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Access Level</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setRole("member")}
                                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${role === 'member' ? 'border-white/20 bg-white/10 ring-1 ring-white/20' : 'border-white/10 hover:border-white/10'}`}
                            >
                                <span className="flex items-center gap-2 text-xs font-bold text-slate-100">
                                    <Shield className="h-3 w-3" /> Member
                                </span>
                                <span className="text-[10px] text-slate-400">Can view and edit documents.</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setRole("viewer")}
                                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${role === 'viewer' ? 'border-white/20 bg-white/10 ring-1 ring-white/20' : 'border-white/10 hover:border-white/10'}`}
                            >
                                <span className="flex items-center gap-2 text-xs font-bold text-slate-100">
                                    <Eye className="h-3 w-3" /> Viewer
                                </span>
                                <span className="text-[10px] text-slate-400">Read-only access. No editing.</span>
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                        <button 
                            type="button" 
                            onClick={() => setOpen(false)}
                            className="flex-1 py-3 rounded-xl font-bold text-slate-400 bg-white/10 hover:bg-white/10 transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white hover:brightness-110 transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Invite"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </>
  )
}
