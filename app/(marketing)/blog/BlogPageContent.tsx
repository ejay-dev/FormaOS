'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  ArrowRight,
  Clock,
  User,
  Tag,
  TrendingUp,
  ChevronRight,
  Sparkles,
  CalendarDays,
  Search,
  Rss,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { ImmersiveHero } from '@/components/motion/ImmersiveHero';
import { BlogListHeroVisual } from './components/BlogListHeroVisual';
import { DeferredSection } from '../components/shared';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import {
  blogPosts,
  featuredPost,
  getCategoryCounts,
  getCategoryId,
} from './blogData';

// ============================================================================
// BLOG DATA
// ============================================================================

const categories = getCategoryCounts(blogPosts);
const parseDate = (value: string) => new Date(value).getTime();

// ============================================================================
// HERO SECTION
// ============================================================================

function BlogHeroExtras() {
  const latestPostDate = useMemo(() => {
    const sorted = [...blogPosts].sort(
      (a, b) => parseDate(b.date) - parseDate(a.date),
    );
    return sorted[0]?.date;
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.1]">
        <Tag className="w-4 h-4 text-slate-300" />
        <span>{blogPosts.length} Articles</span>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.1]">
        <BookOpen className="w-4 h-4 text-slate-300" />
        <span>{categories.length - 1} Categories</span>
      </div>
      {latestPostDate ? (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.1]">
          <TrendingUp className="w-4 h-4 text-slate-300" />
          <span>Last updated {latestPostDate}</span>
        </div>
      ) : null}
    </div>
  );
}

function BlogHero() {
  return (
    <ImmersiveHero
      theme="blog"
      visualContent={<BlogListHeroVisual />}
      badge={{
        icon: <BookOpen className="w-4 h-4" />,
        text: 'Insights & Updates',
      }}
      headline={
        <>
          FormaOS{' '}
          <span className="text-foreground">
            Blog
          </span>
        </>
      }
      subheadline="Regulatory explainers for Australian providers, NDIS, aged care, AHPRA, NQF, WHS and AFS licence obligations, alongside how the platform is built."
      extras={<BlogHeroExtras />}
      primaryCta={{ href: '/blog#featured', label: 'Read Featured Article' }}
    />
  );
}

// ============================================================================
// FEATURED POST
// ============================================================================

