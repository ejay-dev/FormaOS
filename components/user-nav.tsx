"use client"

import { useState, useEffect, useRef } from "react"
import { createSupabaseClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { LogOut, User, Settings, CreditCard, ChevronDown } from "lucide-react"

export function UserNav({ userEmail }: { userEmail: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const initials = userEmail?.split('@')[0].substring(0, 2).toUpperCase() || "US"

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = async () => {
    const supabase = createSupabaseClient()
    await supabase.auth.signOut()
    router.push("/signin")
    router.refresh()
  }

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full hover:bg-white/10 p-1 transition-colors"
      >
        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-[11px] font-bold text-white">
          {initials}
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-white/10 bg-white/10 p-2 shadow-lg ring-1 ring-white/10 focus:outline-none z-50">
          <div className="px-3 py-2 border-b border-white/10 mb-1">
            <p className="text-xs font-semibold text-slate-100">Account</p>
            <p className="text-[10px] text-slate-400 truncate">{userEmail}</p>
          </div>
          
          <div className="space-y-1">
            <button 
              onClick={() => { router.push("/app/settings"); setIsOpen(false); }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
            >
              <User className="h-4 w-4" /> Profile
            </button>
            <button 
              onClick={() => { router.push("/app/settings"); setIsOpen(false); }}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
            >
              <Settings className="h-4 w-4" /> Settings
            </button>
          </div>

          <div className="my-1 border-t border-white/10" />
          
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/10"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      )}
    </div>
  )
}
