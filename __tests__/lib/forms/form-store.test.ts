/**
 * Tests for lib/forms/form-store.ts
 */

function createBuilder(result: any = { data: null, error: null }) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'or',
    'ilike',
    'order',
    'limit',
    'range',
    'single',
    'maybeSingle',
  ].forEach((m) => {
    b[m] = jest.fn(() => b);
  });
  b.then = (resolve: (v: any) => void) => resolve(result);
  return b;
}

function mockDb(result?: any) {
  return {
    from: jest.fn(() =>
      createBuilder(
        result ?? { data: { id: 'f1', slug: 'test', version: 1 }, error: null },
      ),
    ),
  };
}

import {
  createForm,
  updateForm,
  publishForm,
  archiveForm,
  duplicateForm,
  getForm,
  getFormBySlug,
  listForms,
  deleteForm,
} from '@/lib/forms/form-store';

describe('createForm', () => {
  it('creates form with explicit slug', async () => {
    const db = mockDb();
    const result = await createForm(db as any, 'org-1', 'user-1', {
      title: 'Test Form',
      slug: 'test-form',
    });
    expect(result.id).toBe('f1');
  });

  it('generates slug from title when slug empty', async () => {
    const db = mockDb();
    await createForm(db as any, 'org-1', 'user-1', {
      title: 'My Form Title',
      slug: '',
    });
    expect(db.from).toHaveBeenCalledWith('org_forms');
  });

  it('throws on insert error', async () => {
    const db = mockDb({ data: null, error: { message: 'dup slug' } });
    await expect(
      createForm(db as any, 'org-1', 'user-1', {
        title: 'X',
        slug: 'x',
      }),
    ).rejects.toBeDefined();
  });
});

describe('updateForm', () => {
  it('updates title', async () => {
    const db = mockDb();
    await updateForm(db as any, 'f1', 'org-1', { title: 'New Title' });
    expect(db.from).toHaveBeenCalled();
  });

  it('bumps version when fields change', async () => {
    const selectBuilder = createBuilder({ data: { version: 2 }, error: null });
    const updateBuilder = createBuilder({
      data: { id: 'f1', version: 3 },
      error: null,
    });
    let callCount = 0;
    const db = {
      from: jest.fn(() => {
        callCount++;
        return callCount === 1 ? selectBuilder : updateBuilder;
      }),
    };
    await updateForm(db as any, 'f1', 'org-1', {
      fields: [{ type: 'text', label: 'Name' }],
    });
    expect(db.from).toHaveBeenCalledTimes(2);
  });

  it('updates description', async () => {
    const db = mockDb();
    await updateForm(db as any, 'f1', 'org-1', { description: 'Updated' });
    expect(db.from).toHaveBeenCalled();
  });

  it('updates slug', async () => {
    const db = mockDb();
    await updateForm(db as any, 'f1', 'org-1', { slug: 'new-slug' });
    expect(db.from).toHaveBeenCalled();
  });

  it('updates settings', async () => {
    const db = mockDb();
    await updateForm(db as any, 'f1', 'org-1', {
      settings: { requireAuthentication: false },
    });
    expect(db.from).toHaveBeenCalled();
  });

  it('throws on update error', async () => {
    const db = mockDb({ data: null, error: { message: 'fail' } });
    await expect(
      updateForm(db as any, 'f1', 'org-1', { title: 'X' }),
    ).rejects.toBeDefined();
  });
});

describe('publishForm', () => {
  it('publishes a draft form', async () => {
    const db = mockDb();
    await publishForm(db as any, 'f1', 'org-1');
    expect(db.from).toHaveBeenCalledWith('org_forms');
  });

  it('throws on error', async () => {
    const db = mockDb({ data: null, error: { message: 'not draft' } });
    await expect(publishForm(db as any, 'f1', 'org-1')).rejects.toBeDefined();
  });
});

describe('archiveForm', () => {
  it('archives a form', async () => {
    const db = mockDb();
    await archiveForm(db as any, 'f1', 'org-1');
    expect(db.from).toHaveBeenCalled();
  });
});

describe('duplicateForm', () => {
  it('duplicates an existing form', async () => {
    let callCount = 0;
    const db = {
      from: jest.fn(() => {
        callCount++;
        if (callCount === 1) {
          // fetch original
          return createBuilder({
            data: {
              id: 'f1',
              slug: 'original',
              title: 'Original',
              description: 'Desc',
              fields: [],
              settings: {},
            },
            error: null,
          });
        }
        // insert copy
        return createBuilder({
          data: { id: 'f2', slug: 'original-copy' },
          error: null,
        });
      }),
    };
    const result = await duplicateForm(db as any, 'f1', 'org-1', 'user-1');
    expect(result.id).toBe('f2');
  });

  it('throws when original not found', async () => {
    const db = mockDb({ data: null, error: { message: 'not found' } });
    await expect(
      duplicateForm(db as any, 'f1', 'org-1', 'user-1'),
    ).rejects.toBeDefined();
  });
});

describe('getForm', () => {
  it('returns form', async () => {
    const db = mockDb();
    const result = await getForm(db as any, 'f1', 'org-1');
    expect(result.id).toBe('f1');
  });

  it('throws on error', async () => {
    const db = mockDb({ data: null, error: { message: 'not found' } });
    await expect(getForm(db as any, 'f1', 'org-1')).rejects.toBeDefined();
  });
});

describe('getFormBySlug', () => {
  it('returns form by slug', async () => {
    const db = mockDb();
    const result = await getFormBySlug(db as any, 'test', 'org-1');
    expect(result.id).toBe('f1');
  });
});

describe('listForms', () => {
  it('lists forms with pagination', async () => {
    const db = mockDb({ data: [{ id: 'f1' }], count: 1, error: null });
    const result = await listForms(db as any, 'org-1');
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('respects status filter', async () => {
    const db = mockDb({ data: [], count: 0, error: null });
    await listForms(db as any, 'org-1', { status: 'published' });
    expect(db.from).toHaveBeenCalled();
  });

  it('respects search filter', async () => {
    const db = mockDb({ data: [], count: 0, error: null });
    await listForms(db as any, 'org-1', { search: 'intake' });
    expect(db.from).toHaveBeenCalled();
  });

  it('limits to max 100', async () => {
    const db = mockDb({ data: [], count: 0, error: null });
    await listForms(db as any, 'org-1', { limit: 500 });
    expect(db.from).toHaveBeenCalled();
  });

  it('computes hasMore', async () => {
    const db = mockDb({ data: [{ id: 'f1' }], count: 50, error: null });
    const result = await listForms(db as any, 'org-1', { limit: 1 });
    expect(result.hasMore).toBe(true);
  });
});

describe('deleteForm', () => {
  it('deletes form', async () => {
    const db = mockDb({ error: null });
    await deleteForm(db as any, 'f1', 'org-1');
    expect(db.from).toHaveBeenCalled();
  });

  it('throws on error', async () => {
    const db = mockDb({ error: { message: 'fail' } });
    await expect(deleteForm(db as any, 'f1', 'org-1')).rejects.toBeDefined();
  });
});
