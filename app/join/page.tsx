'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import { Logo } from '@/components/brand/Logo';
import { Building2, Mail, ArrowRight, Plus, Loader2 } from 'lucide-react';

/**
 * /join — Join an existing organization or create a new one.
 *
 * This page is shown to authenticated users who need to:
 * 1. Enter an invite code/link to join an employer's organization
 * 2. Create a brand-new organization
 *
 * It handles the "employee onboarding" use case where an admin has
 * invited a team member by email, and the member needs to accept.
 */

export default function JoinOrCreatePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [inviteToken, setInviteToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [creating, setCreating] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Auth check — redirect to signin if not authenticated
  useEffect(() => {
    const supabase = createSupabaseClient();
    supabase.auth.getUser().then(({ data }: { data: { user: any } }) => {
      if (!data?.user) {
        router.replace('/auth/signin');
        return;
      }
      setUserEmail(data.user.email ?? null);

      // Check if already has org membership
      supabase
        .from('org_members')
        .select('organization_id')
        .eq('user_id', data.user.id)
        .limit(1)
        .maybeSingle()
        .then(({ data: membership }: { data: any }) => {
          if (membership?.organization_id) {
            // Already has org — go to app
            router.replace('/app');
            return;
          }
          setIsLoading(false);
        });
    });
  }, [router]);

  /** Extract token from a full invite URL or bare token string */
  const parseToken = (input: string): string => {
    const trimmed = input.trim();
    // Handle full URLs like https://app.formaos.com.au/accept-invite/TOKEN
    const urlMatch = trimmed.match(/accept-invite\/([a-zA-Z0-9]+)/);
    if (urlMatch) return urlMatch[1];
    // Bare token
    return trimmed;
  };

  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const token = parseToken(inviteToken);
    if (!token) {
      setError('Please enter a valid invite code or link.');
      return;
    }
    setJoining(true);
    // Navigate to the accept-invite page which handles validation
    router.push(`/accept-invite/${token}`);
  };

  const handleCreateOrg = async () => {
    setError(null);
    setCreating(true);
    try {
      const response = await fetch('/api/auth/bootstrap', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        const next = typeof data?.next === 'string' ? data.next : '/onboarding';
        router.push(next);
      } else {
        setError('Failed to create organization. Please try again.');
        setCreating(false);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="flex items-center gap-3 text-slate-300">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <Logo size={36} />
        {userEmail && (
          <span className="text-xs text-slate-400 truncate max-w-[200px]">
            {userEmail}
          </span>
        )}
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-6">
          {/* Title */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome to FormaOS
            </h1>
            <p className="text-slate-400">
              Join your employer&apos;s organization or create a new one
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          {/* Option 1: Join with invite code */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/10">
                <Mail className="h-5 w-5 text-sky-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Join Your Employer
                </h2>
                <p className="text-xs text-slate-400">
                  Enter the invite code or link from your admin
                </p>
              </div>
            </div>

            <form onSubmit={handleJoinWithCode} className="space-y-3">
              <input
                type="text"
                value={inviteToken}
                onChange={(e) => setInviteToken(e.target.value)}
                placeholder="Paste invite code or link..."
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-slate-400 focus:border-sky-400/50 focus:outline-none focus:ring-2 focus:ring-sky-400/20"
                disabled={joining}
              />
              <button
                type="submit"
                disabled={joining || !inviteToken.trim()}
                className="w-full rounded-lg bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {joining ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    Join Organization
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 border-t border-white/20" />
            <span className="text-xs text-slate-400">or</span>
            <div className="flex-1 border-t border-white/20" />
          </div>

          {/* Option 2: Create new org */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                <Building2 className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Create New Organization
                </h2>
                <p className="text-xs text-slate-400">
                  Start fresh with your own compliance workspace
                </p>
              </div>
            </div>

            <button
              onClick={handleCreateOrg}
              disabled={creating}
              className="w-full rounded-lg border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Organization
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
