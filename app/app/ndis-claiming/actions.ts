'use server';

/**
 * NDIS claiming lifecycle server actions.
 *
 * Completes the claim state machine that the page previously only half-wired
 * (generate + export existed; submitted/paid/rejected states were unreachable):
 *
 *   draft ──markDraftsReady──▶ ready ──markSubmitted──▶ submitted ──markPaid──▶ paid
 *                                                                  └─rejectClaim─▶ rejected
 *
 * Every transition is org-scoped (service-role client + explicit org_id filter)
 * and uses a source-status guard so an item can only move along a valid edge.
 * Financial-finality transitions (paid / rejected) require an owner/admin.
 */

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { resolveActiveMembership } from '@/lib/auth/membership-cache';
import { batchValidateClaims, markAsPaid } from '@/lib/care/ndis-claiming';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('ndis-claiming/actions');
const PATH = '/app/ndis-claiming';

type OrgCtx = { orgId: string; userId: string; role: string | null };

async function requireOrgCtx(): Promise<OrgCtx | { redirectTo: string }> {
  const m = await resolveActiveMembership();
  if (m.kind === 'ok') {
    return { orgId: m.organizationId, userId: m.userId, role: m.role };
  }
  if (m.kind === 'unauthorized') return { redirectTo: '/auth/signin' };
  if (m.kind === 'ambiguous') return { redirectTo: `${PATH}?error=active_org` };
  return { redirectTo: `${PATH}?error=membership` };
}

function isManager(role: string | null): boolean {
  return role === 'owner' || role === 'admin';
}

function redirectBack(params: Record<string, string | number>): never {
  const qs = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)]),
  ).toString();
  redirect(`${PATH}?${qs}`);
}

function getId(formData: FormData): string | null {
  const id = formData.get('id');
  return typeof id === 'string' && id.length > 0 ? id : null;
}

/**
 * Validate every draft line item and promote the ones that pass to 'ready'.
 * Items that fail validation stay 'draft' and are reported back so the
 * operator can fix them (e.g. add a missing price-guide rate).
 */
export async function markDraftsReady(): Promise<void> {
  const ctx = await requireOrgCtx();
  if ('redirectTo' in ctx) redirect(ctx.redirectTo);

  const admin = createSupabaseAdminClient();
  const { data: drafts } = await admin
    .from('org_ndis_line_items')
    .select('id')
    .eq('org_id', ctx.orgId)
    .eq('status', 'draft')
    .limit(500);

  const draftIds = (drafts ?? []).map((d) => d.id).filter(Boolean);
  if (draftIds.length === 0) redirectBack({ error: 'no_drafts' });

  const validations = await batchValidateClaims(admin, ctx.orgId, draftIds);
  const validIds = validations.filter((v) => v.valid).map((v) => v.id);
  const invalidCount = draftIds.length - validIds.length;

  if (validIds.length > 0) {
    const { error } = await admin
      .from('org_ndis_line_items')
      .update({ status: 'ready' })
      .eq('org_id', ctx.orgId)
      .eq('status', 'draft')
      .in('id', validIds);
    if (error) {
      log.error({ err: error, orgId: ctx.orgId }, 'markDraftsReady failed');
      redirectBack({ error: 'update_failed' });
    }
  }

  revalidatePath(PATH);
  redirectBack({ notice: 'marked_ready', n: validIds.length, invalid: invalidCount });
}

/** Promote a single 'ready' item to 'submitted' (operator has uploaded the file). */
export async function markSubmitted(formData: FormData): Promise<void> {
  const ctx = await requireOrgCtx();
  if ('redirectTo' in ctx) redirect(ctx.redirectTo);

  const id = getId(formData);
  if (!id) redirectBack({ error: 'bad_request' });

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from('org_ndis_line_items')
    .update({ status: 'submitted' })
    .eq('org_id', ctx.orgId)
    .eq('status', 'ready')
    .eq('id', id);
  if (error) {
    log.error({ err: error, orgId: ctx.orgId, id }, 'markSubmitted failed');
    redirectBack({ error: 'update_failed' });
  }

  revalidatePath(PATH);
  redirectBack({ notice: 'submitted' });
}

/** Mark a 'submitted' item paid with a payment reference. Owner/admin only. */
export async function markPaid(formData: FormData): Promise<void> {
  const ctx = await requireOrgCtx();
  if ('redirectTo' in ctx) redirect(ctx.redirectTo);
  if (!isManager(ctx.role)) redirectBack({ error: 'forbidden' });

  const id = getId(formData);
  const paymentRef = String(formData.get('payment_reference') ?? '').trim();
  if (!id || !paymentRef) redirectBack({ error: 'payment_ref_required' });

  const admin = createSupabaseAdminClient();
  try {
    await markAsPaid(admin, ctx.orgId, [id], paymentRef);
  } catch (err) {
    log.error({ err, orgId: ctx.orgId, id }, 'markPaid failed');
    redirectBack({ error: 'update_failed' });
  }

  revalidatePath(PATH);
  redirectBack({ notice: 'paid' });
}

/** Mark a 'submitted' item rejected with a reason. Owner/admin only. */
export async function rejectClaim(formData: FormData): Promise<void> {
  const ctx = await requireOrgCtx();
  if ('redirectTo' in ctx) redirect(ctx.redirectTo);
  if (!isManager(ctx.role)) redirectBack({ error: 'forbidden' });

  const id = getId(formData);
  const reason = String(formData.get('rejection_reason') ?? '').trim();
  if (!id || !reason) redirectBack({ error: 'reason_required' });

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from('org_ndis_line_items')
    .update({ status: 'rejected', rejection_reason: reason })
    .eq('org_id', ctx.orgId)
    .eq('status', 'submitted')
    .eq('id', id);
  if (error) {
    log.error({ err: error, orgId: ctx.orgId, id }, 'rejectClaim failed');
    redirectBack({ error: 'update_failed' });
  }

  revalidatePath(PATH);
  redirectBack({ notice: 'rejected' });
}
