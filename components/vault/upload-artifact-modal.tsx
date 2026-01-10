"use client"

import { useState } from "react"
import { createSupabaseClient } from "@/lib/supabase/client"
import { registerVaultArtifact } from "@/app/app/actions/vault"
import { 
  FileUp, 
  Loader2, 
  X, 
  ShieldCheck, 
  FileText,
  AlertCircle
} from "lucide-react"

export function UploadArtifactModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [uploading, setUploading] = useState(false)
  const supabase = createSupabaseClient()

  if (!isOpen) return null

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setUploading(true)
    try {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth?.user?.id) throw new Error("Unauthorized")

      const { data: membership, error: membershipError } = await supabase
        .from("org_members")
        .select("organization_id")
        .eq("user_id", auth.user.id)
        .maybeSingle()

      if (membershipError || !membership?.organization_id) {
        throw new Error("Organization context missing")
      }

      // 1. Upload Binary to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${membership.organization_id}/vault/${fileName}`

      const { error: storageError } = await supabase.storage
        .from('evidence')
        .upload(filePath, file)

      if (storageError) throw storageError

      // 2. Register Artifact in Database via Server Action
      await registerVaultArtifact({
        title: title || file.name,
        filePath: filePath,
        fileType: fileExt || 'unknown',
        fileSize: file.size
      })

      onClose()
      setFile(null)
      setTitle("")
    } catch (error: any) {
      alert(`Upload failed: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white/10 rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/10">
          <h3 className="font-bold text-slate-100">Upload Evidence Artifact</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleUpload} className="p-6 space-y-6">
          {/* File Dropzone */}
          <div className="group relative border-2 border-dashed border-white/10 rounded-2xl p-8 transition-all hover:border-white/20 hover:bg-white/10 flex flex-col items-center justify-center text-center">
            <input 
              type="file" 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="absolute inset-0 opacity-0 cursor-pointer" 
            />
            {file ? (
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-xl bg-sky-500/10 text-blue-600 flex items-center justify-center mb-2">
                  <FileText className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-slate-100 truncate max-w-[200px]">{file.name}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">Ready to Secure</p>
              </div>
            ) : (
              <>
                <FileUp className="h-8 w-8 text-slate-400 mb-3 group-hover:text-slate-100 transition-colors" />
                <p className="text-sm font-bold text-slate-100">Drop artifact here</p>
                <p className="text-xs text-slate-400 mt-1">PDF, JPG, or PNG (Max 10MB)</p>
              </>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Artifact Label</label>
            <input 
              placeholder="e.g. Annual Fire Safety Certificate 2025"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-4 rounded-xl border border-white/10 bg-white/10 focus:bg-white/10 focus:outline-black text-sm transition-all"
            />
          </div>

          <button 
            type="submit" 
            disabled={!file || uploading}
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white p-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 transition-all disabled:opacity-50 shadow-md"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Securing Artifact...
              </>
            ) : (
              "Upload to Vault"
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
