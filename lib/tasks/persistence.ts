import {
  extractMissingSupabaseColumn,
  getSupabaseErrorMessage,
} from '@/lib/supabase/schema-compat';

type TaskInsertRow = Record<string, unknown>;

type TaskInsertClient = {
  from(table: 'org_tasks'): {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase query builder returns deeply chained generic type
    insert(values: TaskInsertRow): any;
  };
};

type TaskInsertOptions = {
  optionalColumns?: Iterable<string>;
  returning?: 'none' | 'single';
};

const DEFAULT_OPTIONAL_TASK_COLUMNS = [
  'created_by',
  'linked_policy_id',
  'linked_asset_id',
  'is_recurring',
  'recurrence_days',
  'escalation_sent',
];

export async function insertOrgTaskCompat<T extends TaskInsertRow>(
  client: TaskInsertClient,
  row: T,
  options: TaskInsertOptions = {},
): Promise<{ data: Record<string, unknown> | null; payload: Partial<T> }> {
  const payload: Partial<T> = { ...row };
  const optionalColumns = new Set(
    options.optionalColumns ?? DEFAULT_OPTIONAL_TASK_COLUMNS,
  );

  for (;;) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase query builder chain requires dynamic method access
    let query: any = client.from('org_tasks').insert(payload);

    if (options.returning === 'single') {
      query = query.select('*').single();
    }

    const { data, error } = await query;
    if (!error) {
      return {
        data: (data as Record<string, unknown> | null | undefined) ?? null,
        // Supabase returns the stored database row, which can include generated fields like id.
        payload,
      };
    }

    const missingColumn = extractMissingSupabaseColumn(error, 'org_tasks');
    if (
      !missingColumn ||
      !optionalColumns.has(missingColumn) ||
      !(missingColumn in payload)
    ) {
      throw new Error(
        `Task insert failed: ${getSupabaseErrorMessage(error) || 'unknown error'}`,
      );
    }

    optionalColumns.delete(missingColumn);
    delete payload[missingColumn as keyof typeof payload];
  }
}
