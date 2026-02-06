"use client"

import { useState, useEffect } from "react"
import { updatePolicyContent, publishPolicy } from "@/app/app/policies/actions"
import { Save, CheckCircle2, Loader2, ArrowLeft, Globe } from "lucide-react"
import { useRouter } from "next/navigation"

export function PolicyEditor({ policy }: { policy: any }) {
  const [content, setContent] = useState(policy.content || "")
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const router = useRouter()

  // Auto-save logic (Debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
        if (content !== policy.content) {
            setSaving(true)
            await updatePolicyContent(policy.id, content)
            setSaving(false)
        }
    }, 2000) // Save 2 seconds after stopping typing

    return () => clearTimeout(timer)
  }, [content, policy.id, policy.content])

  const handlePublish = async () => {
    if(!confirm("Are you sure? This will make the policy live for all employees.")) return;
    setPublishing(true)
    await publishPolicy(policy.id)
    setPublishing(false)
    router.refresh()
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-white/10 backdrop-blur-md border-b border-white/10 pb-4 mb-8 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <ArrowLeft className="h-5 w-5 text-slate-400" />
            </button>
            <div>
                <h1 className="text-xl font-bold text-slate-100">{policy.title}</h1>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <span>{policy.version}</span>
                    <span>•</span>
                    <span className="capitalize">{policy.status}</span>
                    <span>•</span>
                    <span>{saving ? "Saving..." : "Saved"}</span>
                </div>
            </div>
         </div>

         <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 mr-2 hidden sm:inline-block">
                Markdown Supported
            </span>
            {policy.status !== 'published' && (
                <button 
                    onClick={handlePublish}
                    disabled={publishing}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:brightness-110 transition-colors"
                >
                    {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                    Publish
                </button>
            )}
         </div>
      </div>

      {/* The Writing Area */}
      <div className="min-h-[60vh] md:min-h-screen bg-white/10 rounded-2xl border border-white/10 shadow-sm p-4 sm:p-6 md:p-12">
        <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="# Write your policy here..."
            className="w-full h-[60vh] md:h-[80vh] resize-none outline-none text-slate-100 leading-relaxed font-serif text-base md:text-lg placeholder:text-slate-400"
            spellCheck={false}
        />
      </div>
    </div>
  )
}
