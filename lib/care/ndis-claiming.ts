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
  const { data: visit } = await db
    .from('org_visits')
    .select('*, org_patients(id, first_name, last_name)')
    .eq('id', visitId)
    .eq('org_id', orgId)
    .single();

  if (!visit) throw new Error('Visit not found');
  if (visit.status !== 'completed') throw new Error('Visit must be completed');

  // Calculate duration in hours
  const start = new Date(visit.actual_start_time ?? visit.start_time);
  const end = new Date(visit.actual_end_time ?? visit.end_time);
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

  const item = supportItemMap[visit.visit_type] ?? supportItemMap.personal_care;

  // Look up price from price guide
  const { data: priceGuide } = await db
    .from('org_ndis_price_guide')
    .select('price_national')
    .eq('support_item_number', item.number)
    .order('effective_date', { ascending: false })
    .limit(1)
    .single();

  const unitPrice = priceGuide?.price_national ?? 60.0; // fallback
  const quantity = Math.round(durationHours * 4) / 4; // round to 15min increments
  const totalAmount = unitPrice * quantity;

  const lineItem = {
    org_id: orgId,
    participant_id: visit.participant_id,
    visit_id: visitId,
    care_plan_id: visit.care_plan_id ?? null,
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
  const { data: items } = await db
    .from('org_ndis_line_items')
    .select('*, org_patients(first_name, last_name, ndis_number)')
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

  const rows = items.map((item) => {
    const patient = item.org_patients;
    return [
      '', // RegistrationNumber - org fills in
      patient?.ndis_number ?? '',
      new Date(item.created_at).toISOString().slice(0, 10),
      new Date(item.created_at).toISOString().slice(0, 10),
      item.support_item_number,
      item.id.slice(0, 8),
      item.quantity,
      item.quantity,
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
