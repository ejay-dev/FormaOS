"use client";

// Audit 2026-05-23 (Sprint 4c Phase 1): single toast surface for the
// whole app, replacing the 4 in-house implementations that hand-rolled
// portals, dismiss timers, and queue logic (compliance-toast,
// notification-toast, ComplianceToastAlerts, InteractionFeedback).
//
// Mount once at the root layout. Call `toast(...)` / `toast.success(...)`
// / `toast.error(...)` from anywhere.
//
// Default style is neutral (dark surface, no gradient) — matches the
// stored enterprise-aesthetic preference.

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      richColors={false}
      closeButton
      theme="dark"
      toastOptions={{
        className: "border border-glass-border bg-slate-900 text-slate-100",
      }}
    />
  );
}

export { toast } from "sonner";
