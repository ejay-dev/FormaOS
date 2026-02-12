'use client';

import Link from 'next/link';

const appBase = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.formaos.com.au')
  .replace(/\/$/, '');

export function HeaderCTA() {
  return (
    <div className="flex items-center gap-2.5 text-[13.5px] lg:text-[14px]">
      <Link
        href={`${appBase}/auth/signin`}
        className="px-3.5 py-1.5 text-slate-400 hover:text-white transition-colors rounded-lg font-medium"
      >
        Login
      </Link>
      <Link
        href="/pricing"
        className="inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-white/[0.12] bg-white/[0.04] font-medium text-slate-200 hover:bg-white/[0.08] hover:border-white/[0.18] hover:text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
      >
        Plans
      </Link>
      <Link
        href={`${appBase}/auth/signup?plan=pro&source=header_cta`}
        className="group relative inline-flex items-center justify-center px-5 py-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-[0_0_20px_rgba(0,212,251,0.25),0_0_4px_rgba(0,212,251,0.4)] hover:shadow-[0_0_32px_rgba(0,212,251,0.35),0_0_8px_rgba(0,212,251,0.5)] transition-all active:scale-[0.97] overflow-hidden"
      >
        <span className="relative z-10">Start Free</span>
        <span className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Link>
    </div>
  );
}
