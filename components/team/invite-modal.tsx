"use client"

import { useState } from "react"
import { Mail, Shield, User, Loader2, X, CheckCircle2, Eye } from "lucide-react"

export function InviteModal({ isOpen, onClose, orgId }: { isOpen: boolean; onClose: () => void; orgId?: string | null }) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"admin" | "member" | "viewer">("member")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      if (!orgId) {
        throw new Error("Organization context missing");
      }

      const response = await fetch("/app/api/invitations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: orgId,
          email,
          role,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || "Failed to invite user.")
      }
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 2000)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/10">
          <div>
            <h3 className="text-lg font-bold text-slate-100">Invite Team Member</h3>
            <p className="text-xs text-slate-400">Add a new user to your organization.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        {success ? (
          <div className="p-12 text-center flex flex-col items-center animate-in scale-in-95">
             <div className="h-16 w-16 rounded-full bg-emerald-400/10 text-emerald-500 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8" />
             </div>
             <h4 className="text-lg font-bold text-slate-100">Invite Sent!</h4>
             <p className="text-sm text-slate-400 mt-2">The system has recorded the invitation.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input 
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 text-sm outline-none focus:border-white/20 focus:ring-1 focus:ring-sky-500/20 transition-all"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Workspace Role</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("member")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                    role === 'member' ? 'border-white/20 bg-white/10' : 'border-white/10 bg-white/10 hover:border-white/10'
                  }`}
                >
                  <User className={`h-5 w-5 ${role === 'member' ? 'text-slate-100' : 'text-slate-400'}`} />
                  <span className={`text-xs font-bold ${role === 'member' ? 'text-slate-100' : 'text-slate-400'}`}>Member</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                    role === 'admin' ? 'border-white/20 bg-white/10' : 'border-white/10 bg-white/10 hover:border-white/10'
                  }`}
                >
                  <Shield className={`h-5 w-5 ${role === 'admin' ? 'text-slate-100' : 'text-slate-400'}`} />
                  <span className={`text-xs font-bold ${role === 'admin' ? 'text-slate-100' : 'text-slate-400'}`}>Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("viewer")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                    role === 'viewer' ? 'border-white/20 bg-white/10' : 'border-white/10 bg-white/10 hover:border-white/10'
                  }`}
                >
                  <Eye className={`h-5 w-5 ${role === 'viewer' ? 'text-slate-100' : 'text-slate-400'}`} />
                  <span className={`text-xs font-bold ${role === 'viewer' ? 'text-slate-100' : 'text-slate-400'}`}>Viewer</span>
                </button>
              </div>
            </div>

            {/* Submit */}
            <button 
              disabled={loading}
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white py-4 rounded-2xl font-bold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Invitation"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
