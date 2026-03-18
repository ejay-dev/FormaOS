"use client"

import { useState } from "react"
import { Loader2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useComplianceAction } from "@/components/compliance-system"

interface AddNoteFormProps {
  orgId: string
}

/**
 * AddNoteForm - Client-side admin note submission
 * 
 * Replaces native form POST with fetch + proper loading states.
 * Uses compliance feedback system for success/error notifications.
 */
export function AddNoteForm({ orgId }: AddNoteFormProps) {
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState("")
  const { reportSuccess, reportError } = useComplianceAction()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!note.trim()) return

    setLoading(true)

    try {
      const res = await fetch(`/api/admin/orgs/${orgId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to add note")
      }

      reportSuccess({ title: "Note added", message: "Internal note saved" })
      setNote("")
      window.location.reload()
    } catch (error: any) {
      reportError({ title: "Failed to add note", message: error.message || "Could not save note" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex gap-3">
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note for the team"
        disabled={loading}
        className={cn(
          "flex-1 rounded-lg border border-white/10 bg-[hsl(var(--card))] px-3 py-2 text-sm text-slate-200",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "focus:border-white/20 focus:outline-none focus:ring-2 focus:ring-white/5"
        )}
        required
      />
      <button
        type="submit"
        disabled={loading || !note.trim()}
        className={cn(
          "rounded-lg border border-white/10 px-4 py-2 text-sm font-bold",
          "text-slate-200 hover:bg-white/5 transition-all",
          "flex items-center gap-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "active:scale-95 disabled:active:scale-100"
        )}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        Add note
      </button>
    </form>
  )
}
