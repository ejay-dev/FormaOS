import { getErrorTracker, ErrorTracker } from '@/lib/monitoring/errors';

describe('ErrorTracker class', () => {
  let tracker: ErrorTracker;

  beforeEach(() => {
    tracker = new ErrorTracker();
  });

  describe('getSessionInfo', () => {
    it('returns session info with generated sessionId', () => {
      const info = tracker.getSessionInfo();
      expect(info.sessionId).toMatch(/^error_session_\d+_/);
      expect(info.breadcrumbsCount).toBe(0);
      expect(info.lastBreadcrumb).toBeUndefined();
    });
  });

  describe('addBreadcrumb', () => {
    it('adds a breadcrumb', () => {
      tracker.addBreadcrumb({
        timestamp: Date.now(),
        category: 'test',
        message: 'Test breadcrumb',
        level: 'info',
      });
      const info = tracker.getSessionInfo();
      expect(info.breadcrumbsCount).toBe(1);
      expect(info.lastBreadcrumb?.message).toBe('Test breadcrumb');
    });

    it('limits breadcrumbs to 50', () => {
      for (let i = 0; i < 60; i++) {
        tracker.addBreadcrumb({
          timestamp: Date.now(),
          category: 'test',
          message: `Breadcrumb ${i}`,
          level: 'info',
        });
      }
      expect(tracker.getSessionInfo().breadcrumbsCount).toBe(50);
      // Oldest should be removed: index 10..59 remain
      expect(tracker.getSessionInfo().lastBreadcrumb?.message).toBe(
        'Breadcrumb 59',
      );
    });
  });

  describe('clearBreadcrumbs', () => {
    it('clears all breadcrumbs', () => {
      tracker.addBreadcrumb({
        timestamp: Date.now(),
        category: 'test',
        message: 'To be cleared',
        level: 'info',
      });
      tracker.clearBreadcrumbs();
      expect(tracker.getSessionInfo().breadcrumbsCount).toBe(0);
    });
  });

  describe('captureUserAction', () => {
    it('adds a user action breadcrumb', () => {
      tracker.captureUserAction('clicked_button', { button: 'submit' });
      const info = tracker.getSessionInfo();
      expect(info.breadcrumbsCount).toBe(1);
      expect(info.lastBreadcrumb?.category).toBe('user');
      expect(info.lastBreadcrumb?.message).toBe('User clicked_button');
    });
  });

  describe('captureNavigation', () => {
    it('adds a navigation breadcrumb', () => {
      tracker.captureNavigation('/home', '/dashboard');
      const info = tracker.getSessionInfo();
      expect(info.breadcrumbsCount).toBe(1);
      expect(info.lastBreadcrumb?.category).toBe('navigation');
      expect(info.lastBreadcrumb?.message).toContain('/home');
      expect(info.lastBreadcrumb?.message).toContain('/dashboard');
    });
  });

  describe('captureError', () => {
    it('adds error breadcrumb after capturing', () => {
      const error = new Error('Test error');
      tracker.captureError(error);
      const info = tracker.getSessionInfo();
      // captureError adds a breadcrumb
      expect(info.breadcrumbsCount).toBeGreaterThan(0);
      expect(info.lastBreadcrumb?.category).toBe('error');
      expect(info.lastBreadcrumb?.message).toBe('Test error');
    });

    it('accepts options with context, tags, level', () => {
      const error = new Error('Contextual error');
      expect(() =>
        tracker.captureError(error, {
          context: { component: 'Dashboard' },
          tags: { severity: 'high' },
          level: 'warning',
        }),
      ).not.toThrow();
    });
  });

  describe('captureReactError', () => {
    it('captures React component errors with componentStack', () => {
      const error = new Error('React error');
      const errorInfo = {
        componentStack: '\n    at Dashboard\n    at App',
        digest: undefined,
      };
      tracker.captureReactError(error, errorInfo);
      const info = tracker.getSessionInfo();
      // Should have 2 breadcrumbs: react breadcrumb + error breadcrumb
      expect(info.breadcrumbsCount).toBe(2);
    });
  });

  describe('captureAPIError', () => {
    it('captures API errors with url and status', () => {
      const error = new Error('API failed');
      tracker.captureAPIError(
        error,
        '/api/v1/controls',
        'GET',
        500,
        'Internal error',
      );
      const info = tracker.getSessionInfo();
      // Should have 2 breadcrumbs: http breadcrumb + error breadcrumb
      expect(info.breadcrumbsCount).toBe(2);
    });
  });
});

describe('getErrorTracker singleton', () => {
  it('returns an ErrorTracker instance', () => {
    const tracker = getErrorTracker();
    expect(tracker).toBeInstanceOf(ErrorTracker);
  });

  it('returns the same instance on repeated calls', () => {
    const t1 = getErrorTracker();
    const t2 = getErrorTracker();
    expect(t1).toBe(t2);
  });
});
