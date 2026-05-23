import { brand } from '@/config/brand';

const siteUrl = brand.seo.siteUrl.replace(/\/$/, '');

// ============================================================================
// JSON-LD Schema Helpers
// ============================================================================

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'FormaOS',
    url: siteUrl,
    logo: `${siteUrl}/og-image.png`,
    description:
      'Compliance Operating System for Australian regulated industries. Unify governance, evidence, and audits in one platform.',
    foundingDate: '2025',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'AU',
      addressRegion: 'SA',
      addressLocality: 'Adelaide',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: `support@${brand.domain}`,
      },
    ],
    // sameAs lists external profiles that Google treats as canonical
    // company identities for knowledge-graph linking. The founder's
    // personal Twitter handle (twitter.com/EjazDev) was previously
    // listed here and would be interpreted by indexers as FormaOS's
    // own social profile — wrong identity binding. Until FormaOS has
    // a company-owned X/Twitter handle, only the LinkedIn company
    // page is listed. Audit row #16 (2026-05-13 marketing audit).
    sameAs: ['https://www.linkedin.com/company/formaos'],
  };
}

export function softwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'FormaOS',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: siteUrl,
    description:
      'Compliance Operating System that transforms regulatory obligations into structured controls, owned actions, and immutable audit evidence.',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'AUD',
      lowPrice: '297',
      highPrice: '5000',
      offerCount: '3',
    },
  };
}

export function serviceSchema(opts: {
  name: string;
  description: string;
  url: string;
  serviceType?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: opts.name,
    provider: {
      '@type': 'Organization',
      name: 'FormaOS',
      url: siteUrl,
    },
    serviceType: opts.serviceType ?? 'Compliance Software',
    areaServed: {
      '@type': 'Country',
      name: 'Australia',
    },
    description: opts.description,
    url: opts.url,
  };
}

export function pricingSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'FormaOS Compliance Platform',
    description:
      'Compliance Operating System for Australian regulated industries',
    brand: { '@type': 'Brand', name: 'FormaOS' },
    offers: [
      {
        '@type': 'Offer',
        name: 'Foundation',
        price: '297',
        priceCurrency: 'AUD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '297',
          priceCurrency: 'AUD',
          unitCode: 'MON',
        },
        url: `${siteUrl}/pricing`,
      },
      {
        '@type': 'Offer',
        name: 'Growth',
        price: '1800',
        priceCurrency: 'AUD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '1800',
          priceCurrency: 'AUD',
          unitCode: 'MON',
        },
        url: `${siteUrl}/pricing`,
      },
      {
        '@type': 'Offer',
        name: 'Enterprise',
        price: '5000',
        priceCurrency: 'AUD',
        description: 'Custom compliance infrastructure pricing from $5,000/month.',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '5000',
          priceCurrency: 'AUD',
          unitCode: 'MON',
        },
        url: `${siteUrl}/pricing`,
      },
    ],
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`,
    })),
  };
}

export function faqSchema(questions: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}

export function articleSchema(opts: {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  /**
   * Last-modified date. Audit row #59 (2026-05-13): evergreen
   * regulatory blog content needs `dateModified` for readers to know
   * how current the guidance is. Defaults to `datePublished` when
   * the post has not been revised, which is still a meaningful
   * signal to crawlers.
   */
  dateModified?: string;
  /**
   * Author name. Plain string keeps backwards compatibility with
   * existing callsites that pass "FormaOS Team" (collapsed to the
   * Organization). For E-E-A-T signal pass a `personAuthor` instead —
   * AEO sprint 2026-05-23 added named author bios so AI engines have a
   * Person to attribute citations to.
   */
  author: string;
  /**
   * Named human author with bio URL. When set, emits a Person author
   * with sameAs links instead of the Organization fallback. Drives
   * E-E-A-T (Experience, Expertise, Authoritativeness, Trust) signals
   * that both Google's helpful-content system and AI answer engines
   * use as a citation strength weight.
   */
  personAuthor?: {
    name: string;
    slug: string;
    jobTitle?: string;
    sameAs?: string[];
  };
}) {
  const author = opts.personAuthor
    ? {
        '@type': 'Person',
        name: opts.personAuthor.name,
        url: `${siteUrl}/author/${opts.personAuthor.slug}`,
        ...(opts.personAuthor.jobTitle
          ? { jobTitle: opts.personAuthor.jobTitle }
          : {}),
        ...(opts.personAuthor.sameAs?.length
          ? { sameAs: opts.personAuthor.sameAs }
          : {}),
      }
    : {
        '@type': 'Organization',
        name: opts.author === 'FormaOS Team' ? 'FormaOS' : opts.author,
      };

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: opts.title,
    description: opts.description,
    url: opts.url,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified ?? opts.datePublished,
    author,
    publisher: {
      '@type': 'Organization',
      name: 'FormaOS',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/og-image.png`,
      },
    },
  };
}

/**
 * HowTo schema — Google and AI answer engines treat HowTo as an
 * authoritative step-by-step format. Use sparingly: only when the page
 * actually walks the reader through ordered, completable steps with
 * concrete outcomes (e.g. /security-review's 12-item walkthrough,
 * /trust/procurement evaluation playbook).
 */
export function howToSchema(opts: {
  name: string;
  description: string;
  url: string;
  steps: { name: string; text: string }[];
  totalTime?: string; // ISO 8601 duration, e.g. "PT30M"
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: opts.name,
    description: opts.description,
    url: opts.url,
    ...(opts.totalTime ? { totalTime: opts.totalTime } : {}),
    step: opts.steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

/**
 * Person schema for author profile pages. AEO sprint: surfaces a Person
 * entity that AI engines can cite by name and link back to via the
 * author's bio page.
 */
export function personSchema(opts: {
  name: string;
  slug: string;
  jobTitle: string;
  bio: string;
  sameAs?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: opts.name,
    url: `${siteUrl}/author/${opts.slug}`,
    jobTitle: opts.jobTitle,
    description: opts.bio,
    worksFor: {
      '@type': 'Organization',
      name: 'FormaOS',
      url: siteUrl,
    },
    ...(opts.sameAs?.length ? { sameAs: opts.sameAs } : {}),
  };
}

/**
 * Renders a JSON-LD script tag for use in page components.
 * Usage: <JsonLd data={schema} /> or <JsonLd data={[schema1, schema2]} />
 */
export function jsonLdScript(
  data: Record<string, unknown> | Record<string, unknown>[],
) {
  return JSON.stringify(data);
}

export { siteUrl };
