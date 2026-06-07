'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import { Logo } from '@/components/brand/Logo';
import { Mail, RefreshCw, ArrowRight, CheckCircle2 } from 'lucide-react';

const SESSION_TIMEOUT_MS = 5000;

const withTimeout = async <T,>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
) => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`${label}_timeout`)),
      timeoutMs,
    );
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

function CheckEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const email = searchParams.get('email') || '';
  const plan = searchParams.get('plan');
  const journey = searchParams.get('journey');

  const handleContinue = async () => {
    setIsChecking(true);
    setErrorMessage(null);

    try {
      const supabase = createSupabaseClient();

      // Try to get current session
      const sessionResult = (await withTimeout(
        supabase.auth.getSession(),
        SESSION_TIMEOUT_MS,
        'session',
      )) as Awaited<ReturnType<typeof supabase.auth.getSession>>;
      const {
        data: { session },
        error,
      } = sessionResult;

      if (error) {
        console.error('Session check error:', error);
        setErrorMessage('Unable to verify session. Please try again.');
        setIsChecking(false);
        return;
      }

      if (session) {
        // Session valid - redirect to app
        const onboardingTarget = journey
          ? `/onboarding?journey=${encodeURIComponent(journey)}`
          : '/onboarding';
        router.push(onboardingTarget);
      } else {
        // No session yet
        setErrorMessage('Email not confirmed yet. Please check your inbox and click the confirmation link.');
        setIsChecking(false);
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('timeout')) {
        console.error('[Auth] Session check timed out');
        setErrorMessage(
          'Having trouble verifying your session. Please refresh and try again.',
        );
      } else {
        console.error('Continue error:', err);
        setErrorMessage('An error occurred. Please try again.');
      }
      setIsChecking(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setResendMessage(null);
    setErrorMessage(null);

    try {
      if (!email) {
        setErrorMessage('Email address missing. Please sign up again.');
        setIsResending(false);
        return;
      }

      const response = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          plan,
          journey,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setErrorMessage(
          payload?.error === 'backend_unavailable'
            ? 'Secure email confirmation is temporarily unavailable while background services reconnect. Please try again shortly.'
            : payload?.error === 'too_many_requests'
              ? 'Too many requests. Please wait a few minutes and try again.'
              : 'Failed to resend email. Please try again.',
        );
      } else {
        setResendMessage('A fresh secure sign-in email has been sent.');
      }
    } catch (err) {
      console.error('Resend error:', err);
      setErrorMessage('Failed to resend email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center px-6 py-12">
      {/* Header */}
      <div className="absolute top-6 left-6">
        <Logo variant="wordmark" size={28} className="text-foreground" />
      </div>

      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted border border-border flex items-center justify-center">
            <Mail className="w-10 h-10 text-muted-foreground" />
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-foreground mb-3">Check Your Email</h1>
          <p className="text-muted-foreground mb-8">
            We've sent a confirmation link to your email address. Click the link to verify your account and continue.
          </p>
          {email && (
            <p className="text-xs text-muted-foreground mb-6">
              Sent to <span className="text-foreground">{email}</span>
            </p>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {errorMessage}
            </div>
          )}

          {/* Success Message */}
          {resendMessage && (
            <div className="mb-6 p-4 rounded-lg bg-success/10 border border-success/20 text-success text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {resendMessage}
            </div>
          )}

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            data-testid="check-email-continue-button"
            disabled={isChecking}
            className="w-full mb-3 py-4 px-6 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg hover:opacity-90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isChecking ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                I've Confirmed — Continue
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Resend Button */}
          <button
            onClick={handleResend}
            disabled={isResending}
            className="w-full py-3 px-6 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isResending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Resend Confirmation Email
              </>
            )}
          </button>

          {/* Help Text */}
          <p className="text-xs text-muted-foreground mt-6">
            Didn't receive the email? Check your spam folder or click the resend button above.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
          Loading...
        </div>
      }
    >
      <CheckEmailContent />
    </Suspense>
  );
}
