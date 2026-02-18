'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { ArrowLeft, Lock, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  // Check for valid session from reset link
  useEffect(() => {
    const supabase = createSupabaseClient();

    const checkSession = async () => {
      // Handle hash fragment from email link
      if (typeof window !== 'undefined' && window.location.hash) {
        const hash = window.location.hash.startsWith('#')
          ? window.location.hash.slice(1)
          : window.location.hash;
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');

        if (accessToken && refreshToken && type === 'recovery') {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!error) {
            setHasSession(true);
            // Clear the hash from URL
            window.history.replaceState(null, '', window.location.pathname);
            return;
          }
        }
      }

      // Check existing session
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        setHasSession(true);
      }
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (password.length < 12) {
      setErrorMessage('Password must be at least 12 characters.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/password/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const errors = Array.isArray(payload?.errors)
          ? payload.errors
          : [payload?.error || 'Unable to update password'];
        setErrorMessage(errors.join(' '));
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      // Redirect to app after 2 seconds
      setTimeout(() => router.push('/app'), 2000);
    } catch {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-6">
          <Logo variant="mark" size={44} />
        </div>
        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 text-center">
              <h1 className="text-2xl font-bold text-white mb-2">
                Invalid or expired link
              </h1>
              <p className="text-slate-400 mb-6">
                This password reset link is invalid or has expired. Please
                request a new one.
              </p>
              <Link
                href="/auth/forgot-password"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 hover:brightness-110 transition-all"
              >
                Request new link
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-6">
          <Logo variant="mark" size={44} />
        </div>
        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Password updated
              </h1>
              <p className="text-slate-400">
                Your password has been successfully updated. Redirecting you to
                the app...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-6">
        <Logo variant="mark" size={44} />
      </div>
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8">
            <div className="mb-6">
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
              <h1 className="text-2xl font-bold text-white mb-2">
                Set new password
              </h1>
              <p className="text-slate-400">Enter your new password below.</p>
            </div>

            {errorMessage && (
              <div className="mb-6 rounded-lg border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-300 mb-2"
                >
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="12+ chars, upper/lower, number, symbol"
                    className="w-full rounded-lg border border-white/20 bg-white/10 pl-10 pr-10 py-3 text-sm text-white placeholder-slate-400 focus:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-400/20 backdrop-blur-sm"
                    required
                    disabled={isLoading}
                    minLength={12}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-semibold text-slate-300 mb-2"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full rounded-lg border border-white/20 bg-white/10 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-400 focus:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-400/20 backdrop-blur-sm"
                    required
                    disabled={isLoading}
                    minLength={12}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Updating...' : 'Update password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
