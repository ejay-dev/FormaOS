"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar } from "@/components/sidebar";

type RoleKey = "OWNER" | "COMPLIANCE_OFFICER" | "MANAGER" | "STAFF" | "VIEWER" | "AUDITOR";

export function MobileSidebar({ role }: { role: RoleKey }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full border border-white/10 bg-white/10 p-2 text-slate-100"
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[60]">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div className="absolute left-0 top-0 h-full w-72 shadow-2xl">
            <Sidebar role={role} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-full border border-white/10 bg-white/10 p-2 text-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
