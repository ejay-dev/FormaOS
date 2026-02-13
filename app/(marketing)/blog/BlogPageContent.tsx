'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { VisualDivider } from '@/components/motion';
import CinematicField from '../components/motion/CinematicField';
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

function BlogHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const latestPostDate = useMemo(() => {
    const sorted = [...blogPosts].sort(
      (a, b) => parseDate(b.date) - parseDate(a.date),
    );
    return sorted[0]?.date;
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#0a0f1c] via-[#0d1421] to-[#0a0f1c] pt-24"
    >
      {/* Premium Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-gradient-to-br from-purple-500/15 via-pink-500/10 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-[700px] h-[700px] bg-gradient-to-tl from-cyan-500/15 via-blue-500/10 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-radial from-purple-500/5 to-transparent rounded-full" />
      </div>

      {/* Cinematic Particle Field */}
      <div className="absolute inset-0 z-1">
        <CinematicField />
      </div>

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(168, 85, 247, 0.15) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Main Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col items-center text-center">
          <motion.div style={{ opacity, scale, y }}>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 mb-8 backdrop-blur-sm"
            >
              <BookOpen className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-400 font-medium tracking-wide">
                Insights & Updates
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-[1.1] text-white"
            >
              FormaOS{' '}
              <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-500 bg-clip-text text-transparent">
                Blog
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-lg sm:text-xl text-gray-400 mb-8 max-w-2xl mx-auto text-center leading-relaxed"
            >
              Expert perspectives on compliance management, regulatory
              technology, and building operational excellence in regulated
              industries.
            </motion.p>

            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500"
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/50 border border-gray-700/50">
                <Tag className="w-4 h-4 text-purple-400" />
                <span>{blogPosts.length} Articles</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/50 border border-gray-700/50">
                <BookOpen className="w-4 h-4 text-pink-400" />
                <span>{categories.length - 1} Categories</span>
              </div>
              {latestPostDate ? (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/50 border border-gray-700/50">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span>Last updated {latestPostDate}</span>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        </div>
      </div>

    </section>
  );
}

// ============================================================================
// FEATURED POST
// ============================================================================

function FeaturedPost() {
  const FeaturedIcon = featuredPost.icon;

  return (
    <section className="relative py-16 bg-gradient-to-b from-[#0a0f1c] via-[#0d1421] to-[#0a0f1c]">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <Link
          href={`/blog/${featuredPost.id}`}
          className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 rounded-3xl"
          aria-label={`Read ${featuredPost.title}`}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative p-8 lg:p-12 rounded-3xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 backdrop-blur-xl border border-white/5 hover:border-purple-500/20 transition-all duration-500 shadow-2xl shadow-black/30 overflow-hidden">
              {/* Top accent */}
              <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />

              {/* Glow effect on hover */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-cyan-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />

              <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
                {/* Category visual */}
                <div className="relative w-full lg:w-1/2 aspect-video rounded-2xl overflow-hidden border border-white/5 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent">
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                      <FeaturedIcon className="w-16 h-16 text-purple-400" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-black/40 backdrop-blur-sm px-3 py-1 text-xs text-white/80 border border-white/10">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Featured article</span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-6">
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium">
                      Featured
                    </span>
                    <span className="px-3 py-1 rounded-full bg-gray-800/50 text-gray-400 text-xs">
                      {featuredPost.category}
                    </span>
                  </div>

                  <h2 className="text-2xl lg:text-3xl font-bold text-white group-hover:text-purple-300 transition-colors leading-tight">
                    {featuredPost.title}
                  </h2>

                  <p className="text-gray-400 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
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
                    className="flex items-center gap-2 text-purple-400 font-medium group/btn"
                  >
                    <span>Read Article</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </motion.span>
                </div>
              </div>
            </div>
          </motion.div>
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
    <section className="relative py-8 bg-gradient-to-b from-[#0d1421] to-[#0a0f1c]">
      <div className="max-w-6xl mx-auto px-6 lg:px-12 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap items-center gap-3 justify-center"
        >
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === category.id
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:border-purple-500/30 hover:text-purple-300'
              }`}
            >
              <span>{category.name}</span>
              <span className="text-xs opacity-60">({category.count})</span>
            </button>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-xl mx-auto"
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-full bg-gray-900/60 border border-white/10 text-gray-300 focus-within:border-purple-500/40 focus-within:ring-2 focus-within:ring-purple-500/20 transition">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search articles"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-500"
              type="search"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// BLOG CARD
// ============================================================================

function BlogCard({
  post,
  index,
}: {
  post: (typeof blogPosts)[0];
  index: number;
}) {
  const Icon = post.icon;

  return (
    <Link
      href={`/blog/${post.id}`}
      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 rounded-2xl"
      aria-label={`Read ${post.title}`}
    >
      <motion.article
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className="h-full"
      >
        <div className="relative h-full p-6 rounded-2xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 backdrop-blur-xl border border-white/5 hover:border-purple-500/30 transition-all duration-500 shadow-xl shadow-black/20">
          {/* Top accent */}
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-purple-400/30 transition-colors" />

          <div className="relative mb-5 h-28 w-full rounded-xl overflow-hidden border border-white/5 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent group-hover:from-purple-500/20 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 group-hover:bg-white/10 transition-all duration-500">
                <Icon className="w-8 h-8 text-purple-400 group-hover:text-purple-300 transition-colors" />
              </div>
            </div>
          </div>

          {/* Icon header */}
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Icon className="w-5 h-5 text-purple-400" />
            </div>
            <span className="px-2.5 py-1 rounded-full bg-gray-800/50 text-gray-400 text-xs">
              {post.category}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-white mb-3 group-hover:text-purple-300 transition-colors line-clamp-2">
            {post.title}
          </h3>

          {/* Excerpt */}
          <p className="text-sm text-gray-400 mb-4 line-clamp-3">
            {post.excerpt}
          </p>

          {/* Meta */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-white/5">
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
            <span className="flex items-center gap-2 text-sm text-purple-400 font-medium">
              <span>Read More</span>
              <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </motion.article>
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
    <section className="relative py-16 bg-gradient-to-b from-[#0a0f1c] via-[#0d1421] to-[#0a0f1c]">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/3 -left-32 w-96 h-96 rounded-full bg-purple-500/5 blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/3 -right-32 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 lg:px-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-2xl font-bold text-white mb-8"
        >
          Latest Articles
        </motion.h2>

        {posts.length ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, index) => (
              <BlogCard key={post.id} post={post} index={index} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/5 bg-gray-900/50 p-10 text-center text-gray-400">
            No articles match your search. Try a different keyword or category.
          </div>
        )}

        {/* Load more */}
        {hasMore ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex justify-center mt-12"
          >
            <button
              onClick={onLoadMore}
              className="flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-white font-medium hover:border-purple-500/30 hover:bg-purple-500/10 transition-all"
            >
              <span>Load More Articles</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        ) : null}
      </div>
    </section>
  );
}

// ============================================================================
// NEWSLETTER CTA
// ============================================================================

function NewsletterCTA() {
  return (
    <section className="relative py-24 bg-gradient-to-b from-[#0d1421] to-[#0a0f1c]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-500/5 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative p-10 rounded-3xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 backdrop-blur-xl border border-white/5 shadow-2xl shadow-black/30"
        >
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />

          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 mb-6">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-purple-400 font-medium">
                Stay Informed
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Subscribe to Our Newsletter
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Get the latest insights on compliance management, regulatory
              updates, and product news delivered to your inbox.
            </p>

            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-5 py-3 rounded-full bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
              <motion.button
                type="submit"
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 0 40px rgba(168, 85, 247, 0.4)',
                }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
              >
                <span>Subscribe</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </form>

            <p className="text-xs text-gray-500 mt-4">
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </motion.div>
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
    <div className="relative min-h-screen mk-page-bg">
      {/* Fixed particle background */}
      <div className="fixed inset-0 z-0">
        <div className="opacity-30">
          <CinematicField />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/3 via-transparent to-cyan-500/3" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <BlogHero />
        <VisualDivider gradient />
        <FeaturedPost />
        <CategoryFilter
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <BlogGrid
          posts={visiblePosts}
          hasMore={hasMore}
          onLoadMore={() => setVisibleCount((count) => count + 6)}
        />
        <VisualDivider gradient />
        <NewsletterCTA />
      </div>
    </div>
  );
}
