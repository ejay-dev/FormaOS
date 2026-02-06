'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useProductTour } from '@/lib/onboarding/product-tour';
import { Button } from '@/components/ui/button';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 640px)');
    const handleChange = () => setIsMobile(media.matches);
    handleChange();
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  return isMobile;
}

export function ProductTourOverlay() {
  const {
    steps,
    currentStep,
    totalSteps,
    isActive,
    nextStep,
    prevStep,
    skipTour,
  } = useProductTour();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const step = steps[currentStep];

  const [highlightRect, setHighlightRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const routeAttemptsRef = useRef(0);

  const highlightStyle = useMemo(() => {
    if (!highlightRect) return null;
    return {
      top: highlightRect.top - 10,
      left: highlightRect.left - 10,
      width: highlightRect.width + 20,
      height: highlightRect.height + 20,
    };
  }, [highlightRect]);

  useEffect(() => {
    routeAttemptsRef.current = 0;
  }, [step.id]);

  useEffect(() => {
    if (!isActive) {
      setHighlightRect(null);
      return;
    }

    if (pathname !== step.route) {
      routeAttemptsRef.current += 1;
      if (routeAttemptsRef.current > 3) {
        nextStep();
        return;
      }
      router.push(step.route);
      return;
    }

    let cancelled = false;
    let attempts = 0;
    let timer: number | null = null;

    const locateTarget = () => {
      if (cancelled) return;
      const target = document.querySelector(step.targetSelector) as HTMLElement | null;
      if (!target) {
        attempts += 1;
        if (attempts >= 6) {
          nextStep();
          return;
        }
        timer = window.setTimeout(locateTarget, 250);
        return;
      }

      const rect = target.getBoundingClientRect();
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;

      setHighlightRect({
        top: rect.top + scrollY,
        left: rect.left + scrollX,
        width: rect.width,
        height: rect.height,
      });

      if (!isMobile) {
        const tooltipWidth = Math.min(420, window.innerWidth - 32);
        const tooltipHeight = 220;
        let top = rect.top + scrollY;
        let left = rect.left + scrollX;

        switch (step.position) {
          case 'right':
            top = rect.top + scrollY + rect.height / 2 - tooltipHeight / 2;
            left = rect.right + scrollX + 20;
            break;
          case 'left':
            top = rect.top + scrollY + rect.height / 2 - tooltipHeight / 2;
            left = rect.left + scrollX - tooltipWidth - 20;
            break;
          case 'top':
            top = rect.top + scrollY - tooltipHeight - 20;
            left = rect.left + scrollX + rect.width / 2 - tooltipWidth / 2;
            break;
          case 'bottom':
            top = rect.bottom + scrollY + 20;
            left = rect.left + scrollX + rect.width / 2 - tooltipWidth / 2;
            break;
          case 'center':
            top = scrollY + window.innerHeight / 2 - tooltipHeight / 2;
            left = scrollX + window.innerWidth / 2 - tooltipWidth / 2;
            break;
        }

        const minLeft = scrollX + 16;
        const maxLeft = scrollX + window.innerWidth - tooltipWidth - 16;
        const minTop = scrollY + 16;
        const maxTop = scrollY + window.innerHeight - tooltipHeight - 16;

        setTooltipPosition({
          top: Math.min(Math.max(top, minTop), maxTop),
          left: Math.min(Math.max(left, minLeft), maxLeft),
        });
      }

      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    timer = window.setTimeout(locateTarget, 150);

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [isActive, isMobile, nextStep, pathname, router, step]);

  useEffect(() => {
    if (!isActive || !highlightRect || isMobile) return;

    const handleReposition = () => {
      const target = document.querySelector(step.targetSelector) as HTMLElement | null;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      setHighlightRect({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });
    };

    window.addEventListener('scroll', handleReposition, { passive: true });
    window.addEventListener('resize', handleReposition);
    return () => {
      window.removeEventListener('scroll', handleReposition);
      window.removeEventListener('resize', handleReposition);
    };
  }, [highlightRect, isActive, isMobile, step.targetSelector]);

  if (!isActive || !step) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      {highlightStyle ? (
        <div
          className="absolute rounded-2xl border border-white/20 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] transition-all duration-200"
          style={highlightStyle}
        />
      ) : null}

      <div
        className={`absolute z-[100] w-full sm:w-[min(420px,calc(100vw-2rem))] ${
          isMobile
            ? 'bottom-0 left-0 right-0 rounded-t-3xl border-t border-white/10 bg-[hsl(var(--card))] p-6'
            : 'rounded-2xl border border-white/10 bg-[hsl(var(--card))] p-6 shadow-2xl'
        }`}
        style={
          isMobile
            ? undefined
            : {
                top: tooltipPosition.top,
                left: tooltipPosition.left,
              }
        }
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Product Tour
            </p>
            <h3 className="text-lg font-semibold text-slate-100">
              {step.title}
            </h3>
            <p className="mt-2 text-sm text-slate-300">{step.description}</p>
          </div>
          <button
            onClick={skipTour}
            aria-label="Close tour"
            className="rounded-full border border-white/10 p-2 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
          <span>
            Step {currentStep + 1} of {totalSteps}
          </span>
          <div className="flex items-center gap-1">
            {steps.map((_, index) => (
              <span
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-cyan-400'
                    : index < currentStep
                      ? 'w-4 bg-white/30'
                      : 'w-4 bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={skipTour}
            className="text-slate-300"
          >
            Skip Tour
          </Button>
          <div className="flex items-center gap-2">
            {currentStep > 0 ? (
              <Button variant="outline" size="sm" onClick={prevStep}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            ) : null}
            <Button
              size="sm"
              onClick={nextStep}
              className="bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-900"
            >
              {currentStep === totalSteps - 1 ? 'Finish' : 'Next'}
              {currentStep < totalSteps - 1 ? (
                <ChevronRight className="ml-1 h-4 w-4" />
              ) : null}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
