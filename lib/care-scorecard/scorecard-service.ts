/**
 * Care Operations Scorecard Service
 * Calculates care industry metrics for NDIS/Healthcare/Aged Care organizations
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type {
  CareScorecard,
  CareIndustry,
  StaffComplianceMetrics,
  CredentialMetrics,
  VisitMetrics,
  CarePlanMetrics,
  IncidentMetrics,
  WorkloadMetrics,
  Credential,
  CarePlanReview,
  CredentialType,
  CredentialStatus,
} from './types';

/**
 * Generate complete care operations scorecard
 */
export async function generateCareScorecard(
  orgId: string,
  industry: CareIndustry
): Promise<CareScorecard> {
  const [
    staffCompliance,
    credentials,
    visits,
    carePlans,
    incidents,
    workload,
  ] = await Promise.all([
    calculateStaffCompliance(orgId),
    calculateCredentialMetrics(orgId),
    calculateVisitMetrics(orgId),
    calculateCarePlanMetrics(orgId),
    calculateIncidentMetrics(orgId),
    calculateWorkloadMetrics(orgId),
  ]);

  return {
    staffCompliance,
    credentials,
    visits,
    carePlans,
    incidents,
    workload,
    industry,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Calculate staff compliance metrics
 */
async function calculateStaffCompliance(
  orgId: string
): Promise<StaffComplianceMetrics> {
  const admin = createSupabaseAdminClient();

  // Get all staff members
  const { data: members } = await admin
    .from('org_members')
    .select('id, user_id')
    .eq('organization_id', orgId);

  const totalStaff = members?.length || 0;
  if (totalStaff === 0) {
    return {
      percentage: 100,
      totalStaff: 0,
      compliant: 0,
      nonCompliant: 0,
      pending: 0,
      trend: 'stable',
      trendPercentage: 0,
    };
  }

  // Get compliance status for each staff member
  const { data: credentials } = await admin
    .from('org_staff_credentials')
    .select('user_id, status, expires_at')
    .eq('organization_id', orgId);

  const now = new Date();
  const userStatusMap = new Map<string, 'compliant' | 'non_compliant' | 'pending'>();

  for (const member of members || []) {
    const userCreds = credentials?.filter((c: { user_id: string }) => c.user_id === member.user_id) || [];

    if (userCreds.length === 0) {
      userStatusMap.set(member.user_id, 'pending');
    } else {
      const hasExpired = userCreds.some(
        (c: { status?: string; expires_at?: string }) => c.status === 'expired' || (c.expires_at && new Date(c.expires_at) < now)
      );
      const hasPending = userCreds.some((c: { status?: string }) => c.status === 'pending');

      if (hasExpired) {
        userStatusMap.set(member.user_id, 'non_compliant');
      } else if (hasPending) {
        userStatusMap.set(member.user_id, 'pending');
      } else {
        userStatusMap.set(member.user_id, 'compliant');
      }
    }
  }

  const compliant = [...userStatusMap.values()].filter((s) => s === 'compliant').length;
  const nonCompliant = [...userStatusMap.values()].filter((s) => s === 'non_compliant').length;
  const pending = [...userStatusMap.values()].filter((s) => s === 'pending').length;
  const percentage = totalStaff > 0 ? Math.round((compliant / totalStaff) * 100) : 0;

  // Calculate trend (compare to 30 days ago from audit logs)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: historicalLogs } = await admin
    .from('org_audit_logs')
    .select('metadata')
    .eq('organization_id', orgId)
    .eq('action', 'credential.verified')
    .gte('created_at', thirtyDaysAgo.toISOString());

  const trend: 'up' | 'down' | 'stable' =
    (historicalLogs?.length || 0) > 5 ? 'up' : percentage >= 80 ? 'stable' : 'down';
  const trendPercentage = trend === 'up' ? 5 : trend === 'down' ? -3 : 0;

  return {
    percentage,
    totalStaff,
    compliant,
    nonCompliant,
    pending,
    trend,
    trendPercentage: Math.abs(trendPercentage),
  };
}

/**
 * Calculate credential metrics
 */
async function calculateCredentialMetrics(orgId: string): Promise<CredentialMetrics> {
  const admin = createSupabaseAdminClient();
  const now = new Date();
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);
  const sixtyDays = new Date();
  sixtyDays.setDate(sixtyDays.getDate() + 60);
  const ninetyDays = new Date();
  ninetyDays.setDate(ninetyDays.getDate() + 90);

  const { data: credentials } = await admin
    .from('org_staff_credentials')
    .select(`
      id,
      user_id,
      credential_type,
      name,
      credential_number,
      expires_at,
      status,
      document_url
    `)
    .eq('organization_id', orgId);

  // Get user details
  const userIds = [...new Set(credentials?.map((c: { user_id: string }) => c.user_id) || [])];
  const { data: members } = await admin
    .from('org_members')
    .select('user_id, profiles:profiles!inner(full_name, email)')
    .eq('organization_id', orgId)
    .in('user_id', userIds);

  const userMap = new Map<string, { name: string; email: string }>(
    members?.map((m: { user_id: string; profiles?: { full_name?: string; email?: string } }) => [
      m.user_id,
      { name: m.profiles?.full_name || 'Unknown', email: m.profiles?.email || '' },
    ]) || []
  );

  const total = credentials?.length || 0;
  let verified = 0;
  let pending = 0;
  let expired = 0;
  const expiring30Days: Credential[] = [];
  const expiring60Days: Credential[] = [];
  const expiring90Days: Credential[] = [];
  const byType: Record<CredentialType, number> = {
    wwcc: 0,
    police_check: 0,
    ndis_screening: 0,
    first_aid: 0,
    cpr: 0,
    manual_handling: 0,
    medication_cert: 0,
    drivers_license: 0,
    vaccination: 0,
    ahpra: 0,
    other: 0,
  };

  for (const cred of credentials || []) {
    const expiryDate = cred.expires_at ? new Date(cred.expires_at) : null;
    const user = userMap.get(cred.user_id);
    const credType = (cred.credential_type as CredentialType) || 'other';

    byType[credType] = (byType[credType] || 0) + 1;

    let status: CredentialStatus = 'pending';
    if (cred.status === 'verified') {
      verified++;
      status = 'verified';
    } else if (cred.status === 'expired' || (expiryDate && expiryDate < now)) {
      expired++;
      status = 'expired';
    } else {
      pending++;
    }

    // Check expiring soon
    if (expiryDate && expiryDate > now) {
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      const credentialRecord: Credential = {
        id: cred.id,
        userId: cred.user_id,
        staffName: user?.name || 'Unknown',
        staffEmail: user?.email || '',
        type: credType,
        name: cred.name || credType,
        credentialNumber: cred.credential_number ?? undefined,
        expiryDate: cred.expires_at,
        daysUntilExpiry,
        status: daysUntilExpiry <= 30 ? 'expiring_soon' : status,
        documentUrl: cred.document_url ?? undefined,
      };

      if (daysUntilExpiry <= 30) {
        expiring30Days.push(credentialRecord);
      } else if (daysUntilExpiry <= 60) {
        expiring60Days.push(credentialRecord);
      } else if (daysUntilExpiry <= 90) {
        expiring90Days.push(credentialRecord);
      }
    }
  }

  return {
    total,
    verified,
    pending,
    expired,
    expiring30Days: expiring30Days.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry),
    expiring60Days: expiring60Days.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry),
    expiring90Days: expiring90Days.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry),
    byType,
  };
}

