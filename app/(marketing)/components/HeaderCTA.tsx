'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { easing, duration } from '@/config/motion';
const appBase = 'https://app.formaos.com.au';


export function HeaderCTA() {
  return (
    <div className="hidden md:flex items-center gap-2 lg:gap-3 text-[14px] lg:text-[15px]">
      <Link
        href={`${appBase}/auth/signin`}
        className="px-3 lg:px-4 py-2 text-foreground/80 hover:text-foreground transition-colors rounded-lg"
      >
        Login
      </Link>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: duration.fast, ease: easing.signature }}
      >
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center px-3 lg:px-4 py-2 rounded-lg border border-white/20 bg-white/5 font-medium hover:bg-white/10 transition-colors"
        >
          Plans
        </Link>
      </motion.div>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: duration.fast, ease: easing.signature }}
      >
        <Link
          href={`${appBase}/auth/signup?plan=pro`}
          className="inline-flex items-center justify-center px-4 lg:px-5 py-2 rounded-lg bg-primary text-primary-foreground font-medium shadow-[0_0_20px_rgba(0,212,251,0.3)] hover:shadow-[0_0_30px_rgba(0,212,251,0.4)] transition-shadow"
        >
          Start Free
        </Link>
      </motion.div>
    </div>
  );
}
