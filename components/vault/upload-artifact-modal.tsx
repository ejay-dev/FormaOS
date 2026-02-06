"use client"

import { useState, useEffect } from "react"
import { createSupabaseClient } from "@/lib/supabase/client"
import { registerVaultArtifact } from "@/app/app/actions/vault"
import { 
  FileUp, 
  Loader2, 
  X, 
  ShieldCheck, 
  FileText,
  CheckCircle2
} from "lucide-react"
import { useComplianceAction } from "@/components/compliance-system"

/**
 * =========================================================
 * UPLOAD ARTIFACT MODAL
 * Node Type: Evidence (violet)
 * Creates a new evidence node in the compliance graph
 * =========================================================
 */

export function UploadArtifactModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [success, setSuccess] = useState(false)
  const supabase = createSupabaseClient()
  const { evidenceAdded, reportError } = useComplianceAction()

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFile(null)
      setTitle("")
      setSuccess(false)
      setUploadProgress(0)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setUploading(true)
    setUploadProgress(0)
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 85) {
          clearInterval(progressInterval)
          return 85
        }
        return prev + 5
      })
    }, 100)

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
      
      setUploadProgress(95)

      // 2. Register Artifact in Database via Server Action
      const artifactTitle = title || file.name
      await registerVaultArtifact({
        title: artifactTitle,
        filePath: filePath,
        fileType: fileExt || 'unknown',
        fileSize: file.size
      })

      clearInterval(progressInterval)
      setUploadProgress(100)
      
      // Show success state
      setSuccess(true)
      
      // Report to compliance system
      evidenceAdded(artifactTitle)
      
      // Close after animation
      setTimeout(() => {
        onClose()
      }, 1500)
      
    } catch (error: any) {
      clearInterval(progressInterval)
      reportError({ title: "Upload failed", message: error.message || "Unknown error" })
    } finally {
      setUploading(false)
    }
  }

  // Success state
  if (success) {
    return (
      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden p-10 sm:p-12 flex flex-col items-center justify-center animate-in zoom-in-95">
          <div className="h-20 w-20 rounded-full bg-violet-400/20 flex items-center justify-center mb-4 border-2 border-violet-400/40">
            <CheckCircle2 className="h-10 w-10 text-violet-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-100">Evidence Secured</h3>
          <p className="text-sm text-slate-400 mt-2 text-center">
            New evidence node added to your compliance graph
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-violet-400/20 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-violet-400" />
            </div>
            <h3 className="font-bold text-slate-100">Upload Evidence Artifact</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleUpload} className="p-6 space-y-6">
          {/* File Dropzone */}
          <div className="group relative border-2 border-dashed border-violet-400/30 rounded-2xl p-8 transition-all hover:border-violet-400/50 hover:bg-violet-400/5 flex flex-col items-center justify-center text-center">
            <input 
              type="file" 
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="absolute inset-0 opacity-0 cursor-pointer" 
            />
            {file ? (
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center mb-2 border border-violet-400/30">
                  <FileText className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-slate-100 truncate max-w-[200px]">{file.name}</p>
                <p className="text-[10px] text-violet-300 uppercase font-bold mt-1">Ready to Secure</p>
              </div>
            ) : (
              <>
                <FileUp className="h-8 w-8 text-violet-400/50 mb-3 group-hover:text-violet-400 transition-colors" />
                <p className="text-sm font-bold text-slate-100">Drop artifact here</p>
                <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG, DOC, XLS (Max 10MB)</p>
              </>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1">Artifact Label</label>
            <input 
              placeholder="e.g. Annual Fire Safety Certificate 2025"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-4 rounded-xl border border-white/10 bg-white/5 focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/20 text-sm transition-all outline-none"
            />
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-violet-300 font-medium">Securing artifact...</span>
                <span className="text-slate-400">{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={!file || uploading}
            className="w-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white p-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50 shadow-[0_10px_30px_rgba(139,92,246,0.35)] active:scale-[0.98]"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Securing Artifact...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                Upload to Vault
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
