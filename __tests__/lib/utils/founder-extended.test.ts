/**
 * Tests for lib/utils/founder.ts
 */

describe('isFounder', () => {
  const origEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...origEnv };
  });

  afterAll(() => {
    process.env = origEnv;
  });

  function loadModule() {
    return require('@/lib/utils/founder');
  }

  it('returns false when no email and no userId', () => {
    const { isFounder } = loadModule();
    expect(isFounder(undefined, '')).toBe(false);
  });

  it('returns true when email matches FOUNDER_EMAILS', () => {
    process.env.FOUNDER_EMAILS = 'founder@example.com,admin@test.com';
    const { isFounder } = loadModule();
    expect(isFounder('founder@example.com', 'any-id')).toBe(true);
  });

  it('email match is case-insensitive', () => {
    process.env.FOUNDER_EMAILS = 'Founder@Example.Com';
    const { isFounder } = loadModule();
    expect(isFounder('founder@example.com', 'id')).toBe(true);
  });

  it('returns true when userId matches FOUNDER_USER_IDS', () => {
    process.env.FOUNDER_USER_IDS = 'user-001,user-002';
    const { isFounder } = loadModule();
    expect(isFounder('not-founder@x.com', 'user-001')).toBe(true);
  });

  it('returns false when neither matches', () => {
    process.env.FOUNDER_EMAILS = 'real@founder.com';
    process.env.FOUNDER_USER_IDS = 'founder-id';
    const { isFounder } = loadModule();
    expect(isFounder('random@user.com', 'random-id')).toBe(false);
  });

  it('handles empty FOUNDER_EMAILS', () => {
    process.env.FOUNDER_EMAILS = '';
    const { isFounder } = loadModule();
    expect(isFounder('test@test.com', 'id')).toBe(false);
  });

  it('handles missing env vars gracefully', () => {
    delete process.env.FOUNDER_EMAILS;
    delete process.env.FOUNDER_USER_IDS;
    const { isFounder } = loadModule();
    expect(isFounder('test@test.com', 'test-id')).toBe(false);
  });

  it('trims whitespace around emails', () => {
    process.env.FOUNDER_EMAILS = ' founder@test.com , admin@test.com ';
    const { isFounder } = loadModule();
    expect(isFounder('founder@test.com', '')).toBe(true);
  });

  it('returns false for just whitespace email', () => {
    const { isFounder } = loadModule();
    expect(isFounder('   ', '')).toBe(false);
  });
});
