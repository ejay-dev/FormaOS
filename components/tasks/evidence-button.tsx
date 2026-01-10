"use client"

import { useState } from "react"
import { uploadEvidence } from "@/app/app/actions/evidence"
import { FileUp, Loader2, CheckCircle2 } from "lucide-react"

export function EvidenceButton({ taskId, taskTitle }: { taskId: string, taskTitle: string }) {
  const [uploading, setUploading] = useState(false)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = e.target.files?.[0]
      if (!file) return
      
      setUploading(true)

      // Upload via server action (handles storage + audit)
      const formData = new FormData()
      formData.append("taskId", taskId)
      formData.append("file", file)

      await uploadEvidence(formData)
      alert("Evidence linked successfully!")

    } catch (error: any) {
      alert(error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center">
      <label className="cursor-pointer flex items-center gap-1.5 text-slate-400 hover:text-slate-100 transition-colors">
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin text-sky-300" />
        ) : (
          <FileUp className="h-4 w-4" />
        )}
        <span className="text-xs font-bold italic underline decoration-dotted">
            {uploading ? "Uploading..." : "Link Proof"}
        </span>
        <input 
          type="file" 
          className="hidden" 
          onChange={handleUpload} 
          disabled={uploading}
          accept=".pdf,.jpg,.jpeg,.png"
        />
      </label>
    </div>
  )
}
