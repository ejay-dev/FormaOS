import Link from 'next/link';

export default function AppNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 sm:p-8 text-center shadow-xl">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-muted-foreground/40">
          404
        </h1>
        <h2 className="mt-4 text-lg sm:text-xl font-semibold">
          Page not found
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            href="/app"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
