/**
 * Compliance Deadline Tracker
 * Manages and queries upcoming compliance deadlines
 */

import { createSupabaseOrgClient } from '@/lib/supabase/org-scoped';
import { isMissingSupabaseTableError } from '@/lib/supabase/schema-compat';
import { consoleShim } from '@/lib/monitoring/console-shim';
import type {
  ComplianceDeadline,
  DeadlineType,
  DeadlinePriority,
  DeadlineStatus,
} from './types';

/**
 * Get all deadlines for an organization with filtering options
 */
export async function getDeadlines(
  orgId: string,
  options?: {
    status?: DeadlineStatus[];
    type?: DeadlineType[];
    priority?: DeadlinePriority[];
    frameworkSlug?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ deadlines: ComplianceDeadline[]; total: number }> {
  const supabase = createSupabaseOrgClient(orgId);
  const now = new Date();

  // .eq('organization_id', orgId) appended automatically by the
  // org-scoped client.
  let query = supabase
    .from('org_compliance_deadlines')
    .select('*', { count: 'exact' })
    .order('due_date', { ascending: true });

  if (options?.frameworkSlug) {
    query = query.eq('framework_slug', options.frameworkSlug);
  }

  if (options?.type?.length) {
    query = query.in('deadline_type', options.type);
  }

  if (options?.status?.length) {
    query = query.in('status', options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options?.limit || 50) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    if (isMissingSupabaseTableError(error, 'org_compliance_deadlines')) {
      return { deadlines: [], total: 0 };
    }

    consoleShim.error('[DeadlineTracker] Failed to fetch deadlines:', error);
    return { deadlines: [], total: 0 };
  }

  interface DeadlineRow {
    id: string;
    title: string;
    description?: string | null;
    framework_slug?: string | null;
    due_date: string;
    reminder_date?: string | null;
    deadline_type: string;
    status: string;
  }

  const deadlines: ComplianceDeadline[] = (data || []).map((d: DeadlineRow) => {
    const dueDate = new Date(d.due_date);
    const daysRemaining = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate derived fields
    const derivedPriority: DeadlinePriority =
      daysRemaining <= 7 ? 'critical' : daysRemaining <= 14 ? 'high' : daysRemaining <= 30 ? 'medium' : 'low';

    const derivedStatus: DeadlineStatus =
      d.status === 'completed' || d.status === 'cancelled'
        ? d.status as DeadlineStatus
        : daysRemaining < 0
        ? 'overdue'
        : daysRemaining <= 7
        ? 'due_soon'
        : 'upcoming';

    return {
      id: d.id,
      title: d.title,
      description: d.description ?? undefined,
      framework: d.framework_slug ?? undefined,
      frameworkSlug: d.framework_slug ?? undefined,
      dueDate: d.due_date,
      reminderDate: d.reminder_date ?? undefined,
      type: d.deadline_type as DeadlineType,
      priority: derivedPriority,
      status: derivedStatus,
      daysRemaining: Math.max(0, daysRemaining),
    };
  });

  // Filter by priority if specified (post-query filtering since it's derived)
  const filteredDeadlines = options?.priority?.length
    ? deadlines.filter((d) => options.priority!.includes(d.priority))
    : deadlines;

  return { deadlines: filteredDeadlines, total: count || 0 };
}

/**
 * Create a new compliance deadline
 */
export async function createDeadline(
  orgId: string,
  deadline: {
    title: string;
    description?: string;
    frameworkSlug?: string;
    dueDate: string;
    reminderDate?: string;
    type: DeadlineType;
  }
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const supabase = createSupabaseOrgClient(orgId);

  // organization_id is stamped automatically by the org-scoped client.
  const { data, error } = await supabase
    .from('org_compliance_deadlines')
    .insert({
      title: deadline.title,
      description: deadline.description,
      framework_slug: deadline.frameworkSlug,
      due_date: deadline.dueDate,
      reminder_date: deadline.reminderDate,
      deadline_type: deadline.type,
      status: 'upcoming',
    })
    .select('id')
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, id: data.id };
}

/**
 * Update deadline status
 */
export async function updateDeadlineStatus(
  orgId: string,
  deadlineId: string,
  status: DeadlineStatus
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createSupabaseOrgClient(orgId);

  // .eq('organization_id', orgId) appended automatically.
  const { error } = await supabase
    .from('org_compliance_deadlines')
    .update({ status })
    .eq('id', deadlineId);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

/**
 * Get deadline summary for dashboard
 */
export async function getDeadlineSummary(
  orgId: string
): Promise<{
  total: number;
  overdue: number;
  dueSoon: number;
  upcoming: number;
  byType: Record<DeadlineType, number>;
}> {
  const supabase = createSupabaseOrgClient(orgId);
  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const { data: deadlines, error } = await supabase
    .from('org_compliance_deadlines')
    .select('due_date, deadline_type, status')
    .not('status', 'in', '("completed","cancelled")');

  if (error) {
    if (isMissingSupabaseTableError(error, 'org_compliance_deadlines')) {
      return {
        total: 0,
        overdue: 0,
        dueSoon: 0,
        upcoming: 0,
        byType: {
          audit: 0,
          renewal: 0,
          review: 0,
          submission: 0,
          certification: 0,
          other: 0,
        },
      };
    }

    consoleShim.error('[DeadlineTracker] Failed to summarize deadlines:', error);
  }

  if (!deadlines?.length) {
    return {
      total: 0,
      overdue: 0,
      dueSoon: 0,
      upcoming: 0,
      byType: {
        audit: 0,
        renewal: 0,
        review: 0,
        submission: 0,
        certification: 0,
        other: 0,
      },
    };
  }

  let overdue = 0;
  let dueSoon = 0;
  let upcoming = 0;
  const byType: Record<DeadlineType, number> = {
    audit: 0,
    renewal: 0,
    review: 0,
    submission: 0,
    certification: 0,
    other: 0,
  };

  for (const d of deadlines as Array<{
    due_date: string;
    deadline_type: string | null;
  }>) {
    const dueDate = new Date(d.due_date);

    if (dueDate < now) {
      overdue++;
    } else if (dueDate <= sevenDaysFromNow) {
      dueSoon++;
    } else {
      upcoming++;
    }

    const type = (d.deadline_type as DeadlineType) || 'other';
    byType[type] = (byType[type] || 0) + 1;
  }

  return {
    total: deadlines.length,
    overdue,
    dueSoon,
    upcoming,
    byType,
  };
}

/**
 * Get deadlines requiring action (overdue + due soon)
 */
export async function getActionRequiredDeadlines(
  orgId: string,
  limit = 5
): Promise<ComplianceDeadline[]> {
  const { deadlines } = await getDeadlines(orgId, {
    limit,
  });

  // Filter to overdue and due_soon
  return deadlines.filter((d) => d.status === 'overdue' || d.status === 'due_soon');
}
