import type { MetadataRoute } from 'next';
import { brand } from '@/config/brand';
import { blogPosts } from '@/app/(marketing)/blog/blogData';
import { listAuthors } from '@/lib/authors';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = brand.seo.siteUrl.replace(/\/$/, '');
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    // ── Core pages — highest priority ──
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    // ── Industry pages — very high priority (money pages) ──
    {
      url: `${siteUrl}/ndis-providers`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${siteUrl}/mental-health-compliance`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${siteUrl}/healthcare-compliance`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${siteUrl}/financial-services-compliance`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${siteUrl}/childcare-compliance`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: `${siteUrl}/construction-compliance`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    // ── High priority pages ──
    {
      url: `${siteUrl}/pricing`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/industries`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/product`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/features`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/enterprise`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${siteUrl}/security`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${siteUrl}/trust`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    // ── SEO landing pages ──
    {
      url: `${siteUrl}/what-is-a-compliance-operating-system`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${siteUrl}/iso-compliance-software`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${siteUrl}/soc2-compliance-automation`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    // /ndis-compliance-system + /healthcare-compliance-platform removed
    // 2026-05-14: consolidated under /ndis-providers and
    // /healthcare-compliance via 308 redirect (audit row #9). Sitemap
    // omits them so Google deindexes the duplicates.
    {
      url: `${siteUrl}/audit-evidence-management`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    // ── Secondary pages ──
    {
      url: `${siteUrl}/frameworks`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/integrations`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/our-story`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/faq`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/customer-stories`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      // Added 2026-05-28 — was orphaned from sitemap despite live page +
      // existing metadata + internal links from /trust dropdown. GSC
      // reported only 33/45 indexed; sitemap omission was contributing.
      url: `${siteUrl}/case-studies`,
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
      url: `${siteUrl}/roadmap`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/documentation`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/enterprise-proof`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // /status removed 2026-05-13 — was misreporting "All systems
    // operational" against 0% uptime; unshipped until a real status
    // provider is wired (see chore/unship-status-page).
    // ── Compare pages ──
    {
      url: `${siteUrl}/compare`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${siteUrl}/compare/complispace`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/compare/riskware`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/compare/6clicks`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/compare/healthmetrics`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // ── Outcome journey pages ──
    {
      url: `${siteUrl}/evaluate`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.65,
    },
    {
      url: `${siteUrl}/prove`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.65,
    },
    {
      url: `${siteUrl}/govern`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.65,
    },
    {
      url: `${siteUrl}/operate`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.65,
    },
    // ── Use case pages ──
    // /use-cases/healthcare, /use-cases/ndis-aged-care, and
    // /use-cases/financial-services removed 2026-05-14: consolidated
    // under their industry primary via 308 redirect (audit row #9).
    {
      url: `${siteUrl}/use-cases/government-public-sector`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/use-cases/incident-management`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/use-cases/workforce-credentials`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // ── Trust center sub-pages ──
    {
      url: `${siteUrl}/trust/dpa`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.55,
    },
    {
      url: `${siteUrl}/trust/sla`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.55,
    },
    {
      url: `${siteUrl}/trust/data-handling`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.55,
    },
    {
      url: `${siteUrl}/trust/subprocessors`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.55,
    },
    {
      url: `${siteUrl}/trust/incident-response`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.55,
    },
    {
      url: `${siteUrl}/trust/vendor-assurance`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.55,
    },
    {
      url: `${siteUrl}/trust/procurement`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.55,
    },
    {
      url: `${siteUrl}/trust/packet`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.55,
    },
    {
      url: `${siteUrl}/security-review`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.55,
    },
    {
      // Added 2026-05-28 — operational runbooks page was orphaned from
      // the sitemap. Procurement-relevant content; mid-tier priority.
      url: `${siteUrl}/runbooks`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${siteUrl}/security-review/faq`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    // ── Documentation ──
    {
      url: `${siteUrl}/documentation/api`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.65,
    },
    // ── Legal pages ──
    {
      url: `${siteUrl}/legal`,
      lastModified: new Date('2025-06-01'),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
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
    // /terms removed 2026-05-23: it 308s to /legal/terms (next.config redirects
    // collapsed /privacy → /legal/privacy years ago; /terms was left behind).
    // Sitemaps must only list canonical 200-OK URLs.
  ];

  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${siteUrl}/blog/${post.id}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // AEO sprint 2026-05-23: author bio pages give AI engines a stable
  // Person/Organization entity per byline. Low priority — these are
  // attribution pages, not primary product/marketing surfaces.
  const authorEntries: MetadataRoute.Sitemap = listAuthors().map((a) => ({
    url: `${siteUrl}/author/${a.slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.3,
  }));

  return [...staticPages, ...blogEntries, ...authorEntries];
}
