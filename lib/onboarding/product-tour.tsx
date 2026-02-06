'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/stores/app';

export type TourStep = {
  id: string;
  title: string;
  description: string;
  targetSelector: string;
  route: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
};

const TOUR_STEPS: TourStep[] = [
  {
    id: 'dashboard',
    title: 'Dashboard Overview',
    description:
      'Track compliance health, key metrics, and team-wide readiness at a glance.',
    targetSelector: '[data-tour="dashboard-overview"]',
    route: '/app',
    position: 'bottom',
  },
  {
    id: 'tasks',
    title: 'Tasks & Controls',
    description:
      'Create compliance tasks, assign owners, and track completion in one place.',
    targetSelector: '[data-tour="tasks-header"]',
    route: '/app/tasks',
    position: 'bottom',
  },
  {
    id: 'evidence',
    title: 'Evidence Vault',
    description:
      'Upload, verify, and organize evidence artifacts linked to controls and audits.',
    targetSelector: '[data-tour="vault-header"]',
    route: '/app/vault',
    position: 'bottom',
  },
  {
    id: 'reports',
    title: 'Compliance & Reports',
    description:
      'Review compliance gaps and generate audit-ready reports instantly.',
    targetSelector: '[data-tour="reports-header"]',
    route: '/app/reports',
    position: 'bottom',
  },
  {
    id: 'settings',
    title: 'Settings & Governance',
    description:
      'Manage organization details, access controls, and security preferences.',
    targetSelector: '[data-tour="settings-header"]',
    route: '/app/settings',
    position: 'bottom',
  },
];

export type OnboardingState = {
  completed: boolean;
  skipped: boolean;
  lastStep: number;
};

type ProductTourContextValue = {
  steps: TourStep[];
  currentStep: number;
  totalSteps: number;
  isActive: boolean;
  isReady: boolean;
  state: OnboardingState | null;
  startTour: (options?: { fromStep?: number; resetProgress?: boolean }) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  setStep: (step: number) => void;
};

const ProductTourContext = createContext<ProductTourContextValue | undefined>(
  undefined,
);

const clampStep = (value: number) => {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(value, TOUR_STEPS.length - 1));
};

export function ProductTourProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAppStore((s) => s.user);
  const organization = useAppStore((s) => s.organization);
  const [state, setState] = useState<OnboardingState | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const autoStartedRef = useRef(false);

  const persistState = useCallback(async (nextState: OnboardingState) => {
    setState(nextState);
    try {
      await fetch('/api/onboarding-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completed: nextState.completed,
          skipped: nextState.skipped,
          lastStep: nextState.lastStep,
        }),
      });
    } catch (error) {
      console.error('[ProductTour] Failed to persist state:', error);
    }
  }, []);

  const loadState = useCallback(async () => {
    if (!user || !organization) return;
    try {
      const response = await fetch('/api/onboarding-state');
      if (!response.ok) {
        throw new Error(`Failed to load onboarding state: ${response.status}`);
      }
      const data = await response.json();
      const nextState: OnboardingState = {
        completed: Boolean(data.completed),
        skipped: Boolean(data.skipped),
        lastStep: clampStep(Number(data.lastStep ?? 0)),
      };
      setState(nextState);
      setCurrentStep(nextState.lastStep);
    } catch (error) {
      console.error('[ProductTour] Failed to load state:', error);
      setState({ completed: false, skipped: false, lastStep: 0 });
      setCurrentStep(0);
    } finally {
      setIsReady(true);
    }
  }, [user, organization]);

  useEffect(() => {
    if (!user || !organization) return;
    loadState();
  }, [user, organization, loadState]);

  useEffect(() => {
    if (!state || autoStartedRef.current) return;
    if (state.completed || state.skipped) return;
    if (!pathname.startsWith('/app')) return;
    autoStartedRef.current = true;
    setCurrentStep(clampStep(state.lastStep));
    setIsActive(true);
  }, [state, pathname]);

  const startTour = useCallback(
    (options?: { fromStep?: number; resetProgress?: boolean }) => {
      const step = clampStep(options?.fromStep ?? 0);
      setCurrentStep(step);
      setIsActive(true);

      const baseState: OnboardingState = state ?? {
        completed: false,
        skipped: false,
        lastStep: step,
      };

      const nextState: OnboardingState = {
        completed: options?.resetProgress ? false : baseState.completed,
        skipped: options?.resetProgress ? false : baseState.skipped,
        lastStep: step,
      };

      persistState(nextState);
    },
    [persistState, state],
  );

  const setStep = useCallback(
    (step: number) => {
      const nextStep = clampStep(step);
      setCurrentStep(nextStep);
      const baseState = state ?? { completed: false, skipped: false, lastStep: 0 };
      persistState({
        completed: baseState.completed,
        skipped: baseState.skipped,
        lastStep: nextStep,
      });
    },
    [persistState, state],
  );

  const nextStep = useCallback(() => {
    if (currentStep >= TOUR_STEPS.length - 1) {
      setIsActive(false);
      const finalState = {
        completed: true,
        skipped: false,
        lastStep: TOUR_STEPS.length - 1,
      };
      persistState(finalState);
      return;
    }

    const step = currentStep + 1;
    setCurrentStep(step);
    const baseState = state ?? { completed: false, skipped: false, lastStep: 0 };
    persistState({
      completed: baseState.completed,
      skipped: baseState.skipped,
      lastStep: step,
    });
  }, [currentStep, persistState, state]);

  const prevStep = useCallback(() => {
    if (currentStep <= 0) return;
    const step = currentStep - 1;
    setCurrentStep(step);
    const baseState = state ?? { completed: false, skipped: false, lastStep: 0 };
    persistState({
      completed: baseState.completed,
      skipped: baseState.skipped,
      lastStep: step,
    });
  }, [currentStep, persistState, state]);

  const skipTour = useCallback(() => {
    setIsActive(false);
    if (state?.completed) return;
    const nextState: OnboardingState = {
      completed: false,
      skipped: true,
      lastStep: currentStep,
    };
    persistState(nextState);
  }, [currentStep, persistState, state]);

  const value = useMemo(
    () => ({
      steps: TOUR_STEPS,
      currentStep,
      totalSteps: TOUR_STEPS.length,
      isActive,
      isReady,
      state,
      startTour,
      nextStep,
      prevStep,
      skipTour,
      setStep,
    }),
    [currentStep, isActive, isReady, nextStep, prevStep, setStep, skipTour, startTour, state],
  );

  return (
    <ProductTourContext.Provider value={value}>
      {children}
    </ProductTourContext.Provider>
  );
}

export function useProductTour() {
  const context = useContext(ProductTourContext);
  if (!context) {
    throw new Error('useProductTour must be used within ProductTourProvider');
  }
  return context;
}
