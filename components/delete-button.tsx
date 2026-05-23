"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseClient } from "@/lib/supabase/client"
import { Trash2, Loader2 } from "lucide-react"
import { logActivity } from "@/lib/actions/audit"
import { useComplianceAction, type NodeType } from "@/components/compliance-system"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

/**
 * =========================================================
 * DELETE BUTTON
 * Action: Removes node from compliance graph.
 *
 * Audit 2026-05-23 (Sprint 4c Phase 1): migrated from inline
 * confirm card to AlertDialog. The previous implementation had
 * no focus trap, no ESC handler, no aria-modal, and rendered
 * confirmation as a sibling element. AlertDialog gives all of
 * those for free.
 * =========================================================
 */

type DeleteButtonProps = {
  id: string
  tableName: 'org_policies' | 'org_registers' | 'org_tasks'
  itemTitle?: string
  onDelete?: () => void
}

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
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { nodeDeleted, reportError } = useComplianceAction()

  const nodeType = tableToNodeType[tableName] || 'entity'
  const nodeLabel = tableToLabel[tableName] || 'Record'
  const displayTitle = itemTitle || `${nodeLabel} ${id.slice(0, 8)}`

  async function handleDelete(event: React.MouseEvent) {
    // Stop the AlertDialog default close so the spinner has time to render.
    event.preventDefault()
    setLoading(true)

    const supabase = createSupabaseClient()
    const { error } = await supabase.from(tableName).delete().eq('id', id)

    if (error) {
      reportError({
        title: "Delete failed",
        message: `Failed to delete ${nodeLabel.toLowerCase()}: ${error.message}`,
      })
      setLoading(false)
      return
    }

    const recordType = tableName.split('_')[1].replace(/s$/, '').toUpperCase()

    try {
      await logActivity({
        type: `${recordType}_DELETE`,
        description: `User permanently deleted ${recordType.toLowerCase()} record: ${id.slice(0, 8)}`,
        metadata: { record_id: id, source_table: tableName },
      })
    } catch (auditError) {
      console.error("Audit log failed, but record was deleted:", auditError)
    }

    nodeDeleted(nodeType, displayTitle)

    setLoading(false)
    setOpen(false)
    if (onDelete) onDelete()
    router.refresh()
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button
          className="group p-2 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 rounded-lg border border-transparent hover:border-rose-500/20 transition-all motion-safe:active:scale-95"
          title={`Delete ${nodeLabel.toLowerCase()}`}
        >
          <Trash2 className="h-4 w-4 group-hover:animate-pulse" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {nodeLabel.toLowerCase()}?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="block text-slate-300">{displayTitle}</span>
            <span className="mt-2 block">
              This will disconnect all linked nodes. The deletion is permanent
              and will be recorded in the audit log.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete {nodeLabel.toLowerCase()}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
