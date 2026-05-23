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

// Audit Sprint 6b (2026-05-23): toasts must sit above tour overlays
// (--z-tour=100) so a critical toast firing during a product tour
// is still visible. --z-toast=110 added to app/globals.css for this.
const TOAST_OFFSET_STYLE: React.CSSProperties = { zIndex: 'var(--z-toast)' };

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      richColors={false}
      closeButton
      theme="dark"
      style={TOAST_OFFSET_STYLE}
      toastOptions={{
        className: "border border-glass-border bg-slate-900 text-slate-100",
      }}
    />
  );
}

export { toast } from "sonner";
