"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import { Trash2, Loader2 } from "lucide-react"
import { logActivity } from "@/lib/actions/audit"

type DeleteButtonProps = {
  id: string
  tableName: 'org_policies' | 'org_registers' | 'org_tasks'
  onDelete?: () => void
}

export function DeleteButton({ id, tableName, onDelete }: DeleteButtonProps) {
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    
    // 1. Execute the deletion
    const { error } = await supabase.from(tableName).delete().eq('id', id)

    if (error) {
      alert("Error deleting item: " + error.message)
      setLoading(false)
    } else {
      // 2. Trigger the Automated Audit Log (Objective A/C)
      // Converts 'org_policies' -> 'POLICY'
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

      // 3. Update UI
      setConfirm(false)
      if (onDelete) onDelete()
      router.refresh()
    }
  }

  if (confirm) {
    return (
      <div className="flex items-center gap-3 bg-red-50 px-2 py-1 rounded-md border border-red-100">
        <button 
          onClick={() => setConfirm(false)}
          className="text-[10px] font-bold uppercase text-slate-400 hover:text-slate-300 transition-colors"
        >
          Cancel
        </button>
        <div className="h-3 w-[1px] bg-red-200" />
        <button 
          onClick={handleDelete}
          disabled={loading}
          className="text-[10px] font-bold uppercase text-red-600 hover:text-red-800 flex items-center gap-1.5 transition-colors"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
          Confirm Delete
        </button>
      </div>
    )
  }

  return (
    <button 
      onClick={() => setConfirm(true)}
      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
      title="Delete record"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}