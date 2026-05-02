'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ClipboardList, Plus, BarChart3 } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar-stack';
import { useAppStore } from '@/lib/stores/app';
import { useCurrentUserAvatar } from '@/lib/users/use-current-user-avatar';

interface DashboardHeroProps {
  organizationName: string;
  userEmail?: string;
  complianceScore: number;
  openTasksCount: number;
  dueSoonCount: number;
  liveDataReady: boolean;
}

function greetingFor(now: Date): string {
  const h = now.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function firstNameFrom(displayName: string | null, email: string): string {
  if (displayName) {
    return displayName.trim().split(/\s+/)[0] || displayName;
  }
  const local = email.split('@')[0] ?? email;
  const cleaned = local.replace(/[._-]+/g, ' ').trim();
  const first = cleaned.split(/\s+/)[0] ?? cleaned;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

function formatDate(now: Date): string {
  return new Intl.DateTimeFormat('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(now);
}

export function DashboardHero({
  organizationName,
  userEmail,
  complianceScore,
  openTasksCount,
  dueSoonCount,
  liveDataReady,
}: DashboardHeroProps) {
  const user = useAppStore((state) => state.user);
  const { displayName, avatarUrl } = useCurrentUserAvatar(user?.id);

  const now = useMemo(() => new Date(), []);
  const greeting = greetingFor(now);
  const dateStr = formatDate(now);
  const firstName = firstNameFrom(displayName, user?.email || userEmail || '');
  const avatarFullName =
    displayName || user?.name || user?.email || userEmail || 'User';

  const scoreLabel =
    complianceScore >= 85
      ? 'Buyer-ready'
      : complianceScore >= 70
        ? 'Approaching'
        : complianceScore > 0
          ? 'Needs attention'
          : 'No data yet';

  return (
    <section className="relative overflow-hidden rounded-xl border border-border bg-card">
      {/* primary accent stripe */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1 bg-primary"
      />

      <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:p-8">
        {/* Left: identity */}
        <div className="flex items-center gap-4 min-w-0">
          {avatarUrl ? (
            <Avatar
              name={avatarFullName}
              src={avatarUrl}
              size="lg"
              className="h-14 w-14 text-base ring-0 shrink-0"
            />
          ) : (
            <span
              role="img"
              aria-label={`${greeting} wave`}
              title={greeting}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border bg-muted/40 text-3xl leading-none select-none"
            >
              <span className="origin-[70%_70%] motion-safe:animate-[wave_1.6s_ease-in-out_infinite]">
                👋
              </span>
            </span>
          )}
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {greeting} · {dateStr}
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {greeting}, {firstName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground truncate">
              {organizationName}
            </p>
          </div>
        </div>

        {/* Middle: three hero metrics, large */}
        <div className="grid grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          <HeroMetric
            value={liveDataReady ? `${complianceScore}%` : '—'}
            label="Readiness"
            sub={liveDataReady ? scoreLabel : 'Loading'}
          />
          <HeroMetric
            value={liveDataReady ? openTasksCount : '—'}
            label="Open"
            sub={liveDataReady ? 'obligations' : 'Loading'}
          />
          <HeroMetric
            value={liveDataReady ? dueSoonCount : '—'}
            label="Due"
            sub={liveDataReady ? 'this week' : 'Loading'}
            tone={dueSoonCount > 5 ? 'warning' : 'neutral'}
          />
        </div>

        {/* Right: actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/app/vault"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-[hsl(var(--primary-foreground))] transition-opacity hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Evidence
          </Link>
          <Link
            href="/app/tasks"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary/50"
          >
            <ClipboardList className="h-3.5 w-3.5" />
            New Task
          </Link>
          <Link
            href="/app/reports"
            className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Reports
          </Link>
        </div>
      </div>
    </section>
  );
}

function HeroMetric({
  value,
  label,
  sub,
  tone = 'neutral',
}: {
  value: string | number;
  label: string;
  sub?: string;
  tone?: 'neutral' | 'warning' | 'danger';
}) {
  const valueClass =
    tone === 'warning'
      ? 'text-amber-500'
      : tone === 'danger'
        ? 'text-rose-500'
        : 'text-foreground';

  return (
    <div className="min-w-0">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-1 text-[40px] font-bold leading-none tabular-nums tracking-tight sm:text-[44px] ${valueClass}`}
      >
        {value}
      </div>
      {sub && (
        <div className="mt-1.5 truncate text-[11px] text-muted-foreground">
          {sub}
        </div>
      )}
    </div>
  );
}
