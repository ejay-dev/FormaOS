"use client"

import { ShieldCheck, Clock, AlertTriangle, FileText } from "lucide-react"

export function CredentialStatusWidget({ credentials }: { credentials: any[] }) {
  const stats = {
    verified: credentials.filter(c => c.verification_status === 'verified').length,
    pending: credentials.filter(c => c.verification_status === 'pending').length,
    rejected: credentials.filter(c => c.verification_status === 'rejected').length,
  }

  return (
    <div className="bg-white/10 border border-white/10 rounded-[2.5rem] p-8 shadow-sm space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Credential Integrity</h3>
        <span className="text-[10px] font-black text-slate-100 uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full">
            {credentials.length} Total Files
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-400/10 rounded-2xl p-4 border border-emerald-400/30 text-center">
            <ShieldCheck className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
            <p className="text-xl font-black text-emerald-700 leading-none">{stats.verified}</p>
            <p className="text-[8px] font-black uppercase text-emerald-300 tracking-tighter mt-1">Verified</p>
        </div>
        <div className="bg-sky-500/10 rounded-2xl p-4 border border-sky-400/30 text-center">
            <Clock className="h-5 w-5 text-blue-500 mx-auto mb-2" />
            <p className="text-xl font-black text-sky-300 leading-none">{stats.pending}</p>
            <p className="text-[8px] font-black uppercase text-blue-600 tracking-tighter mt-1">Pending</p>
        </div>
        <div className="bg-red-50 rounded-2xl p-4 border border-red-100 text-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mx-auto mb-2" />
            <p className="text-xl font-black text-red-700 leading-none">{stats.rejected}</p>
            <p className="text-[8px] font-black uppercase text-red-600 tracking-tighter mt-1">Rejected</p>
        </div>
      </div>

      {stats.rejected > 0 && (
        <div className="p-4 bg-red-900 rounded-2xl text-white flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-[10px] leading-relaxed font-bold uppercase tracking-widest">
                Action Required: One or more documents were rejected by your employer. Please re-upload verified proof.
            </p>
        </div>
      )}
    </div>
  )
}