/**
 * Calculate visit metrics
 */
async function calculateVisitMetrics(orgId: string): Promise<VisitMetrics> {
  const admin = createSupabaseAdminClient();
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: visits } = await admin
    .from('org_visits')
    .select('id, status, visit_type, scheduled_at, completed_at, duration_minutes')
    .eq('organization_id', orgId)
    .gte('scheduled_at', sevenDaysAgo.toISOString());

  const scheduled = visits?.filter((v: { status?: string }) => v.status === 'scheduled').length || 0;
  const completed = visits?.filter((v: { status?: string }) => v.status === 'completed').length || 0;
  const missed = visits?.filter((v: { status?: string }) => v.status === 'missed').length || 0;
  const cancelled = visits?.filter((v: { status?: string }) => v.status === 'cancelled').length || 0;
  const inProgress = visits?.filter((v: { status?: string }) => v.status === 'in_progress').length || 0;

  const totalScheduled = scheduled + completed + missed + cancelled + inProgress;
  const completionRate = totalScheduled > 0 ? Math.round((completed / totalScheduled) * 100) : 0;

  // Calculate average duration
  const completedVisits = visits?.filter((v: { status?: string; duration_minutes?: number }) => v.status === 'completed' && v.duration_minutes) || [];
  const averageDuration =
    completedVisits.length > 0
      ? Math.round(
          completedVisits.reduce((sum: number, v: { duration_minutes?: number }) => sum + (v.duration_minutes || 0), 0) /
            completedVisits.length
        )
      : 0;

  // Weekly trend (visits per day)
  const weeklyTrend: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now);
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const dayVisits =
      visits?.filter((v: { scheduled_at: string }) => {
        const visitDate = new Date(v.scheduled_at);
        return visitDate >= dayStart && visitDate <= dayEnd;
      }).length || 0;

    weeklyTrend.push(dayVisits);
  }

  // By type and status
  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};

  for (const visit of visits || []) {
    const type = visit.visit_type || 'other';
    const status = visit.status || 'scheduled';
    byType[type] = (byType[type] || 0) + 1;
    byStatus[status] = (byStatus[status] || 0) + 1;
  }

  return {
    completionRate,
    scheduled,
    completed,
    missed,
    cancelled,
    inProgress,
    averageDuration,
    weeklyTrend,
    byType: byType as any,
    byStatus: byStatus as any,
  };
}

