import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, Clock, User } from 'lucide-react';
import { blogPosts, getCategoryId } from '../blogData';
import { BlogHeroVisual } from '@/components/blog/BlogHeroVisual';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const generateStaticParams = () =>
  blogPosts.map((post) => ({ slug: post.id }));

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = blogPosts.find((item) => item.id === slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-[#0a0f1c] via-[#0d1421] to-[#0a0f1c] pt-24">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-gradient-to-tl from-cyan-500/10 via-blue-500/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <section className="max-w-4xl mx-auto px-6 lg:px-12">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-purple-300 hover:text-purple-200 transition"
          >
            <span>← Back to Blog</span>
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-xs text-gray-400">
            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {post.category}
            </span>
            <span className="px-3 py-1 rounded-full bg-gray-800/60 border border-white/5">
              {getCategoryId(post.category).toUpperCase()}
            </span>
          </div>

          <h1 className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
            {post.title}
          </h1>

          <p className="mt-4 text-lg text-gray-400 leading-relaxed">
            {post.excerpt}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              <span>{post.date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{post.readTime}</span>
            </div>
          </div>

          <div className="mt-10">
            <BlogHeroVisual
              category={post.category}
              icon={post.icon}
              title={post.title}
            />
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 lg:px-12 mt-16 pb-24">
          <div className="space-y-14">
            {post.sections.map((section) => (
              <div key={section.heading} className="space-y-6">
                <h2 className="text-2xl font-semibold text-white">
                  {section.heading}
                </h2>
                {section.paragraphs?.length ? (
                  <div className="space-y-4 text-gray-300 leading-relaxed">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                ) : null}

                {section.bullets?.length ? (
                  <ul className="space-y-2 text-gray-300 list-disc list-inside">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}

                {section.steps?.length ? (
                  <ol className="space-y-3 text-gray-300 list-decimal list-inside">
                    {section.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                ) : null}

                {section.links?.length ? (
                  <div className="rounded-2xl border border-white/5 bg-gray-900/50 p-6 space-y-3">
                    <p className="text-sm uppercase tracking-wide text-gray-400">
                      Related links
                    </p>
                    <div className="flex flex-col gap-3">
                      {section.links.map((link) => (
                        <Link
                          key={link.href + link.label}
                          href={link.href}
                          className="flex flex-col gap-1 rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-purple-200 hover:border-purple-400/40 hover:bg-purple-500/10 transition"
                        >
                          <span className="font-medium">{link.label}</span>
                          {link.description ? (
                            <span className="text-xs text-gray-400">
                              {link.description}
                            </span>
                          ) : null}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-16 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between rounded-3xl border border-white/5 bg-gray-900/50 p-8">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Ready to operationalize compliance?
              </h3>
              <p className="text-sm text-gray-400 mt-2">
                See how FormaOS connects controls, evidence, and teams in one
                platform.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/product"
                className="inline-flex items-center justify-center rounded-2xl bg-white/10 text-white px-6 py-3 border border-white/15 hover:border-purple-400/50 hover:bg-purple-500/10 transition"
              >
                Explore Product
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-2xl bg-purple-500 text-white px-6 py-3 border border-purple-400/50 hover:bg-purple-400 transition"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
