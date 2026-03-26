'use client';

import { useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useAnalytics } from '@/lib/monitoring/analytics';

interface MarketingCtaClickDetails {
  surface:
    | 'pricing'
    | 'trust'
    | 'compare'
    | 'use_case'
    | 'homepage'
    | 'enterprise'
    | 'navigation'
    | 'footer'
    | 'docs';
  section?: string;
  location?: string;
  ctaLabel: string;
  ctaHref: string;
  variant?: 'primary' | 'secondary' | 'plan' | 'final' | 'resource';
  plan?: string;
  competitor?: string;
  compareSource?: string;
  industry?: string;
}

export function useMarketingTelemetry() {
  const analytics = useAnalytics();
  const pathname = usePathname();

  const trackCtaClick = useCallback(
    (details: MarketingCtaClickDetails) => {
      const properties = {
        page_path: pathname,
        surface: details.surface,
        section: details.section,
        location: details.location,
        cta_label: details.ctaLabel,
        cta_href: details.ctaHref,
        cta_variant: details.variant,
        plan: details.plan,
        competitor: details.competitor,
        compare_source: details.compareSource,
        industry: details.industry,
      };

      analytics.track('marketing_cta_click', properties);
      analytics.conversion('marketing_cta_click', undefined, properties);
    },
    [analytics, pathname],
  );

  return { trackCtaClick };
}
