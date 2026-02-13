// =============================================================================
// DEMO ANALYTICS — Lightweight event tracking for the phase demo
// Fires custom events that can be picked up by GA4, Segment, PostHog, etc.
// No external dependencies. Falls back silently if no analytics provider.
// =============================================================================

export type DemoEvent =
  | { type: 'demo_phase_viewed'; phase: string; mode: 'simulation' | 'sandbox' }
  | { type: 'demo_phase_completed'; phase: string; durationMs: number; mode: 'simulation' | 'sandbox' }
  | { type: 'demo_cycle_completed'; totalDurationMs: number; mode: 'simulation' | 'sandbox' }
  | { type: 'demo_mode_switched'; from: string; to: string }
  | { type: 'demo_cta_clicked'; source: string; phase: string }
  | { type: 'demo_sandbox_action'; action: string; target: string; phase: string }
  | { type: 'demo_drawer_opened'; drawer: string; itemId: string }
  | { type: 'demo_tour_started' }
  | { type: 'demo_tour_step'; step: number; total: number }
  | { type: 'demo_tour_completed' }
  | { type: 'demo_tour_dismissed'; step: number }
  | { type: 'demo_reset' }
  | { type: 'demo_time_spent'; phase: string; durationMs: number };

let sessionStart = 0;
const phaseTimers: Record<string, number> = {};

export function trackDemoEvent(event: DemoEvent): void {
  try {
    // Custom event dispatch for any listener
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('formaos:demo', { detail: event }),
      );

      // GA4 gtag
      const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag;
      if (typeof gtag === 'function') {
        gtag('event', event.type, event);
      }

      // dataLayer push (GTM)
      const dataLayer = (window as { dataLayer?: Record<string, unknown>[] }).dataLayer;
      if (Array.isArray(dataLayer)) {
        dataLayer.push({ event: event.type, ...event });
      }
    }
  } catch {
    // Silent fail — analytics should never break the demo
  }
}

export function startPhaseTimer(phase: string): void {
  phaseTimers[phase] = Date.now();
}

export function endPhaseTimer(phase: string, mode: 'simulation' | 'sandbox'): void {
  const start = phaseTimers[phase];
  if (start) {
    trackDemoEvent({
      type: 'demo_time_spent',
      phase,
      durationMs: Date.now() - start,
    });
    trackDemoEvent({
      type: 'demo_phase_completed',
      phase,
      durationMs: Date.now() - start,
      mode,
    });
    delete phaseTimers[phase];
  }
}

export function startDemoSession(): void {
  sessionStart = Date.now();
}

export function getDemoSessionDuration(): number {
  return sessionStart ? Date.now() - sessionStart : 0;
}
