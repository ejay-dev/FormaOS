"use client";

import { ActivityItem } from "@/lib/data/analytics";
import {
  FileText,
  CheckCircle2,
  ShieldAlert,
  User,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

/* ----------------------------- Utilities ----------------------------- */

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function normalizeAction(action: string) {
  return action.replaceAll("_", " ").toLowerCase();
}

function getSeverityMeta(severity?: string) {
  switch (severity) {
    case "critical":
      return { label: "Critical", color: "text-red-700", bg: "bg-red-100", border: "border-red-200" };
    case "high":
      return { label: "High", color: "text-red-600", bg: "bg-red-50", border: "border-red-100" };
    case "medium":
      return { label: "Medium", color: "text-amber-300", bg: "bg-amber-400/10", border: "border-amber-400/30" };
    case "low":
      return { label: "Low", color: "text-slate-400", bg: "bg-white/10", border: "border-white/10" };
    default:
      return null;
  }
}

function getTypeMeta(type: ActivityItem["type"]) {
  switch (type) {
    case "policy":
      return {
        icon: FileText,
        color: "text-blue-600",
        bg: "bg-sky-500/10",
        border: "border-sky-400/30",
        label: "Policy",
      };
    case "task":
      return {
        icon: CheckCircle2,
        color: "text-emerald-300",
        bg: "bg-emerald-400/10",
        border: "border-emerald-400/30",
        label: "Task",
      };
    case "security":
      return {
        icon: ShieldAlert,
        color: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-100",
        label: "Security",
      };
    default:
      return {
        icon: User,
        color: "text-slate-400",
        bg: "bg-white/10",
        border: "border-white/10",
        label: "System",
      };
  }
}

/* ----------------------------- Component ----------------------------- */

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl border border-white/10 bg-white/10 shadow-sm">
        <p className="text-sm text-slate-400 font-medium">
          No governance activity recorded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      {/* Timeline Line */}
      <div className="absolute left-[18px] top-2 bottom-2 w-px bg-white/10" />

      {items.map((item, index) => {
        const meta = getTypeMeta(item.type);
        const severity = getSeverityMeta((item as any)?.severity);
        const Icon = meta.icon;
        const actionUrl = (item as any)?.actionUrl;
        const domain = (item as any)?.domain;

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.03 }}
            className="group flex gap-4 relative"
          >
            {/* Icon Node */}
            <div className="relative z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border 
                  ${meta.bg} ${meta.border} ${meta.color} 
                  shadow-sm group-hover:shadow-md transition-all`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>

            {/* Content */}
            <div
              className="flex-1 rounded-xl border border-transparent 
              group-hover:border-white/10 bg-white/10 px-4 py-3 
              transition-all shadow-sm group-hover:shadow-md"
            >
              {/* Header */}
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Domain Label */}
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {meta.label}
                  </span>

                  {/* Severity Badge */}
                  {severity && (
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border 
                        ${severity.bg} ${severity.border} ${severity.color}`}
                    >
                      {severity.label}
                    </span>
                  )}

                  {/* Security Alert Chip */}
                  {item.type === "security" && (
                    <span className="flex items-center gap-1 text-[10px] font-black text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3" />
                      Alert
                    </span>
                  )}
                </div>

                <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                  {timeAgo(item.timestamp)}
                </span>
              </div>

              {/* Main Message */}
              <p className="text-sm font-semibold text-slate-100 mt-1 leading-snug">
                <span className="font-black">{item.user}</span>{" "}
                {normalizeAction(item.action)}
              </p>

              {/* Target / Description */}
              <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-1 group-hover:line-clamp-none transition-all">
                {item.target}
              </p>

              {/* Action Footer */}
              {(actionUrl || domain) && (
                <div className="mt-2 flex items-center gap-3">
                  {domain && (
                    <span className="text-[10px] font-mono uppercase text-slate-400">
                      {domain}
                    </span>
                  )}

                  {actionUrl && (
                    <Link
                      href={actionUrl}
                      className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800"
                    >
                      Open
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}