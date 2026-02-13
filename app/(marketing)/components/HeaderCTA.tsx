'use client';

import Link from 'next/link';

const appBase = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.formaos.com.au')
  .replace(/\/$/, '');

export function HeaderCTA() {
  return (
    <div className="flex items-center gap-2.5 whitespace-nowrap text-[13.5px] lg:text-[14px]">
      <Link
        href={`${appBase}/auth/signin`}
        className="mk-btn mk-btn-ghost px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap"
      >
        Login
      </Link>
      <Link
        href="/pricing"
        className="mk-btn mk-btn-secondary px-4 py-1.5 whitespace-nowrap"
      >
        Plans
      </Link>
      <Link
        href={`${appBase}/auth/signup?plan=pro&source=header_cta`}
        className="mk-btn mk-btn-primary px-5 py-1.5 whitespace-nowrap"
      >
        <span>Start Free</span>
      </Link>
    </div>
  );
}
