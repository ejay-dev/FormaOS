/**
 * Demo Dashboard Wrapper
 * Wraps dashboard sections with demo-friendly classes for walkthrough targeting
 */

'use client';

import { ReactNode } from 'react';
import { useDemo } from '@/lib/demo/demo-context';

interface DemoDashboardWrapperProps {
  children: ReactNode;
  section: 'score' | 'timeline' | 'evidence' | 'tasks' | 'policies' | 'controls';
}

const SECTION_CLASSES: Record<string, string> = {
  score: 'compliance-score-widget',
  timeline: 'automation-timeline',
  evidence: 'evidence-section',
  tasks: 'tasks-section',
  policies: 'policies-section',
  controls: 'controls-section',
};

export function DemoDashboardWrapper({ children, section }: DemoDashboardWrapperProps) {
  const { isDemoMode } = useDemo();

  return (
    <div className={isDemoMode ? SECTION_CLASSES[section] : ''}>
      {children}
    </div>
  );
}
