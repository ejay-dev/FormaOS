'use client';

import { type ReactNode } from 'react';

interface MarketingPageShellProps {
  children: ReactNode;
  className?: string;
}

export function MarketingPageShell({
  children,
  className = '',
}: MarketingPageShellProps) {
  return (
    <div
      className={`relative min-h-screen overflow-x-hidden mk-page-bg mk-marketing-flow ${className}`}
    >
      {children}
    </div>
  );
}

export default MarketingPageShell;
