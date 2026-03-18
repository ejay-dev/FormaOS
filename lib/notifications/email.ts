/**
 * =========================================================
 * Advanced Email Notifications System
 * =========================================================
 * Rich HTML email templates with scheduling and preferences
 */

import { createSupabaseServerClient as createClient } from '@/lib/supabase/server';
import { getFromEmail, getResendClient } from '@/lib/email/resend-client';

export type EmailTemplate =
  | 'task_assignment'
  | 'task_reminder'
  | 'task_overdue'
  | 'certificate_expiring'
  | 'certificate_expired'
  | 'evidence_request'
  | 'compliance_alert'
  | 'risk_analysis_report'
  | 'weekly_digest'
  | 'monthly_report'
  | 'welcome'
  | 'invitation';

export interface EmailNotification {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  template: EmailTemplate;
  data: Record<string, any>;
  organizationId: string;
  priority?: 'low' | 'normal' | 'high';
  scheduledFor?: string;
}

export interface EmailPreferences {
  userId: string;
  organizationId: string;
  enabled: boolean;
  frequency: 'immediate' | 'daily_digest' | 'weekly_digest';
  enabledEvents: EmailTemplate[];
  quietHours?: {
    start: string; // HH:MM
    end: string; // HH:MM
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, ' - ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate HTML email for task assignment
 */
function generateTaskAssignmentEmail(data: {
  taskTitle: string;
  taskDescription: string;
  dueDate: string;
  priority: string;
  assignedBy: string;
  orgName: string;
  taskUrl: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #e2e8f0; background: #0f172a; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-bottom: 1px solid #22d3ee33; padding: 32px 40px; text-align: center; }
          .header h1 { color: #22d3ee; font-size: 28px; font-weight: 800; margin: 0; letter-spacing: -0.5px; }
          .header p { color: #94a3b8; font-size: 13px; margin: 8px 0 0; letter-spacing: 0.05em; text-transform: uppercase; }
          .content { padding: 36px 40px; background: #1e293b; }
          .task-details { background: #0f172a; border: 1px solid #22d3ee22; border-radius: 10px; padding: 24px; margin: 24px 0; }
          .label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 4px; margin-top: 16px; }
          .label:first-child { margin-top: 0; }
          .value { color: #e2e8f0; font-size: 15px; margin-bottom: 0; }
          .priority-high { color: #f87171; font-weight: 700; }
          .priority-medium { color: #fb923c; font-weight: 700; }
          .priority-low { color: #4ade80; font-weight: 700; }
          .btn-wrap { text-align: center; margin: 32px 0; }
          .button { display: inline-block; background: #22d3ee; color: #0f172a; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; letter-spacing: -0.2px; }
          .footer { text-align: center; color: #475569; font-size: 12px; margin-top: 32px; padding: 24px 40px; border-top: 1px solid #22d3ee11; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FormaOS</h1>
            <p>Compliance Operating System</p>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You have been assigned a new task in <strong style="color:#22d3ee">${data.orgName}</strong>.</p>
            
            <div class="task-details">
              <div class="label">Task</div>
              <div class="value"><strong>${data.taskTitle}</strong></div>
              
              <div class="label">Description</div>
              <div class="value">${data.taskDescription || 'No description provided'}</div>
              
              <div class="label">Priority</div>
              <div class="value priority-${data.priority}">${data.priority.toUpperCase()}</div>
              
              <div class="label">Due Date</div>
              <div class="value">${new Date(data.dueDate).toLocaleDateString()}</div>
              
              <div class="label">Assigned By</div>
              <div class="value">${data.assignedBy}</div>
            </div>
            
            <div class="btn-wrap">
              <a href="${data.taskUrl}" class="button">View Task →</a>
            </div>
            
            <p style="color:#94a3b8;font-size:14px">Please complete this task by the due date to maintain compliance.</p>
          </div>
          
          <div class="footer">
            <p>Sent by FormaOS &mdash; Compliance Operating System</p>
            <p>Manage your email preferences in account settings.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate HTML email for certificate expiring
 */
function generateCertificateExpiringEmail(data: {
  certificateName: string;
  expiryDate: string;
  daysRemaining: number;
  orgName: string;
  certificateUrl: string;
}): string {
  const urgencyColor =
    data.daysRemaining <= 7
      ? '#ef4444'
      : data.daysRemaining <= 30
        ? '#f59e0b'
        : '#2563eb';
  const urgencyIcon = data.daysRemaining <= 7 ? '🚨' : '⚠️';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #e2e8f0; background: #0f172a; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; overflow: hidden; }
          .header { background: linear-gradient(135deg, ${urgencyColor} 0%, ${urgencyColor}cc 100%); padding: 32px 40px; text-align: center; }
          .header h1 { color: #fff; font-size: 26px; font-weight: 800; margin: 0; }
          .header p { color: rgba(255,255,255,0.8); font-size: 13px; margin: 8px 0 0; }
          .content { padding: 36px 40px; background: #1e293b; }
          .alert-box { background: #0f172a; border-left: 4px solid ${urgencyColor}; border-radius: 8px; padding: 18px 20px; margin: 24px 0; }
          .alert-box p { color: #f8fafc; font-weight: 700; margin: 0; font-size: 15px; }
          .cert-details { background: #0f172a; border: 1px solid #22d3ee22; border-radius: 10px; padding: 24px; margin: 24px 0; }
          .label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin-bottom: 4px; margin-top: 16px; }
          .label:first-child { margin-top: 0; }
          .value { color: #e2e8f0; font-size: 15px; }
          .btn-wrap { text-align: center; margin: 32px 0; }
          .button { display: inline-block; background: ${urgencyColor}; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; }
          .footer { text-align: center; color: #475569; font-size: 12px; padding: 24px 40px; border-top: 1px solid #22d3ee11; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${urgencyIcon} Certificate Expiring Soon</h1>
            <p>FormaOS &mdash; Compliance Operating System</p>
          </div>
          <div class="content">
            <div class="alert-box"><p>Action Required: Your certificate is expiring in ${data.daysRemaining} days!</p></div>
            
            <p style="color:#94a3b8">Hello,</p>
            <p>This is a reminder that one of your certificates in <strong style="color:#22d3ee">${data.orgName}</strong> is approaching its expiration date.</p>
            
            <div class="cert-details">
              <div class="label">Certificate</div>
              <div class="value"><strong>${data.certificateName}</strong></div>
              
              <div class="label">Expiry Date</div>
              <div class="value">${new Date(data.expiryDate).toLocaleDateString()}</div>
              
              <div class="label">Days Remaining</div>
              <div class="value" style="color: ${urgencyColor}; font-weight: bold;">${data.daysRemaining} days</div>
            </div>
            
            <div class="btn-wrap">
              <a href="${data.certificateUrl}" class="button">Renew Certificate →</a>
            </div>
            
            <p style="color:#94a3b8;font-size:14px">Please renew before it expires to maintain compliance.</p>
          </div>
          <div class="footer">
            <p>Sent by FormaOS &mdash; Compliance Operating System</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate HTML email for compliance alert
 */
function generateComplianceAlertEmail(data: {
  alertTitle: string;
  alertDescription: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  orgName: string;
  dashboardUrl: string;
}): string {
  const colors = {
    low: '#2563eb',
    medium: '#f59e0b',
    high: '#ef4444',
    critical: '#dc2626',
  };
  const color = colors[data.severity];

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #e2e8f0; background: #0f172a; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; overflow: hidden; }
          .header { background: linear-gradient(135deg, ${color} 0%, ${color}cc 100%); padding: 32px 40px; text-align: center; }
          .header h1 { color: #fff; font-size: 26px; font-weight: 800; margin: 0; }
          .header p { color: rgba(255,255,255,0.8); font-size: 13px; margin: 8px 0 0; }
          .content { padding: 36px 40px; }
          .alert-box { background: #0f172a; border-left: 4px solid ${color}; border-radius: 8px; padding: 18px 20px; margin: 24px 0; }
          .alert-box strong { color: #f8fafc; font-size: 15px; }
          .recommendations { background: #0f172a; border: 1px solid #22d3ee22; border-radius: 10px; padding: 24px; margin: 24px 0; }
          .recommendations strong { color: #22d3ee; display: block; margin-bottom: 12px; }
          .rec-item { color: #cbd5e1; margin: 8px 0; padding-left: 16px; font-size: 14px; }
          .btn-wrap { text-align: center; margin: 32px 0; }
          .button { display: inline-block; background: ${color}; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; }
          .footer { text-align: center; color: #475569; font-size: 12px; padding: 24px 40px; border-top: 1px solid #22d3ee11; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 Compliance Alert &mdash; ${data.severity.toUpperCase()}</h1>
            <p>FormaOS &mdash; Compliance Operating System</p>
          </div>
          <div class="content">
            <div class="alert-box">
              <strong>${data.alertTitle}</strong>
            </div>
            
            <p style="color:#94a3b8">Hello,</p>
            <p>A compliance alert has been detected in <strong style="color:#22d3ee">${data.orgName}</strong>.</p>
            
            <p style="background: #0f172a; padding: 16px; border-radius: 8px; color: #cbd5e1; font-size: 14px;">
              ${data.alertDescription}
            </p>
            
            <div class="recommendations">
              <strong>Recommended Actions</strong>
              ${data.recommendations.map((rec) => `<div class="rec-item">&bull; ${rec}</div>`).join('')}
            </div>
            
            <div class="btn-wrap">
              <a href="${data.dashboardUrl}" class="button">View Dashboard →</a>
            </div>
          </div>
          <div class="footer">
            <p>Sent by FormaOS &mdash; Compliance Operating System</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate HTML email for weekly digest
 */
function generateWeeklyDigestEmail(data: {
  userName: string;
  orgName: string;
  weekStart: string;
  weekEnd: string;
  stats: {
    tasksCompleted: number;
    tasksPending: number;
    certificatesRenewed: number;
    certificatesExpiring: number;
    evidenceUploaded: number;
    riskScore: number;
  };
  topTasks: Array<{ title: string; dueDate: string }>;
  dashboardUrl: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #e2e8f0; background: #0f172a; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-bottom: 1px solid #22d3ee33; padding: 32px 40px; text-align: center; }
          .header h1 { color: #22d3ee; font-size: 26px; font-weight: 800; margin: 0; }
          .header p { color: #94a3b8; font-size: 13px; margin: 8px 0 0; }
          .content { padding: 36px 40px; }
          .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 24px 0; }
          .stat-card { background: #0f172a; border: 1px solid #22d3ee22; padding: 18px; border-radius: 10px; text-align: center; }
          .stat-value { font-size: 32px; font-weight: 800; color: #22d3ee; line-height: 1; }
          .stat-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 6px; }
          .task-list { background: #0f172a; border: 1px solid #22d3ee22; border-radius: 10px; padding: 20px; margin: 24px 0; }
          .task-list strong { color: #22d3ee; display: block; margin-bottom: 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; }
          .task-item { padding: 10px 0; border-bottom: 1px solid #1e293b; color: #cbd5e1; font-size: 14px; }
          .task-item:last-child { border-bottom: none; }
          .btn-wrap { text-align: center; margin: 32px 0; }
          .button { display: inline-block; background: #22d3ee; color: #0f172a; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; }
          .footer { text-align: center; color: #475569; font-size: 12px; padding: 24px 40px; border-top: 1px solid #22d3ee11; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FormaOS</h1>
            <p>📊 Weekly Compliance Summary &mdash; ${new Date(data.weekStart).toLocaleDateString()} &ndash; ${new Date(data.weekEnd).toLocaleDateString()}</p>
          </div>
          <div class="content">
            <p style="color:#94a3b8">Hello ${data.userName},</p>
            <p>Here's your weekly compliance summary for <strong style="color:#22d3ee">${data.orgName}</strong>.</p>
            
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${data.stats.tasksCompleted}</div>
                <div class="stat-label">Tasks Completed</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${data.stats.tasksPending}</div>
                <div class="stat-label">Tasks Pending</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${data.stats.certificatesRenewed}</div>
                <div class="stat-label">Certs Renewed</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${data.stats.certificatesExpiring}</div>
                <div class="stat-label">Expiring Soon</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${data.stats.evidenceUploaded}</div>
                <div class="stat-label">Evidence Uploaded</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${data.stats.riskScore}</div>
                <div class="stat-label">Risk Score</div>
              </div>
            </div>
            
            ${
              data.topTasks.length > 0
                ? `
              <div class="task-list">
                <strong>Upcoming Tasks</strong>
                ${data.topTasks
                  .map(
                    (task) => `
                  <div class="task-item">
                    <strong style="color:#e2e8f0">${task.title}</strong><br>
                    <span style="color: #64748b; font-size: 13px;">Due: ${new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                `,
                  )
                  .join('')}
              </div>
            `
                : ''
            }
            
            <div class="btn-wrap">
              <a href="${data.dashboardUrl}" class="button">View Full Dashboard →</a>
            </div>
          </div>
          <div class="footer">
            <p>Sent by FormaOS &mdash; Compliance Operating System</p>
            <p>Manage your email preferences in account settings.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Send email notification
 */
export async function sendEmail(
  notification: EmailNotification,
): Promise<boolean> {
  const supabase = await createClient();

  try {
    // Generate email HTML based on template
    let html = '';
    switch (notification.template) {
      case 'task_assignment':
        html = generateTaskAssignmentEmail(notification.data as Parameters<typeof generateTaskAssignmentEmail>[0]);
        break;
      case 'certificate_expiring':
        html = generateCertificateExpiringEmail(notification.data as Parameters<typeof generateCertificateExpiringEmail>[0]);
        break;
      case 'compliance_alert':
        html = generateComplianceAlertEmail(notification.data as Parameters<typeof generateComplianceAlertEmail>[0]);
        break;
      case 'weekly_digest':
        html = generateWeeklyDigestEmail(notification.data as Parameters<typeof generateWeeklyDigestEmail>[0]);
        break;
      default:
        console.error(`Unknown email template: ${notification.template}`);
        return false;
    }

    const resend = getResendClient();
    if (!resend) {
      throw new Error('Resend is not configured');
    }

    const result = await resend.emails.send({
      from: getFromEmail(),
      to: notification.to,
      cc: notification.cc,
      bcc: notification.bcc,
      subject: notification.subject,
      html,
      text: stripHtml(html),
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    // Log email sent
    await supabase.from('email_logs').insert({
      organization_id: notification.organizationId,
      recipients: notification.to,
      subject: notification.subject,
      template: notification.template,
      status: 'sent',
      provider_id: result.data?.id ?? null,
      sent_at: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    await supabase.from('email_logs').insert({
      organization_id: notification.organizationId,
      recipients: notification.to,
      subject: notification.subject,
      template: notification.template,
      status: 'failed',
      error_message: error instanceof Error ? error.message : String(error),
      sent_at: new Date().toISOString(),
    });
    return false;
  }
}

/**
 * Get user email preferences
 */
export async function getEmailPreferences(
  userId: string,
  organizationId: string,
): Promise<EmailPreferences | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('email_preferences')
    .select('*')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .single();

  if (error) return null;

  return data;
}

/**
 * Update email preferences
 */
export async function updateEmailPreferences(
  userId: string,
  organizationId: string,
  preferences: Partial<EmailPreferences>,
): Promise<void> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('email_preferences')
    .select('id')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .single();

  if (existing) {
    await supabase
      .from('email_preferences')
      .update({
        ...preferences,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('email_preferences').insert({
      user_id: userId,
      organization_id: organizationId,
      ...preferences,
    });
  }
}

/**
 * Schedule digest emails
 */
export async function scheduleWeeklyDigest(
  organizationId: string,
): Promise<void> {
  const supabase = await createClient();

  // Get all users who have weekly digest enabled
  const { data: preferences } = await supabase
    .from('email_preferences')
    .select('user_id, profiles(email, full_name)')
    .eq('organization_id', organizationId)
    .eq('frequency', 'weekly_digest');

  if (!preferences || preferences.length === 0) return;

  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', organizationId)
    .single();

  // Calculate weekly stats
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const weekEnd = new Date();

  // Fetch stats for the week
  const [tasks, certificates, evidence, riskAnalysis] = await Promise.all([
    supabase
      .from('tasks')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('updated_at', weekStart.toISOString()),
    supabase
      .from('certifications')
      .select('*')
      .eq('organization_id', organizationId),
    supabase
      .from('evidence')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('created_at', weekStart.toISOString()),
    supabase
      .from('risk_analyses')
      .select('overall_risk_score')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
  ]);

  const stats = {
    tasksCompleted:
      tasks.data?.filter((t: any) => t.status === 'completed').length || 0,
    tasksPending:
      tasks.data?.filter((t: any) => t.status === 'pending').length || 0,
    certificatesRenewed: 0,
    certificatesExpiring:
      certificates.data?.filter((c: any) => {
        const daysUntil = Math.ceil(
          (new Date(c.expiry_date).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        );
        return daysUntil <= 30 && daysUntil > 0;
      }).length || 0,
    evidenceUploaded: evidence.data?.length || 0,
    riskScore: riskAnalysis.data?.overall_risk_score || 0,
  };

  const topTasks =
    tasks.data
      ?.filter((t: any) => t.status === 'pending' && t.due_date)
      .sort(
        (a: any, b: any) =>
          new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
      )
      .slice(0, 5) || [];

  // Send digest to each user
  for (const pref of preferences) {
    const profileRaw = (pref as Record<string, unknown>).profiles;
    const profile = (Array.isArray(profileRaw) ? profileRaw[0] : profileRaw) as { email?: string; full_name?: string } | null;
    await sendEmail({
      to: profile?.email ? [profile.email] : [],
      subject: `Weekly Compliance Summary - ${org?.name}`,
      template: 'weekly_digest',
      data: {
        userName: profile?.full_name,
        orgName: org?.name,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        stats,
        topTasks,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      },
      organizationId,
    });
  }
}

/**
 * Get email statistics
 */
export async function getEmailStats(organizationId: string): Promise<{
  totalSent: number;
  deliveryRate: number;
  byTemplate: Record<EmailTemplate, number>;
}> {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from('email_logs')
    .select('*')
    .eq('organization_id', organizationId)
    .gte(
      'sent_at',
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    );

  if (!logs) {
    return {
      totalSent: 0,
      deliveryRate: 0,
      byTemplate: {} as Record<EmailTemplate, number>,
    };
  }

  const totalSent = logs.length;
  const delivered = logs.filter((l: any) => l.status === 'sent').length;
  const deliveryRate =
    totalSent > 0 ? Math.round((delivered / totalSent) * 100) : 0;

  const byTemplate: Record<string, number> = {};
  logs.forEach((log: any) => {
    byTemplate[log.template] = (byTemplate[log.template] || 0) + 1;
  });

  return {
    totalSent,
    deliveryRate,
    byTemplate: byTemplate as Record<EmailTemplate, number>,
  };
}
