"use client"

import { useState, useRef, useEffect } from "react"
import { uploadEvidence } from "@/app/app/actions/evidence"
import { FileUp, Loader2, CheckCircle2, Upload, Shield } from "lucide-react"
import { useComplianceAction } from "@/components/compliance-system"

/**
 * =========================================================
 * EVIDENCE BUTTON
 * Node Type: Evidence (violet)
 * Wire: Control → Evidence (dotted teal)
 * =========================================================
 * 
 * This button creates Evidence nodes in the compliance graph
 * and links them to the parent Control (task).
 */
export function EvidenceButton({ taskId, taskTitle }: { taskId: string, taskTitle: string }) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { evidenceAdded, nodesLinked, reportError } = useComplianceAction()

  // Reset success state after animation
  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [showSuccess])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = e.target.files?.[0]
      if (!file) return
      
      setUploading(true)
      setUploadProgress(0)

      // Simulate progress for better UX (actual upload is via server action)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 150)

      // Upload via server action (handles storage + audit)
      const formData = new FormData()
      formData.append("taskId", taskId)
      formData.append("file", file)

      await uploadEvidence(formData)
      
      clearInterval(progressInterval)
      setUploadProgress(100)

      // Show success state
      setShowSuccess(true)

      // Report to compliance system
      evidenceAdded(file.name, taskTitle)
      
      // Also report the link
      nodesLinked("control", taskTitle, "evidence", file.name)

    } catch (error: any) {
      reportError(`Failed to upload evidence: ${error.message}`)
    } finally {
      setUploading(false)
      setUploadProgress(0)
      // Reset input so same file can be uploaded again if needed
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  // Success state
  if (showSuccess) {
    return (
      <div className="flex items-center gap-1.5 text-emerald-300 animate-in fade-in slide-in-from-left-1 duration-300">
        <div className="h-6 w-6 rounded-full bg-emerald-400/20 flex items-center justify-center border border-emerald-400/40">
          <CheckCircle2 className="h-3.5 w-3.5" />
        </div>
        <span className="text-xs font-bold">Evidence Linked!</span>
      </div>
    )
  }

  // Uploading state with progress
  if (uploading) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative h-6 w-6">
          <div className="absolute inset-0 rounded-full border-2 border-violet-400/30" />
          <svg className="absolute inset-0 h-6 w-6 -rotate-90">
            <circle
              cx="12"
              cy="12"
              r="10"
              fill="none"
              stroke="hsl(var(--node-evidence))"
              strokeWidth="2"
              strokeDasharray={`${uploadProgress * 0.63} 100`}
              className="transition-all duration-150"
            />
          </svg>
          <Loader2 className="absolute inset-0.5 h-5 w-5 animate-spin text-violet-300" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-violet-200">
            {uploadProgress < 100 ? 'Uploading...' : 'Processing...'}
          </span>
          <span className="text-[10px] text-slate-400">{uploadProgress}%</span>
        </div>
      </div>
    )
  }

  // Default state
  return (
    <div className="group/evidence flex items-center">
      <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-violet-400/30 bg-violet-400/5 text-violet-300 hover:border-violet-400/50 hover:bg-violet-400/10 transition-all active:scale-[0.98]">
        <Upload className="h-3.5 w-3.5 group-hover/evidence:animate-bounce" />
        <span className="text-xs font-bold">Link Evidence</span>
        <input 
          ref={inputRef}
          type="file" 
          className="hidden" 
          onChange={handleUpload} 
          disabled={uploading}
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
        />
      </label>
    </div>
  )
}
