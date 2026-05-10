/**
 * Tests for the legacy control-code → standard-code mapping that drives
 * Phase 1.5 of the per-control evaluator workstream.
 *
 * Two layers:
 *   1. Static integrity — every legacy code from framework-packs/{soc2,iso27001}.json
 *      has a mapping; every target code in the mapping exists in the new
 *      framework-packs/{soc2-tsc,iso27001-2022}.json packs.
 *   2. Runtime behaviour — applyLegacyControlMapping handles 1:1, 1:N, and
 *      deprecated cases correctly and is idempotent.
 */

import legacySoc2Pack from '@/framework-packs/soc2.json';
import legacyIsoPack from '@/framework-packs/iso27001.json';
import newSoc2Pack from '@/framework-packs/soc2-tsc.json';
import newIsoPack from '@/framework-packs/iso27001-2022.json';
import {
  ALL_LEGACY_MAPPINGS,
  LEGACY_ISO_MAPPINGS,
  LEGACY_SOC2_MAPPINGS,
  applyLegacyControlMapping,
  getMappingForLegacyCode,
  isLegacyControlCode,
} from '@/lib/compliance/legacy-control-mapping';

describe('legacy-control-mapping — static integrity', () => {
  const legacySoc2Codes = legacySoc2Pack.controls.map((c) => c.control_code);
  const legacyIsoCodes = legacyIsoPack.controls.map((c) => c.control_code);
  const newSoc2Codes = new Set(newSoc2Pack.controls.map((c) => c.control_code));
  const newIsoCodes = new Set(newIsoPack.controls.map((c) => c.control_code));

  it('every legacy SOC 2 control has exactly one mapping entry', () => {
    expect(LEGACY_SOC2_MAPPINGS.length).toBe(legacySoc2Codes.length);
    for (const code of legacySoc2Codes) {
      expect(getMappingForLegacyCode(code)).not.toBeNull();
    }
  });

  it('every legacy ISO 27001 control has exactly one mapping entry', () => {
    expect(LEGACY_ISO_MAPPINGS.length).toBe(legacyIsoCodes.length);
    for (const code of legacyIsoCodes) {
      expect(getMappingForLegacyCode(code)).not.toBeNull();
    }
  });

  it('every SOC 2 mapping target is a real CC/A/C/PI/P code in the TSC pack', () => {
    for (const m of LEGACY_SOC2_MAPPINGS) {
      if (m.deprecated) continue;
      expect(m.newCodes.length).toBeGreaterThan(0);
      for (const code of m.newCodes) {
        expect(newSoc2Codes.has(code)).toBe(true);
      }
    }
  });

  it('every ISO mapping target is a real A.x.y code in the 2022 pack (or deprecated with no targets)', () => {
    for (const m of LEGACY_ISO_MAPPINGS) {
      if (m.deprecated) {
        expect(m.newCodes).toEqual([]);
        continue;
      }
      expect(m.newCodes.length).toBeGreaterThan(0);
      for (const code of m.newCodes) {
        expect(newIsoCodes.has(code)).toBe(true);
      }
    }
  });

  it('every mapping has a non-empty rationale', () => {
    for (const m of ALL_LEGACY_MAPPINGS) {
      expect(m.rationale.length).toBeGreaterThan(20);
    }
  });

  it('isLegacyControlCode discriminates legacy vs standard codes', () => {
    expect(isLegacyControlCode('SOC2-S1')).toBe(true);
    expect(isLegacyControlCode('ISO-A.5.1')).toBe(true);
    expect(isLegacyControlCode('CC6.1')).toBe(false);
    expect(isLegacyControlCode('A.5.1')).toBe(false);
    expect(isLegacyControlCode(null)).toBe(false);
    expect(isLegacyControlCode(undefined)).toBe(false);
    expect(isLegacyControlCode('')).toBe(false);
  });
});

type MockRow = {
  id: string;
  organization_id: string;
  control_type: string;
  control_key: string;
  required: boolean | null;
  status: string;
  last_evaluated_at: string | null;
  details: Record<string, unknown> | null;
  framework_id: string | null;
};

type MockClient = {
  from: jest.Mock;
  __rows: MockRow[];
  __frameworks: { id: string; slug: string }[];
  __updates: Array<{ id: string; patch: Record<string, unknown> }>;
  __inserts: MockRow[];
  __deprecations: string[];
};

