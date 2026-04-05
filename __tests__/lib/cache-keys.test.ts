/**
 * Extended tests for lib/cache.ts — CacheKeys generators
 */

// Mock redis client to avoid ESM uncrypto import issue
jest.mock('@/lib/redis/client', () => ({
  getRedisClient: jest.fn(),
  isRedisConfigured: jest.fn(() => false),
}));

import { CacheKeys } from '@/lib/cache';

describe('CacheKeys generators', () => {
  it('ORG_OVERVIEW uses org prefix', () => {
    expect(CacheKeys.ORG_OVERVIEW('org1')).toBe('org:org1:overview');
  });

  it('ORG_MEMBERS default page 0', () => {
    expect(CacheKeys.ORG_MEMBERS('org1')).toBe('org:org1:members:0');
  });

  it('ORG_MEMBERS custom page', () => {
    expect(CacheKeys.ORG_MEMBERS('org1', 5)).toBe('org:org1:members:5');
  });

  it('ORG_SETTINGS', () => {
    expect(CacheKeys.ORG_SETTINGS('abc')).toBe('org:abc:settings');
  });

  it('USER_PROFILE', () => {
    expect(CacheKeys.USER_PROFILE('u1')).toBe('user:u1:profile');
  });

  it('USER_COMPLIANCE', () => {
    expect(CacheKeys.USER_COMPLIANCE('u1')).toBe('user:u1:compliance');
  });

  it('USER_TASKS', () => {
    expect(CacheKeys.USER_TASKS('u1')).toBe('user:u1:tasks');
  });

  it('USER_PERMISSIONS', () => {
    expect(CacheKeys.USER_PERMISSIONS('u1')).toBe('user:u1:permissions');
  });

  it('ANALYTICS_COMPLIANCE', () => {
    expect(CacheKeys.ANALYTICS_COMPLIANCE('org1')).toBe(
      'analytics:org1:compliance',
    );
  });

  it('ANALYTICS_TEAM', () => {
    expect(CacheKeys.ANALYTICS_TEAM('org1')).toBe('analytics:org1:team');
  });

  it('ANALYTICS_TREND', () => {
    expect(CacheKeys.ANALYTICS_TREND('org1')).toBe('analytics:org1:trend');
  });

  it('CERTIFICATES_LIST', () => {
    expect(CacheKeys.CERTIFICATES_LIST('org1')).toBe('certs:org1:list');
  });

  it('CERTIFICATE_DETAIL', () => {
    expect(CacheKeys.CERTIFICATE_DETAIL('c1')).toBe('cert:c1');
  });

  it('SEARCH_RESULTS with query', () => {
    expect(CacheKeys.SEARCH_RESULTS('org1', 'hello')).toBe('search:org1:hello');
  });

  it('FRAMEWORKS_LIST', () => {
    expect(CacheKeys.FRAMEWORKS_LIST('org1')).toBe('frameworks:org1:list');
  });

  it('TASKS_OVERVIEW', () => {
    expect(CacheKeys.TASKS_OVERVIEW('org1')).toBe('tasks:org1:overview');
  });

  it('REPORTS_LIST', () => {
    expect(CacheKeys.REPORTS_LIST('org1')).toBe('reports:org1:list');
  });
});
