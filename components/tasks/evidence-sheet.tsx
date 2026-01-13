"use client"

import { useState } from "react"
import { uploadEvidence } from "@/app/app/actions/evidence"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet"
import { Paperclip, UploadCloud, FileText, Loader2, Download, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useComplianceAction } from "@/components/compliance-system"

/**
 * =========================================================
 * EVIDENCE SHEET
 * Node Type: Evidence (violet)
 * Wire: Control → Evidence (dotted teal)
 * =========================================================
 */

export function EvidenceSheet({ task, evidenceCount = 0 }: { task: any, evidenceCount: number }) {
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const router = useRouter()
  const { evidenceAdded, nodesLinked, reportError } = useComplianceAction()

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    
    setUploading(true)
    const file = e.target.files[0]
    const formData = new FormData()
    formData.append("taskId", task.id)
    formData.append("file", file)

    try {
      await uploadEvidence(formData)
      
      // Show success state
      setShowSuccess(true)
      
      // Report to compliance system
      evidenceAdded(file.name, task.title)
      nodesLinked("control", task.title, "evidence", file.name)
      
      router.refresh()
      
      // Reset success state after animation
      setTimeout(() => setShowSuccess(false), 2000)
    } catch (error: any) {
      reportError(`Upload failed: ${error.message || 'Unknown error'}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className={`flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-1 rounded-md transition-all active:scale-95 ${evidenceCount > 0 ? 'bg-violet-500/10 text-violet-300 hover:bg-violet-500/20' : 'text-slate-400 hover:text-violet-300 hover:bg-violet-500/10'}`}>
          <Paperclip className="h-3 w-3" />
          {evidenceCount > 0 ? `${evidenceCount} Files` : 'Attach'}
        </button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-violet-400/20 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-violet-400" />
            </div>
            Evidence Vault
          </SheetTitle>
          <SheetDescription>Upload proof of compliance for "{task.title}".</SheetDescription>
        </SheetHeader>

        <div className="mt-8 space-y-6">
          {/* Upload Box */}
          <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all group relative ${
            showSuccess 
              ? 'border-emerald-400/50 bg-emerald-400/10' 
              : 'border-violet-400/30 bg-violet-400/5 hover:bg-violet-400/10 hover:border-violet-400/50'
          }`}>
            <input 
              type="file" 
              onChange={handleUpload}
              disabled={uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            {showSuccess ? (
              <>
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-2 animate-in zoom-in-50" />
                <p className="text-sm font-medium text-emerald-300">Evidence Secured!</p>
              </>
            ) : uploading ? (
              <>
                <Loader2 className="h-8 w-8 text-violet-300 animate-spin mb-2" />
                <p className="text-sm font-medium text-violet-300">Securing file...</p>
              </>
            ) : (
              <>
                <UploadCloud className="h-8 w-8 text-violet-400/50 group-hover:text-violet-300 transition-colors mb-2" />
                <p className="text-sm font-medium text-slate-100">Click to Upload Evidence</p>
                <p className="text-xs text-slate-400 mt-1">Supports PDF, JPG, PNG (Max 10MB)</p>
              </>
            )}
          </div>

          {/* List of Files */}
          <div className="space-y-3">
             <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
               <div className="h-1.5 w-1.5 rounded-full bg-violet-400" />
               Attached Evidence
             </h4>
             {evidenceCount === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm border border-dashed border-violet-400/20 rounded-xl bg-violet-400/5">
                    No evidence attached yet.
                </div>
             )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
