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
        setErrorMessage('Failed to resend email. Please try again.');
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
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-6 py-12">
      {/* Header */}
      <div className="absolute top-6 left-6">
        <Logo size={36} />
      </div>

      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Mail className="w-10 h-10 text-emerald-400" />
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-white mb-3">Check Your Email</h1>
          <p className="text-gray-400 mb-8">
            We've sent a confirmation link to your email address. Click the link to verify your account and continue.
          </p>
          {email && (
            <p className="text-xs text-slate-500 mb-6">
              Sent to <span className="text-slate-200">{email}</span>
            </p>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {errorMessage}
            </div>
          )}

          {/* Success Message */}
          {resendMessage && (
            <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {resendMessage}
            </div>
          )}

          {/* Continue Button */}
          <button
            onClick={handleContinue}
            data-testid="check-email-continue-button"
            disabled={isChecking}
            className="w-full mb-3 py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
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
            className="w-full py-3 px-6 rounded-xl border border-white/20 text-white font-medium hover:bg-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          <p className="text-xs text-gray-500 mt-6">
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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center text-slate-300">
          Loading...
        </div>
      }
    >
      <CheckEmailContent />
    </Suspense>
  );
}
