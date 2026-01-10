"use client"

import { useState } from "react"
import { createAsset } from "@/app/app/registers/actions" // ✅ Using the secure Server Action
import { Plus, Loader2, ShieldAlert, User, Laptop } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"

export function CreateAssetSheet() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    
    try {
      // The Server Action handles Auth, Validation, and DB Insertion
      await createAsset(formData) 
      setOpen(false) // Close only on success
    } catch (error: any) {
      alert("Failed to create asset: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 px-4 py-2 text-sm font-bold text-white hover:brightness-110 transition-all shadow-sm">
          <Plus className="h-4 w-4" />
          Add Asset
        </button>
      </SheetTrigger>
      
      <SheetContent side="right" className="sm:max-w-md">
        {/* We use 'action' instead of 'onSubmit' for Server Actions */}
        <form action={handleSubmit} className="flex flex-col h-full">
          <SheetHeader className="mb-6">
            <SheetTitle>Register New Asset</SheetTitle>
            <SheetDescription>Map your asset inventory and assign ownership.</SheetDescription>
          </SheetHeader>
          
          <div className="flex-1 space-y-6">
            
            {/* 1. Asset Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Asset Name</label>
              <div className="relative">
                <Laptop className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                    required
                    name="name"
                    placeholder="e.g. AWS Production Cluster"
                    className="w-full rounded-xl border border-white/10 pl-10 p-3 text-sm outline-none focus:border-white/20 transition-colors"
                />
              </div>
            </div>

            {/* 2. Asset Type */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Category</label>
              <select 
                name="type" 
                className="w-full rounded-xl border border-white/10 p-3 text-sm outline-none focus:border-white/20 bg-white/10"
              >
                <option value="hardware">Hardware (Laptops, Servers)</option>
                <option value="software">Software (SaaS, Apps)</option>
                <option value="data">Data (Databases, Customer Lists)</option>
                <option value="people">People (Key Personnel)</option>
              </select>
            </div>

            {/* 3. Owner (New Requirement) */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <User className="h-3 w-3" />
                Owner
              </label>
              <input
                required
                name="owner"
                placeholder="e.g. DevOps Team or CTO"
                className="w-full rounded-xl border border-white/10 p-3 text-sm outline-none focus:border-white/20 transition-colors"
              />
              <p className="text-[10px] text-slate-400">The person or team responsible for this asset.</p>
            </div>

            {/* 4. Criticality */}
            <div className="space-y-2 pt-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <ShieldAlert className="h-3 w-3 text-amber-500" />
                Risk Level
              </label>
              <div className="grid grid-cols-2 gap-2">
                 {/* Visual Radio Buttons hack using Select for simplicity, or just a clean Select */}
                 <select 
                    name="criticality" 
                    className="col-span-2 w-full rounded-xl border border-white/10 p-3 text-sm outline-none focus:border-white/20 bg-white/10"
                  >
                    <option value="low">Low - Internal Data</option>
                    <option value="medium">Medium - Operational</option>
                    <option value="high">High - Confidential</option>
                    <option value="critical">Critical - Mission Critical</option>
                  </select>
              </div>
            </div>

          </div>

          <SheetFooter className="border-t pt-4 mt-auto">
            <button
              disabled={loading}
              type="submit"
              className="w-full flex justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 py-4 text-sm font-bold text-white disabled:opacity-70 hover:brightness-110 transition-all"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save to Register"}
            </button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}