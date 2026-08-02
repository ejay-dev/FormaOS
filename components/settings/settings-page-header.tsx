import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * One header and one content width for every /app/settings subpage.
 * The app layout already applies horizontal padding, so the shell only owns
 * the measure and vertical rhythm.
 */

export function SettingsPageShell({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-5xl space-y-6 pb-16">{children}</div>;
}

export function SettingsPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <Link
            href="/app/settings"
            className="rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Settings
          </Link>
          <span aria-hidden className="px-1.5 text-muted-foreground/60">
            /
          </span>
          <span className="text-foreground">{title}</span>
        </nav>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </header>
  );
}
