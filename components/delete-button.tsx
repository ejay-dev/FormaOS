"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseClient } from "@/lib/supabase/client"
import { Trash2, Loader2, AlertTriangle, X } from "lucide-react"
import { logActivity } from "@/lib/actions/audit"
import { useComplianceAction, type NodeType } from "@/components/compliance-system"

/**
 * =========================================================
 * DELETE BUTTON
 * Action: Removes node from compliance graph
 * Shows system impact warning before deletion
 * =========================================================
 */

type DeleteButtonProps = {
  id: string
  tableName: 'org_policies' | 'org_registers' | 'org_tasks'
  itemTitle?: string
  onDelete?: () => void
}

// Map table names to node types
const tableToNodeType: Record<string, NodeType> = {
  'org_policies': 'policy',
  'org_registers': 'control',
  'org_tasks': 'task',
}

const tableToLabel: Record<string, string> = {
  'org_policies': 'Policy',
  'org_registers': 'Control',
  'org_tasks': 'Task',
}

export function DeleteButton({ id, tableName, itemTitle, onDelete }: DeleteButtonProps) {
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const router = useRouter()
  const { nodeDeleted, reportError } = useComplianceAction()

  const nodeType = tableToNodeType[tableName] || 'entity'
  const nodeLabel = tableToLabel[tableName] || 'Record'

  async function handleDelete() {
    setLoading(true)
    
    // 1. Execute the deletion
    const supabase = createSupabaseClient()
    const { error } = await supabase.from(tableName).delete().eq('id', id)

    if (error) {
      reportError(`Failed to delete ${nodeLabel.toLowerCase()}: ${error.message}`)
      setLoading(false)
      setConfirm(false)
      return
    }
    
    // 2. Trigger the Automated Audit Log
    const recordType = tableName.split('_')[1].replace(/s$/, '').toUpperCase(); 
    
    try {
      await logActivity({
        type: `${recordType}_DELETE`,
        description: `User permanently deleted ${recordType.toLowerCase()} record: ${id.slice(0, 8)}`,
        metadata: { record_id: id, source_table: tableName }
      });
    } catch (auditError) {
      console.error("Audit log failed, but record was deleted:", auditError);
    }

    // 3. Report to compliance system
    nodeDeleted(nodeType, itemTitle || `${nodeLabel} ${id.slice(0, 8)}`)

    // 4. Update UI
    setConfirm(false)
    setLoading(false)
    if (onDelete) onDelete()
    router.refresh()
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-2 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/30 animate-in fade-in slide-in-from-right-2 duration-200">
        <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
        <span className="text-[10px] font-medium text-rose-300 hidden sm:inline">
          This will disconnect all linked nodes
        </span>
        <button 
          onClick={() => setConfirm(false)}
          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-white/10 rounded transition-colors"
          title="Cancel"
        >
          <X className="h-3.5 w-3.5" />
        </button>
        <div className="h-4 w-px bg-rose-500/30" />
        <button 
          onClick={handleDelete}
          disabled={loading}
          className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase text-rose-300 hover:text-white hover:bg-rose-500/20 rounded transition-all disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
          Delete
        </button>
      </div>
    )
  }

  return (
    <button 
      onClick={() => setConfirm(true)}
      className="group p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg border border-transparent hover:border-rose-500/20 transition-all active:scale-95"
      title={`Delete ${nodeLabel.toLowerCase()}`}
    >
      <Trash2 className="h-4 w-4 group-hover:animate-pulse" />
    </button>
  )
}
