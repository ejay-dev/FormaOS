import type { Metadata } from 'next';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { TRUST_SUBPROCESSORS } from '@/lib/trust/subprocessors';
import { MarketingPageShell } from '@/app/(marketing)/components/shared/MarketingPageShell';
import { CompactHero } from '@/components/motion/CompactHero';
import { CompactHeroIcon } from '@/components/motion/CompactHeroIcon';
import { siteUrl } from '@/lib/seo';
export const metadata: Metadata = {
  title: 'FormaOS | Sub-processors',
  description:
    'List of third-party sub-processors used by FormaOS for data processing.',
  alternates: { canonical: `${siteUrl}/trust/subprocessors` },
  openGraph: {
    title: 'FormaOS | Sub-processors',
    description:
      'List of third-party sub-processors used by FormaOS for data processing.',
    type: 'website',
    url: `${siteUrl}/trust/subprocessors`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FormaOS | Sub-processors',
    description:
      'List of third-party sub-processors used by FormaOS for data processing.',
  },
};

const subprocessors = [...TRUST_SUBPROCESSORS];

export default function SubprocessorsPage() {
  return (
    <MarketingPageShell>
      <CompactHero
        title="Subprocessors"
        description="Third-party providers used to deliver FormaOS. Change notifications follow the applicable customer agreement."
        topColor="emerald"
        bottomColor="cyan"
        visualContent={
          <CompactHeroIcon
            icon={<Users className="w-8 h-8 text-emerald-400" />}
            color="52,211,153"
          />
        }
      />
      <div className="mx-auto max-w-4xl px-6 pb-24">
        <p className="text-sm text-muted-foreground mt-2 mb-12">
          Last updated: February 2026
        </p>

        <div className="space-y-4">
          {subprocessors.map((sp) => {
            const Icon = sp.icon;
            return (
              <div
                key={sp.name}
                className="flex items-start gap-4 p-5 rounded-xl border border-border bg-card"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Icon
                    className="h-5 w-5 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-foreground">{sp.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {sp.category}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{sp.purpose}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Location: {sp.location}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 p-6 rounded-2xl border border-border bg-card">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Change notifications
          </h3>
          <p className="text-sm text-muted-foreground">
            Enterprise customers on paid plans receive change notifications for
            new sub-processors in accordance with the applicable agreement.
            Contact{' '}
            <a
              href="mailto:Formaos.team@gmail.com"
              className="text-primary hover:underline"
            >
              Formaos.team@gmail.com
            </a>{' '}
            to subscribe to notifications or raise objections.
          </p>
        </div>

        <div className="mt-8 text-sm text-muted-foreground">
          <Link href="/trust" className="text-primary hover:underline">
            ← Back to Trust Center
          </Link>
        </div>
      </div>
    </MarketingPageShell>
  );
}
