"use client"

import { useState, useEffect } from "react"
import { createSupabaseClient } from "@/lib/supabase/client"
import { 
  GraduationCap, 
  Plus, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  User,
  Search,
  Filter
} from "lucide-react"
import { AddCertificationModal } from "@/components/registers/add-certification-modal"

export default function TrainingRegisterPage() {
  const [isOpen, setIsOpen] = useState(false)
  const [records, setRecords] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseClient()

  // ✅ Advanced Data Fetching Loop
  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: membership } = await supabase
        .from("org_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .single()

      if (membership) {
        // 1. Fetch Training Records
        const { data: recs } = await supabase
          .from("org_training_records")
          .select("*")
          .eq("organization_id", membership.organization_id)
          .order("expiry_date", { ascending: true })
        
        setRecords(recs || [])

        // 2. Fetch Members for the dropdown
        const { data: mems } = await supabase
          .from("org_members")
          .select("*")
          .eq("organization_id", membership.organization_id)
        
        setMembers(mems || [])
      }
      setLoading(false)
    }
    fetchData()
  }, [isOpen]) // Re-fetch when modal closes (after a new record is added)

  return (
    <div className="space-y-8 pb-12">
      {/* ✅ MODAL INJECTION */}
      <AddCertificationModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        members={members} 
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">Staff Training Register</h1>
          <p className="text-slate-400 mt-1 font-medium">Monitor mandatory certifications and worker screening.</p>
        </div>
        <button 
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-white/10 text-slate-100 px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all shadow-xl active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Add Certification
        </button>
      </div>

      {/* ✅ ADVANCED FILTER BAR */}
      <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10 shadow-sm">
         <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
                placeholder="Search by personnel or certification..." 
                className="w-full pl-12 pr-4 py-2.5 text-xs font-bold outline-none bg-transparent"
            />
         </div>
         <div className="h-6 w-px bg-white/10" />
         <button className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/10 rounded-xl transition-colors">
            <Filter className="h-4 w-4" />
            Filter
         </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
              <th className="px-8 py-6">Personnel</th>
              <th className="px-8 py-6">Certification / Training</th>
              <th className="px-8 py-6">Completion</th>
              <th className="px-8 py-6">Expiry Status</th>
              <th className="px-8 py-6 text-right">Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center animate-pulse">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Synchronizing Registry...</p>
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-24 text-center">
                    <div className="h-16 w-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                      <GraduationCap className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-sm font-black text-slate-100 tracking-tight">Register is currently empty</p>
                    <p className="text-xs text-slate-400 mt-1">Begin by logging a staff verification record.</p>
                </td>
              </tr>
            ) : (
              records.map((record) => {
                const isExpired = record.expiry_date && new Date(record.expiry_date) < new Date();
                return (
                  <tr key={record.id} className="group hover:bg-white/5 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-slate-400 border border-white/10 group-hover:bg-white/5 transition-colors">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-slate-100">Workspace Member</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID: {record.user_id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs font-bold text-slate-100 tracking-tight">{record.title}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-slate-400 font-bold text-[11px]">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {new Date(record.completion_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-tighter w-fit shadow-sm ${
                         isExpired 
                           ? 'bg-rose-500/10 text-red-700 border-rose-400/30' 
                           : 'bg-emerald-400/10 text-emerald-700 border-emerald-400/30'
                       }`}>
                          {isExpired ? (
                            <AlertTriangle className="h-3 w-3 animate-pulse" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          {isExpired ? 'Expired' : 'Verified Active'} 
                          {record.expiry_date && ` • ${new Date(record.expiry_date).toLocaleDateString()}`}
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-sky-300 transition-all hover:underline decoration-2 underline-offset-4">
                          View Artifact
                       </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
