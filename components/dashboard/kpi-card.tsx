import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import clsx from "clsx";

interface KPICardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;

  /** Trend delta */
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };

  /** Risk or status indicator */
  status?: "LOW" | "MEDIUM" | "HIGH" | "SUCCESS" | "WARNING" | "DANGER";

  /** Loading skeleton */
  isLoading?: boolean;

  /** Optional click behavior */
  onClick?: () => void;

  className?: string;
}

/* ===========================
   COMPONENT
=========================== */

export function KPICard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  status,
  isLoading = false,
  onClick,
  className,
}: KPICardProps) {

  const statusStyles = {
    LOW: "bg-emerald-400/10 text-emerald-200 border-emerald-400/30",
    SUCCESS: "bg-emerald-400/10 text-emerald-200 border-emerald-400/30",
    MEDIUM: "bg-amber-400/10 text-amber-200 border-amber-400/30",
    WARNING: "bg-amber-400/10 text-amber-200 border-amber-400/30",
    HIGH: "bg-rose-500/10 text-rose-200 border-rose-400/30",
    DANGER: "bg-rose-500/10 text-rose-200 border-rose-400/30",
  };

  if (isLoading) {
    return (
      <div
        role="status"
        aria-label={`Loading ${title}`}
        className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.35)] animate-pulse"
      >
        <div className="h-5 w-1/3 bg-white/10 rounded mb-4" />
        <div className="h-8 w-1/2 bg-white/10 rounded mb-2" />
        <div className="h-4 w-2/3 bg-white/10 rounded" />
      </div>
    );
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `${title}: ${value}` : undefined}
      className={clsx(
        "rounded-2xl border border-white/10 bg-white/10 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.35)] transition-all duration-200",
        "hover:shadow-[0_24px_70px_rgba(0,0,0,0.45)] hover:-translate-y-0.5",
        onClick && "cursor-pointer",
        status ? statusStyles[status] : "border-white/10",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl border border-white/10 bg-white/10 shadow-[0_0_18px_rgba(59,130,246,0.2)]">
            <Icon className="h-5 w-5 text-sky-300" aria-hidden="true" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {title}
          </h3>
        </div>

        {/* Status Badge */}
        {status && (
          <span
            className={clsx(
              "text-[10px] font-bold px-2 py-1 rounded-full border",
              statusStyles[status]
            )}
          >
            {status}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-slate-100">
              {value}
            </span>
            {description && (
              <span className="text-sm text-slate-400 font-medium">
                {description}
              </span>
            )}
          </div>
        </div>

        {/* Trend */}
        {trend && (
          <div
            className={clsx(
              "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
              trend.isPositive
                ? "bg-emerald-400/10 text-emerald-700"
                : "bg-red-50 text-red-700"
            )}
          >
            {trend.isPositive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            <span>
              {trend.isPositive ? "+" : ""}
              {trend.value}%
            </span>
            {trend.label && (
              <span className="text-[10px] font-medium opacity-70">
                {trend.label}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Accent Bar */}
      <div
        className={clsx(
          "absolute inset-x-0 bottom-0 h-1 rounded-b-2xl",
          status === "LOW" || status === "SUCCESS"
            ? "bg-emerald-400"
            : status === "MEDIUM" || status === "WARNING"
            ? "bg-amber-400"
            : status === "HIGH" || status === "DANGER"
            ? "bg-red-400"
            : "bg-white/10"
        )}
      />
    </div>
  );
}
