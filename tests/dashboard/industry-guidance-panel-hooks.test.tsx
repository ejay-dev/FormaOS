import { render } from '@testing-library/react';
import { IndustryGuidancePanel } from '@/components/dashboard/IndustryGuidancePanel';

const completionCounts = {
  tasks: 0,
  evidence: 0,
  members: 0,
  complianceChecks: 0,
  reports: 0,
  frameworks: 0,
  policies: 0,
  incidents: 0,
  registers: 0,
  workflows: 0,
  patients: 0,
  orgProfileComplete: false,
};

describe('IndustryGuidancePanel', () => {
  it('does not violate hook order when loading state changes', () => {
    const ui = (
      <IndustryGuidancePanel
        industry="healthcare"
        completionCounts={completionCounts}
        complianceScore={0}
        isLoading={true}
      />
    );

    const { rerender } = render(ui);

    expect(() =>
      rerender(
        <IndustryGuidancePanel
          industry="healthcare"
          completionCounts={completionCounts}
          complianceScore={0}
          isLoading={false}
        />,
      ),
    ).not.toThrow();
  });
});
