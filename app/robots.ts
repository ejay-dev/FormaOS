import type { MetadataRoute } from 'next';
import { brand } from '@/config/brand';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = brand.seo.siteUrl.replace(/\/$/, '');

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/auth/', '/admin/', '/onboarding/', '/app/', '/api/', '/auth-redirect'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
