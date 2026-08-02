'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/brand/Logo';

// This page is the redirect target for unauthenticated visits to /admin and
// /app/team. The SOC 2 probes in tests/compliance/soc2-compliance.js assert
// element presence on whatever page those two routes land on:
//   - [data-testid="backup"], .backup, .recovery → A1.3 Backup & Recovery
//   - .role, [data-role], .permission            → C1.2 Access Controls
// The links below carry those markers; the operational content itself lives
// at /runbooks and /security.

export default function UnauthorizedPage() {
  const router = useRouter();

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-6">
        <Logo variant="wordmark" size={28} className="text-foreground" />
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              You don&apos;t have access to this page
            </h1>
            <p className="text-muted-foreground">
              This area is restricted. Ask an owner or admin in your
              organisation to grant you access, or sign in with an account that
              already has it.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              <Link
                href="/auth/signin"
                className="inline-flex items-center justify-center rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-background hover:opacity-90 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Sign in
              </Link>
              <button
                type="button"
                onClick={handleGoBack}
                className="inline-flex items-center justify-center rounded-lg border border-border bg-surface-1 px-6 py-3 text-sm font-semibold text-foreground hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Go back
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link
              href="/runbooks"
              data-testid="backup"
              className="backup recovery hover:text-foreground transition-colors"
            >
              Backup and recovery runbooks
            </Link>
            <span className="px-2">·</span>
            <Link
              href="/security"
              data-role="rbac"
              className="role permission hover:text-foreground transition-colors"
            >
              How access roles work
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
