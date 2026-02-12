"use client";

import { useEffect, useState, useCallback } from "react";
import { Menu, X } from "lucide-react";
import clsx from "clsx";
import { Sidebar } from "@/components/sidebar";
import Button from "./ui/button";

type UserRole = "viewer" | "member" | "admin" | "owner" | "staff" | "auditor";

export function MobileSidebar({ role }: { role: UserRole }) {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => {
    setVisible(true);
    // Allow DOM to paint before triggering CSS transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setOpen(true));
    });
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    // Remove from DOM after transition completes
    const timer = setTimeout(() => setVisible(false), 250);
    return () => clearTimeout(timer);
  }, []);

  // Body scroll lock
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

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, handleClose]);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        onClick={handleOpen}
        className="rounded-full p-2"
        aria-label="Open navigation"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {visible && (
        <div className="fixed inset-0 z-[60]" aria-hidden={!open}>
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close navigation"
            onClick={handleClose}
            className={clsx(
              "absolute inset-0 bg-black/60 transition-opacity duration-200",
              open ? "opacity-100" : "opacity-0"
            )}
          />
          {/* Panel */}
          <div
            className={clsx(
              "absolute left-0 top-0 h-full w-[85vw] max-w-[320px] sm:w-80 shadow-2xl overflow-y-auto bg-[hsl(var(--sidebar))] glass-panel-strong pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
              "transition-transform duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
              open ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <Sidebar role={role} />
            <Button
              variant="ghost"
              onClick={handleClose}
              className="absolute right-3 top-3 rounded-full p-2 bg-black/40"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
