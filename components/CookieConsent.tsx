'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const CONSENT_COOKIE = 'formaos_cookie_consent';
const CONSENT_MAX_AGE_DAYS = 365;

type ConsentValue = 'accepted' | 'rejected';

function readConsent(): ConsentValue | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${CONSENT_COOKIE}=`));
  if (!match) return null;
  const value = match.split('=')[1];
  if (value === 'accepted' || value === 'rejected') return value;
  return null;
}

function writeConsent(value: ConsentValue) {
  if (typeof document === 'undefined') return;
  const maxAge = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  window.dispatchEvent(
    new CustomEvent('formaos:cookie-consent', { detail: { value } }),
  );
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  // First action button gets focus on mount so keyboard users can
  // resolve the banner in one keystroke instead of tabbing past the
  // entire page (WCAG 2.4.3 focus order). Banner is also rendered
  // *before* {children} in app/layout.tsx so DOM tab order places it
  // immediately after Skip-to-main.
  const rejectButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const current = readConsent();
    if (!current) setVisible(true);
  }, []);

  useEffect(() => {
    if (visible) {
      // Defer to next frame so the button is in the DOM.
      const id = window.requestAnimationFrame(() => {
        rejectButtonRef.current?.focus();
      });
      return () => window.cancelAnimationFrame(id);
    }
  }, [visible]);

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
      // Not aria-modal — we don't want to trap focus; we want the
      // banner to be the FIRST natural stop after Skip-to-main so a
      // keyboard user can dismiss it without tabbing through the page.
      className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4 sm:px-6 sm:pb-6"
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
              className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Reject non-essential
            </button>
            <button
              type="button"
              onClick={() => decide('accepted')}
              className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function hasAnalyticsConsent(): boolean {
  return readConsent() === 'accepted';
}
