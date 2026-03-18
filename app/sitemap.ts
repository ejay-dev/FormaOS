import type { MetadataRoute } from 'next';
import { brand } from '@/config/brand';
import { blogPosts } from '@/app/(marketing)/blog/blogData';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = brand.seo.siteUrl.replace(/\/$/, '');
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    // Core pages
    {
      url: `${siteUrl}/`,
      lastModified: new Date('2026-02-15'),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${siteUrl}/product`,
      lastModified: new Date('2026-02-15'),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/pricing`,
      lastModified: new Date('2026-02-15'),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/security`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/trust`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // Secondary pages
    {
      url: `${siteUrl}/about`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/enterprise`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/industries`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/frameworks`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/compare`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/integrations`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/changelog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/features`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/roadmap`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/faq`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/customer-stories`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/our-story`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    // Compare sub-pages
    {
      url: `${siteUrl}/compare/drata`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/compare/vanta`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/compare/secureframe`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    // Outcome journey pages
    {
      url: `${siteUrl}/evaluate`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/prove`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/govern`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/operate`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    // Use case pages
    {
      url: `${siteUrl}/use-cases/healthcare`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/use-cases/ndis-aged-care`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/use-cases/incident-management`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/use-cases/workforce-credentials`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    // Trust Center sub-pages
    {
      url: `${siteUrl}/trust/dpa`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/trust/sla`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/trust/data-handling`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/trust/subprocessors`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/security-review`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    // SEO landing pages
    {
      url: `${siteUrl}/what-is-a-compliance-operating-system`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/iso-compliance-software`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/soc2-compliance-automation`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/ndis-compliance-system`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/healthcare-compliance-platform`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/audit-evidence-management`,
      lastModified: new Date('2026-01-01'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // Legal pages
    {
      url: `${siteUrl}/legal/terms`,
      lastModified: new Date('2025-06-01'),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${siteUrl}/legal/privacy`,
      lastModified: new Date('2025-06-01'),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${siteUrl}/blog/${post.id}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticPages, ...blogEntries];
}
