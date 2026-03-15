import Link from 'next/link';
import { redirect } from 'next/navigation';

import {
  acceptInvitation,
  getPendingInvitation,
} from '@/lib/multi-org';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface PageProps {
  params?: Promise<{
    membershipId: string;
  }>;
  searchParams?: Promise<{
    error?: string;
  }>;
}

function StateCard(props: {
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-100">{props.title}</h1>
        <p className="mt-4 text-slate-400">{props.description}</p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href={props.primaryHref}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 px-6 py-3 font-semibold text-white transition-all hover:brightness-110"
          >
            {props.primaryLabel}
          </Link>
          {props.secondaryHref && props.secondaryLabel ? (
            <Link
              href={props.secondaryHref}
              className="inline-flex items-center justify-center rounded-xl bg-white/5 px-6 py-3 font-semibold text-slate-200 transition-all hover:bg-white/10"
            >
              {props.secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default async function AcceptOrganizationInvitePage({
  params,
  searchParams,
}: PageProps) {
  const supabase = await createSupabaseServerClient();
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const membershipId = resolvedParams?.membershipId ?? '';
  const actionError = resolvedSearchParams?.error;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/signin?redirect=/accept-organization-invite/${membershipId}`);
  }

  const invitation = await getPendingInvitation(membershipId);
  if (!invitation || invitation.status !== 'invited') {
    return (
      <StateCard
        title="Invitation unavailable"
        description="This organization invitation is invalid, expired, or has already been accepted."
        primaryHref="/app"
        primaryLabel="Go to dashboard"
      />
    );
  }

  if (invitation.user_id !== user.id) {
    return (
      <StateCard
        title="Wrong account"
        description={`This invitation was sent to ${invitation.user_email || 'another account'}. Sign in with that account to continue.`}
        primaryHref={`/auth/signin?redirect=/accept-organization-invite/${membershipId}`}
        primaryLabel="Sign in with invited account"
        secondaryHref="/auth/signout"
        secondaryLabel="Sign out"
      />
    );
  }

  async function acceptAction() {
    'use server';

    const actionSupabase = await createSupabaseServerClient();
    const {
      data: { user: actionUser },
    } = await actionSupabase.auth.getUser();

    if (!actionUser) {
      redirect(`/auth/signin?redirect=/accept-organization-invite/${membershipId}`);
    }

    const currentInvitation = await getPendingInvitation(membershipId);
    if (
      !currentInvitation ||
      currentInvitation.status !== 'invited' ||
      currentInvitation.user_id !== actionUser.id
    ) {
      redirect(`/accept-organization-invite/${membershipId}?error=invalid`);
    }

    await acceptInvitation(membershipId, actionUser.id);
    redirect('/app?invite_accepted=1');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-100">
          Join {invitation.organization_name || 'organization'}
        </h1>
        <p className="mt-4 text-slate-400">
          Confirm your access to join this workspace as a{' '}
          <span className="font-semibold text-slate-200">{invitation.role}</span>.
        </p>
        {actionError ? (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            We could not complete the invitation acceptance. Please try again.
          </div>
        ) : null}
        <form action={acceptAction} className="mt-8">
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 px-6 py-3 font-semibold text-white transition-all hover:brightness-110"
          >
            Accept invitation
          </button>
        </form>
      </div>
    </div>
  );
}
