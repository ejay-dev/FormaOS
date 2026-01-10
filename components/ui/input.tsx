import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-white/10 bg-white/10 px-3 py-1 text-sm text-slate-100 shadow-sm transition-colors outline-none",
        "placeholder:text-slate-400",
        "focus:border-white/20 focus:ring-2 focus:ring-sky-500/20",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Input };