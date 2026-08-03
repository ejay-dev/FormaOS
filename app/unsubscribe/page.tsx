import { redirect } from 'next/navigation';

import { brand } from '@/config/brand';
import { verifyUnsubscribeToken } from '@/lib/email/unsubscribe-token';
import { unsubscribeUserFromAllEmail } from '@/lib/email/unsubscribe';

export const dynamic = 'force-dynamic';

type SearchParams = {
  token?: string;
  status?: string;
};

// Mail scanners (Outlook SafeLinks and similar) follow every link in an
// email, so the opt-out write must never happen on GET — the page renders a
// confirmation and only writes when the recipient submits this action.
async function unsubscribeAction(formData: FormData) {
  'use server';

  const submittedToken = String(formData.get('token') ?? '');
  const payload = submittedToken
    ? verifyUnsubscribeToken(submittedToken)
    : null;

  if (!payload) {
    redirect('/unsubscribe');
  }

  const { ok } = await unsubscribeUserFromAllEmail(payload.userId);

  redirect(
    ok
      ? '/unsubscribe?status=done'
      : `/unsubscribe?status=failed&token=${encodeURIComponent(submittedToken)}`,
  );
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const token = typeof params.token === 'string' ? params.token : null;
  const status = typeof params.status === 'string' ? params.status : null;
  const payload = token ? verifyUnsubscribeToken(token) : null;

  let title: string;
  let message: string;
  let showConfirmForm = false;

  if (status === 'done') {
    title = 'Unsubscribed';
    message = `You have been unsubscribed from all ${brand.appName} emails. Account-related security notices may still be delivered.`;
  } else if (!payload) {
    title = 'Unsubscribe link not valid';
    message =
      'This unsubscribe link is invalid or has expired. Please contact support if you continue to receive unwanted emails.';
  } else if (status === 'failed') {
    title = 'Unsubscribe failed';
    message =
      'Your email preferences could not be updated. Please try again in a moment, or reply to any email to opt out.';
    showConfirmForm = true;
  } else {
    title = `Unsubscribe from ${brand.appName} emails`;
    message =
      'Confirm below to stop product and lifecycle emails to this address. Account and security notices are still delivered.';
    showConfirmForm = true;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          {message}
        </p>
        {showConfirmForm && token ? (
          <form action={unsubscribeAction} className="mt-6">
            <input type="hidden" name="token" value={token} />
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-lg bg-foreground px-6 py-3 text-sm font-semibold text-background transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {status === 'failed' ? 'Try again' : 'Unsubscribe'}
            </button>
          </form>
        ) : null}
        <div className="mt-6 text-xs text-muted-foreground">
          Need help?{' '}
          <a
            className="text-foreground underline underline-offset-2 hover:no-underline"
            href={`mailto:${brand.email.contactEmail}`}
          >
            {brand.email.contactEmail}
          </a>
        </div>
      </div>
    </main>
  );
}
