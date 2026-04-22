import { brand } from '@/config/brand';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { verifyUnsubscribeToken } from '@/lib/email/unsubscribe-token';

export const dynamic = 'force-dynamic';

type SearchParams = {
  token?: string;
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const token = typeof params.token === 'string' ? params.token : null;
  const payload = token ? verifyUnsubscribeToken(token) : null;

  let statusMessage: string;
  let statusKind: 'success' | 'error';

  if (!payload) {
    statusKind = 'error';
    statusMessage =
      'This unsubscribe link is invalid or has expired. Please contact support if you continue to receive unwanted emails.';
  } else {
    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from('email_preferences')
      .upsert(
        {
          user_id: payload.userId,
          unsubscribed_all: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );

    if (error) {
      statusKind = 'error';
      statusMessage =
        'We could not update your email preferences right now. Please try again in a moment or reply to any email to opt out.';
    } else {
      statusKind = 'success';
      statusMessage = `You have been unsubscribed from all ${brand.appName} emails. Account-related security notices may still be delivered.`;
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <h1 className="text-xl font-semibold text-white">
          {statusKind === 'success' ? 'Unsubscribed' : 'Unsubscribe failed'}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-300">
          {statusMessage}
        </p>
        <div className="mt-6 text-xs text-slate-500">
          Need help?{' '}
          <a
            className="text-cyan-400 hover:underline"
            href={`mailto:${brand.email.contactEmail}`}
          >
            {brand.email.contactEmail}
          </a>
        </div>
      </div>
    </main>
  );
}
