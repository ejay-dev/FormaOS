import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import {
  extractMissingSupabaseColumn,
  getSupabaseErrorMessage,
  isMissingSupabaseColumnError,
} from '@/lib/supabase/schema-compat';

type EmailLogStatus = 'sent' | 'failed';

type RecordEmailLogInput = {
  emailType: string;
  recipientEmail: string;
  subject: string;
  status: EmailLogStatus;
  resendId?: string;
  errorMessage?: string;
  organizationId?: string;
  userId?: string;
};

export type OrganizationEmailLog = {
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

function normalizeRecipient(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.filter((entry) => typeof entry === 'string').join(', ');
  }

  return '';
}

function normalizeTimestamp(value: unknown) {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  return new Date(0).toISOString();
}

export async function recordEmailLog({
  emailType,
  recipientEmail,
  subject,
  status,
  resendId,
  errorMessage,
  organizationId,
  userId,
}: RecordEmailLogInput) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.rpc('log_email_send', {
    p_email_type: emailType,
    p_recipient_email: recipientEmail,
    p_subject: subject,
    p_status: status,
    p_resend_id: resendId || null,
    p_error_message: errorMessage || null,
    p_metadata: {},
    p_organization_id: organizationId || null,
    p_user_id: userId || null,
  });

  if (!error) {
    return;
  }

  const missingColumn = extractMissingSupabaseColumn(error, 'email_logs');
  const supabaseErrorMessage = getSupabaseErrorMessage(error);
  const shouldFallbackToLegacyInsert =
    missingColumn === 'email_type' ||
    isMissingSupabaseColumnError(error, 'email_logs', 'email_type') ||
    (supabaseErrorMessage.includes('email_logs') &&
      supabaseErrorMessage.includes('email_type'));

  if (!shouldFallbackToLegacyInsert || !organizationId) {
    throw error;
  }

  const admin = createSupabaseAdminClient();
  const { error: legacyInsertError } = await admin.from('email_logs').insert({
    organization_id: organizationId,
    template: emailType,
    recipient: recipientEmail,
    subject,
    status,
    error_message: errorMessage || null,
    sent_at: new Date().toISOString(),
  });

  if (legacyInsertError) {
    throw legacyInsertError;
  }
}

export async function getOrganizationEmailLogsCompat(
  organizationId: string,
  limit = 50,
): Promise<OrganizationEmailLog[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('email_logs')
    .select('*')
    .eq('organization_id', organizationId)
    .limit(limit);

  if (error) {
    console.error('[getOrganizationEmailLogs] Forensic Fetch Failed:', error.message);
    return [];
  }

  return (data ?? [])
    .map((row) => {
      const record = row as Record<string, unknown>;
      const createdAt = normalizeTimestamp(
        record.created_at ?? record.sent_at ?? record.updated_at,
      );

      return {
        id: String(record.id ?? ''),
        emailType: String(record.email_type ?? record.template ?? 'unknown'),
        recipientEmail: normalizeRecipient(
          record.recipient_email ?? record.recipient ?? record.recipients,
        ),
        subject: String(record.subject ?? ''),
        status: String(record.status ?? 'sent'),
        errorMessage:
          typeof record.error_message === 'string' ? record.error_message : null,
        createdAt,
        resendId:
          typeof record.resend_id === 'string'
            ? record.resend_id
            : typeof record.provider_id === 'string'
              ? record.provider_id
              : null,
        userId: typeof record.user_id === 'string' ? record.user_id : null,
      };
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}
