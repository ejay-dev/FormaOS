// __tests__/onboarding/onboarding-logic.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import OnboardingFlow from '@/components/onboarding/OnboardingFlow';
import { jest } from '@jest/globals';

jest.mock('next/navigation');

const mockPush = jest.fn();

beforeEach(() => {
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
});

describe('Onboarding Logic', () => {
  describe('No Pricing Redirect Logic', () => {
    it('should not redirect to pricing during onboarding', async () => {
      render(<OnboardingFlow />);

      // Complete first step
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));

      // Complete company info step
      fireEvent.change(screen.getByLabelText(/company name/i), {
        target: { value: 'Test Company' },
      });
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));

      // Complete team size step
      fireEvent.click(screen.getByLabelText(/1-10 employees/i));
      fireEvent.click(screen.getByRole('button', { name: /continue/i }));

      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalledWith(
          expect.stringContaining('/pricing'),
        );
      });
    });

    it('should complete onboarding without payment prompts', async () => {
      render(<OnboardingFlow />);

      // Navigate through all onboarding steps
      const steps = [
        {
          label: /welcome/i,
          action: () =>
            fireEvent.click(
              screen.getByRole('button', { name: /get started/i }),
            ),
        },
        {
          label: /company info/i,
          action: () => {
            fireEvent.change(screen.getByLabelText(/company name/i), {
              target: { value: 'Test Company' },
            });
            fireEvent.click(screen.getByRole('button', { name: /continue/i }));
          },
        },
        {
          label: /team size/i,
          action: () => {
            fireEvent.click(screen.getByLabelText(/1-10 employees/i));
            fireEvent.click(screen.getByRole('button', { name: /continue/i }));
          },
        },
      ];

      for (const step of steps) {
        step.action();
        await waitFor(() => {
          expect(screen.queryByText(/upgrade/i)).not.toBeInTheDocument();
          expect(screen.queryByText(/pricing/i)).not.toBeInTheDocument();
          expect(screen.queryByText(/payment/i)).not.toBeInTheDocument();
        });
      }

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should save onboarding data without subscription requirements', async () => {
      const mockSave = jest.fn();

      render(<OnboardingFlow onSave={mockSave} />);

      // Complete onboarding flow
      fireEvent.change(screen.getByLabelText(/company name/i), {
        target: { value: 'Test Company' },
      });
      fireEvent.click(screen.getByLabelText(/1-10 employees/i));
      fireEvent.click(screen.getByRole('button', { name: /complete setup/i }));

      await waitFor(() => {
        expect(mockSave).toHaveBeenCalledWith({
          company_name: 'Test Company',
          team_size: '1-10',
          subscription_required: false,
        });
      });
    });
  });

  describe('User Journey Continuity', () => {
    it('should maintain progress across page refreshes', async () => {
      // Simulate saved onboarding state
      const savedState = {
        currentStep: 2,
        company_name: 'Test Company',
        team_size: '1-10',
      };

      render(<OnboardingFlow initialState={savedState} />);

      expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument();
      expect(
        screen.getByRole('radio', { name: /1-10 employees/i }),
      ).toBeChecked();
    });

    it('should handle incomplete onboarding gracefully', async () => {
      render(<OnboardingFlow />);

      // Try to skip steps
      fireEvent.click(screen.getByRole('button', { name: /skip/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/please complete required fields/i),
        ).toBeInTheDocument();
      });
    });
  });
});
