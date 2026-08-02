import Link from 'next/link';
import { brand } from '@/config/brand';
import { Logo } from '@/components/brand/Logo';

/**
 * Root 404 — reached by every mistyped or retired public URL.
 *
 * The dashboard link that used to sit here was offered to visitors who
 * were not signed in, so the most prominent action on the page led
 * straight to a login redirect.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="w-full max-w-xl text-center">
        <Logo variant="wordmark" size={36} className="mx-auto text-foreground" />

        <p className="mt-12 text-sm font-medium text-muted-foreground">404</p>

        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          We can’t find that page
        </h1>

        <p className="mt-4 text-base text-muted-foreground">
          The link may be out of date, or the page may have moved. Everything
          else is still where you left it.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto"
          >
            Back to home
          </Link>
          <Link
            href="/contact"
            className="inline-flex w-full items-center justify-center rounded-lg border border-border px-6 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground sm:w-auto"
          >
            Contact support
          </Link>
        </div>
      </div>

      <p className="mt-16 text-xs text-muted-foreground">
        © {new Date().getFullYear()} {brand.appName}
      </p>
    </div>
  );
}
