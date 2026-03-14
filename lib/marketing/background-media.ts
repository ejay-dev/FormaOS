export type MarketingBackgroundThemeId =
  | 'executive'
  | 'operations'
  | 'security'
  | 'care';

export interface MarketingBackgroundTheme {
  id: MarketingBackgroundThemeId;
  label: string;
  imageSrc: string;
  imagePosition: string;
  imageOpacity: number;
  videoSrc?: string;
  posterSrc?: string;
  videoPosition?: string;
  videoOpacity?: number;
  tint: string;
}

export const marketingBackgroundThemes: Record<
  MarketingBackgroundThemeId,
  MarketingBackgroundTheme
> = {
  executive: {
    id: 'executive',
    label: 'Executive Workspace',
    imageSrc: '/marketing-media/bg-office-collab.jpg',
    imagePosition: 'center center',
    imageOpacity: 0.14,
    videoSrc: '/marketing-media/bg-office-focus.mp4',
    posterSrc: '/marketing-media/bg-office-focus-poster.jpg',
    videoPosition: 'center center',
    videoOpacity: 0.16,
    tint:
      'linear-gradient(180deg, rgba(5,10,20,0.82) 0%, rgba(7,16,28,0.7) 50%, rgba(4,10,18,0.9) 100%)',
  },
  operations: {
    id: 'operations',
    label: 'Operational Flow',
    imageSrc: '/marketing-media/bg-coding-laptop.jpg',
    imagePosition: 'center center',
    imageOpacity: 0.13,
    videoSrc: '/marketing-media/bg-office-devices.mp4',
    posterSrc: '/marketing-media/bg-office-devices-poster.jpg',
    videoPosition: 'center center',
    videoOpacity: 0.17,
    tint:
      'linear-gradient(180deg, rgba(4,10,20,0.84) 0%, rgba(5,16,27,0.72) 50%, rgba(5,10,18,0.9) 100%)',
  },
  security: {
    id: 'security',
    label: 'Security Network',
    imageSrc: '/marketing-media/bg-data-center.jpg',
    imagePosition: 'center center',
    imageOpacity: 0.16,
    videoSrc: '/marketing-media/bg-security-screens.mp4',
    posterSrc: '/marketing-media/bg-security-screens-poster.jpg',
    videoPosition: 'center center',
    videoOpacity: 0.19,
    tint:
      'linear-gradient(180deg, rgba(2,8,18,0.82) 0%, rgba(4,18,24,0.74) 45%, rgba(3,9,18,0.92) 100%)',
  },
  care: {
    id: 'care',
    label: 'Care Delivery',
    imageSrc: '/marketing-media/bg-healthcare-tablet.jpg',
    imagePosition: 'center top',
    imageOpacity: 0.15,
    videoSrc: '/marketing-media/bg-tablet-research.mp4',
    posterSrc: '/marketing-media/bg-tablet-research-poster.jpg',
    videoPosition: 'center center',
    videoOpacity: 0.15,
    tint:
      'linear-gradient(180deg, rgba(4,10,20,0.82) 0%, rgba(7,18,28,0.68) 48%, rgba(4,10,18,0.9) 100%)',
  },
};

const ROUTE_GROUPS: Array<{
  theme: MarketingBackgroundThemeId;
  prefixes: string[];
}> = [
  {
    theme: 'security',
    prefixes: [
      '/security',
      '/security-review',
      '/trust',
      '/status',
      '/compare',
      '/enterprise-proof',
    ],
  },
  {
    theme: 'care',
    prefixes: [
      '/industries',
      '/healthcare-compliance-platform',
      '/ndis-compliance-system',
      '/use-cases/healthcare',
      '/use-cases/ndis-aged-care',
      '/use-cases/workforce-credentials',
    ],
  },
  {
    theme: 'operations',
    prefixes: [
      '/product',
      '/features',
      '/frameworks',
      '/documentation',
      '/documentation/api',
      '/integrations',
      '/operate',
      '/govern',
      '/prove',
      '/evaluate',
      '/what-is-a-compliance-operating-system',
      '/audit-evidence-management',
      '/soc2-compliance-automation',
      '/iso-compliance-software',
      '/use-cases',
    ],
  },
  {
    theme: 'executive',
    prefixes: [
      '/enterprise',
      '/pricing',
      '/contact',
      '/about',
      '/our-story',
      '/customer-stories',
      '/faq',
      '/blog',
      '/changelog',
      '/legal',
      '/terms',
      '/privacy',
      '/roadmap',
    ],
  },
];

export function normalizeMarketingPath(pathname: string | null | undefined): string {
  if (!pathname) return '/';

  let normalized = pathname.trim();
  if (!normalized.startsWith('/')) normalized = `/${normalized}`;
  if (normalized !== '/' && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }

  return normalized || '/';
}

export function selectMarketingBackgroundTheme(
  pathname: string | null | undefined,
): MarketingBackgroundTheme {
  const normalizedPath = normalizeMarketingPath(pathname);

  if (normalizedPath === '/') {
    return marketingBackgroundThemes.executive;
  }

  for (const group of ROUTE_GROUPS) {
    if (
      group.prefixes.some(
        (prefix) =>
          normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`),
      )
    ) {
      return marketingBackgroundThemes[group.theme];
    }
  }

  return marketingBackgroundThemes.executive;
}
