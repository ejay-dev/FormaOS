"use client"

import { useState } from "react"
import { createSupabaseClient } from "@/lib/supabase/client"
import { UserPlus, Loader2, Mail } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"

export function InviteMemberSheet() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

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

      setOpen(false)
      alert("Invite sent successfully!")
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 px-4 py-2 text-sm font-medium text-white hover:brightness-110 transition-all">
          <UserPlus className="h-4 w-4" />
          Invite Member
        </button>
      </SheetTrigger>
      <SheetContent>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <SheetHeader>
            <SheetTitle>Invite Team Member</SheetTitle>
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
                  className="w-full rounded-md border p-2 pl-10 text-sm outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Role</label>
              <select 
                name="role" 
                className="w-full rounded-md border p-2 text-sm bg-white/10 outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <SheetFooter className="border-t pt-4">
            <button
              disabled={loading}
              type="submit"
              className="w-full flex justify-center items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Sending..." : "Send Invitation"}
            </button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
