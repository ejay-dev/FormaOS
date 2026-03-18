/**
 * Analytics integration for FormaOS
 * Privacy-compliant user behavior and feature usage tracking
 */

'use client';

import { healthLogger } from '@/lib/observability/structured-logger';

// PostHog window augmentation — avoids `(window as any)` casts throughout
interface PostHogInstance {
  init: (key: string, config: Record<string, unknown>) => void;
  identify: (userId: string, properties?: Record<string, unknown>) => void;
  reset: () => void;
  capture: (event: string, properties?: Record<string, unknown>) => void;
  getAllFlags: () => Promise<Record<string, boolean | string>>;
  isFeatureEnabled: (flag: string) => boolean;
  register: (properties: Record<string, unknown>) => void;
  people: { set: (properties: Record<string, unknown>) => void };
  opt_out_capturing: () => void;
  opt_in_capturing: () => void;
}

interface WindowWithPostHog extends Window {
  posthog?: PostHogInstance;
}

function getPostHog(): PostHogInstance | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as WindowWithPostHog).posthog;
}

function setPostHog(instance: PostHogInstance): void {
  if (typeof window === 'undefined') return;
  (window as WindowWithPostHog).posthog = instance;
}

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, unknown>;
  timestamp: number;
  sessionId: string;
  userId?: string;
  anonymousId?: string;
}

interface UserProperties {
  userId?: string;
  email?: string;
  role?: string;
  organizationId?: string;
  plan?: string;
  signupDate?: string;
  lastActive?: string;
}

interface FeatureFlag {
  flag: string;
  enabled: boolean;
  variant?: string;
}

