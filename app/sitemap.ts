import type { MetadataRoute } from 'next';
import { brand } from '@/config/brand';
import { blogPosts } from '@/app/(marketing)/blog/blogData';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = brand.seo.siteUrl.replace(/\/$/, '');
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    // Core pages
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/product`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteUrl}/pricing`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${siteUrl}/security`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/trust`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    // Secondary pages
    { url: `${siteUrl}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/industries`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/frameworks`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/compare`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteUrl}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/customer-stories`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/our-story`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    // Compare sub-pages
    { url: `${siteUrl}/compare/drata`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/compare/vanta`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/compare/secureframe`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    // Outcome journey pages
    { url: `${siteUrl}/evaluate`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/prove`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/govern`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/operate`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    // Use case pages
    { url: `${siteUrl}/use-cases/healthcare`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/use-cases/ndis-aged-care`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/use-cases/incident-management`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/use-cases/workforce-credentials`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    // Trust Center sub-pages
    { url: `${siteUrl}/trust/dpa`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/trust/sla`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/trust/data-handling`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/trust/subprocessors`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/security-review`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    // SEO landing pages
    { url: `${siteUrl}/what-is-a-compliance-operating-system`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/iso-compliance-software`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/soc2-compliance-automation`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/ndis-compliance-system`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/healthcare-compliance-platform`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/audit-evidence-management`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    // Legal pages
    { url: `${siteUrl}/legal/terms`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${siteUrl}/legal/privacy`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ];

  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${siteUrl}/blog/${post.id}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticPages, ...blogEntries];
}
