"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  X,
  ArrowRight,
  Zap
} from "lucide-react";

/**
 * =========================================================
 * COMPLIANCE TOAST SYSTEM
 * =========================================================
 * Toast notifications that show compliance graph changes.
 * Displays: what node changed, what wires updated, compliance impact.
 */

export interface ComplianceToastData {
  id?: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  nodeType?: "policy" | "control" | "evidence" | "audit" | "risk" | "task" | "entity";
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
    throw new Error("useComplianceToast must be used within ComplianceToastProvider");
  }
  return context;
}

const NODE_COLORS: Record<string, string> = {
  policy: "text-cyan-400",
  control: "text-teal-400",
  evidence: "text-violet-400",
  audit: "text-amber-400",
  risk: "text-rose-400",
  task: "text-emerald-400",
};

const TYPE_CONFIG = {
  success: {
    icon: CheckCircle2,
    bgClass: "bg-emerald-500/10 border-emerald-400/40",
    iconClass: "text-emerald-400",
  },
  error: {
    icon: AlertCircle,
    bgClass: "bg-rose-500/10 border-rose-400/40",
    iconClass: "text-rose-400",
  },
  info: {
    icon: Info,
    bgClass: "bg-sky-500/10 border-sky-400/40",
    iconClass: "text-sky-400",
  },
  warning: {
    icon: AlertCircle,
    bgClass: "bg-amber-500/10 border-amber-400/40",
    iconClass: "text-amber-400",
  },
};

function ComplianceToast({ 
  data, 
  onDismiss 
}: { 
  data: ComplianceToastData; 
  onDismiss: () => void;
}) {
  const config = TYPE_CONFIG[data.type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "w-80 rounded-xl border backdrop-blur-md shadow-2xl overflow-hidden",
        "animate-in slide-in-from-right-full duration-300",
        config.bgClass
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <div className={cn(
          "flex items-center justify-center h-8 w-8 rounded-lg shrink-0",
          config.bgClass
        )}>
          <Icon className={cn("h-4 w-4", config.iconClass)} />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-slate-100">
            {data.title}
          </h4>
          
          {data.message && (
            <p className="text-xs text-slate-400 mt-0.5">{data.message}</p>
          )}

          {/* Node change indicator */}
          {data.nodeType && data.nodeAction && (
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span className={cn("font-semibold capitalize", NODE_COLORS[data.nodeType])}>
                {data.nodeType}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{data.nodeAction}</span>
            </div>
          )}

          {/* Wire update indicator */}
          {data.wireFrom && data.wireTo && (
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-400">
              <span>{data.wireFrom}</span>
              <ArrowRight className="h-3 w-3 text-cyan-400" />
              <span>{data.wireTo}</span>
            </div>
          )}

          {/* Impact indicator */}
          {data.impactArea && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold",
                data.impactDelta && data.impactDelta > 0 
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-amber-500/20 text-amber-300"
              )}>
                <Zap className="h-2.5 w-2.5" />
                {data.impactArea}
                {data.impactDelta && ` ${data.impactDelta > 0 ? '+' : ''}${data.impactDelta}%`}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="p-1 rounded hover:bg-white/10 transition-colors shrink-0"
        >
          <X className="h-4 w-4 text-slate-400" />
        </button>
      </div>

      {/* Progress bar for auto-dismiss */}
      <div className="h-1 bg-white/5">
        <div 
          className={cn(
            "h-full bg-gradient-to-r from-cyan-500 to-blue-500",
            "animate-[shrink_5s_linear_forwards]"
          )}
          style={{
            animationDuration: `${(data.duration || 5000)}ms`
          }}
        />
      </div>
    </div>
  );
}

export function ComplianceToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ComplianceToastData[]>([]);
  const idCounter = useRef(0);

  const showToast = useCallback((data: ComplianceToastData) => {
    const id = data.id || `toast-${++idCounter.current}`;
    const duration = data.duration || 5000;
    
    setToasts(prev => [...prev, { ...data, id }]);

    // Auto-dismiss
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <ComplianceToast
            key={toast.id}
            data={toast}
            onDismiss={() => dismissToast(toast.id!)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Add keyframe for shrink animation
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes shrink {
      from { width: 100%; }
      to { width: 0%; }
    }
  `;
  document.head.appendChild(style);
}

export { ComplianceToast };
