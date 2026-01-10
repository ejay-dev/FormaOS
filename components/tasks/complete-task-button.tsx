"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { CheckCircle2, Circle, Loader2 } from "lucide-react"
import { fetchRequiredNonCompliantCount } from "@/app/app/actions/control-evaluations"

export function CompleteTaskButton({ taskId, initialStatus }: { taskId: string, initialStatus: string }) {
  const [loading, setLoading] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const router = useRouter()
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
    if (isCompleted || blocked) return // Don't do anything if already done or blocked
    
    setLoading(true)
    const { error } = await supabase
      .from('org_tasks')
      .update({ status: 'completed' })
      .eq('id', taskId)

    if (error) {
      alert("Error updating task: " + error.message)
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <button 
      onClick={toggleStatus}
      disabled={loading || isCompleted || blocked}
      className={`group transition-all ${isCompleted ? 'cursor-default' : 'cursor-pointer'}`}
      title={blocked ? "Task completion blocked by non-compliant controls." : undefined}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      ) : isCompleted ? (
        <CheckCircle2 className="h-5 w-5 text-green-500 shadow-sm rounded-full" />
      ) : (
        <Circle className={`h-5 w-5 ${blocked ? 'text-slate-400' : 'text-slate-400 group-hover:text-slate-100'} transition-colors`} />
      )}
    </button>
  )
}
