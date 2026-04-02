import { createSupabaseAdminClient } from '@/lib/supabase/admin';

type BulkOperation =
  | 'suspend_orgs'
  | 'email_admins'
  | 'extend_trials'
  | 'update_plan'
  | 'recalculate_health';

type BulkTarget = { orgId: string; orgName?: string };

type BulkPreview = {
  operation: BulkOperation;
  targets: BulkTarget[];
  affectedUsers: number;
  affectedSubscriptions: number;
  estimatedRevenueImpact: number;
  warnings: string[];
};

type BulkResult = {
  operation: BulkOperation;
  total: number;
  succeeded: number;
  failed: number;
  results: Array<{
    orgId: string;
    status: 'success' | 'failed';
    error?: string;
  }>;
};

/**
 * Execute or preview a bulk admin operation.
 * When dryRun=true, returns a preview without executing.
 */
export async function executeBulkOperation(
  operation: BulkOperation,
  targets: BulkTarget[],
  adminId: string,
  dryRun: boolean,
  params?: Record<string, unknown>,
): Promise<BulkPreview | BulkResult> {
  const db = createSupabaseAdminClient();

  // Calculate blast radius
  const orgIds = targets.map((t) => t.orgId);

  const { count: userCount } = await db
    .from('org_memberships')
    .select('id', { count: 'exact', head: true })
    .in('organization_id', orgIds);

  const { count: subCount } = await db
    .from('org_subscriptions')
    .select('id', { count: 'exact', head: true })
    .in('organization_id', orgIds)
    .eq('status', 'active');

  if (dryRun) {
    const warnings: string[] = [];
    if (operation === 'suspend_orgs' && targets.length > 10) {
      warnings.push(
        `Suspending ${targets.length} organizations will affect ${userCount ?? 0} users`,
      );
    }
    if (operation === 'update_plan' && (subCount ?? 0) > 0) {
      warnings.push(`${subCount} active subscriptions will be modified`);
    }

    return {
      operation,
      targets,
      affectedUsers: userCount ?? 0,
      affectedSubscriptions: subCount ?? 0,
      estimatedRevenueImpact: 0,
      warnings,
    } satisfies BulkPreview;
  }

  // Execute
  const results: BulkResult['results'] = [];

  for (const target of targets) {
    try {
      switch (operation) {
        case 'suspend_orgs':
          await db
            .from('organizations')
            .update({ lifecycle_status: 'suspended' })
            .eq('id', target.orgId);
          break;
        case 'extend_trials': {
          const days = (params?.days as number) ?? 14;
          const { data: org } = await db
            .from('organizations')
            .select('trial_expires_at')
            .eq('id', target.orgId)
            .single();
          const current = org?.trial_expires_at
            ? new Date(org.trial_expires_at)
            : new Date();
          const newExp = new Date(
            current.getTime() + days * 24 * 60 * 60 * 1000,
          );
          await db
            .from('organizations')
            .update({ trial_expires_at: newExp.toISOString() })
            .eq('id', target.orgId);
          break;
        }
        case 'recalculate_health':
          // Just mark for recalculation — actual recalc happens via cron or trigger
          await db.from('org_health_scores').upsert(
            {
              organization_id: target.orgId,
              needs_recalc: true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'organization_id' },
          );
          break;
        default:
          break;
      }
      results.push({ orgId: target.orgId, status: 'success' });
    } catch (err) {
      results.push({
        orgId: target.orgId,
        status: 'failed',
        error: String(err),
      });
    }
  }

  // Audit log
  await db.from('admin_audit_log').insert({
    admin_id: adminId,
    action: `bulk_${operation}`,
    resource_type: 'bulk_operation',
    resource_id: crypto.randomUUID(),
    metadata: {
      operation,
      targetCount: targets.length,
      succeeded: results.filter((r) => r.status === 'success').length,
      failed: results.filter((r) => r.status === 'failed').length,
      params,
    },
  });

  return {
    operation,
    total: targets.length,
    succeeded: results.filter((r) => r.status === 'success').length,
    failed: results.filter((r) => r.status === 'failed').length,
    results,
  };
}
