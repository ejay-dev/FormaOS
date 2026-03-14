'use client';

import Link from 'next/link';
import { getSignInUrl, getSignUpUrl } from '@/lib/urls';

const signInUrl = getSignInUrl();
const signUpUrl = getSignUpUrl({ plan: 'pro', source: 'header_cta' });

export function HeaderCTA() {
  return (
    <div className="flex items-center gap-2.5 whitespace-nowrap text-[13.5px] lg:text-[14px]">
      <Link
        href={signInUrl}
        className="mk-btn mk-btn-ghost px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap"
      >
        Login
      </Link>
      <Link
        href="/contact"
        className="mk-btn mk-btn-secondary px-4 py-1.5 whitespace-nowrap"
      >
        Contact
      </Link>
      <Link
        href={signUpUrl}
        className="mk-btn mk-btn-primary px-5 py-1.5 whitespace-nowrap"
      >
        <span>Start Free</span>
      </Link>
    </div>
  );
}
