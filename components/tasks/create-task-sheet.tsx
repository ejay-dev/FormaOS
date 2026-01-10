"use client"

import { useState } from "react"
import { useForm } from "react-hook-form" // Ensure you have: npm install react-hook-form
import { createTask } from "@/app/app/actions/tasks"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetDescription } from "@/components/ui/sheet"
import { Plus, Loader2, Calendar, RefreshCw } from "lucide-react"

export function CreateTaskSheet() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, reset, watch } = useForm()
  
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
        reset()
        setOpen(false)
    } catch (err) {
        alert("Failed to create task")
    } finally {
        setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:brightness-110 transition-all shadow-sm hover:shadow-md">
          <Plus className="h-4 w-4" /> New Task
        </button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-xl">Create Compliance Task</SheetTitle>
          <SheetDescription>Assign a new action item to your compliance roadmap.</SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Title */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Task Title</label>
            <input 
                {...register("title", { required: true })} 
                placeholder="e.g. Review Firewall Logs" 
                className="w-full p-3 bg-white/10 border border-white/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500/20 transition-all" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             {/* Priority */}
             <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Priority Level</label>
                <select 
                    {...register("priority")} 
                    className="w-full p-3 bg-white/10 border border-white/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500/20"
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
                    className="w-full p-3 bg-white/10 border border-white/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500/20"
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
                <label htmlFor="rec" className="text-sm font-bold text-purple-900 flex items-center gap-2 cursor-pointer select-none">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Make this a recurring task
                </label>
            </div>

            {isRecurring && (
                <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="text-[10px] font-bold uppercase text-purple-400 tracking-wider block mb-2">Repeat Every (Days)</label>
                    <div className="flex gap-2">
                        <input 
                            type="number" 
                            {...register("recurrenceDays")}
                            defaultValue={30}
                            className="flex-1 p-2 bg-white/10 border border-purple-400/30 rounded-lg text-sm text-center outline-none focus:border-purple-400/40"
                        />
                        <div className="flex items-center text-xs font-medium text-purple-400">Days</div>
                    </div>
                    <p className="text-[10px] text-purple-400 mt-2">Example: 30 = Monthly, 90 = Quarterly, 365 = Yearly</p>
                </div>
            )}
          </div>

          <SheetFooter className="pt-4">
            <button 
                disabled={loading} 
                className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white py-4 rounded-xl font-bold text-sm hover:brightness-110 disabled:opacity-50 flex justify-center items-center gap-2"
            >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Task"}
            </button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
