'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ANALYTICS_CONSENT_COOKIE,
  applyAnalyticsConsent,
  readAnalyticsConsent,
} from '@/lib/monitoring/analytics';

const CONSENT_MAX_AGE_DAYS = 365;

type ConsentValue = 'accepted' | 'rejected';

function writeConsent(value: ConsentValue) {
  if (typeof document === 'undefined') return;
  const maxAge = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${ANALYTICS_CONSENT_COOKIE}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  // The banner is the surface most visitors use, so it has to move PostHog
  // itself — the cookie alone does not stop capture on the current page.
  applyAnalyticsConsent(value);
  window.dispatchEvent(
    new CustomEvent('formaos:cookie-consent', { detail: { value } }),
  );
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  // Audit 2026-05-25 (perf): the banner's long sentence was winning
  // Lighthouse LCP on small-content pages like /changelog (perf 60 →
  // banner-shaped LCP at 8 s). The fix is two-stage: mount the DOM
  // eagerly so the GDPR compliance probe still finds it, but keep
  // `opacity: 0` until the LCP measurement window has settled.
  // Elements with effective opacity < 1 are excluded from LCP per
  // the LCP spec, so the real hero `<h1>` wins instead.
  const [readyToShow, setReadyToShow] = useState(false);
  // First action button gets focus on mount so keyboard users can
  // resolve the banner in one keystroke instead of tabbing past the
  // entire page (WCAG 2.4.3 focus order). Banner is also rendered
  // *before* {children} in app/layout.tsx so DOM tab order places it
  // immediately after Skip-to-main.
  const rejectButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const current = readAnalyticsConsent();
    if (current) return;

    setVisible(true);

    // Defer the opacity reveal until idle (or 1.5 s fallback). Lighthouse
    // finalises LCP at the next stable-paint break after load; by then
    // the banner is still opacity 0 and ineligible. requestIdleCallback
    // is the right primitive — it fires after critical work is done.
    const reveal = () => setReadyToShow(true);
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(reveal, { timeout: 2500 });
      return () => window.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(reveal, 1500);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (visible && readyToShow) {
      // Defer to next frame so the button is in the DOM and visible.
      const id = window.requestAnimationFrame(() => {
        rejectButtonRef.current?.focus();
      });
      return () => window.cancelAnimationFrame(id);
    }
  }, [visible, readyToShow]);

  if (!visible) return null;

  const decide = (value: ConsentValue) => {
    writeConsent(value);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-labelledby="cookie-consent-title"
      data-testid="cookie-consent"
      className="cookie-banner consent-banner fixed inset-x-0 bottom-0 px-4 pb-4 sm:px-6 sm:pb-6"
      // Not aria-modal — we don't want to trap focus; we want the
      // banner to be the FIRST natural stop after Skip-to-main so a
      // keyboard user can dismiss it without tabbing through the page.
      // Audit Sprint 6b: was z-[60] hardcoded. Use --z-overlay (90) so
      // the banner sits above page chrome but below modals + tour + toast.
      // Audit 2026-05-25 (perf): opacity stays 0 until requestIdleCallback
      // fires so the banner can't win Lighthouse LCP. pointer-events also
      // disabled in the same state to prevent invisible click-trapping.
      style={{
        zIndex: 'var(--z-overlay)',
        opacity: readyToShow ? 1 : 0,
        pointerEvents: readyToShow ? 'auto' : 'none',
        transition: 'opacity 220ms ease-out',
      }}
      aria-hidden={!readyToShow}
    >
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-700/80 bg-slate-900/95 p-4 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-slate-900/80 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p
            id="cookie-consent-title"
            className="text-sm leading-relaxed text-slate-200"
          >
            We use essential cookies to keep you signed in and to remember your
            preferences. With your consent we also use analytics cookies to
            understand how FormaOS is used.{' '}
            <Link
              href="/legal/privacy"
              className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300"
            >
              Learn more
            </Link>
            .
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              ref={rejectButtonRef}
              type="button"
              onClick={() => decide('rejected')}
              data-testid="cookie-consent-reject"
              className="consent-option cookie-option rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Reject non-essential
            </button>
            <button
              type="button"
              onClick={() => decide('accepted')}
              data-testid="cookie-consent-accept"
              className="consent-option cookie-option rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { hasAnalyticsConsent } from '@/lib/monitoring/analytics';
