/**
 * Tests for lib/invitations/validate-invitation.ts
 */

function createBuilder(result: any = { data: null, error: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'upsert',
    'eq',
    'neq',
    'in',
    'lt',
    'lte',
    'gt',
    'gte',
    'not',
    'is',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
    'filter',
    'match',
    'or',
    'contains',
    'textSearch',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

jest.mock('@/lib/supabase/server', () => {
  const c = { from: jest.fn(() => createBuilder()) };
  return {
    createSupabaseServerClient: jest.fn().mockResolvedValue(c),
    __client: c,
  };
});
function getClient() {
  return require('@/lib/supabase/server').__client;
}

import {
  validateInvitation,
  acceptInvitation,
  getInvitationStatus,
  createInvitationWithExpiry,
  revokeInvitation,
  INVITATION_EXPIRY_MS,
} from '@/lib/invitations/validate-invitation';

describe('invitations/validate-invitation', () => {
  beforeEach(() => jest.clearAllMocks());

  const futureDate = new Date(Date.now() + 86400000).toISOString();
  const pastDate = new Date(Date.now() - 86400000).toISOString();
  const validInvitation = {
    id: 'inv1',
    email: 'test@test.com',
    organization_id: 'org1',
    role: 'member',
    expires_at: futureDate,
    status: 'pending',
  };

  describe('INVITATION_EXPIRY_MS', () => {
    it('equals 7 days in milliseconds', () => {
      expect(INVITATION_EXPIRY_MS).toBe(7 * 24 * 60 * 60 * 1000);
    });
  });

  describe('validateInvitation', () => {
    it('returns valid invitation with org name', async () => {
      let callIdx = 0;
      getClient().from.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1)
          return createBuilder({ data: validInvitation, error: null });
        return createBuilder({ data: { name: 'TestOrg' }, error: null });
      });
      const result = await validateInvitation('tok123');
      expect(result.valid).toBe(true);
      expect(result.invitation?.organization_name).toBe('TestOrg');
    });

    it('returns invalid for missing invitation', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: null }),
      );
      const result = await validateInvitation('bad-tok');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('returns invalid for DB error', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: { message: 'fail' } }),
      );
      const result = await validateInvitation('tok');
      expect(result.valid).toBe(false);
    });

    it('returns invalid for accepted invitation', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({
          data: { ...validInvitation, status: 'accepted' },
          error: null,
        }),
      );
      const result = await validateInvitation('tok');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('already been accepted');
    });

    it('returns invalid for revoked invitation', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({
          data: { ...validInvitation, status: 'revoked' },
          error: null,
        }),
      );
      const result = await validateInvitation('tok');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('revoked');
    });

    it('returns invalid for expired invitation', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({
          data: { ...validInvitation, expires_at: pastDate },
          error: null,
        }),
      );
      const result = await validateInvitation('tok');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });
  });

  describe('acceptInvitation', () => {
    it('accepts valid invitation', async () => {
      let callIdx = 0;
      getClient().from.mockImplementation(() => {
        callIdx++;
        // validateInvitation queries: 1=invitation lookup, 2=org name
        // then acceptInvitation: 3=update status, 4=upsert member
        if (callIdx === 1)
          return createBuilder({ data: validInvitation, error: null });
        return createBuilder({ data: { name: 'Org' }, error: null });
      });
      const result = await acceptInvitation('tok123', 'u1');
      expect(result.success).toBe(true);
    });

    it('returns error for invalid invitation', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: null }),
      );
      const result = await acceptInvitation('bad-tok', 'u1');
      expect(result.success).toBe(false);
    });

    it('returns error on update failure', async () => {
      let callIdx = 0;
      getClient().from.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1)
          return createBuilder({ data: validInvitation, error: null });
        if (callIdx === 2)
          return createBuilder({ data: { name: 'Org' }, error: null });
        return createBuilder({ data: null, error: { message: 'update fail' } });
      });
      const result = await acceptInvitation('tok', 'u1');
      expect(result.success).toBe(false);
    });
  });

  describe('getInvitationStatus', () => {
    it('returns valid status with days remaining', async () => {
      let callIdx = 0;
      getClient().from.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1)
          return createBuilder({ data: validInvitation, error: null });
        return createBuilder({ data: { name: 'Org' }, error: null });
      });
      const result = await getInvitationStatus('tok');
      expect(result.status).toBe('valid');
      expect(result.days_remaining).toBeGreaterThanOrEqual(0);
    });

    it('returns expired status', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({
          data: { ...validInvitation, expires_at: pastDate },
          error: null,
        }),
      );
      const result = await getInvitationStatus('tok');
      expect(result.status).toBe('expired');
    });

    it('returns revoked status', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({
          data: { ...validInvitation, status: 'revoked' },
          error: null,
        }),
      );
      const result = await getInvitationStatus('tok');
      expect(result.status).toBe('revoked');
    });

    it('returns accepted status', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({
          data: { ...validInvitation, status: 'accepted' },
          error: null,
        }),
      );
      const result = await getInvitationStatus('tok');
      expect(result.status).toBe('accepted');
    });

    it('returns not_found status', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: null }),
      );
      const result = await getInvitationStatus('bad');
      expect(result.status).toBe('not_found');
    });
  });

  describe('createInvitationWithExpiry', () => {
    it('creates invitation and returns token', async () => {
      let callIdx = 0;
      getClient().from.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1) return createBuilder({ data: null, error: null }); // existing check
        return createBuilder({ data: { id: 'new-inv' }, error: null }); // insert
      });
      const result = await createInvitationWithExpiry(
        'org1',
        'new@test.com',
        'member',
        'u1',
      );
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
    });

    it('revokes existing pending invitation before creating new', async () => {
      let callIdx = 0;
      getClient().from.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1)
          return createBuilder({
            data: { id: 'old-inv', status: 'pending' },
            error: null,
          });
        return createBuilder({ data: { id: 'new-inv' }, error: null });
      });
      const result = await createInvitationWithExpiry(
        'org1',
        'test@test.com',
        'admin',
        'u1',
      );
      expect(result.success).toBe(true);
    });

    it('returns error on insert failure', async () => {
      let callIdx = 0;
      getClient().from.mockImplementation(() => {
        callIdx++;
        if (callIdx === 1) return createBuilder({ data: null, error: null });
        return createBuilder({ data: null, error: { message: 'dup' } });
      });
      const result = await createInvitationWithExpiry(
        'org1',
        'test@test.com',
        'member',
        'u1',
      );
      expect(result.success).toBe(false);
    });
  });

  describe('revokeInvitation', () => {
    it('revokes invitation successfully', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: null }),
      );
      const result = await revokeInvitation('inv1', 'org1', 'u1');
      expect(result.success).toBe(true);
    });

    it('returns error on DB failure', async () => {
      getClient().from.mockImplementation(() =>
        createBuilder({ data: null, error: { message: 'fail' } }),
      );
      const result = await revokeInvitation('inv1', 'org1', 'u1');
      expect(result.success).toBe(false);
    });
  });
});
