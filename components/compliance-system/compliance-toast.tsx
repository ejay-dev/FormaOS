"use client";

// Audit Sprint 7b (2026-05-24): hand-rolled portal + Context + custom
// renderer replaced with a thin sonner shim. The public API
// (`useComplianceToast()`, `ComplianceToastProvider`, `ComplianceToastData`)
// is unchanged so callers don't change. Internally the Provider is now
// a passthrough — sonner's <Toaster /> is mounted at the app root
// (Sprint 4c, components/ui/toaster.tsx).
//
// What we lose: rich node-color badges (cyan/teal/violet per node type)
// + impact-delta indicator + slide-in animation. These were off-brand
// per the stored enterprise-aesthetic preference. The collapsed
// title + description format is more consistent with the rest of the app.
//
// What we keep: the typed surface for callers (useComplianceAction
// builds these on every node-graph event), the priority levels, and
// the dismissToast escape hatch.

import React, { createContext, useCallback, useContext } from "react";
import { toast as sonnerToast } from "@/components/ui/toaster";

export interface ComplianceToastData {
  id?: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  nodeType?:
    | "policy"
    | "control"
    | "evidence"
    | "audit"
    | "risk"
    | "task"
    | "entity";
  nodeAction?: "created" | "updated" | "linked" | "verified" | "deleted";
  wireFrom?: string;
  wireTo?: string;
  impactArea?: string;
  impactDelta?: number;
  duration?: number;
}

interface ToastContextType {
  showToast: (data: ComplianceToastData) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useComplianceToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error(
      "useComplianceToast must be used within ComplianceToastProvider",
    );
  }
  return context;
}

function buildDescription(data: ComplianceToastData): string | undefined {
  const parts: string[] = [];
  if (data.message) parts.push(data.message);
  if (data.nodeType && data.nodeAction) {
    parts.push(`${data.nodeType} ${data.nodeAction}`);
  }
  if (data.impactArea && typeof data.impactDelta === "number") {
    const sign = data.impactDelta > 0 ? "+" : "";
    parts.push(`${data.impactArea}: ${sign}${data.impactDelta}`);
  }
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

export function ComplianceToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const showToast = useCallback((data: ComplianceToastData) => {
    const description = buildDescription(data);
    const variant =
      data.type === "error"
        ? sonnerToast.error
        : data.type === "warning"
          ? sonnerToast.warning
          : data.type === "success"
            ? sonnerToast.success
            : sonnerToast.info;
    variant(data.title, {
      id: data.id,
      description,
      duration: data.duration,
    });
  }, []);

  const dismissToast = useCallback((id: string) => {
    sonnerToast.dismiss(id);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
}
