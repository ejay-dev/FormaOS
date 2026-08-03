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
 * Deletion of a regulated record must be confirmed in an
 * AlertDialog, not an inline card: the dialog is what supplies
 * the focus trap, the ESC handler and aria-modal, so a keyboard
 * or screen-reader user cannot destroy a record they never
 * heard the warning for. Any other destructive control in the
 * app should follow this shape.
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
          type="button"
          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg border border-transparent hover:border-destructive/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-safe:active:scale-95"
          aria-label={`Delete ${nodeLabel.toLowerCase()}: ${displayTitle}`}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {nodeLabel.toLowerCase()}?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="block font-medium text-foreground">
              {displayTitle}
            </span>
            <span className="mt-2 block">
              Anything linked to this {nodeLabel.toLowerCase()} is disconnected.
              The deletion is permanent and is recorded in the audit log.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                Delete {nodeLabel.toLowerCase()}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
