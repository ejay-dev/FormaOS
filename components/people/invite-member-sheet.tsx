"use client"

import { useState } from "react"
import { createSupabaseClient } from "@/lib/supabase/client"
import { UserPlus, Loader2, Mail, CheckCircle2 } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import { useComplianceAction } from "@/components/compliance-system"

/**
 * =========================================================
 * INVITE MEMBER SHEET
 * Node Type: Entity (neutral)
 * Adds a new member entity to the organization graph
 * =========================================================
 */

export function InviteMemberSheet() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [invitedEmail, setInvitedEmail] = useState("")
  const { nodeCreated, reportError, reportInfo } = useComplianceAction()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const role = formData.get("role") as string

    try {
      const supabase = createSupabaseClient()
      // 1. Get current user's organization
      const { data: membership } = await supabase
        .from("org_members")
        .select("organization_id")
        .limit(1)
        .single()

      if (!membership) throw new Error("No organization found")

      // 2. Insert into org_invites
      const { error } = await supabase.from("org_invites").insert({
        email,
        role,
        organization_id: membership.organization_id,
        status: "pending"
      })

      if (error) throw error

      // Show success state
      setInvitedEmail(email)
      setSuccess(true)
      
      // Report to compliance system
      nodeCreated("entity", email)
      reportInfo({ title: "Invitation sent", message: `Sent to ${email}` })
      
      // Close after animation
      setTimeout(() => {
        setOpen(false)
        setSuccess(false)
      }, 1500)
      
    } catch (err: any) {
      reportError({ title: "Invitation failed", message: err.message || "Could not send invitation" })
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
        <button className="group flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 px-4 py-2 text-sm font-medium text-white hover:brightness-110 transition-all shadow-[0_10px_30px_rgba(59,130,246,0.35)] active:scale-[0.98]">
          <UserPlus className="h-4 w-4 group-hover:scale-110 transition-transform" />
          Invite Member
        </button>
      </SheetTrigger>
      <SheetContent>
        {success ? (
          <div className="flex flex-col items-center justify-center h-full animate-in fade-in zoom-in-95 duration-300">
            <div className="h-20 w-20 rounded-full bg-emerald-400/20 flex items-center justify-center mb-4 border-2 border-emerald-400/40">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">Invitation Sent</h3>
            <p className="text-sm text-slate-400 mt-2 text-center">
              {invitedEmail} will receive an email shortly
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-blue-400/20 flex items-center justify-center">
                  <UserPlus className="h-3.5 w-3.5 text-blue-400" />
                </div>
                Invite Team Member
              </SheetTitle>
              <SheetDescription>
                They will receive an invitation to join your organization.
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 py-8 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    required
                    name="email"
                    type="email"
                    placeholder="teammate@company.com"
                    className="w-full rounded-xl border border-white/10 p-2.5 pl-10 text-sm outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition-all bg-white/5"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Role</label>
                <select 
                  name="role" 
                  className="w-full rounded-xl border border-white/10 p-2.5 text-sm bg-white/5 outline-none focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/20 transition-all"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <SheetFooter className="border-t border-white/10 pt-4">
              <button
                disabled={loading}
                type="submit"
                className="w-full flex justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 py-3 text-sm font-bold text-white disabled:opacity-50 hover:brightness-110 transition-all shadow-[0_10px_30px_rgba(59,130,246,0.35)] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Invitation"
                )}
              </button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}
