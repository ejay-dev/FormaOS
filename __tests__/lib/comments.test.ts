/**
 * Tests for Comments & Mentions System
 */

function createBuilder(
  result: { data?: any; error?: any; count?: number } = {
    data: null,
    error: null,
  },
) {
  const b: Record<string, any> = {};
  [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'is',
    'ilike',
    'gte',
    'contains',
    'order',
    'limit',
    'single',
    'maybeSingle',
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

jest.mock('@/lib/audit-trail', () => ({
  logActivity: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/realtime', () => ({
  sendNotification: jest.fn().mockResolvedValue(undefined),
}));

import {
  createComment,
  getComments,
  updateComment,
  deleteComment,
  addReaction,
  removeReaction,
  getCommentCount,
  getUserRecentComments,
  getMentionedComments,
  searchComments,
} from '@/lib/comments';
import { logActivity } from '@/lib/audit-trail';

describe('createComment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getClient().from.mockImplementation(() => createBuilder());
  });

  it('creates a comment and returns it', async () => {
    const commentData = {
      id: 'c1',
      content: 'Hello world',
      user_id: 'u1',
      profiles: { full_name: 'Test User', email: 'test@test.com' },
    };
    getClient().from.mockImplementation((table: string) => {
      if (table === 'team_members')
        return createBuilder({ data: [], error: null });
      return createBuilder({ data: commentData, error: null });
    });
    const result = await createComment('org-1', 'u1', {
      entityType: 'task',
      entityId: 'task-1',
      content: 'Hello world',
    });
    expect(result.id).toBe('c1');
    expect(getClient().from).toHaveBeenCalledWith('comments');
  });

  it('throws on insert error', async () => {
    getClient().from.mockImplementation((table: string) => {
      if (table === 'team_members')
        return createBuilder({ data: [], error: null });
      return createBuilder({ data: null, error: { message: 'insert failed' } });
    });
    await expect(
      createComment('org-1', 'u1', {
        entityType: 'task',
        entityId: 't1',
        content: 'test',
      }),
    ).rejects.toThrow('Failed to create comment');
  });
});

describe('getComments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getClient().from.mockImplementation(() => createBuilder());
  });

  it('returns empty array on error', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'fail' } }),
    );
    const result = await getComments('org-1', 'task', 'task-1');
    expect(result).toEqual([]);
  });

  it('returns comments with replies', async () => {
    const comment = {
      id: 'c1',
      content: 'Test',
      profiles: { full_name: 'Alice' },
      comment_reactions: [],
    };
    let callCount = 0;
    getClient().from.mockImplementation(() => {
      callCount++;
      if (callCount === 1)
        return createBuilder({ data: [comment], error: null });
      return createBuilder({ data: [], error: null });
    });
    const result = await getComments('org-1', 'task', 'task-1');
    expect(result).toHaveLength(1);
    expect(result[0].user).toEqual({ full_name: 'Alice' });
  });
});

describe('updateComment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getClient().from.mockImplementation(() => createBuilder());
  });

  it('throws if user does not own comment', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: { user_id: 'other-user', organization_id: 'org-1' },
        error: null,
      }),
    );
    await expect(updateComment('c1', 'u1', 'new content')).rejects.toThrow(
      'Unauthorized to edit',
    );
  });

  it('updates comment when user is owner', async () => {
    let callCount = 0;
    getClient().from.mockImplementation((table: string) => {
      if (table === 'team_members')
        return createBuilder({ data: [], error: null });
      callCount++;
      if (callCount === 1)
        return createBuilder({
          data: { user_id: 'u1', organization_id: 'org-1' },
          error: null,
        });
      return createBuilder({
        data: { id: 'c1', content: 'updated', profiles: { full_name: 'User' } },
        error: null,
      });
    });
    const result = await updateComment('c1', 'u1', 'updated');
    expect(result.edited).toBe(true);
  });
});

describe('deleteComment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws if user does not own comment', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: { user_id: 'other', organization_id: 'org-1' },
        error: null,
      }),
    );
    await expect(deleteComment('c1', 'u1')).rejects.toThrow(
      'Unauthorized to delete',
    );
  });

  it('deletes comment and logs activity', async () => {
    let callCount = 0;
    getClient().from.mockImplementation(() => {
      callCount++;
      if (callCount === 1)
        return createBuilder({
          data: { user_id: 'u1', organization_id: 'org-1' },
          error: null,
        });
      return createBuilder({ error: null });
    });
    await deleteComment('c1', 'u1');
    expect(logActivity).toHaveBeenCalledWith(
      'org-1',
      'u1',
      'delete',
      'task',
      expect.any(Object),
    );
  });
});

describe('addReaction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws if already reacted', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: { id: 'r1' }, error: null }),
    );
    await expect(addReaction('c1', 'u1', 'thumbsup')).rejects.toThrow(
      'Already reacted',
    );
  });

  it('adds reaction', async () => {
    let callCount = 0;
    getClient().from.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return createBuilder({ data: null, error: null });
      return createBuilder({
        data: { id: 'r1', comment_id: 'c1', user_id: 'u1', emoji: 'thumbsup' },
        error: null,
      });
    });
    const result = await addReaction('c1', 'u1', 'thumbsup');
    expect(result.emoji).toBe('thumbsup');
  });
});

describe('removeReaction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('removes reaction', async () => {
    getClient().from.mockImplementation(() => createBuilder({ error: null }));
    await removeReaction('r1', 'u1');
    expect(getClient().from).toHaveBeenCalledWith('comment_reactions');
  });

  it('throws on error', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ error: { message: 'fail' } }),
    );
    await expect(removeReaction('r1', 'u1')).rejects.toThrow(
      'Failed to remove reaction',
    );
  });
});

describe('getCommentCount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns count', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ count: 5, error: null }),
    );
    const result = await getCommentCount('task', 'task-1');
    expect(result).toBe(5);
  });

  it('returns 0 on error', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ count: null, error: { message: 'fail' } } as any),
    );
    const result = await getCommentCount('task', 'task-1');
    expect(result).toBe(0);
  });
});

describe('getUserRecentComments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns recent comments', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: [{ id: 'c1', content: 'test', profiles: { full_name: 'User' } }],
        error: null,
      }),
    );
    const result = await getUserRecentComments('u1');
    expect(result).toHaveLength(1);
    expect(result[0].user).toEqual({ full_name: 'User' });
  });

  it('returns empty on error', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({ data: null, error: { message: 'fail' } }),
    );
    const result = await getUserRecentComments('u1');
    expect(result).toEqual([]);
  });
});

describe('getMentionedComments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns mentioned comments', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: [{ id: 'c1', profiles: { full_name: 'Author' } }],
        error: null,
      }),
    );
    const result = await getMentionedComments('u1');
    expect(result).toHaveLength(1);
  });
});

describe('searchComments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('searches with query string', async () => {
    getClient().from.mockImplementation(() =>
      createBuilder({
        data: [
          { id: 'c1', content: 'matching', profiles: { full_name: 'User' } },
        ],
        error: null,
      }),
    );
    const result = await searchComments('org-1', 'matching');
    expect(result).toHaveLength(1);
  });
});
