"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
    // Report error to monitoring service if available
    if (typeof window !== "undefined" && error) {
      console.error("[GlobalError] Details:", {
        message: error.message,
        name: error.name,
        digest: error.digest,
        stack: error.stack,
      });
    }
  }, [error]);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-xl">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-400">
          The system hit an unexpected error. Please try again, or contact support if it persists.
        </p>
        {/* Show error details in development or if digest available */}
        {(isDev || error.digest) && (
          <div className="mt-4 p-3 rounded-lg bg-white/5 text-left text-xs">
            {error.digest && (
              <p className="text-slate-500 mb-1">
                Error ID: <code className="text-slate-300">{error.digest}</code>
              </p>
            )}
            {isDev && error.message && (
              <p className="text-red-400 break-words">
                {error.message}
              </p>
            )}
          </div>
        )}
        <button
          onClick={reset}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/20"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