class Analytics {
  private sessionId: string;
  private userId?: string;
  private userProperties: UserProperties = {};
  private eventQueue: AnalyticsEvent[] = [];
  private isInitialized = false;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.init();
  }

  private generateSessionId(): string {
    return `analytics_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Initialize analytics services
   */
  private async init() {
    if (typeof window === 'undefined') return;

    try {
      // Initialize PostHog for product analytics
      await this.initPostHog();

      // Process any queued events
      this.flushEventQueue();

      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize analytics:', error);
    }
  }

  /**
   * Initialize PostHog analytics
   */
  private async initPostHog() {
    if (typeof window === 'undefined') return;

    // Check if PostHog is already loaded
    if (getPostHog()) return;

    // Only initialize in production or when explicitly enabled
    const isEnabled =
      process.env.NODE_ENV === 'production' ||
      process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true';

    if (!isEnabled) return;

    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (!posthogKey) {
      console.warn('PostHog key not configured');
      return;
    }

    try {
      // Dynamically import PostHog to avoid SSR issues
      const { default: posthog } = await import('posthog-js');

      posthog.init(posthogKey, {
        api_host: posthogHost || 'https://app.posthog.com',
        // Privacy-focused configuration
        persistence: 'localStorage', // Avoid cookies
        autocapture: false, // Manual tracking only
        capture_pageview: false, // Manual pageview tracking
        disable_session_recording: false, // Enable session recording for debugging
        session_recording: {
          maskAllInputs: true, // Mask sensitive inputs
          maskTextSelector: '.sensitive, [data-sensitive]', // Mask sensitive elements
          blockClass: 'ph-block', // Don't record elements with this class
          ignoreClass: 'ph-ignore', // Don't record events from these elements
        },
        // GDPR compliance
        respect_dnt: true, // Respect Do Not Track
        opt_out_capturing_by_default: false, // Users can opt out
        loaded: (posthog) => {
          // Set initial session properties
          posthog.register({
            session_id: this.sessionId,
            app_version: process.env.NEXT_PUBLIC_APP_VERSION || 'unknown',
          });
        },
      });

      // Make PostHog available globally
      setPostHog(posthog as unknown as PostHogInstance);
    } catch (error) {
      console.error('Failed to initialize PostHog:', error);
    }
  }

  /**
   * Identify a user
   */
  identify(userId: string, properties?: UserProperties) {
    this.userId = userId;
    this.userProperties = { ...this.userProperties, userId, ...properties };

    const ph = getPostHog();
    if (ph) ph.identify(userId, properties ? { ...properties } : undefined);
  }

  /**
   * Reset user identity (on logout)
   */
  reset() {
    this.userId = undefined;
    this.userProperties = {};

    const ph = getPostHog();
    if (ph) ph.reset();
  }

  /**
   * Track an event
   */
  track(event: string, properties?: Record<string, unknown>) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        session_id: this.sessionId,
        timestamp: Date.now(),
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        user_agent:
          typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      },
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
    };

    if (this.isInitialized) {
      this.sendEvent(analyticsEvent);
    } else {
      // Queue event until analytics is initialized
      this.eventQueue.push(analyticsEvent);
    }
  }

  /**
   * Track page view
   */
  page(pageName?: string, properties?: Record<string, unknown>) {
    if (typeof window === 'undefined') return;

    const pageProperties = {
      page_title: document.title,
      page_url: window.location.href,
      page_path: window.location.pathname,
      page_name: pageName,
      referrer: document.referrer,
      ...properties,
    };

    this.track('page_view', pageProperties);

    // Also send to PostHog's page tracking
    const ph = getPostHog();
    if (ph) ph.capture('$pageview', pageProperties);
  }

  /**
   * Track feature usage
   */
  feature(
    featureName: string,
    action: string,
    properties?: Record<string, unknown>,
  ) {
    this.track('feature_used', {
      feature_name: featureName,
      feature_action: action,
      ...properties,
    });
  }

  /**
   * Track user journey step
   */
  journey(
    step: string,
    status: 'started' | 'completed' | 'failed',
    properties?: Record<string, unknown>,
  ) {
    this.track('user_journey', {
      journey_step: step,
      journey_status: status,
      ...properties,
    });
  }

  /**
   * Track business metrics
   */
  business(metric: string, value: number, properties?: Record<string, unknown>) {
    this.track('business_metric', {
      metric_name: metric,
      metric_value: value,
      ...properties,
    });
  }

  /**
   * Track conversion events
   */
  conversion(event: string, value?: number, properties?: Record<string, unknown>) {
    this.track('conversion', {
      conversion_event: event,
      conversion_value: value,
      ...properties,
    });
  }

  /**
   * Track performance metrics
   */
  performance(metric: string, value: number, properties?: Record<string, unknown>) {
    this.track('performance_metric', {
      metric_name: metric,
      metric_value: value,
      ...properties,
    });
  }

  /**
   * Track A/B test participation
   */
  experiment(
    testName: string,
    variant: string,
    properties?: Record<string, unknown>,
  ) {
    this.track('experiment_viewed', {
      experiment_name: testName,
      experiment_variant: variant,
      ...properties,
    });
  }

  /**
   * Get feature flags
   */
  async getFeatureFlags(): Promise<Record<string, boolean | string>> {
    const ph = getPostHog();
    if (typeof window === 'undefined' || !ph) {
      return {};
    }

    try {
      const flags = await ph.getAllFlags();
      return flags || {};
    } catch (error) {
      console.warn('Failed to get feature flags:', error);
      return {};
    }
  }

  /**
   * Check if feature flag is enabled
   */
  isFeatureEnabled(flag: string): boolean {
    const ph = getPostHog();
    if (typeof window === 'undefined' || !ph) {
      return false;
    }

    try {
      return ph.isFeatureEnabled(flag) || false;
    } catch (error) {
      console.warn('Failed to check feature flag:', error);
      return false;
    }
  }

  /**
   * Send event to analytics services
   */
  private sendEvent(event: AnalyticsEvent) {
    if (typeof window === 'undefined') return;

    // Send to PostHog
    const ph = getPostHog();
    if (ph) {
      try {
        ph.capture(event.event, event.properties);
      } catch (error) {
        console.warn('Failed to send event to PostHog:', error);
      }
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      healthLogger.info('analytics_event_queued', {
        event: event.event,
        timestamp: event.timestamp,
        properties: event.properties,
      });
    }
  }

  /**
   * Process queued events
   */
  private flushEventQueue() {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event) {
        this.sendEvent(event);
      }
    }
  }

  /**
   * Get session information
   */
  getSession() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      userProperties: this.userProperties,
      queuedEvents: this.eventQueue.length,
    };
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: UserProperties) {
    this.userProperties = { ...this.userProperties, ...properties };

    const ph = getPostHog();
    if (ph) ph.people.set({ ...properties });
  }

  /**
   * Opt user out of tracking
   */
  optOut() {
    const ph = getPostHog();
    if (ph) ph.opt_out_capturing();
  }

  /**
   * Opt user back into tracking
   */
  optIn() {
    const ph = getPostHog();
    if (ph) ph.opt_in_capturing();
  }
}

// Global analytics instance
let analytics: Analytics | null = null;

/**
 * Get or create the global analytics instance
 */
export function getAnalytics(): Analytics {
  if (!analytics) {
    analytics = new Analytics();
  }
  return analytics;
}

/**
 * React hook for analytics
 */
export function useAnalytics() {
  return getAnalytics();
}

/**
 * Track component mount
 */
export function useTrackMount(
  componentName: string,
  properties?: Record<string, unknown>,
) {
  const analytics = useAnalytics();

  if (typeof window !== 'undefined') {
    analytics.track('component_mounted', {
      component_name: componentName,
      ...properties,
    });
  }
}

/**
 * Track component lifecycle
 */
export function useTrackLifecycle(componentName: string) {
  const analytics = useAnalytics();

  return {
    onMount: (properties?: Record<string, unknown>) => {
      analytics.track('component_mounted', {
        component_name: componentName,
        ...properties,
      });
    },
    onUnmount: (properties?: Record<string, unknown>) => {
      analytics.track('component_unmounted', {
        component_name: componentName,
        ...properties,
      });
    },
    onUpdate: (properties?: Record<string, unknown>) => {
      analytics.track('component_updated', {
        component_name: componentName,
        ...properties,
      });
    },
  };
}

// Types for external use
export type { AnalyticsEvent, UserProperties, FeatureFlag };
export { Analytics };
