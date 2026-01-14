/**
 * =========================================================
 * Advanced Email Notifications System
 * =========================================================
 * Rich HTML email templates with scheduling and preferences
 */

import { createSupabaseServerClient as createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/audit-trail';

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
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .task-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .label { font-weight: bold; color: #6b7280; }
          .value { color: #1f2937; margin-bottom: 10px; }
          .priority-high { color: #ef4444; font-weight: bold; }
          .priority-medium { color: #f59e0b; font-weight: bold; }
          .priority-low { color: #10b981; font-weight: bold; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 New Task Assigned</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You have been assigned a new task in <strong>${data.orgName}</strong>.</p>
            
            <div class="task-details">
              <div class="label">Task:</div>
              <div class="value"><strong>${data.taskTitle}</strong></div>
              
              <div class="label">Description:</div>
              <div class="value">${data.taskDescription || 'No description provided'}</div>
              
              <div class="label">Priority:</div>
              <div class="value priority-${data.priority}">${data.priority.toUpperCase()}</div>
              
              <div class="label">Due Date:</div>
              <div class="value">${new Date(data.dueDate).toLocaleDateString()}</div>
              
              <div class="label">Assigned By:</div>
              <div class="value">${data.assignedBy}</div>
            </div>
            
            <center>
              <a href="${data.taskUrl}" class="button">View Task</a>
            </center>
            
            <p style="margin-top: 20px;">Please complete this task by the due date to maintain compliance.</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message from FormaOS</p>
            <p>To manage your email preferences, visit your account settings</p>
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
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${urgencyColor}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .alert-box { background: #fef3c7; border-left: 4px solid ${urgencyColor}; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .cert-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .label { font-weight: bold; color: #6b7280; }
          .value { color: #1f2937; margin-bottom: 10px; }
          .button { display: inline-block; background: ${urgencyColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${urgencyIcon} Certificate Expiring Soon</h1>
          </div>
          <div class="content">
            <div class="alert-box">
              <strong>Action Required:</strong> Your certificate is expiring in ${data.daysRemaining} days!
            </div>
            
            <p>Hello,</p>
            <p>This is a reminder that one of your certificates in <strong>${data.orgName}</strong> is approaching its expiration date.</p>
            
            <div class="cert-details">
              <div class="label">Certificate:</div>
              <div class="value"><strong>${data.certificateName}</strong></div>
              
              <div class="label">Expiry Date:</div>
              <div class="value">${new Date(data.expiryDate).toLocaleDateString()}</div>
              
              <div class="label">Days Remaining:</div>
              <div class="value" style="color: ${urgencyColor}; font-weight: bold;">${data.daysRemaining} days</div>
            </div>
            
            <center>
              <a href="${data.certificateUrl}" class="button">Renew Certificate</a>
            </center>
            
            <p style="margin-top: 20px;">Please renew this certificate before it expires to maintain compliance.</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message from FormaOS</p>
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
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${color}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .alert-box { background: #fef3c7; border-left: 4px solid ${color}; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .recommendations { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .rec-item { margin: 10px 0; padding-left: 20px; }
          .button { display: inline-block; background: ${color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 Compliance Alert - ${data.severity.toUpperCase()}</h1>
          </div>
          <div class="content">
            <div class="alert-box">
              <strong>${data.alertTitle}</strong>
            </div>
            
            <p>Hello,</p>
            <p>A compliance alert has been detected in <strong>${data.orgName}</strong>.</p>
            
            <p style="background: white; padding: 15px; border-radius: 8px;">
              ${data.alertDescription}
            </p>
            
            <div class="recommendations">
              <strong>Recommended Actions:</strong>
              ${data.recommendations.map((rec) => `<div class="rec-item">• ${rec}</div>`).join('')}
            </div>
            
            <center>
              <a href="${data.dashboardUrl}" class="button">View Dashboard</a>
            </center>
          </div>
          
          <div class="footer">
            <p>This is an automated message from FormaOS</p>
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
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
          .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
          .stat-card { background: white; padding: 15px; border-radius: 8px; text-align: center; }
          .stat-value { font-size: 32px; font-weight: bold; color: #2563eb; }
          .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
          .task-list { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .task-item { padding: 10px; border-bottom: 1px solid #e5e7eb; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Weekly Compliance Summary</h1>
            <p>${new Date(data.weekStart).toLocaleDateString()} - ${new Date(data.weekEnd).toLocaleDateString()}</p>
          </div>
          <div class="content">
            <p>Hello ${data.userName},</p>
            <p>Here's your weekly compliance summary for <strong>${data.orgName}</strong>.</p>
            
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
                <div class="stat-label">Certificates Renewed</div>
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
                <strong>Upcoming Tasks:</strong>
                ${data.topTasks
                  .map(
                    (task) => `
                  <div class="task-item">
                    <strong>${task.title}</strong>
                    <br>
                    <span style="color: #6b7280; font-size: 14px;">Due: ${new Date(task.dueDate).toLocaleDateString()}</span>
                  </div>
                `,
                  )
                  .join('')}
              </div>
            `
                : ''
            }
            
            <center>
              <a href="${data.dashboardUrl}" class="button">View Full Dashboard</a>
            </center>
          </div>
          
          <div class="footer">
            <p>This is an automated weekly digest from FormaOS</p>
            <p>To manage your email preferences, visit your account settings</p>
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
  try {
    // Generate email HTML based on template
    let html = '';
    switch (notification.template) {
      case 'task_assignment':
        html = generateTaskAssignmentEmail(notification.data);
        break;
      case 'certificate_expiring':
        html = generateCertificateExpiringEmail(notification.data);
        break;
      case 'compliance_alert':
        html = generateComplianceAlertEmail(notification.data);
        break;
      case 'weekly_digest':
        html = generateWeeklyDigestEmail(notification.data);
        break;
      default:
        console.error(`Unknown email template: ${notification.template}`);
        return false;
    }

    // TODO: Integrate with email service (Resend, SendGrid, AWS SES, etc.)
    // For now, log the email
    console.log('Email would be sent:', {
      to: notification.to,
      subject: notification.subject,
      template: notification.template,
    });

    // Log email sent
    const supabase = await createClient();
    await supabase.from('email_logs').insert({
      organization_id: notification.organizationId,
      recipients: notification.to,
      subject: notification.subject,
      template: notification.template,
      status: 'sent',
      sent_at: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
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
    tasksPending: tasks.data?.filter((t: any) => t.status === 'pending').length || 0,
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
        (a, b) =>
          new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
      )
      .slice(0, 5) || [];

  // Send digest to each user
  for (const pref of preferences) {
    await sendEmail({
      to: [pref.profiles.email],
      subject: `Weekly Compliance Summary - ${org?.name}`,
      template: 'weekly_digest',
      data: {
        userName: pref.profiles.full_name,
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
  logs.forEach((log) => {
    byTemplate[log.template] = (byTemplate[log.template] || 0) + 1;
  });

  return {
    totalSent,
    deliveryRate,
    byTemplate: byTemplate as Record<EmailTemplate, number>,
  };
}
