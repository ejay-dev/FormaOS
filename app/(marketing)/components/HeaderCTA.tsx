'use client';

import Link from 'next/link';
import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';
import { getSignInUrl } from '@/lib/urls';
import { compliancePlanHref, PUBLIC_CTA_LABELS } from '@/lib/marketing/cta';

const signInUrl = getSignInUrl();
const compliancePlanUrl = compliancePlanHref('header_cta');

export function HeaderCTA() {
  const { trackCtaClick } = useMarketingTelemetry();

  return (
    <div className="flex items-center gap-2 whitespace-nowrap text-[13px] lg:text-[13.5px]">
      <Link
        href={signInUrl}
        onClick={() =>
          trackCtaClick({
            surface: 'navigation',
            section: 'header',
            location: 'header_login',
            ctaLabel: 'Login',
            ctaHref: signInUrl,
            variant: 'secondary',
          })
        }
        className="px-3.5 py-1.5 rounded-lg font-medium text-zinc-400 hover:text-white transition-colors whitespace-nowrap"
      >
        Login
      </Link>
      <Link
        href={compliancePlanUrl}
        onClick={() =>
          trackCtaClick({
            surface: 'navigation',
            section: 'header',
            location: 'header_primary',
            ctaLabel: PUBLIC_CTA_LABELS.compliancePlan,
            ctaHref: compliancePlanUrl,
            variant: 'primary',
          })
        }
        className="inline-flex items-center gap-1.5 rounded-lg bg-foreground text-background px-4 py-1.5 text-[13px] font-semibold transition-all hover:opacity-90 whitespace-nowrap"
      >
        {PUBLIC_CTA_LABELS.compliancePlan}
      </Link>
    </div>
  );
}