function makeMockClient(rows: MockRow[]): MockClient {
  const frameworks = [
    { id: 'fw-soc2-tsc', slug: 'soc2-tsc' },
    { id: 'fw-iso-2022', slug: 'iso27001-2022' },
  ];
  const client: MockClient = {
    from: jest.fn(),
    __rows: rows,
    __frameworks: frameworks,
    __updates: [],
    __inserts: [],
    __deprecations: [],
  };

  client.from.mockImplementation((table: string) => {
    if (table === 'frameworks') {
      return {
        select: () => ({
          in: (_col: string, slugs: string[]) => ({
            then: (resolve: (v: any) => void) =>
              resolve({
                data: client.__frameworks.filter((f) => slugs.includes(f.slug)),
                error: null,
              }),
          }),
        }),
      };
    }
    if (table === 'org_control_evaluations') {
      return {
        select: () => ({
          in: (_col: string, codes: string[]) => ({
            then: (resolve: (v: any) => void) =>
              resolve({
                data: client.__rows.filter((r) => codes.includes(r.control_key)),
                error: null,
              }),
          }),
        }),
        update: (patch: Record<string, unknown>) => ({
          eq: (_col: string, id: string) => {
            client.__updates.push({ id, patch });
            if (patch.status === 'deprecated') {
              client.__deprecations.push(id);
            } else if (patch.control_key) {
              const row = client.__rows.find((r) => r.id === id);
              if (row) row.control_key = patch.control_key as string;
            }
            return Promise.resolve({ error: null });
          },
        }),
        insert: (newRow: Omit<MockRow, 'id'>) => {
          const inserted: MockRow = {
            ...newRow,
            id: `inserted-${client.__inserts.length + 1}`,
          };
          client.__inserts.push(inserted);
          return Promise.resolve({ error: null });
        },
      };
    }
    throw new Error(`Unexpected table: ${table}`);
  });

  return client;
}

describe('applyLegacyControlMapping — runtime behaviour', () => {
  it('updates a 1:1 SOC 2 row to the standard code', async () => {
    const client = makeMockClient([
      {
        id: 'r-1',
        organization_id: 'org-1',
        control_type: 'soc2',
        control_key: 'SOC2-PI1',
        required: true,
        status: 'satisfied',
        last_evaluated_at: '2026-04-01T00:00:00Z',
        details: { evidenceCount: 3 },
        framework_id: 'old-fw',
      },
    ]);
    const result = await applyLegacyControlMapping(client as any);
    expect(result.ok).toBe(true);
    expect(client.__updates).toHaveLength(1);
    expect(client.__updates[0].patch.control_key).toBe('CC8.1');
    expect(client.__updates[0].patch.framework_id).toBe('fw-soc2-tsc');
    expect(client.__inserts).toHaveLength(0);
  });

  it('splits a 1:N SOC 2 row into N standard codes', async () => {
    const client = makeMockClient([
      {
        id: 'r-2',
        organization_id: 'org-1',
        control_type: 'soc2',
        control_key: 'SOC2-S2',
        required: true,
        status: 'partial',
        last_evaluated_at: '2026-04-01T00:00:00Z',
        details: null,
        framework_id: 'old-fw',
      },
    ]);
    const result = await applyLegacyControlMapping(client as any);
    expect(result.ok).toBe(true);
    expect(client.__updates[0].patch.control_key).toBe('CC6.1');
    expect(client.__inserts).toHaveLength(2);
    expect(client.__inserts.map((r) => r.control_key).sort()).toEqual([
      'CC6.2',
      'CC6.3',
    ]);
    for (const insert of client.__inserts) {
      expect(insert.organization_id).toBe('org-1');
      expect(insert.status).toBe('partial');
      expect((insert.details as any).legacy_migration.isSplitClone).toBe(true);
    }
  });

  it('marks a deprecated ISO row as status=deprecated and records rationale', async () => {
    const client = makeMockClient([
      {
        id: 'r-3',
        organization_id: 'org-1',
        control_type: 'iso27001',
        control_key: 'ISO-A.6.1',
        required: true,
        status: 'satisfied',
        last_evaluated_at: '2026-04-01T00:00:00Z',
        details: null,
        framework_id: 'old-fw',
      },
    ]);
    const result = await applyLegacyControlMapping(client as any);
    expect(result.ok).toBe(true);
    expect(client.__deprecations).toEqual(['r-3']);
    const update = client.__updates[0];
    expect(update.patch.status).toBe('deprecated');
    expect((update.patch.details as any).legacy_migration.deprecated).toBe(
      true,
    );
  });

  it('is idempotent — re-running on already-migrated rows is a no-op', async () => {
    const client = makeMockClient([
      {
        id: 'r-4',
        organization_id: 'org-1',
        control_type: 'soc2',
        control_key: 'CC8.1', // already migrated
        required: true,
        status: 'satisfied',
        last_evaluated_at: '2026-04-01T00:00:00Z',
        details: null,
        framework_id: 'fw-soc2-tsc',
      },
    ]);
    const result = await applyLegacyControlMapping(client as any);
    expect(result.ok).toBe(true);
    expect(client.__updates).toHaveLength(0);
    expect(client.__inserts).toHaveLength(0);
  });

  it('reports an error when the new framework rows are missing', async () => {
    const client = makeMockClient([]);
    client.__frameworks = []; // simulate pre-load state
    const result = await applyLegacyControlMapping(client as any);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toMatch(
      /soc2-tsc|new framework row missing/i,
    );
  });
});
