"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Command } from "cmdk"
import { 
  Search, 
  FileText, 
  Users, 
  Settings, 
  Shield, 
  LayoutDashboard,
  CheckSquare
} from "lucide-react"

export function CommandMenu() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  // Toggle logic: Handles both Keyboard Shortcuts AND Click Events from TopBar
  useEffect(() => {
    // 1. Handle CMD+K / CTRL+K
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }

      // ESC to close
      if (e.key === "Escape") setOpen(false)
    }

    // 2. Handle Custom Event from TopBar click
    const openHandler = () => setOpen(true)

    // 3. Add Listeners
    document.addEventListener("keydown", down)
    window.addEventListener("open-command-menu", openHandler)

    // 4. Cleanup on unmount
    return () => {
      document.removeEventListener("keydown", down)
      window.removeEventListener("open-command-menu", openHandler)
    }
  }, [])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  return (
    <>
      {/* Mobile Trigger Button (Visible on small screens) */}
      <button 
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 h-12 w-12 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white rounded-full shadow-xl flex items-center justify-center hover:scale-105 transition-transform md:hidden z-50"
      >
        <Search className="h-5 w-5" />
      </button>

      {/* 🔥 FIX: Prevent invisible overlay from blocking the UI */}
      <div
        className={open ? "pointer-events-auto" : "pointer-events-none hidden"}
      >
        <Command.Dialog
          open={open}
          onOpenChange={setOpen}
          label="Global Command Menu"
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500/40 backdrop-blur-sm px-4 transition-all"
        >
          <div className="w-full max-w-[640px] overflow-hidden rounded-2xl border border-white/10 bg-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center border-b border-white/10 px-4">
              <Search className="h-5 w-5 text-slate-400 mr-2" />
              <Command.Input
                placeholder="Type a command or search..."
                className="h-14 w-full border-none bg-transparent px-2 text-sm outline-none placeholder:text-slate-400"
                autoFocus
              />
              <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/10 px-1.5 font-mono text-[10px] font-medium text-slate-400">
                ESC
              </kbd>
            </div>

            <Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-hide">
              <Command.Empty className="py-6 text-center text-sm text-slate-400">
                No results found.
              </Command.Empty>

              <Command.Group heading="Essentials" className="px-2 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <CommandItem 
                  onSelect={() => runCommand(() => router.push("/app"))}
                  icon={<LayoutDashboard className="h-4 w-4" />}
                >
                  Dashboard
                </CommandItem>
                <CommandItem 
                  onSelect={() => runCommand(() => router.push("/app/tasks"))}
                  icon={<CheckSquare className="h-4 w-4" />}
                >
                  Tasks & Roadmap
                </CommandItem>
              </Command.Group>

              <Command.Group heading="Modules" className="px-2 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <CommandItem 
                  onSelect={() => runCommand(() => router.push("/app/policies"))}
                  icon={<Shield className="h-4 w-4" />}
                >
                  Policies
                </CommandItem>
                <CommandItem 
                  onSelect={() => runCommand(() => router.push("/app/registers"))}
                  icon={<FileText className="h-4 w-4" />}
                >
                  Asset Registers
                </CommandItem>
                <CommandItem 
                  onSelect={() => runCommand(() => router.push("/app/team"))}
                  icon={<Users className="h-4 w-4" />}
                >
                  Team Management
                </CommandItem>
              </Command.Group>

              <Command.Group heading="Settings" className="px-2 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <CommandItem 
                  onSelect={() => runCommand(() => router.push("/app/settings"))}
                  icon={<Settings className="h-4 w-4" />}
                >
                  Organization Settings
                </CommandItem>
              </Command.Group>
            </Command.List>
          </div>
        </Command.Dialog>
      </div>
    </>
  )
}

// Helper Component
function CommandItem({ children, icon, onSelect }: { children: React.ReactNode, icon: React.ReactNode, onSelect: () => void }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-400 aria-selected:bg-white/10 aria-selected:text-slate-100 transition-all"
    >
      <div className="text-slate-400 group-aria-selected:text-slate-100">
        {icon}
      </div>
      {children}
    </Command.Item>
  )
}