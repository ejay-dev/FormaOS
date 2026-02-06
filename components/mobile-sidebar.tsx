"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import Button from "./ui/button";

type UserRole = "viewer" | "member" | "admin" | "owner" | "staff" | "auditor";

export function MobileSidebar({ role }: { role: UserRole }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    return () => {
      const top = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      if (top) {
        window.scrollTo(0, parseInt(top || "0") * -1);
      }
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        onClick={() => setOpen(true)}
        className="rounded-full p-2"
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {open ? (
        <div className="fixed inset-0 z-[60]">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div className="absolute left-0 top-0 h-full w-[85vw] max-w-[320px] sm:w-80 shadow-2xl overflow-y-auto bg-[hsl(var(--sidebar))] glass-panel-strong pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
            <Sidebar role={role} />
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-full p-2 bg-black/40"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
