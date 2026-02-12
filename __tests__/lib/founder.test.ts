/** @jest-environment node */

/**
 * Unit tests for lib/utils/founder.ts
 *
 * The isFounder function checks process.env.FOUNDER_EMAILS and
 * process.env.FOUNDER_USER_IDS to determine founder status.
 */

import { isFounder } from '@/lib/utils/founder';

describe('isFounder', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Restore a clean copy of process.env before each test
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.FOUNDER_EMAILS;
    delete process.env.FOUNDER_USER_IDS;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns true when email matches FOUNDER_EMAILS', () => {
    process.env.FOUNDER_EMAILS = 'alice@example.com';
    expect(isFounder('alice@example.com', '')).toBe(true);
  });

  it('returns true when userId matches FOUNDER_USER_IDS', () => {
    process.env.FOUNDER_USER_IDS = 'user-abc-123';
    expect(isFounder(undefined, 'user-abc-123')).toBe(true);
  });

  it('returns false when neither email nor userId matches', () => {
    process.env.FOUNDER_EMAILS = 'founder@company.com';
    process.env.FOUNDER_USER_IDS = 'founder-id';
    expect(isFounder('random@other.com', 'random-id')).toBe(false);
  });

  it('returns false with empty strings for both params', () => {
    process.env.FOUNDER_EMAILS = 'founder@company.com';
    expect(isFounder('', '')).toBe(false);
  });

  it('returns false when both email and userId are undefined/empty', () => {
    expect(isFounder(undefined, '')).toBe(false);
  });

  it('performs case-insensitive email matching', () => {
    process.env.FOUNDER_EMAILS = 'Founder@Company.COM';
    expect(isFounder('founder@company.com', '')).toBe(true);
    expect(isFounder('FOUNDER@COMPANY.COM', '')).toBe(true);
  });

  it('parses comma-separated FOUNDER_EMAILS correctly', () => {
    process.env.FOUNDER_EMAILS = 'alice@co.com, bob@co.com, carol@co.com';
    expect(isFounder('bob@co.com', '')).toBe(true);
    expect(isFounder('carol@co.com', '')).toBe(true);
    expect(isFounder('dave@co.com', '')).toBe(false);
  });

  it('parses comma-separated FOUNDER_USER_IDS correctly', () => {
    process.env.FOUNDER_USER_IDS = 'id-1, id-2, id-3';
    expect(isFounder(undefined, 'id-2')).toBe(true);
    expect(isFounder(undefined, 'id-4')).toBe(false);
  });

  it('returns false when env variables are not set at all', () => {
    // Neither FOUNDER_EMAILS nor FOUNDER_USER_IDS is set
    expect(isFounder('someone@test.com', 'some-id')).toBe(false);
  });

  it('trims whitespace from email and userId before comparison', () => {
    process.env.FOUNDER_EMAILS = '  spaced@test.com  ';
    process.env.FOUNDER_USER_IDS = '  spaced-id  ';
    expect(isFounder('spaced@test.com', '')).toBe(true);
    expect(isFounder(undefined, 'spaced-id')).toBe(true);
  });
});
