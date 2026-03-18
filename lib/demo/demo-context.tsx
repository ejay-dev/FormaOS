/**
 * Demo Mode Context
 * Manages guided demo state and orchestration
 */

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DemoContextType {
  isDemoMode: boolean;
  currentStep: number;
  totalSteps: number;
  isWalkthroughActive: boolean;
  startDemo: () => void;
  exitDemo: () => void;
  restartDemo: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipWalkthrough: () => void;
  goToStep: (step: number) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

const DEMO_STEPS = 6;
const DEMO_MODE_KEY = 'formaos_demo_mode';
const DEMO_STEP_KEY = 'formaos_demo_step';

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isWalkthroughActive, setIsWalkthroughActive] = useState(false);

  // Load demo state from sessionStorage on mount
  useEffect(() => {
    const savedDemoMode = sessionStorage.getItem(DEMO_MODE_KEY);
    const savedStep = sessionStorage.getItem(DEMO_STEP_KEY);

    if (savedDemoMode === 'true') {
      setIsDemoMode(true);
      setCurrentStep(parseInt(savedStep || '0', 10));
      setIsWalkthroughActive(true);
    }
  }, []);

  // Save demo state to sessionStorage
  useEffect(() => {
    if (isDemoMode) {
      sessionStorage.setItem(DEMO_MODE_KEY, 'true');
      sessionStorage.setItem(DEMO_STEP_KEY, currentStep.toString());
    } else {
      sessionStorage.removeItem(DEMO_MODE_KEY);
      sessionStorage.removeItem(DEMO_STEP_KEY);
    }
  }, [isDemoMode, currentStep]);

  const startDemo = () => {
    setIsDemoMode(true);
    setCurrentStep(0);
    setIsWalkthroughActive(true);

    // Scroll to top for better demo experience
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const exitDemo = () => {
    setIsDemoMode(false);
    setCurrentStep(0);
    setIsWalkthroughActive(false);
    sessionStorage.removeItem(DEMO_MODE_KEY);
    sessionStorage.removeItem(DEMO_STEP_KEY);
  };

  const restartDemo = () => {
    setCurrentStep(0);
    setIsWalkthroughActive(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextStep = () => {
    if (currentStep < DEMO_STEPS - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Completed all steps
      setIsWalkthroughActive(false);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const skipWalkthrough = () => {
    setIsWalkthroughActive(false);
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step < DEMO_STEPS) {
      setCurrentStep(step);
    }
  };

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        currentStep,
        totalSteps: DEMO_STEPS,
        isWalkthroughActive,
        startDemo,
        exitDemo,
        restartDemo,
        nextStep,
        prevStep,
        skipWalkthrough,
        goToStep,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}
