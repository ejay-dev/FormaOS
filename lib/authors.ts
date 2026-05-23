import { brand } from '@/config/brand';

const siteUrl = brand.seo.siteUrl.replace(/\/$/, '');

/**
 * Author registry for blog bylines.
 *
 * The blog currently bylines posts under editorial group names (e.g.
 * "FormaOS Team", "Compliance Team") rather than individual people.
 * That's accurate to how the content is produced today — a small group
 * of advisors and engineers contributes under shared bylines reviewed
 * by the FormaOS team.
 *
 * Each group has an /author/[slug] page so AI answer engines and Google
 * have a stable entity to attribute citations to. When individual
 * humans take ownership of specific surfaces (e.g. the founder writing
 * platform announcements), promote them to first-class entries with
 * type: 'person' and add a `sameAs` array linking to LinkedIn / X.
 *
 * AEO sprint 2026-05-23.
 */

export type AuthorKind = 'person' | 'collective';

export interface Author {
  slug: string;
  /** Byline string as it appears in blogData.author */
  name: string;
  /** What this byline represents — kept honest, no marketing puff. */
  bio: string;
  /** "Senior Compliance Engineer" etc. for Person; "Editorial collective" for collectives. */
  role: string;
  kind: AuthorKind;
  /** External profiles for E-E-A-T sameAs */
  sameAs?: string[];
  /** Headshot or group avatar (optional). Path relative to site root. */
  avatar?: string;
}

const AUTHORS: readonly Author[] = [
  {
    slug: 'formaos-team',
    name: 'FormaOS Team',
    role: 'Editorial collective',
    kind: 'collective',
    bio: 'General platform updates and cross-functional posts. Reviewed by the FormaOS engineering and compliance leads before publishing. We byline this name when no single subject-matter group is the primary author.',
  },
  {
    slug: 'compliance-team',
    name: 'Compliance Team',
    role: 'Compliance and regulatory subject-matter group',
    kind: 'collective',
    bio: 'Posts on NDIS Practice Standards, NSQHS, AHPRA, ACECQA, AFS licence obligations, and audit-readiness practice. Written by FormaOS staff with prior experience inside regulated AU operators — disability, aged care, healthcare, and financial services — and reviewed by an external compliance advisor before publishing.',
  },
  {
    slug: 'security-team',
    name: 'Security Team',
    role: 'Security and trust engineering group',
    kind: 'collective',
    bio: 'Posts on SOC 2 readiness, immutable audit trails, security architecture, identity and access, and data residency. Written by FormaOS security engineers responsible for the live production posture (the same people who answer enterprise security questionnaires).',
  },
  {
    slug: 'product-team',
    name: 'Product Team',
    role: 'Product and design group',
    kind: 'collective',
    bio: 'Posts about how the FormaOS platform works — feature releases, workflow design choices, integration patterns, and the reasoning behind specific UX trade-offs in a compliance product where every screen has audit implications.',
  },
  {
    slug: 'engineering-team',
    name: 'Engineering Team',
    role: 'Engineering group',
    kind: 'collective',
    bio: 'Technical posts on the engineering behind FormaOS — Postgres row-level security, evidence-chain immutability, the framework-mapping graph, Next.js server-side rendering choices, and the testing posture that supports a compliance product.',
  },
  {
    slug: 'compliance-strategy',
    name: 'Compliance Strategy',
    role: 'Strategy and benchmarking group',
    kind: 'collective',
    bio: 'Higher-level pieces on compliance program design — how to structure a control library, how to negotiate framework scope with an assessor, how to set realistic timelines for SOC 2 attestation. Written for compliance leaders responsible for program-level decisions, not individual controls.',
  },
  {
    slug: 'product-updates',
    name: 'Product Updates',
    role: 'Release notes byline',
    kind: 'collective',
    bio: 'Standing byline for release notes and product update posts. Sourced from the active engineering changelog.',
  },
];

const BY_NAME = new Map(AUTHORS.map((a) => [a.name, a] as const));
const BY_SLUG = new Map(AUTHORS.map((a) => [a.slug, a] as const));

export function getAuthorByName(name: string): Author | undefined {
  return BY_NAME.get(name);
}

export function getAuthorBySlug(slug: string): Author | undefined {
  return BY_SLUG.get(slug);
}

export function listAuthors(): readonly Author[] {
  return AUTHORS;
}

export function authorUrl(slug: string): string {
  return `${siteUrl}/author/${slug}`;
}
