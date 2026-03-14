import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Mail,
  ShieldCheck,
} from 'lucide-react';

import {
  acceptInvitation,
  validateInvitation,
} from '@/lib/invitations/validate-invitation';
import { logActivity } from '@/lib/logger';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface PageProps {
  params?: Promise<{
    token: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
}

function renderInviteState(options: {
  title: string;
  description: ReactNode;
  icon: ReactNode;
  iconBg: string;
  actions: ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] p-6">
      <div className="max-w-md w-full">
        <div className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center">
          <div
            className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${options.iconBg}`}
          >
            {options.icon}
          </div>
          <h1 className="mb-4 text-2xl font-bold text-slate-100">
            {options.title}
          </h1>
          <div className="mb-8 text-slate-400">{options.description}</div>
          <div className="flex flex-col gap-3">{options.actions}</div>
        </div>
      </div>
    </div>
  );
}

export default async function AcceptInvitePage({
  params,
  searchParams,
}: PageProps) {
  const supabase = await createSupabaseServerClient();
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const token = resolvedParams?.token ?? '';
  const actionError = resolvedSearchParams?.error ?? null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/signin?redirect=/accept-invite/${token}`);
  }

  const validation = await validateInvitation(token);

  if (!validation.valid) {
    let errorTitle = 'Invalid Invitation';
    let errorDescription =
      validation.error || 'This invitation link is invalid.';
    let icon = <AlertCircle className="h-12 w-12 text-red-500" />;
    let iconBg = 'bg-red-500/10';

    if (validation.error?.includes('expired')) {
      errorTitle = 'Invitation Expired';
      errorDescription =
        'This invitation has expired. Please contact the organization owner for a new invitation.';
      icon = <Calendar className="h-12 w-12 text-orange-500" />;
      iconBg = 'bg-orange-500/10';
    } else if (validation.error?.includes('revoked')) {
      errorTitle = 'Invitation Revoked';
      errorDescription =
        'This invitation has been revoked. Please contact the organization owner.';
      icon = <AlertCircle className="h-12 w-12 text-amber-500" />;
      iconBg = 'bg-amber-500/10';
    } else if (validation.error?.includes('accepted')) {
      errorTitle = 'Already Accepted';
      errorDescription = 'This invitation has already been accepted.';
      icon = <CheckCircle className="h-12 w-12 text-emerald-500" />;
      iconBg = 'bg-emerald-500/10';
    }

    return renderInviteState({
      title: errorTitle,
      description: <p>{errorDescription}</p>,
      icon,
      iconBg,
      actions: (
        <>
          <Link
            href="/app"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[hsl(var(--card))] px-6 py-3 font-semibold text-white transition-all hover:brightness-110"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/auth/signout"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 px-6 py-3 font-semibold text-slate-200 transition-all hover:bg-white/10"
          >
            Sign Out
          </Link>
        </>
      ),
    });
  }

  const invitation = validation.invitation!;

  async function acceptInviteAction() {
    'use server';

    const actionSupabase = await createSupabaseServerClient();
    const {
      data: { user: actionUser },
    } = await actionSupabase.auth.getUser();

    if (!actionUser) {
      redirect(`/auth/signin?redirect=/accept-invite/${token}`);
    }

    const currentValidation = await validateInvitation(token);
    if (!currentValidation.valid || !currentValidation.invitation) {
      redirect(`/accept-invite/${token}?error=invalid`);
    }

    const currentInvitation = currentValidation.invitation;
    if (
      currentInvitation.email.toLowerCase() !== actionUser.email?.toLowerCase()
    ) {
      redirect(`/accept-invite/${token}?error=email_mismatch`);
    }

    const acceptResult = await acceptInvitation(token, actionUser.id);
    if (!acceptResult.success) {
      redirect(`/accept-invite/${token}?error=accept_failed`);
    }

    await logActivity(
      currentInvitation.organization_id,
      'ACCEPT_INVITATION',
      currentInvitation.email ?? 'invitation',
      {
        metadata: {
          email: actionUser.email,
          role: currentInvitation.role,
          organization: currentInvitation.organization_name,
        },
      },
    );

    redirect('/app?invite_accepted=1');
  }

  if (invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
    return renderInviteState({
      title: 'Email Mismatch',
      description: (
        <>
          <p className="mb-2">
            This invitation was sent to{' '}
            <span className="font-semibold text-amber-400">
              {invitation.email}
            </span>
          </p>
          <p>
            but you&apos;re signed in as{' '}
            <span className="font-semibold text-amber-400">{user.email}</span>
          </p>
        </>
      ),
      icon: <Mail className="h-12 w-12 text-amber-500" />,
      iconBg: 'bg-amber-500/10',
      actions: (
        <>
          <Link
            href={`/auth/signin?redirect=/accept-invite/${token}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 px-6 py-3 font-semibold text-white transition-all hover:brightness-110"
          >
            Sign In with Different Account
          </Link>
          <Link
            href="/auth/signout"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 px-6 py-3 font-semibold text-slate-200 transition-all hover:bg-white/10"
          >
            Sign Out
          </Link>
        </>
      ),
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] p-6">
      <div className="max-w-md w-full">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
            <ShieldCheck className="h-12 w-12 text-emerald-500" />
          </div>
          <h1 className="mb-4 text-2xl font-bold text-slate-100">
            Join {invitation.organization_name || 'the organization'}
          </h1>
          <p className="mb-3 text-slate-400">
            Review the invite details below and confirm to join the workspace.
          </p>
          {actionError ? (
            <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {actionError === 'accept_failed'
                ? 'We could not complete the invitation acceptance. Please try again.'
                : actionError === 'email_mismatch'
                  ? 'You must sign in with the invited email address before accepting.'
                  : 'This invitation can no longer be accepted.'}
            </div>
          ) : null}
          <div className="mb-8 rounded-2xl border border-white/10 bg-black/10 p-4 text-left">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Invited Email
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-100">
              {invitation.email}
            </p>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Access Role
            </p>
            <p className="mt-1 text-sm font-semibold capitalize text-emerald-300">
              {invitation.role}
            </p>
          </div>
          <form action={acceptInviteAction} className="flex flex-col gap-3">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 px-8 py-4 font-semibold text-white transition-all hover:brightness-110"
            >
              Accept Invitation
              <ArrowRight className="h-5 w-5" />
            </button>
            <Link
              href="/auth/signout"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 px-8 py-4 font-semibold text-slate-200 transition-all hover:bg-white/10"
            >
              Sign Out
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 8l4 4m0 0l-4 4m4-4H3"
      />
    </svg>
  );
}
