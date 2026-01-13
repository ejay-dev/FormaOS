"use client"

import { useState } from "react"
import { addTrainingRecord } from "@/app/app/actions/registers"
import { GraduationCap, Loader2, X, Calendar, User, CheckCircle2 } from "lucide-react"
import { useComplianceAction } from "@/components/compliance-system"

/**
 * =========================================================
 * ADD CERTIFICATION MODAL
 * Node Type: Evidence (violet) - Training certification
 * Creates a new certification record in the compliance graph
 * =========================================================
 */

export function AddCertificationModal({ 
  isOpen, 
  onClose, 
  members 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  members: any[];
}) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const [userId, setUserId] = useState("")
  const [title, setTitle] = useState("")
  const [completionDate, setCompletionDate] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const { evidenceAdded, reportError } = useComplianceAction()

  if (!isOpen) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await addTrainingRecord({
        userId,
        trainingTitle: title,
        completionDate,
        expiryDate: expiryDate || undefined
      })
      
      // Report to compliance system
      evidenceAdded(title)
      
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 2000)
    } catch (error: any) {
      reportError({ title: "Certification failed", message: error.message || "Unknown error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white/10 rounded-[2rem] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/10">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center">
              <GraduationCap className="h-4 w-4" />
            </div>
            <h3 className="font-black text-slate-100 tracking-tight">Record Certification</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        {success ? (
          <div className="p-12 text-center flex flex-col items-center animate-in zoom-in-95">
             <div className="h-16 w-16 rounded-full bg-emerald-400/10 text-emerald-500 flex items-center justify-center mb-4 border border-emerald-400/30">
                <CheckCircle2 className="h-8 w-8" />
             </div>
             <h4 className="text-lg font-black text-slate-100 tracking-tight">Record Logged</h4>
             <p className="text-sm text-slate-400 mt-1">Staff register has been updated.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Select Member */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Personnel</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <select 
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 rounded-2xl border border-white/10 bg-white/10 focus:bg-white/10 focus:outline-black text-xs font-bold transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select Staff Member</option>
                  {members.map(m => (
                    <option key={m.user_id} value={m.user_id}>Member ID: {m.user_id.slice(0, 8)}...</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Certification Title</label>
              <input 
                required
                placeholder="e.g. NDIS Worker Screening Check"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-4 rounded-2xl border border-white/10 bg-white/10 focus:bg-white/10 focus:outline-black text-xs font-bold transition-all"
              />
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Completion</label>
                <input 
                  required
                  type="date"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  className="w-full p-4 rounded-2xl border border-white/10 bg-white/10 focus:bg-white/10 focus:outline-black text-[10px] font-bold transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Expiry (Optional)</label>
                <input 
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full p-4 rounded-2xl border border-white/10 bg-white/10 focus:bg-white/10 focus:outline-black text-[10px] font-bold transition-all"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 transition-all shadow-lg disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Log Record"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}