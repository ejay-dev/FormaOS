'use client';

import Link from 'next/link';
import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';
import { getSignInUrl, getSignUpUrl } from '@/lib/urls';

const signInUrl = getSignInUrl();
const signUpUrl = getSignUpUrl({ plan: 'pro', source: 'header_cta' });

export function HeaderCTA() {
  const { trackCtaClick } = useMarketingTelemetry();

  return (
    <div className="flex items-center gap-2.5 whitespace-nowrap text-[13.5px] lg:text-[14px]">
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
        className="mk-btn mk-btn-ghost px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap"
      >
        Login
      </Link>
      <Link
        href="/contact"
        onClick={() =>
          trackCtaClick({
            surface: 'navigation',
            section: 'header',
            location: 'header_contact',
            ctaLabel: 'Talk to Sales',
            ctaHref: '/contact',
            variant: 'secondary',
          })
        }
        className="mk-btn mk-btn-secondary px-4 py-1.5 whitespace-nowrap"
      >
        Talk to Sales
      </Link>
      <Link
        href={signUpUrl}
        onClick={() =>
          trackCtaClick({
            surface: 'navigation',
            section: 'header',
            location: 'header_primary',
            ctaLabel: 'Start Free Trial',
            ctaHref: signUpUrl,
            variant: 'primary',
          })
        }
        className="mk-btn mk-btn-primary px-5 py-1.5 whitespace-nowrap"
      >
        <span>Start Free Trial</span>
      </Link>
    </div>
  );
}
