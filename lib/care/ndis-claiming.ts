/**
 * NDIS Claiming - Line item generation, validation, and export
 */

import { SupabaseClient } from '@supabase/supabase-js';

export async function generateLineItems(
  db: SupabaseClient,
  orgId: string,
  visitId: string,
) {
  // Fetch visit details
  // Schema: org_visits uses organization_id (not org_id) and client_id (not participant_id).
  // org_ndis_line_items uses org_id + participant_id — we map between them at insert time.
  const { data: visit } = await db
    .from('org_visits')
    .select('*, org_patients(id, full_name)')
    .eq('id', visitId)
    .eq('organization_id', orgId)
    .single();

  if (!visit) throw new Error('Visit not found');
  if (visit.status !== 'completed') throw new Error('Visit must be completed');
  if (!visit.client_id) throw new Error('Visit has no linked participant');

  // Calculate duration in hours from actual times if available, else scheduled times.
  const startSource =
    visit.actual_start ??
    visit.scheduled_start ??
    visit.actual_start_time ??
    visit.start_time;
  const endSource =
    visit.actual_end ??
    visit.scheduled_end ??
    visit.actual_end_time ??
    visit.end_time;
  if (!startSource || !endSource) {
    throw new Error('Visit is missing start/end times — cannot generate claim');
  }
  const start = new Date(startSource);
  const end = new Date(endSource);
  const durationHours = Math.max(
    0.25,
    (end.getTime() - start.getTime()) / (1000 * 60 * 60),
  );

  // Map visit type to NDIS support item (simplified mapping)
  const supportItemMap: Record<
    string,
    { number: string; name: string; category: string }
  > = {
    personal_care: {
      number: '01_011_0107_1_1',
      name: 'Assistance with Daily Life - Standard',
      category: 'core',
    },
    community_access: {
      number: '04_104_0125_6_1',
      name: 'Community Participation Activities',
      category: 'core',
    },
    therapy: {
      number: '15_037_0117_1_3',
      name: 'Therapeutic Supports',
      category: 'capacity_building',
    },
    group_activity: {
      number: '04_102_0136_6_1',
      name: 'Group-Based Activities in the Community',
      category: 'core',
    },
    domestic: {
      number: '01_020_0104_1_1',
      name: 'House or Yard Maintenance',
      category: 'core',
    },
  };

  // Visit type is the high-level category; service_category is the more specific NDIS-aligned tag.
  const itemKey = visit.service_category ?? visit.visit_type;
  const item = supportItemMap[itemKey] ?? supportItemMap.personal_care;

  // Look up price from price guide
  const { data: priceGuide } = await db
    .from('org_ndis_price_guide')
    .select('price_national')
    .eq('support_item_number', item.number)
    .order('effective_date', { ascending: false })
    .limit(1)
    .single();

  // v4-021: previously fell back to a hardcoded $60/hr when the
  // price guide was missing for the support item. Silently
  // underbilling/overbilling at $60 is a compliance + revenue bug
  // — refuse to generate the line item and surface the gap so the
  // operator updates org_ndis_price_guide before claiming.
  if (priceGuide?.price_national == null) {
    throw new Error(
      `NDIS line item refused: no price_guide row for support item ${item.number} (${item.name}). ` +
        `Add the rate under org_ndis_price_guide before claiming for this visit.`,
    );
  }
  const unitPrice = Number(priceGuide.price_national);
  const quantity = Math.round(durationHours * 4) / 4; // round to 15min increments
  const totalAmount = unitPrice * quantity;

  // Map org_visits.client_id → org_ndis_line_items.participant_id. org_visits has no
  // care_plan_id column, so leave that null on the line item.
  const lineItem = {
    org_id: orgId,
    participant_id: visit.client_id,
    visit_id: visitId,
    care_plan_id: null as string | null,
    support_category: item.category,
    support_item_number: item.number,
    support_item_name: item.name,
    unit_price: unitPrice,
    quantity,
    total_amount: totalAmount,
    claim_type: 'standard',
    status: 'draft',
  };

  const { data, error } = await db
    .from('org_ndis_line_items')
    .insert(lineItem)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function validateLineItem(
  db: SupabaseClient,
  lineItem: {
    support_item_number: string;
    unit_price: number;
    quantity: number;
    total_amount: number;
  },
) {
  const errors: string[] = [];

  // Check price against price guide ceiling
  const { data: guide } = await db
    .from('org_ndis_price_guide')
    .select('price_national')
    .eq('support_item_number', lineItem.support_item_number)
    .order('effective_date', { ascending: false })
    .limit(1)
    .single();

  if (guide && lineItem.unit_price > guide.price_national) {
    errors.push(
      `Unit price $${lineItem.unit_price} exceeds NDIS ceiling $${guide.price_national}`,
    );
  }

  if (lineItem.quantity <= 0) errors.push('Quantity must be positive');
  if (lineItem.total_amount <= 0) errors.push('Total amount must be positive');

  const expectedTotal =
    Math.round(lineItem.unit_price * lineItem.quantity * 100) / 100;
  if (Math.abs(lineItem.total_amount - expectedTotal) > 0.01) {
    errors.push(
      `Total amount $${lineItem.total_amount} doesn't match unit_price × quantity = $${expectedTotal}`,
    );
  }

  return { valid: errors.length === 0, errors };
}

export async function batchValidateClaims(
  db: SupabaseClient,
  orgId: string,
  lineItemIds: string[],
) {
  const { data: items } = await db
    .from('org_ndis_line_items')
    .select('*')
    .eq('org_id', orgId)
    .in('id', lineItemIds);

  const results = [];
  for (const item of items ?? []) {
    const validation = await validateLineItem(db, item);
    results.push({ id: item.id, ...validation });
  }
  return results;
}

export async function exportClaimFile(
  db: SupabaseClient,
  orgId: string,
  lineItemIds: string[],
): Promise<string> {
  // Audit care-ops-004 (2026-05-22): the original implementation populated
  // both SupportsDeliveredFrom and SupportsDeliveredTo with
  // `new Date(item.created_at).toISOString().slice(0,10)`. created_at is
  // the line-item bookkeeping timestamp — for fortnightly batches it
  // differs from the actual visit date by days/weeks. NDIA either
  // rejects the claim outright or pays it against the wrong service
  // period. The NDIA bulk-payment CSV format requires the actual date(s)
  // of service delivery.
  //
  // Resolve from the linked visit (actual_start / actual_end, falling back
  // to scheduled_start / scheduled_end if a visit was claim-only). Only
  // when no visit row exists do we fall back to created_at so the export
  // doesn't break on legacy data.
  //
  // org_patients exposes full_name, not first_name/last_name. Only
  // ndis_number is read downstream, so the join just needs full_name +
  // ndis_number.
  const { data: items } = await db
    .from('org_ndis_line_items')
    .select(
      '*, org_patients(full_name, ndis_number), org_visits(actual_start, actual_end, scheduled_start, scheduled_end)',
    )
    .eq('org_id', orgId)
    .in('id', lineItemIds);

  if (!items?.length) throw new Error('No line items found');

  // Generate NDIS bulk claim CSV
  const headers = [
    'RegistrationNumber',
    'NDISNumber',
    'SupportsDeliveredFrom',
    'SupportsDeliveredTo',
    'SupportNumber',
    'ClaimReference',
    'Quantity',
    'Hours',
    'UnitPrice',
    'GSTCode',
    'AuthorisedBy',
    'ParticipantApproved',
    'InKindFundingProgram',
    'ClaimType',
    'CancellationReason',
    'ABN',
  ];

  const toIsoDate = (value: string | null | undefined): string | null => {
    if (!value) return null;
    const ms = Date.parse(value);
    if (Number.isNaN(ms)) return null;
    return new Date(ms).toISOString().slice(0, 10);
  };

  const rows = items.map((item) => {
    const patient = item.org_patients;
    const visit = (item as { org_visits?: {
      actual_start?: string | null;
      actual_end?: string | null;
      scheduled_start?: string | null;
      scheduled_end?: string | null;
    } | null }).org_visits ?? null;

    const serviceFrom =
      toIsoDate(visit?.actual_start) ??
      toIsoDate(visit?.scheduled_start) ??
      toIsoDate(item.created_at) ??
      '';
    const serviceTo =
      toIsoDate(visit?.actual_end) ??
      toIsoDate(visit?.scheduled_end) ??
      toIsoDate(item.created_at) ??
      '';

    // v4-021: previously wrote item.quantity into BOTH the Quantity
    // and Hours columns — the NDIA expects Hours to be the actual
    // service duration (start→end in hours) and Quantity to be
    // units of the support item. For time-based supports the two
    // happen to coincide; for per-trip or per-item supports they
    // diverge and the bulk-upload is rejected/mispaid. Compute
    // Hours from the visit window when available; fall back to
    // quantity for time-based items where the values match.
    const startMs =
      Date.parse(visit?.actual_start ?? '') ||
      Date.parse(visit?.scheduled_start ?? '') ||
      NaN;
    const endMs =
      Date.parse(visit?.actual_end ?? '') ||
      Date.parse(visit?.scheduled_end ?? '') ||
      NaN;
    const durationHours =
      Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs
        ? Math.round(((endMs - startMs) / (1000 * 60 * 60)) * 100) / 100
        : null;
    const hoursColumn = durationHours ?? item.quantity;

    return [
      '', // RegistrationNumber - org fills in
      patient?.ndis_number ?? '',
      serviceFrom,
      serviceTo,
      item.support_item_number,
      item.id.slice(0, 8),
      item.quantity,
      hoursColumn,
      item.unit_price,
      'P1', // GST exempt
      '',
      'Y',
      '',
      item.claim_type === 'cancellation' ? 'CANC' : '',
      '',
      '',
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export async function markAsPaid(
  db: SupabaseClient,
  orgId: string,
  lineItemIds: string[],
  paymentRef: string,
) {
  const { error } = await db
    .from('org_ndis_line_items')
    .update({
      status: 'paid',
      payment_reference: paymentRef,
      claimed_at: new Date().toISOString(),
    })
    .eq('org_id', orgId)
    .in('id', lineItemIds);

  if (error) throw new Error(error.message);
}

export async function getClaimingSummary(
  db: SupabaseClient,
  orgId: string,
  period: { from: string; to: string },
) {
  const { data } = await db
    .from('org_ndis_line_items')
    .select('status, total_amount')
    .eq('org_id', orgId)
    .gte('created_at', period.from)
    .lte('created_at', period.to);

  const items = data ?? [];
  const summary = {
    totalClaimed: 0,
    totalPaid: 0,
    totalPending: 0,
    totalRejected: 0,
    totalDraft: 0,
    itemCount: items.length,
  };

  for (const item of items) {
    const amount = Number(item.total_amount);
    switch (item.status) {
      case 'submitted':
        summary.totalClaimed += amount;
        break;
      case 'paid':
        summary.totalPaid += amount;
        break;
      case 'ready':
        summary.totalPending += amount;
        break;
      case 'rejected':
        summary.totalRejected += amount;
        break;
      case 'draft':
        summary.totalDraft += amount;
        break;
    }
  }

  return summary;
}
