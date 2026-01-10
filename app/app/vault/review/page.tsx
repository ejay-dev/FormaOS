"use client"

import { useState, useEffect } from "react"
import { createSupabaseClient } from "@/lib/supabase/client"
import { 
  ShieldCheck, 
  Eye, 
  CheckCircle2, 
  FileText, 
  Calendar,
  Clock,
  Search,
  Filter,
  ArrowRight,
} from "lucide-react"
// FIX: Removed curly braces for default import
import CredentialInspectorModal from "@/components/vault/credential-inspector-modal"

export default function CredentialReviewPage() {
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseClient()

  useEffect(() => {
    async function fetchQueue() {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data: membership } = await supabase
        .from("org_members")
        .select("organization_id")
        .eq("user_id", user?.id)
        .single()

      if (membership) {
        const { data } = await supabase
          .from("org_credentials")
          .select("*")
          .eq("organization_id", membership.organization_id)
          .eq("verification_status", "pending")
          .order("created_at", { ascending: false })
        
        setDocs(data || [])
      }
      setLoading(false)
    }
    fetchQueue()
  }, [selectedDoc]) 

  // Helper to map DB Document -> Modal Credential format
  const getModalData = (doc: any) => {
    if (!doc) return null;
    return {
      id: doc.id,
      title: doc.document_type || "Untitled Document",
      username: `ID: ${doc.user_id}`,
      // Documents don't have secrets, so we leave this undefined
      secret: "", 
      category: "certificate",
      notes: doc.notes || "No additional notes.",
      updated_at: doc.created_at,
      expiry_date: doc.expiry_date,
      status: doc.verification_status,
      file_path: doc.file_path
    };
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* FIX: Transform data before passing to modal */}
      <CredentialInspectorModal 
        isOpen={!!selectedDoc} 
        onClose={() => setSelectedDoc(null)} 
        credential={getModalData(selectedDoc)} 
      />

      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">Verification Queue</h1>
          <p className="text-slate-400 font-medium mt-1 tracking-tight">
            Audit and approve employee professional credentials for organizational compliance.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-sky-500/10 px-4 py-2 rounded-full border border-sky-400/30 shadow-sm">
            <Clock className="h-3.5 w-3.5 text-sky-300" />
            <span className="text-[10px] font-black text-sky-300 uppercase tracking-widest">
                {docs.length} Items Awaiting Review
            </span>
        </div>
      </header>

      {/* Intelligence Toolbar */}
      <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10 shadow-sm">
         <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
                placeholder="Search by personnel ID or document type..." 
                className="w-full pl-12 pr-4 py-2.5 text-xs font-bold outline-none bg-transparent"
            />
         </div>
         <div className="h-6 w-px bg-white/10" />
         <button className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/10 rounded-xl transition-colors">
            <Filter className="h-4 w-4" />
            Filter
         </button>
      </div>

      {loading ? (
        <div className="py-24 text-center animate-pulse">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Vault Integrity...</p>
        </div>
      ) : docs.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-24 text-center shadow-sm">
            <div className="h-20 w-20 bg-emerald-400/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-emerald-400/30 shadow-inner">
                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </div>
            <h3 className="text-xl font-black text-slate-100 tracking-tight">Vault Fully Verified</h3>
            <p className="text-sm text-slate-400 mt-2 font-medium">All staff credentials have been audited and secured against organizational standards.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {docs.map((doc) => (
            <div 
                key={doc.id} 
                className="group bg-white/5 border border-white/10 rounded-[2.5rem] p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-sm hover:border-white/10 transition-all duration-300"
            >
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 rounded-[1.25rem] bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 group-hover:bg-white/10 group-hover:text-slate-100 transition-all duration-500">
                  <FileText className="h-7 w-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-slate-100 tracking-tight">{doc.document_type}</p>
                    <span className="px-2 py-0.5 bg-sky-500/10 text-sky-300 rounded-md text-[9px] font-black uppercase tracking-tighter border border-sky-400/30">
                        Intake Node: USR-{doc.user_id.slice(0, 8)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                     <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <Calendar className="h-3.5 w-3.5" />
                        Expires: {doc.expiry_date || "Continuous"}
                     </div>
                     <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <Activity className="h-3.5 w-3.5" />
                        Submitted: {new Date(doc.created_at).toLocaleDateString()}
                     </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedDoc(doc)}
                  className="flex items-center gap-2 px-8 py-4 bg-white/10 text-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all shadow-xl active:scale-95"
                >
                  <Eye className="h-4 w-4" />
                  Inspect & Verify
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="bg-white/10 rounded-[2.5rem] p-10 text-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="flex items-start gap-6 relative z-10">
            <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-blue-400 border border-white/10 backdrop-blur-md">
                <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="max-w-xl">
                <h4 className="text-sm font-black uppercase tracking-[0.2em] text-blue-400">Non-Repudiation Policy</h4>
                <p className="text-xs text-slate-400 mt-3 leading-relaxed font-bold uppercase tracking-widest">
                    By verifying a document, you confirm that you have visually inspected the credential and matched it against staff data. This action is permanently cryptographically tethered to your employer session.
                </p>
            </div>
          </div>
      </div>
    </div>
  )
}

function Activity({ className }: { className?: string }) {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
    )
}
