import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { AutomatedCheckResult } from './types';

// ---------------------------------------------------------------------------
// Automated SOC 2 evidence checks
// ---------------------------------------------------------------------------

type CheckDefinition = {
  checkName: string;
  controlCode: string;
  category: string;
  run: (
    supabase: ReturnType<typeof createSupabaseAdminClient>,
    orgId: string,
  ) => Promise<{ passed: boolean; detail: string }>;
};

const CHECKS: CheckDefinition[] = [
  // SOC2-S1: Security governance
  {
    checkName: 'Security policies exist',
    controlCode: 'SOC2-S1',
    category: 'Security',
    run: async (supabase, orgId) => {
      const { data } = await supabase
        .from('org_policies')
        .select('id')
        .eq('organization_id', orgId)
        .ilike('title', '%security%')
        .limit(1);

      const found = (data ?? []).length > 0;
      return {
        passed: found,
        detail: found
          ? 'Security policy found in organization policies.'
          : 'No security policy found. Create a policy with "security" in the title.',
      };
    },
  },

  // SOC2-S2: Identity and access management
  {
    checkName: 'MFA and access review evidence',
    controlCode: 'SOC2-S2',
    category: 'Security',
    run: async (supabase, orgId) => {
      // Check for MFA-related evidence or policies
      const { data: mfaEvidence } = await supabase
        .from('org_evidence')
        .select('id')
        .eq('organization_id', orgId)
        .ilike('title', '%mfa%')
        .limit(1);

      const { data: accessReview } = await supabase
        .from('org_evidence')
        .select('id')
        .eq('organization_id', orgId)
        .ilike('title', '%access review%')
        .limit(1);

      const hasMfa = (mfaEvidence ?? []).length > 0;
      const hasAccessReview = (accessReview ?? []).length > 0;

      if (hasMfa && hasAccessReview) {
        return { passed: true, detail: 'MFA enforcement report and access review evidence found.' };
      }

      const missing: string[] = [];
      if (!hasMfa) missing.push('MFA enforcement report');
      if (!hasAccessReview) missing.push('access review logs');
      return {
        passed: false,
        detail: `Missing: ${missing.join(', ')}. Upload evidence with relevant titles.`,
      };
    },
  },

  // SOC2-S3: Security monitoring
  {
    checkName: 'Security monitoring evidence',
    controlCode: 'SOC2-S3',
    category: 'Security',
    run: async (supabase, orgId) => {
      const { data: siemEvidence } = await supabase
        .from('org_evidence')
        .select('id')
        .eq('organization_id', orgId)
        .ilike('title', '%siem%')
        .limit(1);

      const { data: monitoringEvidence } = await supabase
        .from('org_evidence')
        .select('id')
        .eq('organization_id', orgId)
        .ilike('title', '%monitoring%')
        .limit(1);

      const found = (siemEvidence ?? []).length > 0 || (monitoringEvidence ?? []).length > 0;
      return {
        passed: found,
        detail: found
          ? 'Security monitoring / SIEM evidence found.'
          : 'No monitoring or SIEM evidence found. Upload SIEM dashboards or monitoring configuration evidence.',
      };
    },
  },

  // SOC2-A1: Availability planning
  {
    checkName: 'Availability and SLA policies',
    controlCode: 'SOC2-A1',
    category: 'Availability',
    run: async (supabase, orgId) => {
      const { data: availPolicy } = await supabase
        .from('org_policies')
        .select('id')
        .eq('organization_id', orgId)
        .ilike('title', '%availability%')
        .limit(1);

      const { data: slaPolicy } = await supabase
        .from('org_policies')
        .select('id')
        .eq('organization_id', orgId)
        .ilike('title', '%sla%')
        .limit(1);

      const found = (availPolicy ?? []).length > 0 || (slaPolicy ?? []).length > 0;
      return {
        passed: found,
        detail: found
          ? 'Availability / SLA policy found.'
          : 'No availability or SLA policy found. Create a policy defining availability targets.',
      };
    },
  },

  // SOC2-A2: Resilience and recovery
  {
    checkName: 'Backup and recovery evidence',
    controlCode: 'SOC2-A2',
    category: 'Availability',
    run: async (supabase, orgId) => {
      const { data: backupEvidence } = await supabase
        .from('org_evidence')
        .select('id')
        .eq('organization_id', orgId)
        .ilike('title', '%backup%')
        .limit(1);

      const { data: recoveryEvidence } = await supabase
        .from('org_evidence')
        .select('id')
        .eq('organization_id', orgId)
        .ilike('title', '%recovery%')
        .limit(1);

      const found = (backupEvidence ?? []).length > 0 || (recoveryEvidence ?? []).length > 0;
      return {
        passed: found,
        detail: found
          ? 'Backup / recovery evidence found.'
          : 'No backup or recovery evidence found. Upload backup restore test results or recovery runbooks.',
      };
    },
  },

  // SOC2-C1: Data classification
  {
    checkName: 'Data classification policy',
    controlCode: 'SOC2-C1',
    category: 'Confidentiality',
    run: async (supabase, orgId) => {
      const { data: classPolicy } = await supabase
        .from('org_policies')
        .select('id')
        .eq('organization_id', orgId)
        .ilike('title', '%classification%')
        .limit(1);

      const { data: dataPolicy } = await supabase
        .from('org_policies')
        .select('id')
        .eq('organization_id', orgId)
        .ilike('title', '%data handling%')
        .limit(1);

      const found = (classPolicy ?? []).length > 0 || (dataPolicy ?? []).length > 0;
      return {
        passed: found,
        detail: found
          ? 'Data classification policy found.'
          : 'No data classification policy found. Create a policy defining data classification levels.',
      };
    },
  },

  // SOC2-C2: Encryption and key management
  {
    checkName: 'Encryption policy',
    controlCode: 'SOC2-C2',
    category: 'Confidentiality',
    run: async (supabase, orgId) => {
      const { data: encPolicy } = await supabase
        .from('org_policies')
        .select('id')
        .eq('organization_id', orgId)
        .ilike('title', '%encryption%')
        .limit(1);

      const { data: keyEvidence } = await supabase
        .from('org_evidence')
        .select('id')
        .eq('organization_id', orgId)
        .ilike('title', '%key rotation%')
        .limit(1);

      const found = (encPolicy ?? []).length > 0 || (keyEvidence ?? []).length > 0;
      return {
        passed: found,
        detail: found
          ? 'Encryption policy or key management evidence found.'
          : 'No encryption policy found. Create a policy covering encryption at rest and in transit.',
      };
    },
  },

  // SOC2-PI1: Change management
  {
    checkName: 'Change management policy',
    controlCode: 'SOC2-PI1',
    category: 'Processing Integrity',
    run: async (supabase, orgId) => {
      const { data } = await supabase
        .from('org_policies')
        .select('id')
        .eq('organization_id', orgId)
        .ilike('title', '%change management%')
        .limit(1);

      const found = (data ?? []).length > 0;
      return {
        passed: found,
        detail: found
          ? 'Change management policy found.'
          : 'No change management policy found. Create a policy requiring approvals and testing for changes.',
      };
    },
  },

  // SOC2-PI2: Data processing quality
  {
    checkName: 'Data quality reports',
    controlCode: 'SOC2-PI2',
    category: 'Processing Integrity',
    run: async (supabase, orgId) => {
      const { data } = await supabase
        .from('org_evidence')
        .select('id')
        .eq('organization_id', orgId)
        .ilike('title', '%data quality%')
        .limit(1);

      const found = (data ?? []).length > 0;
      return {
        passed: found,
        detail: found
          ? 'Data quality reports found as evidence.'
          : 'No data quality reports found. Upload data quality monitoring results.',
      };
    },
  },

  // SOC2-P1: Privacy notice and consent
  {
    checkName: 'Privacy policy',
    controlCode: 'SOC2-P1',
    category: 'Privacy',
    run: async (supabase, orgId) => {
      const { data } = await supabase
        .from('org_policies')
        .select('id')
        .eq('organization_id', orgId)
        .ilike('title', '%privacy%')
        .limit(1);

      const found = (data ?? []).length > 0;
      return {
        passed: found,
        detail: found
          ? 'Privacy policy found.'
          : 'No privacy policy found. Create a policy covering privacy notices and consent.',
      };
    },
  },

  // SOC2-P2: Data subject rights and retention
  {
    checkName: 'Retention schedule',
    controlCode: 'SOC2-P2',
    category: 'Privacy',
    run: async (supabase, orgId) => {
      const { data: retentionPolicy } = await supabase
        .from('org_policies')
        .select('id')
        .eq('organization_id', orgId)
        .ilike('title', '%retention%')
        .limit(1);

      const { data: retentionEvidence } = await supabase
        .from('org_evidence')
        .select('id')
        .eq('organization_id', orgId)
        .ilike('title', '%retention%')
        .limit(1);

      const found = (retentionPolicy ?? []).length > 0 || (retentionEvidence ?? []).length > 0;
      return {
        passed: found,
        detail: found
          ? 'Retention schedule or policy found.'
          : 'No retention schedule found. Create a policy or upload evidence defining data retention periods.',
      };
    },
  },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function runAutomatedChecks(
  orgId: string,
): Promise<AutomatedCheckResult[]> {
  const supabase = createSupabaseAdminClient();
  const results: AutomatedCheckResult[] = [];

  for (const check of CHECKS) {
    try {
      const { passed, detail } = await check.run(supabase, orgId);
      results.push({
        checkName: check.checkName,
        controlCode: check.controlCode,
        passed,
        detail,
        category: check.category,
      });
    } catch (err) {
      results.push({
        checkName: check.checkName,
        controlCode: check.controlCode,
        passed: false,
        detail: `Check failed: ${err instanceof Error ? err.message : String(err)}`,
        category: check.category,
      });
    }
  }

  return results;
}
