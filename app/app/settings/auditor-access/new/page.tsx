import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { fetchSystemState } from '@/lib/system-state/server';
import { createAuditorAccess } from '@/lib/auditor/portal';

export const metadata = { title: 'Grant Auditor Access | FormaOS' };

async function grantAccess(formData: FormData) {
  'use server';
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

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

  try {
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
    );
    redirect(
      `/app/settings/auditor-access?granted=${encodeURIComponent(token)}`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to grant access';
    redirect(
      `/app/settings/auditor-access/new?error=${encodeURIComponent(message)}`,
    );
  }
}

export default async function NewAuditorAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/app/settings/auditor-access"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Grant Auditor Access</h1>
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
        className="space-y-4 rounded-lg border border-border bg-card p-5"
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
            Issue Access Token
          </button>
        </div>
      </form>
    </div>
  );
}
