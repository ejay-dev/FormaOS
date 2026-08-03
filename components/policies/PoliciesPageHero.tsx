'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { PageHero, type PageHeroMetric } from '@/components/ui/page-hero';

interface PoliciesPageHeroProps {
  total: number;
  published: number;
  drafts: number;
  loading?: boolean;
}

export function PoliciesPageHero({
  total,
  published,
  drafts,
  loading = false,
}: PoliciesPageHeroProps) {
  const v = (n: number) => (loading ? '—' : n);

  const metrics: PageHeroMetric[] = [
    { label: 'Total', value: v(total), sub: 'policies' },
    {
      label: 'Published',
      value: v(published),
      sub: !loading && published > 0 ? 'live' : 'none yet',
    },
    {
      label: 'Drafts',
      value: v(drafts),
      sub: !loading && drafts > 0 ? 'in progress' : 'all published',
      tone: drafts > 0 ? 'warning' : 'neutral',
    },
  ];

  return (
    <PageHero
      eyebrow="Governance"
      title="Policy library"
      subtitle="Draft, publish and review the policies your organisation operates under."
      metrics={metrics}
      actions={
        <Link
          href="/app/policies/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-2 text-xs font-semibold text-[hsl(var(--primary-foreground))] transition-opacity hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" />
          New policy
        </Link>
      }
    />
  );
}
