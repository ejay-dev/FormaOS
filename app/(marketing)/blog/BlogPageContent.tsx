'use client';

import { useRef, useState } from 'react';
import {
  BookOpen,
  ArrowRight,
  Clock,
  User,
  Tag,
  TrendingUp,
  Shield,
  FileCheck,
  Zap,
  Building2,
  ChevronRight,
  Sparkles,
  CalendarDays,
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { VisualDivider } from '@/components/motion';
import CinematicField from '../components/motion/CinematicField';

// ============================================================================
// BLOG DATA
// ============================================================================

const categories = [
  { id: 'all', name: 'All Posts', count: 12 },
  { id: 'compliance', name: 'Compliance', count: 4 },
  { id: 'technology', name: 'Technology', count: 3 },
  { id: 'ndis', name: 'NDIS', count: 2 },
  { id: 'security', name: 'Security', count: 2 },
  { id: 'updates', name: 'Product Updates', count: 1 },
];

const featuredPost = {
  id: 'compliance-operating-system',
  title: 'Why Your Organization Needs a Compliance Operating System',
  excerpt:
    'Discover how modern compliance operating systems are replacing fragmented tools and manual processes to deliver real-time assurance, defensible audit trails, and operational efficiency.',
  author: 'FormaOS Team',
  date: 'January 15, 2025',
  readTime: '8 min read',
  category: 'Compliance',
  image: '/blog/compliance-os.jpg',
  featured: true,
};

const blogPosts = [
  {
    id: 'ndis-practice-standards-2025',
    title: 'NDIS Practice Standards 2025: What Providers Need to Know',
    excerpt:
      'A comprehensive guide to the updated NDIS Practice Standards and how to ensure your organization remains compliant with the new requirements.',
    author: 'Compliance Team',
    date: 'January 10, 2025',
    readTime: '6 min read',
    category: 'NDIS',
    icon: Building2,
  },
  {
    id: 'immutable-audit-trails',
    title: 'The Power of Immutable Audit Trails in Regulatory Defense',
    excerpt:
      'Learn how immutable audit trails provide bulletproof evidence chains that satisfy even the most rigorous regulatory scrutiny.',
    author: 'Security Team',
    date: 'January 5, 2025',
    readTime: '5 min read',
    category: 'Security',
    icon: Shield,
  },
  {
    id: 'automated-evidence-collection',
    title: 'From Manual to Automatic: Evidence Collection Reimagined',
    excerpt:
      'See how FormaOS automatically generates compliance evidence as work is completed, eliminating retroactive documentation burden.',
    author: 'Product Team',
    date: 'December 28, 2024',
    readTime: '4 min read',
    category: 'Technology',
    icon: Zap,
  },
  {
    id: 'governance-framework-design',
    title: 'Designing a Governance Framework That Actually Works',
    excerpt:
      'Best practices for structuring policies, controls, and workflows that create accountability and drive compliance outcomes.',
    author: 'FormaOS Team',
    date: 'December 20, 2024',
    readTime: '7 min read',
    category: 'Compliance',
    icon: FileCheck,
  },
  {
    id: 'real-time-compliance-monitoring',
    title: 'Real-Time Compliance Monitoring: Beyond the Dashboard',
    excerpt:
      'How modern compliance platforms provide actionable insights, not just metrics, to keep your organization audit-ready.',
    author: 'Product Team',
    date: 'December 15, 2024',
    readTime: '5 min read',
    category: 'Technology',
    icon: TrendingUp,
  },
  {
    id: 'security-soc2-journey',
    title: 'Our SOC 2 Journey: Lessons Learned Building FormaOS',
    excerpt:
      'A transparent look at how we applied our own principles to achieve SOC 2 compliance and what we learned along the way.',
    author: 'Engineering Team',
    date: 'December 8, 2024',
    readTime: '6 min read',
    category: 'Security',
    icon: Shield,
  },
];

// ============================================================================
// HERO SECTION
// ============================================================================

function BlogHero() {
  const containerRef = useRef<HTMLDivElement>(null);
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
                <FileCheck className="w-4 h-4 text-purple-400" />
                <span>12 Articles</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/50 border border-gray-700/50">
                <Tag className="w-4 h-4 text-pink-400" />
                <span>5 Categories</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/50 border border-gray-700/50">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>Updated Weekly</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-6 h-10 rounded-full border-2 border-gray-600/50 flex items-start justify-center p-2"
        >
          <motion.div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ============================================================================
// FEATURED POST
// ============================================================================

function FeaturedPost() {
  return (
    <section className="relative py-16 bg-gradient-to-b from-[#0a0f1c] via-[#0d1421] to-[#0a0f1c]">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative group"
        >
          <div className="relative p-8 lg:p-12 rounded-3xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 backdrop-blur-xl border border-white/5 hover:border-purple-500/20 transition-all duration-500 shadow-2xl shadow-black/30 overflow-hidden">
            {/* Top accent */}
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent" />

            {/* Glow effect on hover */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-cyan-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />

            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
              {/* Image placeholder */}
              <div className="w-full lg:w-1/2 aspect-video rounded-2xl bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-cyan-500/20 flex items-center justify-center border border-white/5">
                <div className="text-center">
                  <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
                  <span className="text-gray-500 text-sm">Featured Image</span>
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

                <motion.button
                  whileHover={{ x: 5 }}
                  className="flex items-center gap-2 text-purple-400 font-medium group/btn"
                >
                  <span>Read Article</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// CATEGORY FILTER
// ============================================================================

function CategoryFilter() {
  const [activeCategory, setActiveCategory] = useState('all');

  return (
    <section className="relative py-8 bg-gradient-to-b from-[#0d1421] to-[#0a0f1c]">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
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
              onClick={() => setActiveCategory(category.id)}
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
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group"
    >
      <div className="relative h-full p-6 rounded-2xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 backdrop-blur-xl border border-white/5 hover:border-purple-500/30 transition-all duration-500 shadow-xl shadow-black/20">
        {/* Top accent */}
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-purple-400/30 transition-colors" />

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
          <button className="flex items-center gap-2 text-sm text-purple-400 font-medium">
            <span>Read More</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

// ============================================================================
// BLOG GRID
// ============================================================================

function BlogGrid() {
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post, index) => (
            <BlogCard key={post.id} post={post} index={index} />
          ))}
        </div>

        {/* Load more */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex justify-center mt-12"
        >
          <button className="flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm text-white font-medium hover:border-purple-500/30 hover:bg-purple-500/10 transition-all">
            <span>Load More Articles</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>
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
  return (
    <div className="relative min-h-screen bg-[#0a0f1c]">
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
        <CategoryFilter />
        <BlogGrid />
        <VisualDivider gradient />
        <NewsletterCTA />
      </div>
    </div>
  );
}
