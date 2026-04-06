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

  const ragBorder =
    status === "LOW" || status === "SUCCESS"
      ? "metric-card-success"
      : status === "MEDIUM" || status === "WARNING"
      ? "metric-card-warning"
      : status === "HIGH" || status === "DANGER"
      ? "metric-card-danger"
      : "metric-card-neutral";

  if (isLoading) {
    return (
      <div
        role="status"
        aria-label={`Loading ${title}`}
        className="metric-card animate-pulse"
      >
        <div className="h-4 w-1/3 bg-muted rounded mb-2" />
        <div className="h-6 w-1/2 bg-muted rounded" />
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
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- role/tabIndex/onKeyDown are conditionally applied when onClick exists
    <div
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `${title}: ${value}` : undefined}
      className={clsx(
        "metric-card transition-all duration-200 hover:shadow-sm",
        onClick && "cursor-pointer",
        ragBorder,
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
      </div>

      {/* Value + Trend */}
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {value}
          </span>
          {description && (
            <span className="text-xs text-muted-foreground">
              {description}
            </span>
          )}
        </div>

        {trend && (
          <div
            className={clsx(
              "flex items-center gap-0.5 text-[10px] font-bold",
              trend.isPositive
                ? "text-emerald-500"
                : "text-red-500"
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
              <span className="opacity-70 ml-0.5">
                {trend.label}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
