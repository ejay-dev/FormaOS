export type SupabaseAction =
  | 'select'
  | 'insert'
  | 'update'
  | 'delete'
  | 'upsert';

export interface SupabaseFilter {
  type: 'eq' | 'in' | 'contains' | 'gte' | 'lte' | 'is' | 'or';
  column: string;
  value: unknown;
}

export interface SupabaseOrder {
  column: string;
  ascending?: boolean;
}

export interface SupabaseOperation {
  table: string;
  action: SupabaseAction;
  columns?: string;
  values?: unknown;
  filters: SupabaseFilter[];
  orders: SupabaseOrder[];
  limit?: number;
  range?: { from: number; to: number };
  selectOptions?: Record<string, unknown>;
  actionOptions?: Record<string, unknown>;
  expects: 'many' | 'single' | 'maybeSingle';
}

export interface SupabaseResult<T = any> {
  data?: T;
  error?: { message: string } | null;
  count?: number | null;
}

type Resolver = (
  operation: SupabaseOperation,
  index: number,
) => SupabaseResult | Promise<SupabaseResult>;

type QueuedResponse = {
  match?: Partial<Pick<SupabaseOperation, 'table' | 'action' | 'expects'>>;
  response: SupabaseResult | ((operation: SupabaseOperation) => SupabaseResult);
};

class MockSupabaseBuilder implements PromiseLike<SupabaseResult> {
  constructor(
    private readonly controller: ReturnType<typeof mockSupabase>,
    private readonly operation: SupabaseOperation,
  ) {}

  select(columns = '*', options?: Record<string, unknown>) {
    this.operation.columns = columns;
    this.operation.selectOptions = options;
    if (this.operation.action === 'select') {
      return this;
    }
    return this;
  }

  insert(values: unknown) {
    this.operation.action = 'insert';
    this.operation.values = values;
    return this;
  }

  update(values: unknown) {
    this.operation.action = 'update';
    this.operation.values = values;
    return this;
  }

  delete() {
    this.operation.action = 'delete';
    return this;
  }

  upsert(values: unknown, options?: Record<string, unknown>) {
    this.operation.action = 'upsert';
    this.operation.values = values;
    this.operation.actionOptions = options;
    return this;
  }

  eq(column: string, value: unknown) {
    this.operation.filters.push({ type: 'eq', column, value });
    return this;
  }

  in(column: string, value: unknown) {
    this.operation.filters.push({ type: 'in', column, value });
    return this;
  }

  contains(column: string, value: unknown) {
    this.operation.filters.push({ type: 'contains', column, value });
    return this;
  }

  gte(column: string, value: unknown) {
    this.operation.filters.push({ type: 'gte', column, value });
    return this;
  }

  lte(column: string, value: unknown) {
    this.operation.filters.push({ type: 'lte', column, value });
    return this;
  }

  is(column: string, value: unknown) {
    this.operation.filters.push({ type: 'is', column, value });
    return this;
  }

  or(value: string) {
    this.operation.filters.push({ type: 'or', column: '$or', value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.operation.orders.push({ column, ascending: options?.ascending });
    return this;
  }

  limit(value: number) {
    this.operation.limit = value;
    return this;
  }

  range(from: number, to: number) {
    this.operation.range = { from, to };
    return this;
  }

  single() {
    this.operation.expects = 'single';
    return this.execute();
  }

  maybeSingle() {
    this.operation.expects = 'maybeSingle';
    return this.execute();
  }

  then<TResult1 = SupabaseResult, TResult2 = never>(
    onfulfilled?:
      | ((value: SupabaseResult) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private execute(): Promise<SupabaseResult> {
    return this.controller.execute(this.operation);
  }
}

export function mockSupabase(options: { resolver?: Resolver } = {}) {
  const operations: SupabaseOperation[] = [];
  const queued: QueuedResponse[] = [];
  let resolver = options.resolver;

  function nextResponse(operation: SupabaseOperation): SupabaseResult {
    const index = queued.findIndex((entry) => {
      if (!entry.match) return true;
      return Object.entries(entry.match).every(
        ([key, value]) => operation[key as keyof typeof entry.match] === value,
      );
    });

    if (index >= 0) {
      const [entry] = queued.splice(index, 1);
      return typeof entry.response === 'function'
        ? entry.response(operation)
        : entry.response;
    }

    return { data: null, error: null, count: null };
  }

  const client = {
    from(table: string) {
      return new MockSupabaseBuilder(api, {
        table,
        action: 'select',
        columns: '*',
        filters: [],
        orders: [],
        expects: 'many',
      });
    },
  };

  const api = {
    client,
    operations,
    queueResponse(entry: QueuedResponse) {
      queued.push(entry);
    },
    setResolver(nextResolver: Resolver) {
      resolver = nextResolver;
    },
    reset() {
      operations.length = 0;
      queued.length = 0;
      resolver = options.resolver;
    },
    getLastOperation(table?: string) {
      const items = table
        ? operations.filter((operation) => operation.table === table)
        : operations;
      return items[items.length - 1];
    },
    async execute(operation: SupabaseOperation): Promise<SupabaseResult> {
      const snapshot: SupabaseOperation = {
        ...operation,
        filters: [...operation.filters],
        orders: [...operation.orders],
      };
      operations.push(snapshot);

      if (resolver) {
        return resolver(snapshot, operations.length - 1);
      }

      return nextResponse(snapshot);
    },
  };

  return api;
}

