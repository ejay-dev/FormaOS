'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/stores/app';
import { WelcomeStep } from './steps/WelcomeStep';
import { FrameworkStep } from './steps/FrameworkStep';
import { ObligationStep } from './steps/ObligationStep';
import { InviteStep } from './steps/InviteStep';
import { CompleteStep } from './steps/CompleteStep';

const TOTAL_STEPS = 5;

const STEP_LABELS = [
  'Welcome',
  'Framework',
  'Obligation',
  'Invite Team',
  'Ready',
];

export interface OnboardingState {
  industry: string;
  industryConfirmed: boolean;
  frameworkActivated: boolean;
  frameworkName: string;
  obligationCreated: boolean;
  teamInvited: boolean;
  inviteCount: number;
}

function StepIndicator({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-md mx-auto">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div key={i} className="flex items-center">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold tabular-nums transition-all duration-300 ${
              i < currentStep
                ? 'bg-success text-background'
                : i === currentStep
                  ? 'bg-primary text-primary-foreground ring-2 ring-ring ring-offset-2 ring-offset-background'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {i < currentStep ? '\u2713' : i + 1}
          </div>
          {i < totalSteps - 1 && (
            <div
              className={`w-12 h-0.5 transition-all duration-300 ${
                i < currentStep ? 'bg-success' : 'bg-muted'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

export function OnboardingWizard() {
  const organization = useAppStore((s) => s.organization);
  const user = useAppStore((s) => s.user);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [state, setState] = useState<OnboardingState>({
    industry: organization?.industry ?? 'other',
    industryConfirmed: false,
    frameworkActivated: false,
    frameworkName: '',
    obligationCreated: false,
    teamInvited: false,
    inviteCount: 0,
  });

  const goNext = useCallback(() => {
    if (step < TOTAL_STEPS - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  }, [step]);

  const goBack = useCallback(() => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  }, [step]);

  const updateState = useCallback((updates: Partial<OnboardingState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const userName = user?.name?.split(' ')[0] || 'there';

  // Focus trap. The wizard is a modal dialog covering the whole app shell, so
  // without this a keyboard user tabs straight past it into the app behind —
  // reachable but invisible, and the wizard cannot be completed by keyboard.
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const FOCUSABLE =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const focusables = () =>
      Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );

    // Move focus into the dialog on open and on every step change, otherwise
    // focus stays on whatever triggered it and the trap has nothing to hold.
    focusables()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && (active === first || !panel.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    panel.addEventListener('keydown', onKeyDown);
    return () => panel.removeEventListener('keydown', onKeyDown);
  }, [step]);

  return (
    // The wizard covers the whole app shell, so it has to hold focus:
    // without the trap, keyboard users tab into the app behind it.
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-wizard-step"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm"
    >
      <div className="w-full max-w-2xl mx-auto px-4">
        {/* Step indicator */}
        <div className="mb-8">
          <StepIndicator currentStep={step} totalSteps={TOTAL_STEPS} />
          <p
            id="onboarding-wizard-step"
            className="text-center text-xs text-muted-foreground mt-2"
          >
            {STEP_LABELS[step]}
          </p>
        </div>

        {/* Step content */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-8 min-h-[420px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {step === 0 && (
                <WelcomeStep
                  userName={userName}
                  state={state}
                  updateState={updateState}
                  onNext={goNext}
                />
              )}
              {step === 1 && (
                <FrameworkStep
                  state={state}
                  updateState={updateState}
                  onNext={goNext}
                  onBack={goBack}
                />
              )}
              {step === 2 && (
                <ObligationStep
                  state={state}
                  updateState={updateState}
                  onNext={goNext}
                  onBack={goBack}
                />
              )}
              {step === 3 && (
                <InviteStep
                  state={state}
                  updateState={updateState}
                  onNext={goNext}
                  onBack={goBack}
                />
              )}
              {step === 4 && <CompleteStep state={state} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
