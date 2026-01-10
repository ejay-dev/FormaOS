"use client"

import { useState, useEffect } from "react"
import { createSupabaseClient } from "@/lib/supabase/client"
import { 
  UserPlus, 
  Shield, 
  User, 
  MoreHorizontal, 
  CheckSquare, 
  ShieldCheck, 
  Activity,
  Search,
  Filter,
  AlertCircle
} from "lucide-react"
import { InviteModal } from "@/components/team/invite-modal"

export default function PeoplePage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [orgId, setOrgId] = useState<string | null>(null)

  useEffect(() => {
    async function getPersonnelData() {
      const supabase = createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.id) {
        setOrgId(null)
        setMembers([])
        setLoading(false)
        return
      }
      
      const { data: membership } = await supabase
        .from("org_members")
        .select("organization_id")
        .eq("user_id", user?.id)
        .single()

      if (membership?.organization_id) {
        setOrgId(membership.organization_id)
        // Fetch Members including Phase 1 metadata: department, start_date, and compliance_status
        const { data: membersList } = await supabase
          .from("org_members")
          .select("*")
          .eq("organization_id", membership.organization_id)

        const enrichedMembers = await Promise.all((membersList || []).map(async (m: { user_id: string }) => {
          const { count: taskCount } = await supabase
            .from("org_tasks")
            .select('*', { count: 'exact', head: true })
            .eq("organization_id", membership.organization_id)
            .eq("assigned_to", m.user_id)

          const { count: evidenceCount } = await supabase
            .from("org_evidence")
            .select('*', { count: 'exact', head: true })
            .eq("organization_id", membership.organization_id)
            .eq("uploaded_by", m.user_id)

          return { ...m, taskCount: taskCount || 0, evidenceCount: evidenceCount || 0 }
        }))

        setMembers(enrichedMembers)
      } else {
        setOrgId(null)
        setMembers([])
      }
      setLoading(false)
    }
    getPersonnelData()
  }, [isModalOpen])

  return (
    <div className="space-y-8 pb-12">
      <InviteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        orgId={orgId ?? null}
      />

      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">Personnel Oversight</h1>
          <p className="text-slate-400 mt-1 font-medium tracking-tight">Phase 1: Foundation • Workforce Data Ownership</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-white/10 text-slate-100 px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all shadow-xl active:scale-95"
        >
          <UserPlus className="h-4 w-4" />
          Provision Access
        </button>
      </div>

      <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10 shadow-sm">
         <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
                placeholder="Search by name, department, or role..." 
                className="w-full pl-12 pr-4 py-2.5 text-xs font-bold outline-none bg-transparent"
            />
         </div>
         <div className="h-6 w-px bg-white/10" />
         <button className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/10 rounded-xl transition-colors">
            <Filter className="h-4 w-4" />
            Filter
         </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
            <div className="py-20 text-center animate-pulse">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Synchronizing Personnel Records...</p>
            </div>
        ) : members.map((member) => (
          <div key={member.user_id} className="group bg-white/5 border border-white/10 rounded-[2.5rem] p-6 hover:border-white/10 transition-all shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            
            {/* Phase 1 Enhanced Profile Section */}
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-[1.25rem] bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 group-hover:bg-white/10 group-hover:text-slate-100 transition-all duration-300">
                <User className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-slate-100 leading-none">Workspace Member</p>
                    
                    {/* Compliance Status Badge */}
                    <div className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-tighter flex items-center gap-1 ${
                        member.compliance_status === 'active' 
                        ? 'bg-emerald-400/10 text-emerald-300 border-emerald-400/30' 
                        : 'bg-rose-500/10 text-rose-300 border-rose-400/30'
                    }`}>
                        {member.compliance_status === 'active' ? <ShieldCheck className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                        {member.compliance_status || 'active'}
                    </div>
                </div>
                {/* Department & Start Date Metadata */}
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">
                    {member.department || 'General Staff'} • Joined {new Date(member.start_date || member.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Oversight Metrics Section */}
            <div className="flex items-center gap-8 md:gap-16 border-t md:border-t-0 pt-6 md:pt-0 border-white/10">
                <div className="text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Roadmap Progress</p>
                    <div className="flex items-center gap-2 justify-center">
                        <CheckSquare className="h-3.5 w-3.5 text-sky-300" />
                        <span className="text-sm font-black text-slate-100">{member.taskCount}</span>
                    </div>
                </div>
                <div className="text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Evidence Density</p>
                    <div className="flex items-center gap-2 justify-center">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-sm font-black text-slate-100">{member.evidenceCount}</span>
                    </div>
                </div>
                <div className="text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Access Role</p>
                    <div className="flex items-center gap-2 justify-center">
                        <Shield className={`h-3.5 w-3.5 ${member.role === 'admin' ? 'text-purple-300' : 'text-slate-400'}`} />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{member.role}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button className="flex-1 md:flex-none px-6 py-3 bg-white/10 text-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-slate-100 transition-all">
                   View Records
                </button>
                <button className="p-3 text-slate-400 hover:text-slate-100 transition-colors">
                    <MoreHorizontal className="h-5 w-5" />
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
