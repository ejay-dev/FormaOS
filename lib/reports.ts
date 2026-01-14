/**
 * =========================================================
 * PDF Report Generation
 * =========================================================
 * Generate professional PDF reports with charts and branding
 */

import { createSupabaseServerClient as createClient } from '@/lib/supabase/server';
import {
  getComplianceMetrics,
  getTeamMetrics,
  getComplianceTrend,
} from './analytics';
import { calculateRiskScore } from './analytics';

export interface ReportConfig {
  organizationId: string;
  type: 'compliance' | 'audit' | 'certificate' | 'team' | 'custom';
  title: string;
  dateRange?: {
    from: string;
    to: string;
  };
  sections?: ReportSection[];
  branding?: {
    logo?: string;
    primaryColor?: string;
    companyName?: string;
  };
}

export interface ReportSection {
  type:
    | 'overview'
    | 'metrics'
    | 'charts'
    | 'tasks'
    | 'certificates'
    | 'team'
    | 'recommendations';
  title: string;
  content?: any;
}

/**
 * Generate compliance report
 */
export async function generateComplianceReport(
  organizationId: string,
  options: {
    dateRange?: { from: string; to: string };
    includeCharts?: boolean;
  } = {},
): Promise<string> {
  const supabase = await createClient();

  // Get organization details
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single();

  // Get compliance metrics
  const metrics = await getComplianceMetrics(organizationId);
  const teamMetrics = await getTeamMetrics(organizationId);
  const trend = await getComplianceTrend(organizationId);
  const riskScore = await calculateRiskScore(organizationId);

  // Build HTML report
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Compliance Report - ${org?.name}</title>
        <style>
          @page { margin: 2cm; }
          body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .logo {
            max-width: 200px;
            margin-bottom: 10px;
          }
          h1 {
            color: #2563eb;
            margin: 10px 0;
          }
          .report-info {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .metric-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin: 30px 0;
          }
          .metric-card {
            background: #fff;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
          }
          .metric-value {
            font-size: 36px;
            font-weight: bold;
            color: #2563eb;
            margin: 10px 0;
          }
          .metric-label {
            color: #6b7280;
            font-size: 14px;
            text-transform: uppercase;
          }
          .section {
            margin: 40px 0;
            page-break-inside: avoid;
          }
          .section-title {
            font-size: 24px;
            color: #1f2937;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .risk-indicator {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
          }
          .risk-low { background: #d1fae5; color: #065f46; }
          .risk-medium { background: #fef3c7; color: #92400e; }
          .risk-high { background: #fee2e2; color: #991b1b; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          th {
            background: #f9fafb;
            font-weight: 600;
            color: #374151;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          .chart-placeholder {
            background: #f9fafb;
            border: 2px dashed #d1d5db;
            border-radius: 8px;
            padding: 40px;
            text-align: center;
            color: #6b7280;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <!-- Header -->
        <div class="header">
          ${org?.logo_url ? `<img src="${org.logo_url}" class="logo" alt="${org.name} Logo">` : ''}
          <h1>Compliance Report</h1>
          <p style="color: #6b7280;">${org?.name}</p>
        </div>

        <!-- Report Info -->
        <div class="report-info">
          <strong>Report Generated:</strong> ${new Date().toLocaleDateString()}<br>
          <strong>Period:</strong> ${options.dateRange ? `${options.dateRange.from} to ${options.dateRange.to}` : 'All Time'}<br>
          <strong>Organization:</strong> ${org?.name}
        </div>

        <!-- Executive Summary -->
        <div class="section">
          <h2 class="section-title">Executive Summary</h2>
          <p>
            This compliance report provides a comprehensive overview of ${org?.name}'s compliance status,
            including certificate management, task completion rates, and risk assessment.
          </p>
          <div style="margin: 20px 0;">
            <strong>Overall Risk Level:</strong> 
            <span class="risk-indicator ${
              riskScore.overall < 30
                ? 'risk-low'
                : riskScore.overall < 70
                  ? 'risk-medium'
                  : 'risk-high'
            }">
              ${riskScore.overall < 30 ? 'LOW' : riskScore.overall < 70 ? 'MEDIUM' : 'HIGH'} (${riskScore.overall}/100)
            </span>
          </div>
        </div>

        <!-- Key Metrics -->
        <div class="section">
          <h2 class="section-title">Key Metrics</h2>
          <div class="metric-grid">
            <div class="metric-card">
              <div class="metric-label">Total Certificates</div>
              <div class="metric-value">${metrics.totalCertificates}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Active Certificates</div>
              <div class="metric-value" style="color: #10b981;">${metrics.activeCertificates}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Expiring Soon</div>
              <div class="metric-value" style="color: #f59e0b;">${metrics.expiringSoon}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Expired</div>
              <div class="metric-value" style="color: #ef4444;">${metrics.expiredCertificates}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Completion Rate</div>
              <div class="metric-value">${metrics.completionRate}%</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Team Members</div>
              <div class="metric-value">${teamMetrics.totalMembers}</div>
            </div>
          </div>
        </div>

        <!-- Compliance Trend -->
        ${
          options.includeCharts
            ? `
        <div class="section">
          <h2 class="section-title">30-Day Compliance Trend</h2>
          <div class="chart-placeholder">
            [Chart: Compliance trend over the past 30 days]<br>
            <small>Shows active vs. expired certificates and completion rates</small>
          </div>
        </div>
        `
            : ''
        }

        <!-- Team Performance -->
        <div class="section">
          <h2 class="section-title">Team Performance</h2>
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Tasks Completed</th>
                <th>Completion Rate</th>
              </tr>
            </thead>
            <tbody>
              ${teamMetrics.topPerformers
                .slice(0, 10)
                .map(
                  (performer) => `
                <tr>
                  <td>${performer.email}</td>
                  <td style="text-transform: capitalize;">Member</td>
                  <td>${performer.completedTasks}</td>
                  <td>${performer.complianceRate}%</td>
                </tr>
              `,
                )
                .join('')}
            </tbody>
          </table>
        </div>

        <!-- Recommendations -->
        <div class="section">
          <h2 class="section-title">Recommendations</h2>
          <ul>
            ${metrics.expiringSoon > 0 ? `<li><strong>Certificate Renewal:</strong> ${metrics.expiringSoon} certificate(s) expiring within 30 days require immediate attention.</li>` : ''}
            ${metrics.expiredCertificates > 0 ? `<li><strong>Expired Certificates:</strong> ${metrics.expiredCertificates} certificate(s) have expired and need to be renewed urgently.</li>` : ''}
            ${metrics.completionRate < 80 ? `<li><strong>Task Completion:</strong> Current completion rate of ${metrics.completionRate}% is below target. Review task assignments and deadlines.</li>` : ''}
            ${riskScore.overall > 50 ? `<li><strong>Risk Mitigation:</strong> Risk score of ${riskScore.overall}/100 indicates areas requiring immediate attention to reduce compliance risk.</li>` : ''}
            ${teamMetrics.activeMembers / teamMetrics.totalMembers < 0.8 ? `<li><strong>Team Engagement:</strong> Only ${Math.round((teamMetrics.activeMembers / teamMetrics.totalMembers) * 100)}% of team members are active. Consider engagement initiatives.</li>` : ''}
          </ul>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>Generated by FormaOS Compliance Management System</p>
          <p>This report is confidential and intended for internal use only.</p>
          <p>Report ID: ${org?.id}-${Date.now()}</p>
        </div>
      </body>
    </html>
  `;

  return html;
}

/**
 * Generate certificate report
 */
export async function generateCertificateReport(
  organizationId: string,
  certificateId?: string,
): Promise<string> {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single();

  let query = supabase
    .from('certifications')
    .select('*')
    .eq('organization_id', organizationId);

  if (certificateId) {
    query = query.eq('id', certificateId);
  }

  const { data: certificates } = await query;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Certificate Report - ${org?.name}</title>
        <style>
          /* Same styles as compliance report */
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
          h1 { color: #2563eb; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background: #f9fafb; font-weight: 600; }
          .status-active { color: #10b981; font-weight: bold; }
          .status-expired { color: #ef4444; font-weight: bold; }
          .status-expiring { color: #f59e0b; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Certificate Report</h1>
          <p>${org?.name}</p>
          <p style="color: #6b7280;">Generated: ${new Date().toLocaleDateString()}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Certificate Name</th>
              <th>Issued Date</th>
              <th>Expiry Date</th>
              <th>Status</th>
              <th>Issuer</th>
            </tr>
          </thead>
          <tbody>
            ${(certificates || [])
              .map((cert: any) => {
                const expiryDate = new Date(cert.expiry_date);
                const daysUntilExpiry = Math.ceil(
                  (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
                );
                let statusClass = 'status-active';
                let statusText = 'Active';

                if (daysUntilExpiry < 0) {
                  statusClass = 'status-expired';
                  statusText = 'Expired';
                } else if (daysUntilExpiry < 30) {
                  statusClass = 'status-expiring';
                  statusText = 'Expiring Soon';
                }

                return `
                <tr>
                  <td>${cert.name}</td>
                  <td>${new Date(cert.issued_date).toLocaleDateString()}</td>
                  <td>${expiryDate.toLocaleDateString()}</td>
                  <td class="${statusClass}">${statusText}</td>
                  <td>${cert.issuer || 'N/A'}</td>
                </tr>
              `;
              })
              .join('')}
          </tbody>
        </table>

        <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
          <p>Generated by FormaOS Compliance Management System</p>
        </div>
      </body>
    </html>
  `;

  return html;
}

/**
 * Generate audit report
 */
export async function generateAuditReport(
  organizationId: string,
  dateRange: { from: string; to: string },
): Promise<string> {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', organizationId)
    .single();

  const { data: activities } = await supabase
    .from('activity_logs')
    .select('*, profiles!user_id(full_name, email)')
    .eq('organization_id', organizationId)
    .gte('created_at', dateRange.from)
    .lte('created_at', dateRange.to)
    .order('created_at', { ascending: false })
    .limit(1000);

  // Group activities by action type
  const activityCounts: Record<string, number> = {};
  (activities || []).forEach((activity: any) => {
    activityCounts[activity.action] =
      (activityCounts[activity.action] || 0) + 1;
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Audit Report - ${org?.name}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
          h1 { color: #2563eb; }
          .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 30px 0; }
          .summary-card { background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center; }
          .summary-value { font-size: 24px; font-weight: bold; color: #2563eb; }
          .summary-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb; }
          th { background: #f9fafb; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Audit Report</h1>
          <p>${org?.name}</p>
          <p style="color: #6b7280;">Period: ${new Date(dateRange.from).toLocaleDateString()} - ${new Date(dateRange.to).toLocaleDateString()}</p>
        </div>

        <h2>Activity Summary</h2>
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-value">${activities?.length || 0}</div>
            <div class="summary-label">Total Activities</div>
          </div>
          <div class="summary-card">
            <div class="summary-value">${activityCounts['create'] || 0}</div>
            <div class="summary-label">Created</div>
          </div>
          <div class="summary-card">
            <div class="summary-value">${activityCounts['update'] || 0}</div>
            <div class="summary-label">Updated</div>
          </div>
          <div class="summary-card">
            <div class="summary-value">${activityCounts['delete'] || 0}</div>
            <div class="summary-label">Deleted</div>
          </div>
        </div>

        <h2>Activity Log</h2>
        <table>
          <thead>
            <tr>
              <th>Date/Time</th>
              <th>User</th>
              <th>Action</th>
              <th>Entity Type</th>
              <th>Entity Name</th>
            </tr>
          </thead>
          <tbody>
            ${(activities || [])
              .slice(0, 100)
              .map(
                (activity: any) => `
              <tr>
                <td>${new Date(activity.created_at).toLocaleString()}</td>
                <td>${activity.profiles?.full_name || activity.profiles?.email || 'Unknown'}</td>
                <td style="text-transform: capitalize;">${activity.action}</td>
                <td style="text-transform: capitalize;">${activity.entity_type}</td>
                <td>${activity.entity_name || 'N/A'}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>

        ${
          activities && activities.length > 100
            ? `
          <p style="text-align: center; color: #6b7280; margin-top: 20px;">
            Showing first 100 of ${activities.length} activities. Full audit log available in the application.
          </p>
        `
            : ''
        }

        <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
          <p>Generated by FormaOS Compliance Management System</p>
          <p>This audit report is confidential and should be stored securely.</p>
        </div>
      </body>
    </html>
  `;

  return html;
}

/**
 * Convert HTML to PDF (requires external service or library)
 * This is a placeholder - in production, use puppeteer, wkhtmltopdf, or a service like DocRaptor
 */
export async function htmlToPdf(html: string): Promise<Buffer> {
  // TODO: Implement PDF conversion
  // Options:
  // 1. Puppeteer: const browser = await puppeteer.launch(); const page = await browser.newPage(); await page.setContent(html); const pdf = await page.pdf();
  // 2. wkhtmltopdf: const pdf = await wkhtmltopdf(html);
  // 3. Cloud service: await fetch('https://api.docraptor.com/docs', { method: 'POST', body: { document_content: html } });

  // For now, return HTML as buffer
  return Buffer.from(html, 'utf-8');
}

/**
 * Save report to storage
 */
export async function saveReport(
  organizationId: string,
  userId: string,
  report: {
    type: string;
    title: string;
    content: string;
    format: 'html' | 'pdf';
  },
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('reports')
    .insert({
      organization_id: organizationId,
      user_id: userId,
      type: report.type,
      title: report.title,
      content: report.content,
      format: report.format,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save report: ${error.message}`);
  }

  return data.id;
}

/**
 * Get saved reports
 */
export async function getSavedReports(
  organizationId: string,
  limit = 50,
): Promise<any[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('reports')
    .select('*, profiles!user_id(full_name, email)')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];

  return data || [];
}
