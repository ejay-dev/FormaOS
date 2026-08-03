import { brand } from '@/config/brand';

const siteUrl = brand.seo.siteUrl.replace(/\/$/, '');

/**
 * Author registry for blog bylines.
 *
 * Every published post carries the same byline, so this registry holds one
 * entry. An /author/[slug] page and its structured data are a claim that a
 * writing identity exists; an entry with no posts behind it is an empty claim,
 * so a byline only belongs here once something is published under it.
 *
 * When a named person takes ownership of a surface, add them with
 * kind: 'person' and a `sameAs` array — the author page emits Person schema
 * for those and Organization schema for a shared byline.
 */

export type AuthorKind = 'person' | 'collective';

export interface Author {
  slug: string;
  /** Byline string as it appears in blogData.author */
  name: string;
  /** What this byline represents — kept honest, no marketing puff. */
  bio: string;
  /** "Senior Compliance Engineer" etc. for a person; what the byline is for a collective. */
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
    role: 'Standing byline for the FormaOS blog',
    kind: 'collective',
    bio: 'Every post on the FormaOS blog is published under this byline rather than an individual name, so citations have one stable entity to point at. Posts cover compliance frameworks, audit readiness, and how the platform works. Where a post states a regulatory requirement, the regulator or standard it comes from is named in the text so you can check it.',
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