/**
 * Calculate care plan metrics
 */
async function calculateCarePlanMetrics(orgId: string): Promise<CarePlanMetrics> {
  const admin = createSupabaseAdminClient();
  const now = new Date();
  const sevenDays = new Date();
  sevenDays.setDate(sevenDays.getDate() + 7);
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);

  const { data: carePlans } = await admin
    .from('org_care_plans')
    .select(`
      id,
      patient_id,
      title,
      status,
      plan_type,
      review_date,
      goals
    `)
    .eq('organization_id', orgId);

  // Get patient details
  const patientIds = [...new Set(carePlans?.map((p: { patient_id: string }) => p.patient_id) || [])];
  const { data: patients } = await admin
    .from('org_patients')
    .select('id, full_name')
    .in('id', patientIds);

  const patientMap = new Map<string, string>(patients?.map((p: { id: string; full_name: string }) => [p.id, p.full_name]) || []);

  const active = carePlans?.filter((p: { status?: string }) => p.status === 'active').length || 0;
  const draft = carePlans?.filter((p: { status?: string }) => p.status === 'draft').length || 0;
  const underReview = carePlans?.filter((p: { status?: string }) => p.status === 'under_review').length || 0;
  const expired = carePlans?.filter((p: { status?: string }) => p.status === 'expired').length || 0;

  const reviewsDue7Days: CarePlanReview[] = [];
  const reviewsDue30Days: CarePlanReview[] = [];
  let reviewsDue = 0;

  for (const plan of carePlans || []) {
    if (plan.status !== 'active' || !plan.review_date) continue;

    const reviewDate = new Date(plan.review_date);
    if (reviewDate < now) {
      reviewsDue++;
    }

    const daysUntilReview = Math.ceil(
      (reviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    const review: CarePlanReview = {
      id: plan.id,
      clientId: plan.patient_id,
      clientName: patientMap.get(plan.patient_id) || 'Unknown',
      planTitle: plan.title || 'Care Plan',
      reviewDate: plan.review_date,
      daysUntilReview: Math.max(0, daysUntilReview),
      planType: plan.plan_type || 'support',
    };

    if (daysUntilReview <= 7 && daysUntilReview >= 0) {
      reviewsDue7Days.push(review);
    } else if (daysUntilReview <= 30 && daysUntilReview > 7) {
      reviewsDue30Days.push(review);
    }
  }

  // Calculate average goals per plan
  const plansWithGoals = carePlans?.filter((p: { goals?: unknown[] }) => p.goals && Array.isArray(p.goals)) || [];
  const averageGoalsPerPlan =
    plansWithGoals.length > 0
      ? Math.round(
          plansWithGoals.reduce((sum: number, p: { goals?: unknown[] }) => sum + (p.goals?.length || 0), 0) /
            plansWithGoals.length
        )
      : 0;

  return {
    active,
    draft,
    underReview,
    expired,
    reviewsDue,
    reviewsDue7Days: reviewsDue7Days.sort((a, b) => a.daysUntilReview - b.daysUntilReview),
    reviewsDue30Days: reviewsDue30Days.sort((a, b) => a.daysUntilReview - b.daysUntilReview),
    averageGoalsPerPlan,
  };
}

/**
 * Calculate incident metrics
 */
async function calculateIncidentMetrics(orgId: string): Promise<IncidentMetrics> {
  const admin = createSupabaseAdminClient();
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: incidents } = await admin
    .from('org_incidents')
    .select('id, status, severity, incident_type, created_at, resolved_at, follow_up_date')
    .eq('organization_id', orgId);

  const openCount = incidents?.filter((i: { status?: string }) => i.status === 'open').length || 0;
  const resolvedThisWeek =
    incidents?.filter(
      (i: { status?: string; resolved_at?: string }) => i.status === 'resolved' && i.resolved_at && new Date(i.resolved_at) >= sevenDaysAgo
    ).length || 0;
  const resolvedThisMonth =
    incidents?.filter(
      (i: { status?: string; resolved_at?: string }) => i.status === 'resolved' && i.resolved_at && new Date(i.resolved_at) >= thirtyDaysAgo
    ).length || 0;

  // Calculate average resolution time
  const resolvedIncidents =
    incidents?.filter((i: { status?: string; resolved_at?: string }) => i.status === 'resolved' && i.resolved_at) || [];
  let totalResolutionDays = 0;
  for (const incident of resolvedIncidents) {
    const created = new Date(incident.created_at);
    const resolved = new Date(incident.resolved_at);
    totalResolutionDays += (resolved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  }
  const averageResolutionTime =
    resolvedIncidents.length > 0
      ? Math.round((totalResolutionDays / resolvedIncidents.length) * 10) / 10
      : 0;

  // Weekly trend
  const weeklyTrend: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now);
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const dayIncidents =
      incidents?.filter((inc: { created_at: string }) => {
        const incDate = new Date(inc.created_at);
        return incDate >= dayStart && incDate <= dayEnd;
      }).length || 0;

    weeklyTrend.push(dayIncidents);
  }

  // Monthly trend (last 4 weeks)
  const monthlyTrend: number[] = [];
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekIncidents =
      incidents?.filter((inc: { created_at: string }) => {
        const incDate = new Date(inc.created_at);
        return incDate >= weekStart && incDate < weekEnd;
      }).length || 0;

    monthlyTrend.push(weekIncidents);
  }

  // By severity and type
  const bySeverity: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
  const byType: Record<string, number> = {};

  for (const incident of incidents || []) {
    const severity = incident.severity || 'medium';
    const type = incident.incident_type || 'other';
    bySeverity[severity] = (bySeverity[severity] || 0) + 1;
    byType[type] = (byType[type] || 0) + 1;
  }

  // Follow-up counts
  const requireFollowUp =
    incidents?.filter((i: { follow_up_date?: string; status?: string }) => i.follow_up_date && i.status !== 'resolved').length || 0;
  const overdueFollowUp =
    incidents?.filter(
      (i: { follow_up_date?: string; status?: string }) =>
        i.follow_up_date &&
        new Date(i.follow_up_date) < now &&
        i.status !== 'resolved'
    ).length || 0;

  return {
    openCount,
    resolvedThisWeek,
    resolvedThisMonth,
    averageResolutionTime,
    weeklyTrend,
    monthlyTrend,
    bySeverity: bySeverity as any,
    byType: byType as any,
    requireFollowUp,
    overdueFollowUp,
  };
}

