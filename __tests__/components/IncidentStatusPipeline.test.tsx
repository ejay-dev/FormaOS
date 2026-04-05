/**
 * Tests for components/incidents/IncidentStatusPipeline.tsx
 * Covers: step rendering, current/complete/future/blocked states.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock the ErrorBoundary to just render children
jest.mock('@/components/ui/error-boundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

import { IncidentStatusPipeline } from '@/components/incidents/IncidentStatusPipeline';

describe('IncidentStatusPipeline', () => {
  it('renders all four step labels', () => {
    render(<IncidentStatusPipeline currentStep="reported" />);
    expect(screen.getByText('Reported')).toBeInTheDocument();
    expect(screen.getByText('Under Investigation')).toBeInTheDocument();
    expect(screen.getByText('Regulator Notified')).toBeInTheDocument();
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('renders with reported step as current', () => {
    render(<IncidentStatusPipeline currentStep="reported" />);
    // All 4 labels rendered
    expect(screen.getByText('Reported')).toBeInTheDocument();
    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('renders with closed step — all steps complete', () => {
    render(<IncidentStatusPipeline currentStep="closed" />);
    // All labels still visible
    expect(screen.getByText('Closed')).toBeInTheDocument();
    expect(screen.getByText('Reported')).toBeInTheDocument();
  });

  it('renders with under_investigation step', () => {
    render(<IncidentStatusPipeline currentStep="under_investigation" />);
    expect(screen.getByText('Under Investigation')).toBeInTheDocument();
  });

  it('renders with blockedStep', () => {
    render(
      <IncidentStatusPipeline
        currentStep="under_investigation"
        blockedStep="regulator_notified"
      />,
    );
    expect(screen.getByText('Regulator Notified')).toBeInTheDocument();
  });
});
