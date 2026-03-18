/**
 * Care Operations Scorecard Types
 * Types for NDIS/Healthcare/Aged Care industry intelligence panel
 */

export interface CareScorecard {
  staffCompliance: StaffComplianceMetrics;
  credentials: CredentialMetrics;
  visits: VisitMetrics;
  carePlans: CarePlanMetrics;
  incidents: IncidentMetrics;
  workload: WorkloadMetrics;
  industry: CareIndustry;
  generatedAt: string;
}

export type CareIndustry = 'ndis' | 'healthcare' | 'aged_care' | 'childcare';

// =========================================================
// Staff Compliance
// =========================================================

export interface StaffComplianceMetrics {
  percentage: number;
  totalStaff: number;
  compliant: number;
  nonCompliant: number;
  pending: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

// =========================================================
// Credentials
// =========================================================

export interface CredentialMetrics {
  total: number;
  verified: number;
  pending: number;
  expired: number;
  expiring30Days: Credential[];
  expiring60Days: Credential[];
  expiring90Days: Credential[];
  byType: Record<CredentialType, number>;
}

export interface Credential {
  id: string;
  userId: string;
  staffName: string;
  staffEmail: string;
  type: CredentialType;
  name: string;
  credentialNumber?: string;
  expiryDate: string;
  daysUntilExpiry: number;
  status: CredentialStatus;
  documentUrl?: string;
}

export type CredentialType =
  | 'wwcc'
  | 'police_check'
  | 'ndis_screening'
  | 'first_aid'
  | 'cpr'
  | 'manual_handling'
  | 'medication_cert'
  | 'drivers_license'
  | 'vaccination'
  | 'ahpra'
  | 'other';

export type CredentialStatus = 'pending' | 'verified' | 'expired' | 'expiring_soon';

// =========================================================
// Visits / Service Delivery
// =========================================================

export interface VisitMetrics {
  completionRate: number;
  scheduled: number;
  completed: number;
  missed: number;
  cancelled: number;
  inProgress: number;
  averageDuration: number;
  weeklyTrend: number[];
  byType: Record<VisitType, number>;
  byStatus: Record<VisitStatus, number>;
}

export type VisitType =
  | 'service'
  | 'assessment'
  | 'review'
  | 'support'
  | 'transport'
  | 'community'
  | 'other';

export type VisitStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'missed'
  | 'rescheduled';

// =========================================================
// Care Plans
// =========================================================

export interface CarePlanMetrics {
  active: number;
  draft: number;
  underReview: number;
  expired: number;
  reviewsDue: number;
  reviewsDue7Days: CarePlanReview[];
  reviewsDue30Days: CarePlanReview[];
  averageGoalsPerPlan: number;
}

export interface CarePlanReview {
  id: string;
  clientId: string;
  clientName: string;
  planTitle: string;
  reviewDate: string;
  daysUntilReview: number;
  planType: CarePlanType;
  assignedTo?: string;
}

export type CarePlanType = 'support' | 'ndis' | 'chsp' | 'clinical' | 'behavioral';

// =========================================================
// Incidents
// =========================================================

export interface IncidentMetrics {
  openCount: number;
  resolvedThisWeek: number;
  resolvedThisMonth: number;
  averageResolutionTime: number;
  weeklyTrend: number[];
  monthlyTrend: number[];
  bySeverity: Record<IncidentSeverity, number>;
  byType: Record<IncidentType, number>;
  requireFollowUp: number;
  overdueFollowUp: number;
}

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';

export type IncidentType =
  | 'injury'
  | 'medication_error'
  | 'behavioral'
  | 'abuse'
  | 'neglect'
  | 'property'
  | 'complaint'
  | 'near_miss'
  | 'other';

// =========================================================
// Workload
// =========================================================

export interface WorkloadMetrics {
  averageLoad: number;
  distribution: StaffWorkload[];
  overloaded: number;
  underutilized: number;
  optimal: number;
}

export interface StaffWorkload {
  userId: string;
  staffName: string;
  staffEmail: string;
  role: string;
  load: number;
  activeClients: number;
  scheduledVisits: number;
  status: 'overloaded' | 'optimal' | 'underutilized';
}

// =========================================================
// API Response
// =========================================================

export interface CareScorecardAPIResponse {
  scorecard: CareScorecard;
  alerts: CareScorecardAlert[];
  recommendations: string[];
}

export interface CareScorecardAlert {
  type: 'warning' | 'critical' | 'info';
  category: 'credentials' | 'visits' | 'incidents' | 'care_plans' | 'workload';
  message: string;
  actionUrl?: string;
  count?: number;
}
