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

/**
 * Keeps every builder handed out by `.from()` so tests can assert the exact
 * filters/limits the store applied, not merely that a query happened.
 */
function mockDb(result?: any) {
  const builders: Record<string, any>[] = [];
  return {
    builders,
    from: jest.fn(() => {
      const builder = createBuilder(
        result ?? { data: { id: 'f1', slug: 'test', version: 1 }, error: null },
      );
      builders.push(builder);
      return builder;
    }),
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
    expect(db.builders[0].insert).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: 'org-1',
        title: 'My Form Title',
        slug: 'my-form-title',
        created_by: 'user-1',
      }),
    );
  });

  it('stamps the default settings when none are supplied', async () => {
    const db = mockDb();
    await createForm(db as any, 'org-1', 'user-1', {
      title: 'Defaults',
      slug: 'defaults',
    });
    expect(db.builders[0].insert).toHaveBeenCalledWith(
      expect.objectContaining({
        fields: [],
        settings: expect.objectContaining({
          // Forms are authenticated-only by default; flipping this to false
          // would silently open every new form to the public.
          requireAuthentication: true,
          allowMultipleSubmissions: false,
        }),
      }),
    );
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
  it('updates title and scopes the update to the form and org', async () => {
    const db = mockDb();
    await updateForm(db as any, 'f1', 'org-1', { title: 'New Title' });
    expect(db.builders[0].update).toHaveBeenCalledWith({ title: 'New Title' });
    expect(db.builders[0].eq).toHaveBeenCalledWith('id', 'f1');
    // Dropping this org filter is a cross-tenant write.
    expect(db.builders[0].eq).toHaveBeenCalledWith('org_id', 'org-1');
  });

  it('leaves untouched columns out of the update payload', async () => {
    const db = mockDb();
    await updateForm(db as any, 'f1', 'org-1', { title: 'Only Title' });
    const payload = db.builders[0].update.mock.calls[0][0];
    expect(Object.keys(payload)).toEqual(['title']);
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
    const fields = [{ type: 'text', label: 'Name' }];
    await updateForm(db as any, 'f1', 'org-1', { fields });
    expect(db.from).toHaveBeenCalledTimes(2);
    expect(selectBuilder.select).toHaveBeenCalledWith('version');
    expect(updateBuilder.update).toHaveBeenCalledWith({ fields, version: 3 });
  });

  it('starts version at 1 when the stored row has no version', async () => {
    const selectBuilder = createBuilder({ data: { version: null }, error: null });
    const updateBuilder = createBuilder({ data: { id: 'f1' }, error: null });
    let callCount = 0;
    const db = {
      from: jest.fn(() => (++callCount === 1 ? selectBuilder : updateBuilder)),
    };
    await updateForm(db as any, 'f1', 'org-1', { fields: [] });
    expect(updateBuilder.update).toHaveBeenCalledWith({
      fields: [],
      version: 1,
    });
  });

  it('updates description', async () => {
    const db = mockDb();
    await updateForm(db as any, 'f1', 'org-1', { description: 'Updated' });
    expect(db.builders[0].update).toHaveBeenCalledWith({
      description: 'Updated',
    });
  });

  it('updates slug', async () => {
    const db = mockDb();
    await updateForm(db as any, 'f1', 'org-1', { slug: 'new-slug' });
    expect(db.builders[0].update).toHaveBeenCalledWith({ slug: 'new-slug' });
  });

  it('updates settings without bumping version', async () => {
    const db = mockDb();
    await updateForm(db as any, 'f1', 'org-1', {
      settings: { requireAuthentication: false },
    });
    expect(db.builders[0].update).toHaveBeenCalledWith({
      settings: { requireAuthentication: false },
    });
    // Only the update round-trip — no version read.
    expect(db.from).toHaveBeenCalledTimes(1);
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
    expect(db.builders[0].update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'published',
        published_at: expect.any(String),
      }),
    );
    // Only a draft may be published — losing this guard lets an archived
    // form be silently resurrected.
    expect(db.builders[0].eq).toHaveBeenCalledWith('status', 'draft');
    expect(db.builders[0].eq).toHaveBeenCalledWith('org_id', 'org-1');
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
    expect(db.builders[0].update).toHaveBeenCalledWith({ status: 'archived' });
    expect(db.builders[0].eq).toHaveBeenCalledWith('id', 'f1');
    expect(db.builders[0].eq).toHaveBeenCalledWith('org_id', 'org-1');
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

  it('always scopes the list to the caller org', async () => {
    const db = mockDb({ data: [], count: 0, error: null });
    await listForms(db as any, 'org-1');
    expect(db.builders[0].eq).toHaveBeenCalledWith('org_id', 'org-1');
  });

  it('respects status filter', async () => {
    const db = mockDb({ data: [], count: 0, error: null });
    await listForms(db as any, 'org-1', { status: 'published' });
    expect(db.builders[0].eq).toHaveBeenCalledWith('status', 'published');
  });

  it('omits the status filter when none is requested', async () => {
    const db = mockDb({ data: [], count: 0, error: null });
    await listForms(db as any, 'org-1');
    const statusFilters = db.builders[0].eq.mock.calls.filter(
      (call: unknown[]) => call[0] === 'status',
    );
    expect(statusFilters).toHaveLength(0);
  });

  it('respects search filter', async () => {
    const db = mockDb({ data: [], count: 0, error: null });
    await listForms(db as any, 'org-1', { search: 'intake' });
    expect(db.builders[0].or).toHaveBeenCalledWith(
      'title.ilike.%intake%,description.ilike.%intake%',
    );
  });

  it('drops a search term that sanitizes to nothing instead of issuing a bare or()', async () => {
    const db = mockDb({ data: [], count: 0, error: null });
    await listForms(db as any, 'org-1', { search: '%,*' });
    expect(db.builders[0].or).not.toHaveBeenCalled();
  });

  it('limits to max 100', async () => {
    const db = mockDb({ data: [], count: 0, error: null });
    await listForms(db as any, 'org-1', { limit: 500 });
    // Math.min(500, 100) -> range(offset, offset + limit - 1). Losing the
    // clamp turns this hot list endpoint into an unbounded query.
    expect(db.builders[0].range).toHaveBeenCalledWith(0, 99);
  });

  it('defaults to a page of 25 and honours the cursor', async () => {
    const db = mockDb({ data: [], count: 0, error: null });
    await listForms(db as any, 'org-1');
    expect(db.builders[0].range).toHaveBeenCalledWith(0, 24);

    const paged = mockDb({ data: [], count: 0, error: null });
    await listForms(paged as any, 'org-1', { cursor: 50, limit: 10 });
    expect(paged.builders[0].range).toHaveBeenCalledWith(50, 59);
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
    expect(db.builders[0].delete).toHaveBeenCalled();
    expect(db.builders[0].eq).toHaveBeenCalledWith('id', 'f1');
    // A delete without the org filter can wipe another tenant's row on an
    // id collision.
    expect(db.builders[0].eq).toHaveBeenCalledWith('org_id', 'org-1');
  });

  it('throws on error', async () => {
    const db = mockDb({ error: { message: 'fail' } });
    await expect(deleteForm(db as any, 'f1', 'org-1')).rejects.toBeDefined();
  });
});
