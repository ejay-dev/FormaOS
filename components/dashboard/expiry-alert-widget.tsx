"use client"

import { AlertCircle, Calendar, ArrowRight, User } from "lucide-react"
import Link from "next/link"

export function ExpiryAlertWidget({ atRiskDocs }: { atRiskDocs: any[] }) {
  if (atRiskDocs.length === 0) return null;

  return (
    <div className="bg-amber-400/10 border border-amber-400/30 rounded-[2.5rem] p-8 space-y-6 shadow-sm animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-amber-300">
            <AlertCircle className="h-5 w-5" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Expiring Credentials</h3>
        </div>
        <span className="bg-amber-400/10 text-amber-300 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
            {atRiskDocs.length} At Risk
        </span>
      </div>

      <div className="space-y-3">
        {atRiskDocs.map((doc) => (
          <div key={doc.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border border-amber-400/30/50 group hover:bg-white/10 transition-all">
            <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-amber-400/10 flex items-center justify-center text-amber-300">
                    <User className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-xs font-black text-slate-100">{doc.document_type}</p>
                    <p className="text-[10px] font-bold text-amber-300 uppercase tracking-tighter mt-0.5">
                        Expiring: {new Date(doc.expiry_date).toLocaleDateString()}
                    </p>
                </div>
            </div>
            <Link href={`/app/people`} className="p-2 text-slate-400 hover:text-slate-100 transition-colors">
                <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ))}
      </div>

      <p className="text-[9px] text-amber-300 font-bold uppercase tracking-widest text-center pt-2">
        System Notice: Impacted personnel have been notified.
      </p>
    </div>
  )
}