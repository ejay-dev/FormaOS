import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BookOpen, Clock } from 'lucide-react';
import { breadcrumbSchema, personSchema, siteUrl } from '@/lib/seo';
import { getAuthorBySlug, listAuthors } from '@/lib/authors';
import { blogPosts } from '../../blog/blogData';
import { MarketingPageShell } from '../../components/shared/MarketingPageShell';
import { JsonLd } from '@/components/JsonLd';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return listAuthors().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);
  if (!author) {
    return { title: 'Author not found | FormaOS' };
  }
  const title = `${author.name}, ${author.role} | FormaOS`;
  const description = author.bio.slice(0, 155);
  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/author/${author.slug}` },
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `${siteUrl}/author/${author.slug}`,
      siteName: 'FormaOS',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const author = getAuthorBySlug(slug);
  if (!author) notFound();

  const posts = blogPosts
    .filter((p) => p.author === author.name)
    .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

  const schemas =
    author.kind === 'person'
      ? [
          personSchema({
            name: author.name,
            slug: author.slug,
            jobTitle: author.role,
            bio: author.bio,
            sameAs: author.sameAs,
          }),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Blog', path: '/blog' },
            { name: author.name, path: `/author/${author.slug}` },
          ]),
        ]
      : [
          // Collective bylines emit Organization rather than Person , 
          // honest signal to crawlers about what the byline represents.
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: `FormaOS ${author.name}`,
            url: `${siteUrl}/author/${author.slug}`,
            description: author.bio,
            parentOrganization: {
              '@type': 'Organization',
              name: 'FormaOS',
              url: siteUrl,
            },
          },
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Blog', path: '/blog' },
            { name: author.name, path: `/author/${author.slug}` },
          ]),
        ];

  return (
    <>
      <JsonLd data={schemas} />
      <MarketingPageShell>
        <section className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-24 pb-12">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to all posts
          </Link>

          <div className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm p-7 sm:p-10">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
                <BookOpen
                  className="h-6 w-6 text-slate-300"
                  aria-hidden="true"
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {author.kind === 'person' ? 'Author' : 'Editorial byline'}
                </p>
                <h1 className="mt-1 text-3xl sm:text-4xl font-bold text-white">
                  {author.name}
                </h1>
                <p className="mt-1 text-sm text-slate-400">{author.role}</p>
              </div>
            </div>

            <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed">
              {author.bio}
            </p>

            {author.sameAs?.length ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {author.sameAs.map((link) => (
                  <a
                    key={link}
                    href={link}
                    rel="noopener noreferrer"
                    target="_blank"
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs text-slate-300 hover:border-white/25 hover:text-slate-100 transition-colors"
                  >
                    {new URL(link).host}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-24">
          <h2 className="text-2xl font-semibold text-white">
            Posts under this byline
            <span className="ml-3 text-base font-normal text-slate-400">
              {posts.length === 1
                ? '1 article'
                : `${posts.length} article${posts.length === 0 ? 's' : 's'}`}
            </span>
          </h2>

          {posts.length === 0 ? (
            <p className="mt-6 text-slate-400">
              No published articles under this byline yet.{' '}
              <Link
                href="/blog"
                className="text-slate-300 underline-offset-4 hover:underline"
              >
                See all posts on the blog
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {posts.map((post) => (
                <li key={post.id}>
                  <Link
                    href={`/blog/${post.id}`}
                    className="block h-full rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06]"
                  >
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      {post.category}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-white">
                      {post.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-400 leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                      <span>{post.date}</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {post.readTime}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </MarketingPageShell>
    </>
  );
}
