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
      className={`mk-page-shell relative min-h-screen overflow-x-hidden mk-page-bg mk-marketing-flow ${className}`}
      data-marketing-shell="true"
    >
      <div className="mk-page-shell__content relative z-0">{children}</div>
    </div>
  );
}

export default MarketingPageShell;
