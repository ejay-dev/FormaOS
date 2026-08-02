import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { fetchSystemState } from '@/lib/system-state/server';
import { createAuditorAccess } from '@/lib/auditor/portal';
import { brand } from '@/config/brand';

export const metadata = { title: 'Grant Auditor Access | FormaOS' };

// The raw token is only ever produced once. It is handed back through a
// short-lived httpOnly cookie rather than a query string so it stays out of
// browser history, referrers and proxy/access logs.
const ISSUED_TOKEN_COOKIE = 'formaos_auditor_issued_token';
const ISSUED_TOKEN_TTL_SECONDS = 600;

async function grantAccess(formData: FormData) {
  'use server';
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');

  const auditorName = String(formData.get('auditor_name') ?? '').trim();
  const auditorEmail = String(formData.get('auditor_email') ?? '').trim();
  const auditorCompany = String(formData.get('auditor_company') ?? '').trim();
  const expiresInDays = Number.parseInt(
    String(formData.get('expires_in_days') ?? '30'),
    10,
  );

  if (!auditorName || !auditorEmail) {
    redirect('/app/settings/auditor-access/new?error=name-and-email-required');
  }

  // redirect() signals by throwing NEXT_REDIRECT, so only the create call is
  // guarded — a catch spanning the success redirect would swallow it.
  const { token } = await createAuditorAccess(
    state.organization.id,
    state.user.id,
    {
      auditorName,
      auditorEmail,
      auditorCompany: auditorCompany || undefined,
      scopes: {},
      expiresInDays: Number.isFinite(expiresInDays) ? expiresInDays : 30,
    },
  ).catch((err: unknown): never => {
    const message =
      err instanceof Error ? err.message : 'Failed to grant access';
    redirect(
      `/app/settings/auditor-access/new?error=${encodeURIComponent(message)}`,
    );
  });

  const cookieStore = await cookies();
  cookieStore.set(ISSUED_TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/app/settings/auditor-access',
    maxAge: ISSUED_TOKEN_TTL_SECONDS,
  });

  redirect('/app/settings/auditor-access/new?issued=1');
}

async function dismissIssuedToken() {
  'use server';
  const cookieStore = await cookies();
  cookieStore.delete({
    name: ISSUED_TOKEN_COOKIE,
    path: '/app/settings/auditor-access',
  });
  redirect('/app/settings/auditor-access');
}

export default async function NewAuditorAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; issued?: string }>;
}) {
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');
  const { error, issued } = await searchParams;

  const issuedToken = issued
    ? ((await cookies()).get(ISSUED_TOKEN_COOKIE)?.value ?? null)
    : null;

  if (issuedToken) {
    const portalUrl = `${brand.seo.appUrl.replace(/\/$/, '')}/audit-portal/${issuedToken}`;

    return (
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold">Auditor Access Granted</h1>
          <p className="text-sm text-muted-foreground">
            Send this link to the auditor. It is shown once and cannot be
            retrieved later.
          </p>
        </div>

        <div className="space-y-3 rounded-lg border border-border bg-card p-5">
          <label
            htmlFor="auditor_portal_url"
            className="block text-sm font-medium"
          >
            Auditor portal link
          </label>
          <input
            id="auditor_portal_url"
            readOnly
            value={portalUrl}
            className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs"
          />
          <p className="text-xs text-muted-foreground">
            Anyone holding this link has read-only access to your compliance
            data until it expires.
          </p>
        </div>

        <form action={dismissIssuedToken} className="flex justify-end">
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            I&rsquo;ve copied the link
          </button>
        </form>
      </div>
    );
  }

  // The grant was created but the cookie carrying the one-time link is gone
  // (past its 10 minute life, a different browser, or cookies blocked). The
  // raw token is unrecoverable, so say so instead of falling through to a
  // blank form that reads as if nothing happened.
  if (issued && !issuedToken) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold">Link No Longer Available</h1>
          <p className="text-sm text-muted-foreground">
            The auditor access grant was created, but its one-time link can no
            longer be shown. Revoke the grant on the access list and issue a new
            one.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/app/settings/auditor-access"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Back to auditor access
          </Link>
          <Link
            href="/app/settings/auditor-access/new"
            className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            Issue a new grant
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-16">
      <div className="flex items-center gap-3">
        <Link
          href="/app/settings/auditor-access"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Grant auditor access</h1>
          <p className="text-sm text-muted-foreground">
            Issue a time-limited, read-only link to an external auditor
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <form
        action={grantAccess}
        className="max-w-2xl space-y-4 rounded-lg border border-border bg-card p-5"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="auditor_name" className="mb-1 block text-sm font-medium">
              Auditor name <span className="text-destructive">*</span>
            </label>
            <input
              id="auditor_name"
              name="auditor_name"
              type="text"
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label htmlFor="auditor_email" className="mb-1 block text-sm font-medium">
              Auditor email <span className="text-destructive">*</span>
            </label>
            <input
              id="auditor_email"
              name="auditor_email"
              type="email"
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>
        <div>
          <label htmlFor="auditor_company" className="mb-1 block text-sm font-medium">
            Company / firm
          </label>
          <input
            id="auditor_company"
            name="auditor_company"
            type="text"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div>
          <label htmlFor="expires_in_days" className="mb-1 block text-sm font-medium">
            Expires in (days)
          </label>
          <select
            id="expires_in_days"
            name="expires_in_days"
            defaultValue="30"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
            <option value="60">60 days</option>
            <option value="90">90 days</option>
          </select>
          <p className="mt-1 text-xs text-muted-foreground">
            Access automatically expires. You can revoke the grant at any time.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          <Link
            href="/app/settings/auditor-access"
            className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Grant access
          </button>
        </div>
      </form>
    </div>
  );
}
