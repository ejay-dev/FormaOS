'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

interface MockBrowserChromeProps {
  children: ReactNode;
  url?: string;
  height?: string;
  className?: string;
}

/**
 * MockBrowserChrome
 * Wraps content in a macOS-style browser window frame
 * matching the FormaOS app design system.
 */
export function MockBrowserChrome({
  children,
  url = 'app.formaos.com.au / dashboard',
  height = 'h-[480px]',
  className = '',
}: MockBrowserChromeProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{
        scale: 1.01,
        boxShadow:
          '0 0 80px rgba(0,212,251,0.1), 0 0 160px rgba(160,131,255,0.04)',
      }}
      className={`rounded-xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50 bg-[#0a0f1e] cursor-default select-none ${className}`}
    >
      {/* Browser chrome bar */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-2 px-4 h-9 bg-[#060d1a] border-b border-white/[0.08]"
      >
        {/* Traffic lights */}
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        {/* URL bar */}
        <div className="flex-1 mx-4 h-5 rounded bg-white/5 flex items-center px-3">
          <span className="text-[10px] text-white/40 font-mono">{url}</span>
        </div>
        {/* Avatar */}
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
          <span className="text-[8px] font-bold text-white">FO</span>
        </div>
      </motion.div>

      {/* App content */}
      <div className={`flex ${height}`}>{children}</div>
    </motion.div>
  );
}

export default MockBrowserChrome;