function FeaturedPost() {
  const FeaturedIcon = featuredPost.icon;

  return (
    <section className="mk-section relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12">
        <Link
          href={`/blog/${featuredPost.id}`}
          className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-3xl"
          aria-label={`Read ${featuredPost.title}`}
        >
          <ScrollReveal variant="fadeUp" range={[0, 0.3]} className="relative">
            <div className="relative p-5 sm:p-8 lg:p-12 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-white/20 transition-all duration-500 shadow-2xl shadow-black/30 overflow-hidden">
              {/* Top accent */}
              <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

              <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
                {/* Category visual */}
                <div className="relative w-full lg:w-1/2 aspect-video rounded-2xl overflow-hidden border border-white/5 bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent">
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="p-8 rounded-2xl bg-white/5 border border-white/10">
                      <FeaturedIcon className="w-16 h-16 text-slate-300" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-xs text-white/80 border border-white/10">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Featured article</span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 rounded-full bg-white/[0.08] border border-white/10 text-slate-200 text-xs font-medium">
                      Featured
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-slate-400 text-xs">
                      {featuredPost.category}
                    </span>
                  </div>

                  <h2 className="text-2xl lg:text-3xl font-bold text-white group-hover:text-slate-200 transition-colors leading-tight">
                    {featuredPost.title}
                  </h2>

                  <p className="text-slate-400 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{featuredPost.author}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" />
                      <span>{featuredPost.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{featuredPost.readTime}</span>
                    </div>
                  </div>

                  <motion.span
                    whileHover={{ x: 5 }}
                    className="flex items-center gap-2 text-slate-200 font-medium group/btn"
                  >
                    <span>Read Article</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </motion.span>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </Link>
      </div>
    </section>
  );
}

// ============================================================================
// CATEGORY FILTER
// ============================================================================

function CategoryFilter({
  activeCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
}: {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <section className="mk-section relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 space-y-6">
        <ScrollReveal
          variant="fadeUp"
          range={[0, 0.3]}
          className="flex flex-wrap items-center gap-3 justify-center"
        >
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === category.id
                  ? 'bg-white/[0.1] text-white border border-white/20'
                  : 'bg-white/[0.06] text-slate-400 border border-white/[0.1] hover:border-white/25 hover:text-slate-200'
              }`}
            >
              <span>{category.name}</span>
              <span className="text-xs opacity-60">({category.count})</span>
            </button>
          ))}
        </ScrollReveal>

        <ScrollReveal
          variant="fadeUp"
          range={[0.04, 0.34]}
          className="max-w-xl mx-auto"
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-full bg-white/[0.04] border border-white/10 text-slate-300 focus-within:border-white/30 focus-within:ring-2 focus-within:ring-white/10 transition">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search articles"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-500"
              type="search"
            />
          </div>
          <div className="mt-3 flex justify-center">
            <a
              href="/blog/rss.xml"
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
            >
              <Rss className="w-3.5 h-3.5" aria-hidden="true" />
              Subscribe via RSS
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ============================================================================
// BLOG CARD
// ============================================================================

function BlogCard({ post }: { post: (typeof blogPosts)[0] }) {
  const Icon = post.icon;

  return (
    <Link
      href={`/blog/${post.id}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-2xl h-full"
      aria-label={`Read ${post.title}`}
    >
      <div className="relative h-full p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/20 transition-all duration-500 shadow-xl shadow-black/20">
        {/* Top accent */}
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-white/25 transition-colors" />

        <div className="relative mb-5 h-28 w-full rounded-xl overflow-hidden border border-white/5 bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent group-hover:from-white/[0.1] transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 group-hover:bg-white/10 transition-all duration-500">
              <Icon className="w-8 h-8 text-slate-300 group-hover:text-slate-200 transition-colors" />
            </div>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-end">
          <span className="px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-slate-400 text-xs">
            {post.category}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white mb-3 group-hover:text-slate-200 transition-colors line-clamp-2">
          {post.title}
        </h3>

        {/* Excerpt */}
        <p className="text-sm text-slate-400 mb-4 line-clamp-3">
          {post.excerpt}
        </p>

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-3.5 h-3.5" />
            <span>{post.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            <span>{post.readTime}</span>
          </div>
        </div>

        {/* Hover CTA */}
        <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="flex items-center gap-2 text-sm text-slate-200 font-medium">
            <span>Read More</span>
            <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ============================================================================
// BLOG GRID
// ============================================================================

function BlogGrid({
  posts,
  onLoadMore,
  hasMore,
}: {
  posts: typeof blogPosts;
  onLoadMore: () => void;
  hasMore: boolean;
}) {
  return (
    <section className="mk-section relative">
      <div className="relative max-w-6xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="blurIn" range={[0, 0.3]}>
          <h2 className="text-2xl font-bold text-white mb-8">
            Latest Articles
          </h2>
        </ScrollReveal>

        {posts.length ? (
          <SectionChoreography
            pattern="stagger-wave"
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </SectionChoreography>
        ) : (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-10 text-center text-slate-400">
            No articles match your search. Try a different keyword or category.
          </div>
        )}

        {/* Load more */}
        {hasMore ? (
          <ScrollReveal
            variant="slideUp"
            range={[0.04, 0.34]}
            className="flex justify-center mt-12"
          >
            <button
              onClick={onLoadMore}
              className="flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 bg-white/5 text-white font-medium hover:border-white/25 hover:bg-white/[0.08] transition-all"
            >
              <span>Load More Articles</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </ScrollReveal>
        ) : null}
      </div>
    </section>
  );
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export default function BlogPageContent() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(6);

  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const includeFeatured = activeCategory !== 'all' || query.length > 0;
    return blogPosts
      .filter((post) => (includeFeatured ? true : post.id !== featuredPost.id))
      .filter((post) =>
        activeCategory === 'all'
          ? true
          : getCategoryId(post.category) === activeCategory,
      )
      .filter((post) => {
        if (!query) {
          return true;
        }
        return (
          post.title.toLowerCase().includes(query) ||
          post.excerpt.toLowerCase().includes(query) ||
          post.author.toLowerCase().includes(query) ||
          post.category.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => parseDate(b.date) - parseDate(a.date));
  }, [activeCategory, searchQuery]);

  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const hasMore = filteredPosts.length > visibleCount;

  useEffect(() => {
    setVisibleCount(6);
  }, [activeCategory, searchQuery]);

  return (
    <MarketingPageShell className="mk-page-bg">
      <BlogHero />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>
      <DeferredSection minHeight={300}>
        <FeaturedPost />
      </DeferredSection>
      <CategoryFilter
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <DeferredSection minHeight={400}>
        <BlogGrid
          posts={visiblePosts}
          hasMore={hasMore}
          onLoadMore={() => setVisibleCount((count) => count + 6)}
        />
      </DeferredSection>
    </MarketingPageShell>
  );
}
