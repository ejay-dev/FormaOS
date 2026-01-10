"use client"

import { useState } from "react"
import { createPolicy } from "@/app/app/policies/actions" // ✅ Using the secure Server Action
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetFooter } from "@/components/ui/sheet"
import { Plus, Loader2, FileText, ShieldCheck } from "lucide-react"

export function CreatePolicySheet() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    try {
        // The Server Action handles all DB logic, Auth, and ID generation
        await createPolicy(formData)
        setOpen(false) // Close modal on success
    } catch (error: any) {
        alert("Failed to create policy: " + error.message)
    } finally {
        setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:brightness-110 transition-colors shadow-sm">
            <Plus className="h-4 w-4" />
            New Policy
        </button>
      </SheetTrigger>
      
      <SheetContent side="right" className="sm:max-w-md">
        <form action={handleSubmit} className="flex flex-col h-full">
          <SheetHeader className="mb-6">
            <SheetTitle>Draft New Policy</SheetTitle>
            <SheetDescription>Start a new governance document for your organization.</SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-6">
            {/* Title Field */}
            <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Policy Title</label>
                <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input 
                        name="title" 
                        required 
                        placeholder="e.g. Data Retention Policy" 
                        className="w-full pl-10 p-3 rounded-xl border border-white/10 text-sm outline-none focus:border-white/20 transition-colors" 
                    />
                </div>
                <p className="text-[10px] text-slate-400">This will be the official name of the document.</p>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-white/10 rounded-xl border border-white/10 flex gap-3">
                <ShieldCheck className="h-5 w-5 text-slate-400" />
                <div>
                    <h4 className="text-xs font-bold text-slate-100">Automatic Versioning</h4>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        FormaOS will automatically assign a version number (v0.1) and set the status to "Draft" until you are ready to publish.
                    </p>
                </div>
            </div>
          </div>

          <SheetFooter className="border-t pt-4 mt-auto">
            <button 
                disabled={loading} 
                className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-70 transition-all"
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Draft"}
            </button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}