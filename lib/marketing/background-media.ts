export interface MarketingRouteMedia {
  id: string;
  imageSrc: string;
  imagePosition: string;
}

const DEFAULT_POSITION = 'center center';

// Industry money pages intentionally opt OUT of this shared backdrop , 
// they render their own industry-themed hero (AnimatedHeroBg + the
// InteractiveDashboard mock) which converts better than a uniform
// photographic backdrop. Decision recorded in the 2026-05-13 marketing
// audit §20c. Routes that opt out:
//
//   /healthcare-compliance
//   /ndis-providers
//   /financial-services-compliance
//   /childcare-compliance
//   /construction-compliance
//
// If you add an entry for any of the above, also update the audit
// §20c row so the trail stays honest.
const ROUTE_MEDIA: Record<
  string,
  Omit<MarketingRouteMedia, 'id'>
> = {
  '/': {
    imageSrc: '/marketing-media/home.jpg',
    imagePosition: 'center 34%',
  },
  '/about': {
    imageSrc: '/marketing-media/about.jpg',
    imagePosition: 'center center',
  },
  '/audit-evidence-management': {
    imageSrc: '/marketing-media/audit-evidence-management.jpg',
    imagePosition: 'center 42%',
  },
  '/blog': {
    imageSrc: '/marketing-media/blog.jpg',
    imagePosition: 'center 32%',
  },
  '/changelog': {
    imageSrc: '/marketing-media/changelog.jpg',
    imagePosition: 'center 36%',
  },
  '/compare': {
    imageSrc: '/marketing-media/compare.jpg',
    imagePosition: 'center center',
  },
  '/compare/healthmetrics': {
    imageSrc: '/marketing-media/compare.jpg',
    imagePosition: 'center center',
  },
  '/contact': {
    imageSrc: '/marketing-media/contact.jpg',
    imagePosition: 'center 30%',
  },
  '/customer-stories': {
    imageSrc: '/marketing-media/customer-stories.jpg',
    imagePosition: 'center center',
  },
  '/customer-stories/template': {
    imageSrc: '/marketing-media/customer-stories-template.jpg',
    imagePosition: 'center 36%',
  },
  '/documentation': {
    imageSrc: '/marketing-media/documentation.jpg',
    imagePosition: 'center 20%',
  },
  '/documentation/api': {
    imageSrc: '/marketing-media/documentation-api.jpg',
    imagePosition: 'center center',
  },
  '/enterprise': {
    imageSrc: '/marketing-media/enterprise.jpg',
    imagePosition: 'center center',
  },
  '/enterprise-proof': {
    imageSrc: '/marketing-media/enterprise-proof.jpg',
    imagePosition: 'center center',
  },
  '/evaluate': {
    imageSrc: '/marketing-media/evaluate.jpg',
    imagePosition: 'center center',
  },
  '/faq': {
    imageSrc: '/marketing-media/faq.jpg',
    imagePosition: 'center center',
  },
  '/features': {
    imageSrc: '/marketing-media/features.jpg',
    imagePosition: 'center center',
  },
  '/frameworks': {
    imageSrc: '/marketing-media/frameworks.jpg',
    imagePosition: 'center 30%',
  },
  '/govern': {
    imageSrc: '/marketing-media/govern.jpg',
    imagePosition: 'center center',
  },
  '/industries': {
    imageSrc: '/marketing-media/industries.jpg',
    imagePosition: 'center 28%',
  },
  '/integrations': {
    imageSrc: '/marketing-media/integrations.jpg',
    imagePosition: 'center center',
  },
  '/iso-compliance-software': {
    imageSrc: '/marketing-media/iso-compliance-software.jpg',
    imagePosition: 'center center',
  },
  '/legal': {
    imageSrc: '/marketing-media/legal.jpg',
    imagePosition: 'center center',
  },
  '/legal/privacy': {
    imageSrc: '/marketing-media/legal-privacy.jpg',
    imagePosition: 'center center',
  },
  '/legal/terms': {
    imageSrc: '/marketing-media/legal-terms.jpg',
    imagePosition: 'center center',
  },
  '/operate': {
    imageSrc: '/marketing-media/operate.jpg',
    imagePosition: 'center center',
  },
  '/our-story': {
    imageSrc: '/marketing-media/our-story.jpg',
    imagePosition: 'center 32%',
  },
  '/pricing': {
    imageSrc: '/marketing-media/pricing.jpg',
    imagePosition: 'center center',
  },
  '/product': {
    imageSrc: '/marketing-media/product.jpg',
    imagePosition: 'center center',
  },
  '/prove': {
    imageSrc: '/marketing-media/prove.jpg',
    imagePosition: 'center center',
  },
  '/roadmap': {
    imageSrc: '/marketing-media/roadmap.jpg',
    imagePosition: 'center 30%',
  },
  '/security': {
    imageSrc: '/marketing-media/security.jpg',
    imagePosition: 'center center',
  },
  '/security-review': {
    imageSrc: '/marketing-media/security-review.jpg',
    imagePosition: 'center center',
  },
  '/security-review/faq': {
    imageSrc: '/marketing-media/security-review-faq.jpg',
    imagePosition: 'center 36%',
  },
  '/soc2-compliance-automation': {
    imageSrc: '/marketing-media/soc2-compliance-automation.jpg',
    imagePosition: 'center 32%',
  },
  // /status was unshipped 2026-05-13 via PR #68; portal entry removed
  // here so the now-deleted route no longer carries a backdrop. The
  // marketing-media/status.jpg file is left on disk for whenever
  // /status comes back with a real status provider.
  '/terms': {
    imageSrc: '/marketing-media/terms.jpg',
    imagePosition: 'center center',
  },
  '/trust': {
    imageSrc: '/marketing-media/trust.jpg',
    imagePosition: 'center center',
  },
  '/trust/data-handling': {
    imageSrc: '/marketing-media/trust-data-handling.jpg',
    imagePosition: 'center center',
  },
  '/trust/dpa': {
    imageSrc: '/marketing-media/trust-dpa.jpg',
    imagePosition: 'center center',
  },
  '/trust/incident-response': {
    imageSrc: '/marketing-media/trust-incident-response.jpg',
    imagePosition: 'center center',
  },
  '/trust/packet': {
    imageSrc: '/marketing-media/trust-packet.jpg',
    imagePosition: 'center 34%',
  },
  '/trust/procurement': {
    imageSrc: '/marketing-media/trust-procurement.jpg',
    imagePosition: 'center center',
  },
  '/trust/sla': {
    imageSrc: '/marketing-media/trust-sla.jpg',
    imagePosition: 'center 30%',
  },
  '/trust/subprocessors': {
    imageSrc: '/marketing-media/trust-subprocessors.jpg',
    imagePosition: 'center center',
  },
  '/trust/vendor-assurance': {
    imageSrc: '/marketing-media/trust-vendor-assurance.jpg',
    imagePosition: 'center center',
  },
  '/use-cases/government-public-sector': {
    imageSrc: '/marketing-media/use-case-government-public-sector.jpg',
    imagePosition: 'center center',
  },
  '/use-cases/incident-management': {
    imageSrc: '/marketing-media/use-case-incident-management.jpg',
    imagePosition: 'center center',
  },
  '/use-cases/workforce-credentials': {
    imageSrc: '/marketing-media/use-case-workforce-credentials.jpg',
    imagePosition: 'center 34%',
  },
  '/what-is-a-compliance-operating-system': {
    imageSrc: '/marketing-media/what-is-a-compliance-operating-system.jpg',
    imagePosition: 'center center',
  },
};

