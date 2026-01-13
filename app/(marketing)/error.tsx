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
    // Log the error details for debugging
    console.error("[Marketing Error]", {
      message: error.message,
      name: error.name,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
        <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We encountered an error loading this page. Please try again.
        </p>
        
        {/* Always show error ID for support purposes */}
        {error.digest && (
          <div className="mt-4 p-3 rounded-lg bg-muted/50 text-left text-xs">
            <p className="text-muted-foreground">
              Error ID: <code className="text-foreground">{error.digest}</code>
            </p>
          </div>
        )}
        
        {/* Show error message in development */}
        {process.env.NODE_ENV === "development" && error.message && (
          <div className="mt-2 p-3 rounded-lg bg-destructive/10 text-left text-xs">
            <p className="text-destructive break-words">
              {error.message}
            </p>
          </div>
        )}
        
        <div className="mt-6 flex gap-4 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-muted px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted/80"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
