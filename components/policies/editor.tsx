"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Link from "@tiptap/extension-link"
import { useState } from "react"
import { Save, Loader2, Bold, Italic, Heading1, Heading2, CheckCircle2 } from "lucide-react"
import { useComplianceAction } from "@/components/compliance-system"

/**
 * =========================================================
 * POLICY EDITOR
 * Node Type: Policy (cyan)
 * Updates policy content in the compliance graph
 * =========================================================
 */

export function PolicyEditor({
  initialContent,
  policyId,
  title,
}: {
  initialContent: string
  policyId: string
  title: string
}) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const { nodeUpdated, reportError } = useComplianceAction()

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-blue-600 underline" },
      }),
      Placeholder.configure({
        placeholder: "Start drafting your compliance control...",
      }),
    ],
    content: initialContent || "",
    editorProps: {
      attributes: {
        class: "prose prose-neutral focus:outline-none min-h-[360px] sm:min-h-[600px] max-w-none p-4",
      },
    },
  })

  const handleSave = async () => {
    if (!editor) return
    setIsSaving(true)

    try {
      const html = editor.getHTML()

      const res = await fetch("/api/policies/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyId,
          html,
          title,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || "Failed to save policy")
      }

      setLastSaved(new Date())
      setShowSuccess(true)
      
      // Report to compliance system
      nodeUpdated("policy", title)
      
      // Reset success state
      setTimeout(() => setShowSuccess(false), 2000)
    } catch (error: any) {
      console.error("Save Error:", error)
      reportError({ title: "Sync failed", message: error.message || "Unknown error" })
    } finally {
      setIsSaving(false)
    }
  }

  if (!editor) return null

  return (
    <div className="flex flex-col h-full bg-white/10 rounded-3xl border border-white/10 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 bg-white/10 p-3">
        <div className="flex flex-wrap items-center gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            icon={<Bold className="h-4 w-4" />}
            label="Bold"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            icon={<Italic className="h-4 w-4" />}
            label="Italic"
          />
          <div className="w-[1px] h-4 bg-white/10 mx-1" />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor.isActive("heading", { level: 1 })}
            icon={<Heading1 className="h-4 w-4" />}
            label="H1"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            icon={<Heading2 className="h-4 w-4" />}
            label="H2"
          />
        </div>

        <div className="flex items-center gap-3">
          {lastSaved && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-400/10 text-emerald-300 rounded-md border border-emerald-400/30 animate-in fade-in">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-tight">
                Synced
              </span>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 disabled:opacity-50 transition-all shadow-md active:scale-95"
          >
            {isSaving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Save className="h-3 w-3" />
            )}
            Save
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white/10 p-6 md:p-12">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

function ToolbarButton({
  onClick,
  active,
  icon,
  label,
}: {
  onClick: () => void
  active: boolean
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`p-2 rounded-lg transition-all flex items-center justify-center ${
        active
          ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-inner scale-95"
          : "text-slate-400 hover:bg-white/10 hover:text-slate-100"
      }`}
    >
      {icon}
    </button>
  )
}
