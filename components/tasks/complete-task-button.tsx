"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseClient } from "@/lib/supabase/client"
import { CheckCircle2, Circle, Loader2, AlertTriangle } from "lucide-react"
import { fetchRequiredNonCompliantCount } from "@/app/app/actions/control-evaluations"
import { useComplianceAction } from "@/components/compliance-system"

/**
 * =========================================================
 * COMPLETE TASK BUTTON
 * Node Type: Task (emerald)
 * Wire: Task → Control (green loop back)
 * =========================================================
 * 
 * Completing a task updates the compliance graph by marking
 * the task node as verified and strengthening connected wires.
 */

export function CompleteTaskButton({ 
  taskId, 
  taskTitle,
  initialStatus 
}: { 
  taskId: string, 
  taskTitle?: string,
  initialStatus: string 
}) {
  const [loading, setLoading] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const router = useRouter()
  const { taskCompleted, reportError, reportWarning } = useComplianceAction()
  const isCompleted = initialStatus === 'completed'

  useEffect(() => {
    let mounted = true
    async function checkBlocks() {
      try {
        const count = await fetchRequiredNonCompliantCount()
        if (mounted) setBlocked(count > 0)
      } catch {
        if (mounted) setBlocked(false)
      }
    }
    checkBlocks()
    return () => {
      mounted = false
    }
  }, [])

  async function toggleStatus() {
    if (isCompleted) return
    
    if (blocked) {
      reportWarning({ title: "Cannot complete", message: "Non-compliant controls exist" })
      return
    }
    
    setLoading(true)
    const supabase = createSupabaseClient()
    const { error } = await supabase
      .from('org_tasks')
      .update({ status: 'completed' })
      .eq('id', taskId)

    if (error) {
      reportError({ title: "Completion failed", message: error.message })
    } else {
      // Show success animation
      setShowSuccess(true)
      
      // Report to compliance system
      taskCompleted(taskTitle || `Task ${taskId.slice(0, 8)}`)
      
      // Refresh after animation
      setTimeout(() => {
        router.refresh()
      }, 500)
    }
    setLoading(false)
  }

  // Success animation state
  if (showSuccess) {
    return (
      <div className="relative">
        <CheckCircle2 className="h-5 w-5 text-emerald-400 animate-in zoom-in-50 duration-300" />
        <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
      </div>
    )
  }

  return (
    <button 
      onClick={toggleStatus}
      disabled={loading || isCompleted}
      className={`group relative transition-all active:scale-95 ${
        isCompleted ? 'cursor-default' : blocked ? 'cursor-not-allowed' : 'cursor-pointer'
      }`}
      title={
        blocked 
          ? "Task completion blocked by non-compliant controls" 
          : isCompleted 
            ? "Task completed"
            : "Click to complete task"
      }
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
      ) : isCompleted ? (
        <div className="relative">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
        </div>
      ) : blocked ? (
        <div className="relative">
          <Circle className="h-5 w-5 text-slate-500" />
          <AlertTriangle className="absolute -top-1 -right-1 h-3 w-3 text-amber-400" />
        </div>
      ) : (
        <Circle className="h-5 w-5 text-slate-400 group-hover:text-emerald-400 group-hover:drop-shadow-[0_0_4px_rgba(52,211,153,0.4)] transition-all" />
      )}
    </button>
  )
}
