import { redirect } from 'next/navigation';

import {
  SettingsPageHeader,
  SettingsPageShell,
} from '@/components/settings/settings-page-header';
import { getOrganizationEmailLogs } from '@/lib/data/emails';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata = { title: 'Email history | Settings | FormaOS' };

const PAGE_SIZE = 50;

type EmailLog = {
  id: string;
  emailType: string;
  recipientEmail: string;
  subject: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
  resendId: string | null;
  userId: string | null;
};

export default async function EmailHistoryPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/signin');

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!membership) {
    return (
      <SettingsPageShell>
        <SettingsPageHeader
          title="Email history"
          description="Emails FormaOS has sent to your team."
        />
        <p className="text-sm text-muted-foreground">
          You are not a member of an organisation yet, so there is nothing to
          show.
        </p>
      </SettingsPageShell>
    );
  }

  const logs: EmailLog[] = await getOrganizationEmailLogs(
    membership.organization_id,
    PAGE_SIZE,
  );

  return (
    <SettingsPageShell>
      <SettingsPageHeader
        title="Email history"
        description="Emails FormaOS has sent to your team, newest first."
      />

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium sm:px-6">Recipient</th>
                <th className="px-4 py-3 font-medium sm:px-6">Type</th>
                <th className="px-4 py-3 font-medium sm:px-6">Subject</th>
                <th className="px-4 py-3 font-medium sm:px-6">Status</th>
                <th className="px-4 py-3 font-medium sm:px-6">Sent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-muted-foreground sm:px-6"
                  >
                    No emails have been sent yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-4 font-medium text-foreground sm:px-6">
                      {log.recipientEmail}
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      <span className="rounded bg-muted px-2 py-1 text-xs font-medium capitalize text-muted-foreground">
                        {log.emailType.replaceAll('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground sm:px-6">
                      {log.subject}
                    </td>
                    <td className="px-4 py-4 sm:px-6">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            log.status === 'sent'
                              ? 'border border-success/20 bg-success/10 text-success'
                              : 'border border-destructive/20 bg-destructive/10 text-destructive'
                          }`}
                        >
                          {log.status === 'sent' ? 'Delivered' : 'Failed'}
                        </span>
                        {log.status === 'failed' && log.errorMessage ? (
                          <span className="max-w-[180px] text-xs leading-tight text-destructive">
                            {log.errorMessage}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-4 tabular-nums text-muted-foreground sm:px-6">
                      {new Date(log.createdAt).toLocaleString('en-AU', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {logs.length === PAGE_SIZE
          ? `Showing the ${PAGE_SIZE} most recent emails.`
          : `${logs.length} email${logs.length === 1 ? '' : 's'} sent.`}
      </p>
    </SettingsPageShell>
  );
}