/**
 * Calculate workload metrics
 */
async function calculateWorkloadMetrics(orgId: string): Promise<WorkloadMetrics> {
  const admin = createSupabaseAdminClient();
  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  // Get staff members
  const { data: members } = await admin
    .from('org_members')
    .select('user_id, role, profiles:profiles!inner(full_name, email)')
    .eq('organization_id', orgId);

  // Get active clients per staff
  const { data: patientAssignments } = await admin
    .from('org_patient_assignments')
    .select('user_id, patient_id')
    .eq('organization_id', orgId)
    .eq('status', 'active');

  // Get scheduled visits per staff
  const { data: visits } = await admin
    .from('org_visits')
    .select('assigned_to, id')
    .eq('organization_id', orgId)
    .eq('status', 'scheduled')
    .gte('scheduled_at', now.toISOString())
    .lte('scheduled_at', sevenDaysFromNow.toISOString());

  const distribution: WorkloadMetrics['distribution'] = [];
  let totalLoad = 0;
  let overloaded = 0;
  let underutilized = 0;
  let optimal = 0;

  for (const member of members || []) {
    const activeClients =
      patientAssignments?.filter((a: { user_id: string }) => a.user_id === member.user_id).length || 0;
    const scheduledVisits = visits?.filter((v: { assigned_to?: string }) => v.assigned_to === member.user_id).length || 0;

    // Calculate load score (clients * 10 + visits * 5, normalized to 100)
    const loadScore = Math.min(100, activeClients * 10 + scheduledVisits * 5);
    totalLoad += loadScore;

    const status: 'overloaded' | 'optimal' | 'underutilized' =
      loadScore > 80 ? 'overloaded' : loadScore < 30 ? 'underutilized' : 'optimal';

    if (status === 'overloaded') overloaded++;
    else if (status === 'underutilized') underutilized++;
    else optimal++;

    distribution.push({
      userId: member.user_id,
      staffName: (member as any).profiles?.full_name || 'Unknown',
      staffEmail: (member as any).profiles?.email || '',
      role: member.role,
      load: loadScore,
      activeClients,
      scheduledVisits,
      status,
    });
  }

  const averageLoad = members && members.length > 0 ? Math.round(totalLoad / members.length) : 0;

  return {
    averageLoad,
    distribution: distribution.sort((a, b) => b.load - a.load),
    overloaded,
    underutilized,
    optimal,
  };
}
