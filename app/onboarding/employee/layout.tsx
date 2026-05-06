import type { ReactNode } from 'react';

export const dynamic = 'force-dynamic';

/**
 * Standalone layout for the employee onboarding wizard.
 * No sidebar, no topbar — full focus experience.
 * Matches the visual language of the main app (dark glass).
 */
export default function EmployeeOnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] font-sans antialiased">
      {children}
    </div>
  );
}
