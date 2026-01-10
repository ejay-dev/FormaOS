import { getResendClient, getFromEmail } from "./resend-client";
import { ReactElement } from 'react';
import WelcomeEmail from '@/emails/welcome-email';
import InviteEmail from '@/emails/invite-email';
import AlertEmail from '@/emails/alert-email';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type EmailType = 'welcome' | 'invite' | 'alert';

interface BaseEmailData {
  to: string;
  type: EmailType;
  organizationId?: string;
  userId?: string;
}

interface WelcomeEmailData extends BaseEmailData {
  type: 'welcome';
  userName: string;
  organizationName: string;
  loginUrl?: string;
}

interface InviteEmailData extends BaseEmailData {
  type: 'invite';
  inviterName: string;
  inviterEmail: string;
  organizationName: string;
  inviteUrl: string;
  role: string;
}

interface AlertEmailData extends BaseEmailData {
  type: 'alert';
  userName: string;
  alertType: 'info' | 'warning' | 'critical';
  alertTitle: string;
  alertMessage: string;
  actionUrl?: string;
  actionText?: string;
}

export type EmailData = WelcomeEmailData | InviteEmailData | AlertEmailData;

/**
 * Check user email preferences before sending.
 * Enhanced to handle edge cases where user doesn't exist yet.
 */
async function checkEmailPreferences(
  email: string,
  emailType: EmailType
): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();
    
    // NOTE: We look up the preferences by the user's email 
    // This assumes the user already has a record in email_preferences.
    // We use a join or a subquery if user_id is unknown.
    const { data: prefs, error } = await supabase
      .from('email_preferences')
      .select(`
        *,
        user:user_id (
          email
        )
      `)
      .filter('user.email', 'eq', email.toLowerCase())
      .maybeSingle();

    if (error) {
      console.error('[checkEmailPreferences] DB Error:', error.message);
      return true; // Default to allowing if DB check fails
    }

    if (!prefs) return true; // No settings found (e.g. new invite), allow email
    if (prefs.unsubscribed_all) return false;

    switch (emailType) {
      case 'welcome':
        return prefs.welcome_emails;
      case 'invite':
        return prefs.invitation_emails;
      case 'alert':
        return prefs.alert_emails;
      default:
        return true;
    }
  } catch (error) {
    console.error('[checkEmailPreferences] Unexpected Error:', error);
    return true; 
  }
}

/**
 * Log email status to the immutable email_logs table.
 */
async function logEmail(
  emailType: string,
  recipientEmail: string,
  subject: string,
  status: 'sent' | 'failed',
  resendId?: string,
  errorMessage?: string,
  organizationId?: string,
  userId?: string
) {
  try {
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

    if (error) throw error;
  } catch (error) {
    console.error('[logEmail] Failed to record in ledger:', error);
  }
}

export async function sendEmail(data: EmailData) {
  try {
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "https://app.formaos.com.au";
    const appBase = appUrl.replace(/\/$/, "");

    // 1. Policy Enforcement: Check if user wants this email
    const allowed = await checkEmailPreferences(data.to, data.type);
    if (!allowed) {
      console.log(`[sendEmail] BLOCKED: User ${data.to} opted out of ${data.type}`);
      return { success: false, error: 'OPTED_OUT' };
    }

    let subject = '';
    let react: ReactElement;

    // 2. Template Selection
    switch (data.type) {
      case 'welcome':
        subject = `Welcome to FormaOS, ${data.userName}!`;
        react = WelcomeEmail({
          userName: data.userName,
          organizationName: data.organizationName,
          loginUrl: data.loginUrl || `${appBase}/app`,
        }) as ReactElement;
        break;

      case 'invite':
        subject = `Invitation: Join ${data.organizationName} on FormaOS`;
        react = InviteEmail({
          inviterName: data.inviterName,
          inviterEmail: data.inviterEmail,
          organizationName: data.organizationName,
          inviteUrl: data.inviteUrl,
          role: data.role,
        }) as ReactElement;
        break;

      case 'alert':
        subject = `FormaOS Alert: ${data.alertTitle}`;
        react = AlertEmail({
          userName: data.userName,
          alertType: data.alertType,
          alertTitle: data.alertTitle,
          alertMessage: data.alertMessage,
          actionUrl: data.actionUrl,
          actionText: data.actionText,
        }) as ReactElement;
        break;

      default:
        throw new Error('Invalid email type');
    }

    // 3. Execution: Send via Resend
    const resend = getResendClient();
    if (!resend) {
      throw new Error("Resend is not configured.");
    }

    const result = await resend.emails.send({
      from: getFromEmail(),
      to: data.to,
      subject,
      react,
    });

    if (result.error) throw new Error(result.error.message);

    // 4. Traceability: Log success
    await logEmail(
      data.type,
      data.to,
      subject,
      'sent',
      result.data?.id,
      undefined,
      data.organizationId,
      data.userId
    );

    return { success: true, data: result.data };
  } catch (error: any) {
    console.error('[sendEmail] CRITICAL FAILURE:', error.message);

    // Log failure for audit purposes
    await logEmail(
      data.type,
      data.to,
      'FAILED_TO_SEND',
      'failed',
      undefined,
      error instanceof Error ? error.message : 'Unknown transport error',
      data.organizationId,
      data.userId
    );

    return { success: false, error: error.message };
  }
}
