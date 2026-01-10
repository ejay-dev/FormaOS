"use client"

import { useState } from "react"
import { uploadEvidence } from "@/app/app/actions/evidence"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet"
import { Paperclip, UploadCloud, FileText, Loader2, Download } from "lucide-react"
import { useRouter } from "next/navigation"

export function EvidenceSheet({ task, evidenceCount = 0 }: { task: any, evidenceCount: number }) {
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const router = useRouter()

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    
    setUploading(true)
    const formData = new FormData()
    formData.append("taskId", task.id)
    formData.append("file", e.target.files[0])

    try {
      await uploadEvidence(formData)
      router.refresh()
      // Optional: Add a success toast here
    } catch (error) {
      alert("Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className={`flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-1 rounded-md transition-colors ${evidenceCount > 0 ? 'bg-purple-500/10 text-purple-300' : 'text-slate-400 hover:text-slate-400 hover:bg-white/10'}`}>
          <Paperclip className="h-3 w-3" />
          {evidenceCount > 0 ? `${evidenceCount} Files` : 'Attach'}
        </button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Evidence Vault</SheetTitle>
          <SheetDescription>Upload proof of compliance for "{task.title}".</SheetDescription>
        </SheetHeader>

        <div className="mt-8 space-y-6">
          {/* Upload Box */}
          <div className="border-2 border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center bg-white/10 hover:bg-white/10 hover:border-purple-400/30 transition-all group relative">
            <input 
              type="file" 
              onChange={handleUpload}
              disabled={uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            {uploading ? (
              <Loader2 className="h-8 w-8 text-purple-300 animate-spin mb-2" />
            ) : (
              <UploadCloud className="h-8 w-8 text-slate-400 group-hover:text-purple-300 transition-colors mb-2" />
            )}
            <p className="text-sm font-medium text-slate-100">
              {uploading ? "Securing file..." : "Click to Upload Evidence"}
            </p>
            <p className="text-xs text-slate-400 mt-1">Supports PDF, JPG, PNG (Max 10MB)</p>
          </div>

          {/* List of Files */}
          <div className="space-y-3">
             <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Attached Files</h4>
             {/* Note: In a real app, pass the list of evidence as a prop. For now, we just show the upload UI. */}
             {evidenceCount === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm italic">
                    No evidence attached yet.
                </div>
             )}
             {/* If we had the list passed down, we would map it here: */}
             {/* task.evidence?.map(file => <FileRow key={file.id} file={file} />) */}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
