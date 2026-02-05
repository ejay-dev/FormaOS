import Link from 'next/link';
import { brand } from '@/config/brand';

/**
 * =========================================================
 * CUSTOM 404 NOT FOUND PAGE
 * =========================================================
 *
 * Displays when user navigates to non-existent route.
 * Provides clear messaging and navigation options.
 */

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-16">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-gradient-radial from-blue-500/20 via-purple-500/10 to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-gradient-radial from-purple-500/20 via-pink-500/10 to-transparent blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl text-center">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <img
            src={brand.logo.mark}
            alt={brand.appName}
            className="h-16 w-16 rounded-lg"
          />
        </div>

        {/* 404 */}
        <div className="mb-6">
          <h1 className="font-display text-9xl font-bold text-white/90">404</h1>
        </div>

        {/* Message */}
        <div className="mb-8">
          <h2 className="mb-4 font-display text-3xl font-bold text-white">
            Page Not Found
          </h2>
          <p className="text-lg text-white/70">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30"
          >
            Go to Homepage
          </Link>

          <Link
            href="/app"
            className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/5 px-8 py-4 font-semibold text-white backdrop-blur-sm transition-all hover:scale-105 hover:border-white/30 hover:bg-white/10"
          >
            Go to Dashboard
          </Link>
        </div>

        {/* Help text */}
        <div className="mt-12">
          <p className="text-sm text-white/50">
            Need help?{' '}
            <Link
              href="/contact"
              className="text-blue-400 underline underline-offset-2 hover:text-blue-300"
            >
              Contact support
            </Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-center text-sm text-white/40">
        © {new Date().getFullYear()} {brand.appName} • {brand.identity}
      </div>
    </div>
  );
}
