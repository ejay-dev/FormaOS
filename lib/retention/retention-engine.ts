import { createSupabaseServerClient } from '@/lib/supabase/server';

// ------------------------------------------------------------------
// Document Retention Engine
// ------------------------------------------------------------------

export async function getRetentionPolicies(orgId: string) {
  const db = await createSupabaseServerClient();
  const { data } = await db
    .from('retention_policies')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .order('document_category');
  return data || [];
}

export async function createRetentionPolicy(
  orgId: string,
  data: {
    name: string;
    description?: string;
    documentCategory: string;
    retentionPeriodDays: number;
    actionOnExpiry: 'archive' | 'delete' | 'review';
  },
) {
  const db = await createSupabaseServerClient();
  const { error } = await db.from('retention_policies').insert({
    org_id: orgId,
    name: data.name,
    description: data.description,
    document_category: data.documentCategory,
    retention_period_days: data.retentionPeriodDays,
    action_on_expiry: data.actionOnExpiry,
  });
  if (error) throw error;
}

export async function isUnderLegalHold(
  orgId: string,
  documentId: string,
): Promise<boolean> {
  const db = await createSupabaseServerClient();
  const { count } = await db
    .from('legal_hold_documents')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('document_id', documentId)
    .in(
      'legal_hold_id',
      (
        await db
          .from('legal_holds')
          .select('id')
          .eq('org_id', orgId)
          .eq('status', 'active')
      ).data?.map((h) => h.id) || [],
    );
  return (count || 0) > 0;
}

export async function createLegalHold(
  orgId: string,
  data: { name: string; reason: string; createdBy: string },
) {
  const db = await createSupabaseServerClient();
  const { data: hold, error } = await db
    .from('legal_holds')
    .insert({
      org_id: orgId,
      name: data.name,
      reason: data.reason,
      created_by: data.createdBy,
    })
    .select()
    .single();
  if (error) throw error;
  return hold;
}

export async function releaseLegalHold(
  orgId: string,
  holdId: string,
  releasedBy: string,
) {
  const db = await createSupabaseServerClient();
  await db
    .from('legal_holds')
    .update({
      status: 'released',
      released_by: releasedBy,
      released_at: new Date().toISOString(),
    })
    .eq('id', holdId)
    .eq('org_id', orgId);

  // Log release for each document
  const { data: docs } = await db
    .from('legal_hold_documents')
    .select('document_type, document_id')
    .eq('legal_hold_id', holdId);

  if (docs) {
    const logs = docs.map((d) => ({
      org_id: orgId,
      document_type: d.document_type,
      document_id: d.document_id,
      action: 'hold_released',
      performed_by: releasedBy,
      metadata: { legal_hold_id: holdId },
    }));
    await db.from('document_lifecycle_log').insert(logs);
  }
}

export async function addDocumentToHold(
  orgId: string,
  holdId: string,
  doc: { documentType: string; documentId: string; addedBy: string },
) {
  const db = await createSupabaseServerClient();
  await db.from('legal_hold_documents').upsert(
    {
      org_id: orgId,
      legal_hold_id: holdId,
      document_type: doc.documentType,
      document_id: doc.documentId,
      added_by: doc.addedBy,
    },
    { onConflict: 'legal_hold_id,document_id' },
  );

  await db.from('document_lifecycle_log').insert({
    org_id: orgId,
    document_type: doc.documentType,
    document_id: doc.documentId,
    action: 'hold_applied',
    performed_by: doc.addedBy,
    metadata: { legal_hold_id: holdId },
  });
}

export async function logDocumentAction(
  orgId: string,
  doc: {
    documentType: string;
    documentId: string;
    action: string;
    performedBy?: string;
    metadata?: Record<string, unknown>;
  },
) {
  const db = await createSupabaseServerClient();
  await db.from('document_lifecycle_log').insert({
    org_id: orgId,
    document_type: doc.documentType,
    document_id: doc.documentId,
    action: doc.action,
    performed_by: doc.performedBy,
    metadata: doc.metadata || {},
  });
}

export async function getDocumentsExpiringSoon(
  orgId: string,
  withinDays: number = 30,
) {
  const db = await createSupabaseServerClient();

  const { data: policies } = await db
    .from('retention_policies')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_active', true);

  if (!policies || policies.length === 0) return [];

  // For each category, find docs created before (now - retention_period)
  const results: Array<{
    category: string;
    policy: string;
    action: string;
    expiresIn: number;
  }> = [];

  for (const policy of policies) {
    const cutoffDate = new Date();
    cutoffDate.setDate(
      cutoffDate.getDate() - policy.retention_period_days + withinDays,
    );

    // Check evidence table as example
    if (policy.document_category === 'evidence') {
      const { count } = await db
        .from('org_evidence')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .lte('created_at', cutoffDate.toISOString());

      if (count && count > 0) {
        results.push({
          category: policy.document_category,
          policy: policy.name,
          action: policy.action_on_expiry,
          expiresIn: withinDays,
        });
      }
    }
  }

  return results;
}
