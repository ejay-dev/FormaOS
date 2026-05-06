import React from 'react';
import { render, screen } from '@testing-library/react';
import { DeduplicationOpportunities } from '@/components/compliance/cross-map-matrix';

describe('DeduplicationOpportunities', () => {
  it('links gap controls to the controls page with framework and control context', () => {
    render(
      <DeduplicationOpportunities
        opportunities={[
          {
            groupName: 'Access control reuse',
            category: 'Access',
            potentialScoreImprovement: 2,
            satisfiedControls: [{ framework: 'soc2', controlId: 'CC6.1' }],
            unsatisfiedControls: [
              { framework: 'iso27001', controlId: 'A.5.15' },
            ],
          },
        ]}
      />,
    );

    const link = screen.getByRole('link', { name: 'Link' });
    expect(link).toHaveAttribute(
      'href',
      '/app/controls?framework=iso27001&control=A.5.15',
    );
  });
});
