'use client';

/**
 * =========================================================
 * EMPLOYEE ONBOARDING WIZARD
 * =========================================================
 *
 * 5-step industry-aware wizard for invited team members.
 *
 * Steps: Welcome → Mission → Tools → Profile → Ready
 *
 * Design: Dark glassmorphism, mobile-first, Framer Motion
 * transitions. Industry content is derived from the
 * `getIndustryContent` helper in employee-journey.ts.
 * =========================================================
 */

import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  getIndustryContent,
  getStepIndex,
  EMPLOYEE_ONBOARDING_STEPS,
  TOTAL_EMPLOYEE_STEPS,
  type EmployeeOnboardingStep,
} from '@/lib/onboarding/employee-journey';
import { WelcomeStep } from './steps/WelcomeStep';
import { MissionStep } from './steps/MissionStep';
import { ToolsStep } from './steps/ToolsStep';
import { ProfileStep } from './steps/ProfileStep';
import { ReadyStep } from './steps/ReadyStep';

// ── Motion config ─────────────────────────────────────────

const SLIDE_VARIANTS = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
  }),
};

const SPRING = { type: 'spring', stiffness: 340, damping: 32 } as const;

// ── Logo ─────────────────────────────────────────────────

function FormaLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary shadow-md">
        <span className="text-[10px] font-black text-primary-foreground tracking-tight">
          F
        </span>
      </div>
      <span className="text-sm font-black tracking-tight text-foreground">
        FormaOS
      </span>
    </div>
  );
}

// ── Progress indicator ────────────────────────────────────

function StepProgress({
  currentStep,
  totalSteps,
  stepLabel,
}: {
  currentStep: number;
  totalSteps: number;
  stepLabel: string;
}) {
  const percent = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground tabular-nums">
          Step {currentStep + 1} of {totalSteps}
        </span>
        <span className="text-[10px] font-semibold text-muted-foreground">
          {stepLabel}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-1">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
    </div>
  );
}

// ── Step labels ───────────────────────────────────────────

const STEP_LABELS: Record<EmployeeOnboardingStep, string> = {
  welcome: 'Welcome',
  mission: 'Your mission',
  tools: 'Your tools',
  profile: 'Your profile',
  ready: 'Ready',
};

// ── Wizard props ──────────────────────────────────────────

interface EmployeeOnboardingWizardProps {
  firstName: string;
  displayName: string;
  phone: string;
  userEmail: string;
  orgName: string;
  industry: string | null;
  userRole: string;
  initialStep: EmployeeOnboardingStep;
  errorCode: string | null;
  saveProfileAction: (formData: FormData) => Promise<void>;
  completeAction: (formData: FormData) => Promise<void>;
  skipAction: () => Promise<void>;
}

// ── Wizard ────────────────────────────────────────────────

export function EmployeeOnboardingWizard({
  firstName,
  displayName,
  phone,
  orgName,
  industry,
  initialStep,
  errorCode,
  saveProfileAction,
  completeAction,
  skipAction,
}: EmployeeOnboardingWizardProps) {
  const [currentStep, setCurrentStep] =
    useState<EmployeeOnboardingStep>(initialStep);
  const [direction, setDirection] = useState(1);

  const industryContent = getIndustryContent(industry);
  const stepIndex = getStepIndex(currentStep);

  const goNext = useCallback(() => {
    const idx = getStepIndex(currentStep);
    if (idx < EMPLOYEE_ONBOARDING_STEPS.length - 1) {
      setDirection(1);
      setCurrentStep(EMPLOYEE_ONBOARDING_STEPS[idx + 1]);
    }
  }, [currentStep]);

  const goBack = useCallback(() => {
    const idx = getStepIndex(currentStep);
    if (idx > 0) {
      setDirection(-1);
      setCurrentStep(EMPLOYEE_ONBOARDING_STEPS[idx - 1]);
    }
  }, [currentStep]);

  // For the profile step skip, we jump to the ready step
  const skipProfile = useCallback(() => {
    setDirection(1);
    setCurrentStep('ready');
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 w-full border-b border-border bg-[hsl(var(--background))]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between px-5 py-4">
          <FormaLogo />
          <StepProgress
            currentStep={stepIndex}
            totalSteps={TOTAL_EMPLOYEE_STEPS}
            stepLabel={STEP_LABELS[currentStep]}
          />
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex flex-1 items-start justify-center px-5 py-8 sm:py-14">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={SPRING}
            >
              {currentStep === 'welcome' && (
                <WelcomeStep
                  firstName={firstName}
                  orgName={orgName}
                  industryLabel={industryContent.industryLabel}
                  roleLabel={industryContent.roleLabel}
                  onNext={goNext}
                />
              )}

              {currentStep === 'mission' && (
                <MissionStep
                  orgName={orgName}
                  missionContent={industryContent.missionContent}
                  onNext={goNext}
                  onBack={goBack}
                />
              )}

              {currentStep === 'tools' && (
                <ToolsStep
                  tools={industryContent.tools}
                  onNext={goNext}
                  onBack={goBack}
                />
              )}

              {currentStep === 'profile' && (
                <ProfileStep
                  displayName={displayName}
                  phone={phone}
                  errorCode={errorCode}
                  saveProfileAction={saveProfileAction}
                  onBack={goBack}
                  onSkip={skipProfile}
                />
              )}

              {currentStep === 'ready' && (
                <ReadyStep
                  firstName={firstName}
                  orgName={orgName}
                  industryContent={industryContent}
                  completeAction={completeAction}
                  skipAction={skipAction}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="py-6 text-center">
        <p className="text-[10px] text-muted-foreground">
          FormaOS &mdash; Compliance Management Platform
        </p>
      </footer>
    </div>
  );
}
