'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import { Logo } from '@/components/brand/Logo';
import { Mail, RefreshCw, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function CheckEmailPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleContinue = async () => {
    setIsChecking(true);
    setErrorMessage(null);

    try {
      const supabase = createSupabaseClient();

      // Try to get current session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Session check error:', error);
        setErrorMessage('Unable to verify session. Please try again.');
        setIsChecking(false);
        return;
      }

      if (session) {
        // Session valid - redirect to app
        router.push('/app/onboarding');
      } else {
        // No session yet
        setErrorMessage('Email not confirmed yet. Please check your inbox and click the confirmation link.');
        setIsChecking(false);
      }
    } catch (err) {
      console.error('Continue error:', err);
      setErrorMessage('An error occurred. Please try again.');
      setIsChecking(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setResendMessage(null);
    setErrorMessage(null);

    try {
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user?.email) {
        setErrorMessage('No email found. Please sign up again.');
        setIsResending(false);
        return;
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setResendMessage('Confirmation email resent! Check your inbox.');
      }
    } catch (err) {
      console.error('Resend error:', err);
      setErrorMessage('Failed to resend email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-6 py-12">
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
