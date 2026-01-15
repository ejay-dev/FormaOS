// scripts/monitoring-setup.js
const fs = require('fs');
const path = require('path');

// Sentry configuration for error monitoring
const sentryConfig = `
import { init, BrowserTracing, Replay } from '@sentry/nextjs'

init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  integrations: [
    new BrowserTracing({
      tracePropagationTargets: ['localhost', /^\\https:\\/\\/yourapp\\.com\\/api/],
    }),
    new Replay(),
  ],
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    // Filter out non-critical errors
    if (event.exception) {
      const error = event.exception.values?.[0]?.value || ''
      
      // Skip common non-critical errors
      if (
        error.includes('Non-Error promise rejection') ||
        error.includes('ResizeObserver loop limit exceeded') ||
        error.includes('Network Error')
      ) {
        return null
      }
    }
    
    return event
  }
})
`;

// Vercel Analytics configuration
const vercelAnalyticsConfig = `
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Analytics />
      <SpeedInsights />
    </>
  )
}
`;

// Custom performance monitoring
const performanceMonitor = `
// lib/monitoring/performance.ts
class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  markStart(name: string): void {
    performance.mark(\`\${name}-start\`)
  }

  markEnd(name: string): void {
    performance.mark(\`\${name}-end\`)
    performance.measure(name, \`\${name}-start\`, \`\${name}-end\`)
    
    const measure = performance.getEntriesByName(name, 'measure')[0]
    if (measure) {
      this.recordMetric(name, measure.duration)
    }
  }

  private recordMetric(name: string, duration: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    const values = this.metrics.get(name)!
    values.push(duration)
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift()
    }

    // Send to analytics if duration is concerning
    if (duration > 3000) { // 3 seconds
      this.reportSlowOperation(name, duration)
    }
  }

  private reportSlowOperation(name: string, duration: number): void {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'slow_operation', {
        custom_parameter: name,
        value: Math.round(duration)
      })
    }
  }

  getAverageTime(name: string): number {
    const values = this.metrics.get(name) || []
    return values.length > 0 
      ? values.reduce((sum, val) => sum + val, 0) / values.length 
      : 0
  }

  reportWebVitals(): void {
    // Core Web Vitals monitoring
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS((metric) => this.sendToAnalytics('CLS', metric))
      getFID((metric) => this.sendToAnalytics('FID', metric))
      getFCP((metric) => this.sendToAnalytics('FCP', metric))
      getLCP((metric) => this.sendToAnalytics('LCP', metric))
      getTTFB((metric) => this.sendToAnalytics('TTFB', metric))
    })
  }

  private sendToAnalytics(name: string, metric: any): void {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', name, {
        value: Math.round(metric.value),
        metric_id: metric.id,
        metric_delta: metric.delta
      })
    }

    // Also send to Sentry for performance monitoring
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.addBreadcrumb({
        category: 'web-vitals',
        message: name,
        data: metric,
        level: 'info'
      })
    }
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance()

// React hook for component performance tracking
export function usePerformanceMonitor(componentName: string) {
  const { useEffect } = require('react')
  
  useEffect(() => {
    performanceMonitor.markStart(componentName)
    
    return () => {
      performanceMonitor.markEnd(componentName)
    }
  }, [componentName])
}
`;

// Real User Monitoring setup
const rumSetup = `
// lib/monitoring/rum.ts
interface UserSession {
  sessionId: string
  userId?: string
  startTime: number
  pageViews: number
  interactions: number
  errors: number
}

class RealUserMonitoring {
  private session: UserSession
  private interactions: string[] = []

  constructor() {
    this.session = {
      sessionId: this.generateSessionId(),
      startTime: Date.now(),
      pageViews: 0,
      interactions: 0,
      errors: 0
    }

    this.setupEventListeners()
    this.trackPageView()
  }

  private generateSessionId(): string {
    return \`\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`
  }

  private setupEventListeners(): void {
    // Track user interactions
    document.addEventListener('click', (e) => {
      this.trackInteraction('click', e.target)
    })

    document.addEventListener('scroll', this.debounce(() => {
      this.trackInteraction('scroll')
    }, 1000))

    // Track form submissions
    document.addEventListener('submit', (e) => {
      this.trackInteraction('form_submit', e.target)
    })

    // Track errors
    window.addEventListener('error', (e) => {
      this.trackError('javascript_error', e.error)
    })

    window.addEventListener('unhandledrejection', (e) => {
      this.trackError('unhandled_promise_rejection', e.reason)
    })
  }

  private debounce(func: Function, wait: number): () => void {
    let timeout: NodeJS.Timeout
    return () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(this), wait)
    }
  }

  trackPageView(page?: string): void {
    this.session.pageViews++
    
    this.sendEvent('page_view', {
      page: page || window.location.pathname,
      timestamp: Date.now(),
      session_id: this.session.sessionId
    })
  }

  trackInteraction(type: string, target?: EventTarget | null): void {
    this.session.interactions++
    
    const elementInfo = target ? this.getElementInfo(target as Element) : {}
    
    this.sendEvent('user_interaction', {
      type,
      ...elementInfo,
      timestamp: Date.now(),
      session_id: this.session.sessionId
    })
  }

  trackError(type: string, error: any): void {
    this.session.errors++
    
    this.sendEvent('error', {
      type,
      message: error?.message || error?.toString() || 'Unknown error',
      stack: error?.stack,
      timestamp: Date.now(),
      session_id: this.session.sessionId
    })
  }

  private getElementInfo(element: Element): any {
    return {
      tag: element.tagName?.toLowerCase(),
      id: element.id,
      class: element.className,
      text: element.textContent?.substring(0, 100) || ''
    }
  }

  private sendEvent(eventType: string, data: any): void {
    // Send to multiple analytics services
    if (typeof window !== 'undefined') {
      // Google Analytics
      if (window.gtag) {
        window.gtag('event', eventType, data)
      }

      // Send to custom endpoint for detailed analysis
      fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, data })
      }).catch(() => {}) // Fail silently to not affect user experience
    }
  }

  getSessionSummary(): UserSession {
    return { ...this.session }
  }
}

// Initialize RUM when DOM is ready
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    new RealUserMonitoring()
  })
}
`;

console.log('🚀 Setting up monitoring configuration files...\n');

// Create monitoring directory and files
const configs = [
  { path: 'lib/monitoring/sentry.ts', content: sentryConfig },
  { path: 'lib/monitoring/analytics.tsx', content: vercelAnalyticsConfig },
  { path: 'lib/monitoring/performance.ts', content: performanceMonitor },
  { path: 'lib/monitoring/rum.ts', content: rumSetup },
];

configs.forEach((config) => {
  const fullPath = path.join(process.cwd(), config.path);
  const dir = path.dirname(fullPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(fullPath, config.content);
  console.log(`✅ Created ${config.path}`);
});

console.log('\n📊 Monitoring setup complete!');
console.log('\nNext steps:');
console.log('1. Add environment variables for monitoring services');
console.log('2. Import and initialize monitoring in your app');
console.log('3. Configure alerting thresholds');
console.log('4. Set up dashboard for metrics visualization');
