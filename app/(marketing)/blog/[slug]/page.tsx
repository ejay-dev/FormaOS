import Link from 'next/link';

export default function BlogPostPlaceholder() {
  return (
    <main className="relative min-h-screen bg-gradient-to-b from-[#0a0f1c] via-[#0d1421] to-[#0a0f1c] pt-28">
      <div className="max-w-3xl mx-auto px-6 lg:px-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm font-medium mb-6">
          Coming soon
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
          This article is on the way
        </h1>
        <p className="text-base sm:text-lg text-gray-400 mb-10">
          We&apos;re finishing the full post and will publish it shortly.
        </p>
        <Link
          href="/blog"
          className="inline-flex items-center justify-center rounded-2xl bg-white/10 text-white px-6 py-3 border border-white/15 hover:border-purple-400/50 hover:bg-purple-500/10 transition"
        >
          Back to Blog
        </Link>
      </div>
    </main>
  );
}
