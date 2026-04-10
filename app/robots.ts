import type { MetadataRoute } from 'next';
import { brand } from '@/config/brand';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = brand.seo.siteUrl.replace(/\/$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/app/',
          '/admin/',
          '/api/',
          '/auth/',
          '/audit-portal/',
          '/submit/',
          '/join/',
          '/workspace-recovery/',
          '/onboarding/',
          '/auth-redirect',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/app/', '/admin/', '/api/', '/auth/', '/audit-portal/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
