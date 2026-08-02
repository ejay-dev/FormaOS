import type { Metadata } from 'next';
import { Activity } from 'lucide-react';
import StatusPageClient from './StatusPageClient';
import { MarketingPageShell } from '@/app/(marketing)/components/shared/MarketingPageShell';
import { CompactHero } from '@/components/motion/CompactHero';
import { CompactHeroIcon } from '@/components/motion/CompactHeroIcon';
import { siteUrl } from '@/lib/seo';

// Audit 2026-05-27, public platform status page.
//
// Surfaces:
//   * /api/health          , overall up/degraded/down + per-subsystem
//   * /api/health/integrity, audit-chain hash integrity
//   * Latest audit_chain_anchor, proof we're publishing chain state
//                                 to a public transparency log
//
// Customer-visible without auth so enterprise prospects + customer
// auditors can hit /status to see live posture. No PII, no per-org
// data, only platform-level health.

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'FormaOS Status',
  description:
    'Live platform health for FormaOS: API, database, authentication, and audit-chain integrity.',
  alternates: {
    canonical: `${siteUrl}/status`,
  },
  robots: {
    index: true,
    follow: false,
  },
};

export default function StatusPage() {
  return (
    <MarketingPageShell>
      <CompactHero
        title="Platform Status"
        description="Live health checks for the FormaOS API, database, authentication, and audit-chain anchoring. Sampled every 30 seconds, no sign-in required."
        topColor="slate"
        bottomColor="slate"
        visualContent={
          <CompactHeroIcon
            icon={<Activity className="w-8 h-8 text-slate-300" />}
            color="148,163,184"
          />
        }
      />
      <StatusPageClient />
    </MarketingPageShell>
  );
}
