'use client';

import Link from 'next/link';

const appBase = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.formaos.com.au')
  .replace(/\/$/, '');

export function HeaderCTA() {
  return (
    <div className="hidden md:flex items-center gap-3 text-[14px] lg:text-[15px]">
      <Link
        href={`${appBase}/auth/signin`}
        className="mk-nav-link px-3 py-2 text-gray-300 hover:text-white transition-colors rounded-lg"
      >
        Login
      </Link>
      <Link
        href="/pricing"
        className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-white/15 bg-white/5 font-medium hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
      >
        Plans
      </Link>
      <Link
        href={`${appBase}/auth/signup?plan=pro&source=header_cta`}
        className="inline-flex items-center justify-center px-4 lg:px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium shadow-[0_0_20px_rgba(0,212,251,0.3)] hover:shadow-[0_0_30px_rgba(0,212,251,0.4)] transition-all active:scale-[0.98]"
      >
        Start Free
      </Link>
    </div>
  );
}