// Routes whose PAGE already paints its own hero photo via <SectionMedia>
// (the newer per-section backdrop pattern rolled out 2026-05-29). For these
// the shared route-level MarketingRouteBackdrop would render the SAME photo a
// second time at 24% opacity behind the hero, a doubled / ghosted image.
// Reported 2026-05-30 on /pricing and /trust; a DOM probe across every
// ROUTE_MEDIA route confirmed all 20 routes below were doubled. They keep
// their ROUTE_MEDIA entry (canonical per-route image, still used for the
// hero's own SectionMedia and OG fallbacks) but opt OUT of the shared
// backdrop here, mirroring the homepage skip in MarketingRouteBackdrop and
// the industry-page omissions documented above.
//
// If a page in this set ever DROPS its own <SectionMedia> hero, remove it
// here so the shared backdrop comes back. If you add a new <SectionMedia>
// hero to a route that has a ROUTE_MEDIA entry, add it here too or the photo
// will double.
const SELF_HOSTED_HERO_ROUTES = new Set<string>([
  '/audit-evidence-management',
  '/contact',
  '/customer-stories',
  '/enterprise',
  '/enterprise-proof',
  '/evaluate',
  '/features',
  '/frameworks',
  '/govern',
  '/industries',
  '/integrations',
  '/iso-compliance-software',
  '/operate',
  '/pricing',
  '/product',
  '/prove',
  '/security',
  '/soc2-compliance-automation',
  '/trust',
  '/what-is-a-compliance-operating-system',
]);

export function normalizeMarketingPath(pathname: string | null | undefined): string {
  if (!pathname) return '/';

  let normalized = pathname.trim();
  if (!normalized.startsWith('/')) normalized = `/${normalized}`;
  if (normalized !== '/' && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  return normalized || '/';
}

export function selectMarketingRouteMedia(
  pathname: string | null | undefined,
): MarketingRouteMedia | null {
  const normalizedPath = normalizeMarketingPath(pathname);

  // Pages that render their own <SectionMedia> hero opt out of the shared
  // route backdrop so the hero photo is not painted twice (see set above).
  if (SELF_HOSTED_HERO_ROUTES.has(normalizedPath)) return null;

  const entry = ROUTE_MEDIA[normalizedPath];

  if (!entry) return null;

  return {
    id: normalizedPath,
    imagePosition: entry.imagePosition || DEFAULT_POSITION,
    imageSrc: entry.imageSrc,
  };
}

export function getMarketingRouteMediaEntries(): MarketingRouteMedia[] {
  return Object.entries(ROUTE_MEDIA).map(([id, entry]) => ({
    id,
    imagePosition: entry.imagePosition || DEFAULT_POSITION,
    imageSrc: entry.imageSrc,
  }));
}
