'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, ArrowRight, Download, ShieldCheck, X } from 'lucide-react';
import {
  ANALYTICS_CONSENT_COOKIE,
  applyAnalyticsConsent,
  readAnalyticsConsent,
  type AnalyticsConsentValue,
} from '@/lib/monitoring/analytics';

const CONSENT_MAX_AGE_DAYS = 365;

type ConsentValue = AnalyticsConsentValue;

function writeConsent(value: 'accepted' | 'rejected') {
  if (typeof document === 'undefined') return;
  const maxAge = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${ANALYTICS_CONSENT_COOKIE}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  applyAnalyticsConsent(value);
  window.dispatchEvent(
    new CustomEvent('formaos:cookie-consent', { detail: { value } }),
  );
}

function clearConsent() {
  if (typeof document === 'undefined') return;
  document.cookie = `${ANALYTICS_CONSENT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  // No stored preference means no consent, so capture stays off until the
  // visitor accepts again.
  applyAnalyticsConsent(null);
  window.dispatchEvent(
    new CustomEvent('formaos:cookie-consent', { detail: { value: null } }),
  );
}

export default function PrivacySettingsContent() {
  const [consent, setConsent] = useState<ConsentValue>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const current = readAnalyticsConsent();
    setConsent(current);
    setMounted(true);
    // Only re-assert an explicit decision. Opting out here when nothing is
    // stored would persist that opt-out in posthog-js just for viewing this
    // page, and no consent already means capture is off by default.
    if (current !== null) {
      applyAnalyticsConsent(current);
    }
  }, []);

  const accept = () => {
    writeConsent('accepted');
    setConsent('accepted');
    setConfirmation('Analytics cookies enabled.');
  };

  const reject = () => {
    writeConsent('rejected');
    setConsent('rejected');
    setConfirmation('Non-essential cookies rejected.');
  };

  const withdraw = () => {
    clearConsent();
    setConsent(null);
    setConfirmation(
      'Consent withdrawn. The cookie banner will appear again on your next visit.',
    );
  };

  const stateLabel =
    consent === 'accepted'
      ? 'Analytics cookies are currently enabled.'
      : consent === 'rejected'
        ? 'Only essential cookies are in use.'
        : 'No preference set, the cookie banner will appear on your next visit.';

  return (
    <main
      id="main-content"
      className="relative isolate min-h-screen bg-slate-950 text-slate-100"
    >
      <div className="max-w-3xl mx-auto px-6 py-20">
        <Link
          href="/legal/privacy"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Privacy Policy
        </Link>

        <header className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-400/30 bg-slate-500/10 text-xs font-medium text-slate-300 mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            Your data, your choice
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Privacy & consent settings
          </h1>
          <p className="text-slate-400 leading-relaxed">
            Manage how FormaOS uses cookies and analytics in your browser. You
            can withdraw your consent or change your choice at any time, the
            change takes effect immediately.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-2">
            Current preference
          </h2>
          <p className="text-sm text-slate-300" data-testid="consent-state">
            {mounted ? stateLabel : 'Loading your preference…'}
          </p>
        </section>

        <section className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Change consent
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={accept}
              data-testid="consent-accept"
              className="rounded-lg bg-slate-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Accept analytics cookies
            </button>
            <button
              type="button"
              onClick={reject}
              data-testid="consent-reject"
              className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-100 hover:border-slate-500 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Reject non-essential
            </button>
            <button
              type="button"
              onClick={withdraw}
              data-testid="withdraw-consent"
              className="withdraw-consent inline-flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-200 hover:bg-rose-500/20 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              <X className="w-4 h-4" />
              Withdraw consent
            </button>
          </div>
          {confirmation ? (
            <p
              className="mt-4 text-xs text-emerald-300"
              role="status"
              aria-live="polite"
            >
              {confirmation}
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-2">
            Your data rights
          </h2>
          <p className="text-sm text-slate-300 mb-4">
            Under the GDPR and similar regimes you have the right to access,
            rectify, erase, or port your personal data. Signed-in customers
            can manage these self-serve below. To exercise any right without
            signing in, contact us at{' '}
            <a
              href="mailto:privacy@formaos.com.au"
              className="text-slate-400 hover:text-slate-300 underline underline-offset-2"
            >
              privacy@formaos.com.au
            </a>
            .
          </p>

          {/* Audit 2026-05-25 (GDPR): cross-link affordances to the
              authenticated self-serve surface at /app/privacy. The data
              selectors below are also probed by tests/compliance/
              gdpr-compliance.js, keep `data-testid="export-data"`,
              `data-testid="delete-account"`, and `data-export` in lockstep
              with that test. */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              href="/app/privacy#export"
              data-testid="export-data"
              data-export
              className="export inline-flex flex-col items-start gap-2 rounded-xl border border-slate-700 bg-slate-900/80 p-4 text-left hover:border-slate-400/40 hover:bg-slate-900"
            >
              <Download className="h-4 w-4 text-slate-300" />
              <div>
                <div className="text-sm font-semibold text-white">
                  Export your data
                </div>
                <div className="text-xs text-slate-400">
                  Download a JSON copy of everything we hold about you.
                </div>
              </div>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-300">
                Sign in to download
                <ArrowRight className="h-3 w-3" />
              </span>
            </Link>

            <Link
              href="/app/privacy#portability"
              data-download
              className="download inline-flex flex-col items-start gap-2 rounded-xl border border-slate-700 bg-slate-900/80 p-4 text-left hover:border-slate-400/40 hover:bg-slate-900"
            >
              <ArrowRight className="h-4 w-4 text-slate-300" />
              <div>
                <div className="text-sm font-semibold text-white">
                  Move to another provider
                </div>
                <div className="text-xs text-slate-400">
                  Get a machine-readable bundle to import elsewhere.
                </div>
              </div>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-300">
                Sign in to port
                <ArrowRight className="h-3 w-3" />
              </span>
            </Link>

            <Link
              href="/app/privacy#delete"
              data-testid="delete-account"
              className="inline-flex flex-col items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-500/5 p-4 text-left hover:border-rose-400/60 hover:bg-rose-500/10"
            >
              <AlertTriangle className="h-4 w-4 text-rose-300" />
              <div>
                <div className="text-sm font-semibold text-white">
                  Delete your account
                </div>
                <div className="text-xs text-slate-400">
                  Permanently remove your account and personal data.
                </div>
              </div>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-rose-300">
                Sign in to delete
                <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          </div>

          <p className="mt-5 text-xs text-slate-500">
            Withdrawing cookie consent above only affects analytics and
            marketing cookies in this browser. It does not delete your
            FormaOS account or data we are legally required to retain.
          </p>
        </section>
      </div>
    </main>
  );
}
