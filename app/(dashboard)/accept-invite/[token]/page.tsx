import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { validateInvitation, acceptInvitation } from '@/lib/invitations/validate-invitation';
import { logActivity } from '@/lib/logger';
import Link from 'next/link';
import { ShieldCheck, Mail, Calendar, AlertCircle, CheckCircle } from 'lucide-react';

interface PageProps {
  params?: Promise<{
    token: string;
  }>;
}

export default async function AcceptInvitePage({ params }: PageProps) {
  const supabase = await createSupabaseServerClient();
  const resolvedParams = await params;
  const token = resolvedParams?.token ?? '';

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/signin?redirect=/accept-invite/${token}`);
  }

  const validation = await validateInvitation(token);

  if (!validation.valid) {
    let errorTitle = "Invalid Invitation";
    let errorDescription = validation.error || "This invitation link is invalid.";
    let icon = <AlertCircle className="h-12 w-12 text-red-500" />;
    let iconBg = "bg-red-500/10";

    if (validation.error?.includes("expired")) {
      errorTitle = "Invitation Expired";
      errorDescription = "This invitation has expired. Please contact the organization owner for a new invitation.";
      icon = <Calendar className="h-12 w-12 text-orange-500" />;
      iconBg = "bg-orange-500/10";
    } else if (validation.error?.includes("revoked")) {
      errorTitle = "Invitation Revoked";
      errorDescription = "This invitation has been revoked. Please contact the organization owner.";
      icon = <AlertCircle className="h-12 w-12 text-amber-500" />;
      iconBg = "bg-amber-500/10";
    } else if (validation.error?.includes("accepted")) {
      errorTitle = "Already Accepted";
      errorDescription = "This invitation has already been accepted.";
      icon = <CheckCircle className="h-12 w-12 text-emerald-500" />;
      iconBg = "bg-emerald-500/10";
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] p-6">
        <div className="max-w-md w-full">
          <div className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center">
            <div className={`mx-auto w-20 h-20 rounded-full ${iconBg} flex items-center justify-center mb-6`}>
              {icon}
            </div>
            <h1 className="text-2xl font-bold text-slate-100 mb-4">{errorTitle}</h1>
            <p className="text-slate-400 mb-8">{errorDescription}</p>
            <div className="flex flex-col gap-3">
              <Link href="/app" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[hsl(var(--card))] text-white rounded-xl font-semibold hover:brightness-110 transition-all">
                Go to Dashboard
              </Link>
              <Link href="/auth/signout" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 text-slate-200 rounded-xl font-semibold hover:bg-white/10 transition-all">
                Sign Out
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const invitation = validation.invitation!;

  if (invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] p-6">
        <div className="max-w-md w-full">
          <div className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
              <Mail className="h-12 w-12 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100 mb-4">Email Mismatch</h1>
            <p className="text-slate-400 mb-2">
              This invitation was sent to <span className="text-amber-400 font-semibold">{invitation.email}</span>
            </p>
            <p className="text-slate-400 mb-8">
              but you're signed in as <span className="text-amber-400 font-semibold">{user.email}</span>
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/auth/signin" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white rounded-xl font-semibold hover:brightness-110 transition-all">
                Sign In with Different Account
              </Link>
              <Link href="/auth/signout" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 text-slate-200 rounded-xl font-semibold hover:bg-white/10 transition-all">
                Sign Out
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const acceptResult = await acceptInvitation(token, user.id);

  if (!acceptResult.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
        <div className="max-w-md w-full bg-white/5 p-8 rounded-lg shadow-sm text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-slate-400 mb-6">
            {acceptResult.error || "Failed to accept invitation. Please try again."}
          </p>
        </div>
      </div>
    );
  }

  await logActivity(
    invitation.organization_id,
    "ACCEPT_INVITATION",
    invitation.email ?? "invitation",
    {
      metadata: {
        email: user.email,
        role: invitation.role,
        organization: invitation.organization_name,
      },
    }
  );

  return (
  <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] p-6">
      <div className="max-w-md w-full">
        <div className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
            <ShieldCheck className="h-12 w-12 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mb-4">Welcome to {invitation.organization_name || "the organization"}!</h1>
          <p className="text-slate-400 mb-8">
            You've successfully joined as a <span className="text-emerald-400 font-semibold">{invitation.role}</span>
          </p>
          <div className="animate-pulse">
            <Link href="/app" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white rounded-xl font-semibold hover:brightness-110 transition-all">
              Go to Dashboard
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  );
}
