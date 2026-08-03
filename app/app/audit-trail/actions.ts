'use server';

import { revalidatePath } from 'next/cache';
import { fetchSystemState } from '@/lib/system-state/server';
import { requestAuditExport } from '@/lib/audit/audit-engine';

export async function createAuditExport(
  dateFrom: string,
  dateTo: string,
): Promise<{ success: true } | { error: string }> {
  const state = await fetchSystemState();
  if (!state) return { error: 'Not signed in.' };

  if (state.role !== 'owner' && state.role !== 'admin') {
    return { error: 'Only owners and admins can export the audit trail.' };
  }

  if (!dateFrom || !dateTo) {
    return { error: 'Choose both a start and an end date.' };
  }
  if (dateFrom > dateTo) {
    return { error: 'The start date must come before the end date.' };
  }

  try {
    await requestAuditExport(state.organization.id, {
      dateFrom,
      dateTo,
      createdBy: state.user.id,
    });
  } catch {
    return { error: 'Could not queue the export. Try again.' };
  }

  revalidatePath('/app/audit-trail');
  return { success: true };
}
