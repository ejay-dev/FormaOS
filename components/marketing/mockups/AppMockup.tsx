'use client';

import { MockBrowserChrome } from './MockBrowserChrome';
import { MockSidebar, type MockIndustry } from './MockSidebar';
import { MockTopbar } from './MockTopbar';
import { NDISMockContent } from './NDISMockContent';
import { HealthcareMockContent } from './HealthcareMockContent';
import { FinancialMockContent } from './FinancialMockContent';
import { ChildcareMockContent } from './ChildcareMockContent';
import { ConstructionMockContent } from './ConstructionMockContent';
import { CompareObligationsContent } from './CompareObligationsContent';
import type { ReactNode } from 'react';

export type MockVariant =
  | 'ndis'
  | 'healthcare'
  | 'financial'
  | 'childcare'
  | 'construction'
  | 'compare';

interface AppMockupProps {
  variant?: MockVariant;
  industry?: MockIndustry;
  height?: string;
  className?: string;
  children?: ReactNode;
}

const VARIANT_INDUSTRY: Record<MockVariant, MockIndustry> = {
  ndis: 'NDIS Provider',
  healthcare: 'Healthcare',
  financial: 'Financial Services',
  childcare: 'Childcare',
  construction: 'Construction',
  compare: 'NDIS Provider',
};

const VARIANT_CONTENT: Record<MockVariant, React.ComponentType> = {
  ndis: NDISMockContent,
  healthcare: HealthcareMockContent,
  financial: FinancialMockContent,
  childcare: ChildcareMockContent,
  construction: ConstructionMockContent,
  compare: CompareObligationsContent,
};

/**
 * AppMockup
 * Full-app mockup with browser chrome, sidebar, topbar, and industry content.
 * Drop-in replacement for any marketing page embedded app demo.
 */
export function AppMockup({
  variant = 'ndis',
  industry,
  height = 'h-[480px]',
  className = '',
  children,
}: AppMockupProps) {
  const resolvedIndustry = industry ?? VARIANT_INDUSTRY[variant];
  const Content = VARIANT_CONTENT[variant];

  return (
    <MockBrowserChrome height={height} className={className}>
      {/* Sidebar */}
      <MockSidebar industry={resolvedIndustry} />
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <MockTopbar />
        {children ?? <Content />}
      </div>
    </MockBrowserChrome>
  );
}

export default AppMockup;
