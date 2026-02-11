"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Marketing Error]", {
      message: error.message,
      name: error.name,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1c] px-6">
      <div className="w-full max-w-lg backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 p-8 text-center shadow-xl">
        <h1 className="text-xl font-semibold text-white">Something went wrong</h1>
        <p className="mt-2 text-sm text-gray-400">
          We encountered an error loading this page. Please try again.
        </p>

        {error.digest && (
          <div className="mt-4 p-3 rounded-lg bg-white/[0.04] text-left text-xs">
            <p className="text-gray-400">
              Error ID: <code className="text-white">{error.digest}</code>
            </p>
          </div>
        )}

        {process.env.NODE_ENV === "development" && error.message && (
          <div className="mt-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-left text-xs">
            <p className="text-red-400 break-words">
              {error.message}
            </p>
          </div>
        )}

        <div className="mt-6 flex gap-4 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:border-cyan-400/50 hover:bg-cyan-400/5 transition-all"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
