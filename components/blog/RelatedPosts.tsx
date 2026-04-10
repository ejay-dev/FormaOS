'use client';

import Link from 'next/link';
import { CalendarDays, Clock, ArrowRight } from 'lucide-react';

interface RelatedPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
}

interface RelatedPostsProps {
  posts: RelatedPost[];
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <div className="mt-16 space-y-6">
      <h3 className="text-lg font-semibold text-white">Related Articles</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.id}`}
            className="group flex flex-col gap-3 rounded-2xl border border-white/5 bg-gray-900/50 p-5 transition hover:border-purple-400/40 hover:bg-purple-500/10"
          >
            <span className="inline-flex self-start rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs font-medium text-purple-300 border border-purple-500/30">
              {post.category}
            </span>
            <h4 className="text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-purple-200 transition-colors">
              {post.title}
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
              {post.excerpt}
            </p>
            <div className="mt-auto flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {post.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {post.readTime}
              </span>
            </div>
            <span className="flex items-center gap-1 text-xs font-medium text-purple-300 group-hover:text-purple-200 transition-colors">
              Read article
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
