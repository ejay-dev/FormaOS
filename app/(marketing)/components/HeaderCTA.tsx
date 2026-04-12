'use client';

import Link from 'next/link';
import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';
import { getSignInUrl, getSignUpUrl } from '@/lib/urls';

const signInUrl = getSignInUrl();
const signUpUrl = getSignUpUrl({ plan: 'pro', source: 'header_cta' });

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
        className="px-3.5 py-1.5 rounded-lg font-medium text-slate-400 hover:text-white transition-colors whitespace-nowrap"
      >
        Login
      </Link>
      <Link
        href={signUpUrl}
        onClick={() =>
          trackCtaClick({
            surface: 'navigation',
            section: 'header',
            location: 'header_primary',
            ctaLabel: 'Get Started',
            ctaHref: signUpUrl,
            variant: 'primary',
          })
        }
        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-400 px-4 py-1.5 text-[13px] font-semibold text-slate-950 shadow-sm shadow-cyan-500/20 transition-all hover:shadow-md hover:brightness-110 whitespace-nowrap"
      >
        Get Started
      </Link>
    </div>
  );
}
