"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { createTask } from "@/app/app/actions/tasks"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetDescription } from "@/components/ui/sheet"
import { Plus, Loader2, Calendar, RefreshCw, CheckCircle2 } from "lucide-react"
import { useComplianceAction } from "@/components/compliance-system"

/**
 * =========================================================
 * CREATE TASK SHEET
 * Node Type: Task (emerald)
 * Creates a new task node in the compliance graph
 * =========================================================
 */

export function CreateTaskSheet() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { register, handleSubmit, reset, watch } = useForm()
  const { nodeCreated, reportError } = useComplianceAction()
  
  // Watch the recurring checkbox to toggle the "Days" input
  const isRecurring = watch("isRecurring")

  const onSubmit = async (data: any) => {
    setLoading(true)
    
    const formData = new FormData()
    formData.append("title", data.title)
    formData.append("priority", data.priority)
    formData.append("dueDate", data.dueDate)
    if (data.isRecurring) {
        formData.append("recurrenceDays", data.recurrenceDays)
    }

    try {
        await createTask(formData)
        
        // Show success state
        setSuccess(true)
        
        // Report to compliance system
        nodeCreated("task", data.title)
        
        // Close after animation
        setTimeout(() => {
          reset()
          setOpen(false)
          setSuccess(false)
        }, 1000)
        
    } catch (err: any) {
        reportError({ title: "Task creation failed", message: err.message || "Unknown error" })
    } finally {
        setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) {
        setSuccess(false)
        reset()
      }
    }}>
      <SheetTrigger asChild>
        <button className="group flex items-center gap-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:brightness-110 transition-all shadow-[0_10px_30px_rgba(52,211,153,0.35)] active:scale-[0.98]">
          <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" /> New Task
        </button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        {success ? (
          <div className="flex flex-col items-center justify-center h-full animate-in fade-in zoom-in-95 duration-300">
            <div className="h-20 w-20 rounded-lg bg-emerald-400/20 flex items-center justify-center mb-4 border-2 border-emerald-400/40">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Task Created</h3>
            <p className="text-sm text-slate-400 mt-2 text-center">
              New task node added to your compliance roadmap
            </p>
          </div>
        ) : (
          <>
            <SheetHeader className="mb-6">
              <SheetTitle className="text-xl flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-emerald-400/20 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-sm bg-emerald-400" />
                </div>
                Create Compliance Task
              </SheetTitle>
              <SheetDescription>Assign a new action item to your compliance roadmap.</SheetDescription>
            </SheetHeader>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Title */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Task Title</label>
                <input 
                    {...register("title", { required: true })} 
                    placeholder="e.g. Review Firewall Logs" 
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 transition-all" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 {/* Priority */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Priority Level</label>
                    <select 
                        {...register("priority")} 
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20"
                    >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                    </select>
                 </div>

                 {/* Due Date */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Due Date
                    </label>
                    <input 
                        type="date"
                        {...register("dueDate")} 
                        className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20"
                    />
                 </div>
              </div>

              {/* Recurrence Engine */}
              <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-400/30 space-y-4">
                <div className="flex items-center gap-3">
                    <input 
                        type="checkbox" 
                        id="rec"
                        {...register("isRecurring")}
                        className="h-4 w-4 rounded border-white/10 text-purple-300 focus:ring-purple-400/40"
                    />
                    <label htmlFor="rec" className="text-sm font-bold text-purple-200 flex items-center gap-2 cursor-pointer select-none">
                        <RefreshCw className="h-3.5 w-3.5" />
                        Make this a recurring task
                    </label>
                </div>

                {isRecurring && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                        <label className="text-[10px] font-bold uppercase text-purple-300 tracking-wider block mb-2">Repeat Every (Days)</label>
                        <div className="flex gap-2">
                            <input 
                                type="number" 
                                {...register("recurrenceDays")}
                                defaultValue={30}
                                className="flex-1 p-2 bg-white/5 border border-purple-400/30 rounded-lg text-sm text-center outline-none focus:border-purple-400/50"
                            />
                            <div className="flex items-center text-xs font-medium text-purple-300">Days</div>
                        </div>
                        <p className="text-[10px] text-purple-300/70 mt-2">Example: 30 = Monthly, 90 = Quarterly, 365 = Yearly</p>
                    </div>
                )}
              </div>

              <SheetFooter className="pt-4">
                <button 
                    disabled={loading} 
                    className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-500 text-white py-4 rounded-xl font-bold text-sm hover:brightness-110 disabled:opacity-50 flex justify-center items-center gap-2 shadow-[0_10px_30px_rgba(52,211,153,0.35)] active:scale-[0.98]"
                >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Creating Node...</span>
                      </>
                    ) : (
                      "Create Task"
                    )}
                </button>
              </SheetFooter>
            </form>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
