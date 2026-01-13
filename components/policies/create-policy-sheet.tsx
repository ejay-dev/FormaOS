"use client"

import { useState } from "react"
import { createPolicy } from "@/app/app/policies/actions"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetFooter } from "@/components/ui/sheet"
import { Plus, Loader2, FileText, ShieldCheck, CheckCircle2 } from "lucide-react"
import { useComplianceAction } from "@/components/compliance-system"

/**
 * =========================================================
 * CREATE POLICY SHEET
 * Node Type: Policy (cyan)
 * Creates a new policy node in the compliance graph
 * =========================================================
 */

export function CreatePolicySheet() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { nodeCreated, reportError } = useComplianceAction()

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    try {
        const title = formData.get("title") as string
        
        // The Server Action handles all DB logic, Auth, and ID generation
        await createPolicy(formData)
        
        // Show success state
        setSuccess(true)
        
        // Report to compliance system
        nodeCreated("policy", title)
        
        // Close after animation
        setTimeout(() => {
          setOpen(false)
          setSuccess(false)
        }, 1000)
        
    } catch (error: any) {
        reportError(`Failed to create policy: ${error.message}`)
    } finally {
        setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) setSuccess(false)
    }}>
      <SheetTrigger asChild>
        <button className="group flex items-center gap-2 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:brightness-110 transition-all shadow-[0_10px_30px_rgba(6,182,212,0.35)] active:scale-[0.98]">
            <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
            New Policy
        </button>
      </SheetTrigger>
      
      <SheetContent side="right" className="sm:max-w-md">
        {success ? (
          <div className="flex flex-col items-center justify-center h-full animate-in fade-in zoom-in-95 duration-300">
            <div className="h-20 w-20 rounded-full bg-cyan-400/20 flex items-center justify-center mb-4 border-2 border-cyan-400/40">
              <CheckCircle2 className="h-10 w-10 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Policy Created</h3>
            <p className="text-sm text-slate-400 mt-2 text-center">
              New policy node added to your compliance graph
            </p>
          </div>
        ) : (
          <form action={handleSubmit} className="flex flex-col h-full">
            <SheetHeader className="mb-6">
              <SheetTitle className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-cyan-400/20 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-cyan-400" />
                </div>
                Draft New Policy
              </SheetTitle>
              <SheetDescription>
                Start a new governance document. This creates a Policy node.
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-6">
              {/* Title Field */}
              <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Policy Title</label>
                  <div className="relative">
                      <FileText className="absolute left-3 top-3 h-4 w-4 text-cyan-400/70" />
                      <input 
                          name="title" 
                          required 
                          placeholder="e.g. Data Retention Policy" 
                          className="w-full pl-10 p-3 rounded-xl border border-white/10 text-sm outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 transition-all" 
                      />
                  </div>
                  <p className="text-[10px] text-slate-400">This will be the official name of the document.</p>
              </div>

              {/* Info Box */}
              <div className="p-4 bg-cyan-400/5 rounded-xl border border-cyan-400/20 flex gap-3">
                  <ShieldCheck className="h-5 w-5 text-cyan-400 shrink-0" />
                  <div>
                      <h4 className="text-xs font-bold text-slate-100">Automatic Versioning</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                          FormaOS will automatically assign a version number (v0.1) and set the status to "Draft" until you are ready to publish.
                      </p>
                  </div>
              </div>

              {/* Graph Info */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex gap-3">
                  <div className="h-5 w-5 rounded-full bg-cyan-400/20 flex items-center justify-center shrink-0">
                    <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  </div>
                  <div>
                      <h4 className="text-xs font-bold text-slate-100">Compliance Graph</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                          Once created, you can link Controls and Evidence to this Policy to build your compliance graph.
                      </p>
                  </div>
              </div>
            </div>

            <SheetFooter className="border-t border-white/10 pt-4 mt-auto">
              <button 
                  disabled={loading} 
                  className="w-full py-3 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-70 transition-all shadow-[0_10px_30px_rgba(6,182,212,0.35)] active:scale-[0.98]"
              >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Creating Node...</span>
                    </>
                  ) : (
                    "Create Draft"
                  )}
              </button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}