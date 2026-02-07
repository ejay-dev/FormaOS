/**
 * Credential Monitor Service
 * Tracks credential expiry and generates alerts
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import type { Credential, CredentialType, CareScorecardAlert } from './types';

/**
 * Get all expiring credentials with detailed information
 */
export async function getExpiringCredentials(
  orgId: string,
  options?: {
    daysAhead?: number;
    credentialTypes?: CredentialType[];
    limit?: number;
  }
): Promise<Credential[]> {
  const admin = createSupabaseAdminClient();
  const now = new Date();
  const daysAhead = options?.daysAhead || 90;
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  let query = admin
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
    .eq('organization_id', orgId)
    .gte('expires_at', now.toISOString())
    .lte('expires_at', futureDate.toISOString())
    .order('expires_at', { ascending: true });

  if (options?.credentialTypes?.length) {
    query = query.in('credential_type', options.credentialTypes);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data: credentials, error } = await query;

  if (error) {
    console.error('[CredentialMonitor] Failed to fetch credentials:', error);
    return [];
  }

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

  return (credentials || []).map((cred: { id: string; user_id: string; credential_type?: string; name?: string; credential_number?: string; expires_at: string; status?: string; document_url?: string }) => {
    const user = userMap.get(cred.user_id);
    const expiryDate = new Date(cred.expires_at);
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      id: cred.id,
      userId: cred.user_id,
      staffName: user?.name || 'Unknown',
      staffEmail: user?.email || '',
      type: (cred.credential_type as CredentialType) || 'other',
      name: cred.name || cred.credential_type || 'Unknown',
      credentialNumber: cred.credential_number ?? undefined,
      expiryDate: cred.expires_at,
      daysUntilExpiry,
      status: daysUntilExpiry <= 30 ? 'expiring_soon' : 'verified',
      documentUrl: cred.document_url ?? undefined,
    };
  });
}

/**
 * Get expired credentials
 */
export async function getExpiredCredentials(
  orgId: string,
  limit = 50
): Promise<Credential[]> {
  const admin = createSupabaseAdminClient();
  const now = new Date();

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
    .eq('organization_id', orgId)
    .lt('expires_at', now.toISOString())
    .order('expires_at', { ascending: false })
    .limit(limit);

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

  return (credentials || []).map((cred: { id: string; user_id: string; credential_type?: string; name?: string; credential_number?: string; expires_at: string; status?: string; document_url?: string }) => {
    const user = userMap.get(cred.user_id);
    const expiryDate = new Date(cred.expires_at);
    const daysExpired = Math.abs(
      Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );

    return {
      id: cred.id,
      userId: cred.user_id,
      staffName: user?.name || 'Unknown',
      staffEmail: user?.email || '',
      type: (cred.credential_type as CredentialType) || 'other',
      name: cred.name || cred.credential_type || 'Unknown',
      credentialNumber: cred.credential_number ?? undefined,
      expiryDate: cred.expires_at,
      daysUntilExpiry: -daysExpired,
      status: 'expired',
      documentUrl: cred.document_url ?? undefined,
    };
  });
}

/**
 * Generate credential alerts based on expiry thresholds
 */
export async function generateCredentialAlerts(
  orgId: string
): Promise<CareScorecardAlert[]> {
  const alerts: CareScorecardAlert[] = [];
  const now = new Date();

  const [expired, expiring30, expiring7] = await Promise.all([
    getExpiredCredentials(orgId, 100),
    getExpiringCredentials(orgId, { daysAhead: 30 }),
    getExpiringCredentials(orgId, { daysAhead: 7 }),
  ]);

  // Critical: Expired credentials
  if (expired.length > 0) {
    alerts.push({
      type: 'critical',
      category: 'credentials',
      message: `${expired.length} credential${expired.length > 1 ? 's' : ''} expired and require immediate renewal`,
      actionUrl: '/app/team/credentials?filter=expired',
      count: expired.length,
    });
  }

  // Critical: Expiring within 7 days
  if (expiring7.length > 0) {
    alerts.push({
      type: 'critical',
      category: 'credentials',
      message: `${expiring7.length} credential${expiring7.length > 1 ? 's' : ''} expiring within 7 days`,
      actionUrl: '/app/team/credentials?filter=expiring_soon',
      count: expiring7.length,
    });
  }

  // Warning: Expiring within 30 days (excluding 7-day ones)
  const expiring30Only = expiring30.filter(
    (c) => !expiring7.some((e) => e.id === c.id)
  );
  if (expiring30Only.length > 0) {
    alerts.push({
      type: 'warning',
      category: 'credentials',
      message: `${expiring30Only.length} credential${expiring30Only.length > 1 ? 's' : ''} expiring within 30 days`,
      actionUrl: '/app/team/credentials?filter=expiring',
      count: expiring30Only.length,
    });
  }

  return alerts;
}

/**
 * Get credential summary by type
 */
export async function getCredentialSummaryByType(
  orgId: string
): Promise<
  Array<{
    type: CredentialType;
    label: string;
    total: number;
    verified: number;
    pending: number;
    expired: number;
    expiringSoon: number;
  }>
> {
  const admin = createSupabaseAdminClient();
  const now = new Date();
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);

  const { data: credentials } = await admin
    .from('org_staff_credentials')
    .select('credential_type, status, expires_at')
    .eq('organization_id', orgId);

  const typeLabels: Record<CredentialType, string> = {
    wwcc: 'Working With Children Check',
    police_check: 'Police Check',
    ndis_screening: 'NDIS Worker Screening',
    first_aid: 'First Aid Certificate',
    cpr: 'CPR Certificate',
    manual_handling: 'Manual Handling',
    medication_cert: 'Medication Certificate',
    drivers_license: "Driver's License",
    vaccination: 'Vaccination Record',
    ahpra: 'AHPRA Registration',
    other: 'Other',
  };

  const summary: Record<
    CredentialType,
    { total: number; verified: number; pending: number; expired: number; expiringSoon: number }
  > = {} as any;

  for (const type of Object.keys(typeLabels) as CredentialType[]) {
    summary[type] = { total: 0, verified: 0, pending: 0, expired: 0, expiringSoon: 0 };
  }

  for (const cred of credentials || []) {
    const type = (cred.credential_type as CredentialType) || 'other';
    if (!summary[type]) {
      summary[type] = { total: 0, verified: 0, pending: 0, expired: 0, expiringSoon: 0 };
    }

    summary[type].total++;

    const expiryDate = cred.expires_at ? new Date(cred.expires_at) : null;

    if (cred.status === 'verified') {
      summary[type].verified++;
    } else if (cred.status === 'expired' || (expiryDate && expiryDate < now)) {
      summary[type].expired++;
    } else {
      summary[type].pending++;
    }

    if (expiryDate && expiryDate > now && expiryDate <= thirtyDays) {
      summary[type].expiringSoon++;
    }
  }

  return (Object.keys(typeLabels) as CredentialType[])
    .filter((type) => summary[type].total > 0)
    .map((type) => ({
      type,
      label: typeLabels[type],
      ...summary[type],
    }));
}
