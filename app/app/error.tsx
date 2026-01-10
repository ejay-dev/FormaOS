"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DashboardError]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-xl">
        <h1 className="text-xl font-semibold">Command Center unavailable</h1>
        <p className="mt-2 text-sm text-slate-400">
          We could not load the dashboard safely. Try again, or contact your administrator.
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/20"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
