jest.mock('cheerio', () => ({
  load: jest.fn(() =>
    jest.fn(() => ({
      text: () => '',
      first: () => ({ text: () => '' }),
      attr: () => '',
    })),
  ),
}));

jest.mock('@node-saml/node-saml', () => ({
  SAML: jest.fn(),
  ValidateInResponseTo: { never: 'never' },
}));

jest.mock('@/lib/redis/client', () => ({
  getRedisClient: jest.fn(() => null),
  isRedisConfigured: jest.fn(() => false),
}));

import {
  isAllowedDomain,
  getSamlEmail,
  getSamlDisplayName,
  getSamlGroups,
  buildServiceProviderUrls,
} from '@/lib/sso/saml';

describe('isAllowedDomain', () => {
  it('returns true when allowedDomains is empty', () => {
    expect(isAllowedDomain('user@any.com', [])).toBe(true);
  });

  it('returns true when domain matches', () => {
    expect(isAllowedDomain('user@example.com', ['example.com'])).toBe(true);
  });

  it('is case-insensitive for domain matching', () => {
    expect(isAllowedDomain('user@EXAMPLE.COM', ['example.com'])).toBe(true);
    expect(isAllowedDomain('user@example.com', ['EXAMPLE.COM'])).toBe(true);
  });

  it('returns false when domain does not match', () => {
    expect(isAllowedDomain('user@other.com', ['example.com'])).toBe(false);
  });

  it('returns false when email has no domain', () => {
    expect(isAllowedDomain('noatsign', ['example.com'])).toBe(false);
  });

  it('supports multiple allowed domains', () => {
    const allowed = ['example.com', 'test.org'];
    expect(isAllowedDomain('a@example.com', allowed)).toBe(true);
    expect(isAllowedDomain('a@test.org', allowed)).toBe(true);
    expect(isAllowedDomain('a@other.com', allowed)).toBe(false);
  });
});

describe('getSamlEmail', () => {
  it('extracts email from profile.email', () => {
    expect(
      getSamlEmail({
        email: 'Test@Example.com',
        nameID: 'n',
        nameIDFormat: '',
      }),
    ).toBe('test@example.com');
  });

  it('falls back to profile.mail', () => {
    expect(
      getSamlEmail({
        mail: 'ALT@DOMAIN.COM',
        nameID: 'n',
        nameIDFormat: '',
      } as any),
    ).toBe('alt@domain.com');
  });

  it('falls back to OID attribute', () => {
    const profile = {
      'urn:oid:0.9.2342.19200300.100.1.3': 'oid@test.com',
      nameID: 'n',
      nameIDFormat: '',
    };
    expect(getSamlEmail(profile as any)).toBe('oid@test.com');
  });

  it('falls back to nameID', () => {
    expect(getSamlEmail({ nameID: 'name@test.com', nameIDFormat: '' })).toBe(
      'name@test.com',
    );
  });

  it('returns empty string for empty nameID values', () => {
    expect(getSamlEmail({ nameID: '' as any, nameIDFormat: '' })).toBe('');
  });
});

describe('getSamlDisplayName', () => {
  it('returns displayName if present', () => {
    expect(
      getSamlDisplayName({
        displayName: 'John Doe',
        nameID: 'x',
        nameIDFormat: '',
      } as any),
    ).toBe('John Doe');
  });

  it('builds from firstName + lastName', () => {
    expect(
      getSamlDisplayName({
        firstName: 'Jane',
        lastName: 'Doe',
        nameID: 'x',
        nameIDFormat: '',
      } as any),
    ).toBe('Jane Doe');
  });

  it('uses givenName / sn as fallback', () => {
    expect(
      getSamlDisplayName({
        givenName: 'Bob',
        sn: 'Smith',
        nameID: 'x',
        nameIDFormat: '',
      } as any),
    ).toBe('Bob Smith');
  });

  it('falls back to cn', () => {
    expect(
      getSamlDisplayName({
        cn: 'Common Name',
        nameID: 'x',
        nameIDFormat: '',
      } as any),
    ).toBe('Common Name');
  });

  it('falls back to email/nameID', () => {
    expect(
      getSamlDisplayName({ nameID: 'user@test.com', nameIDFormat: '' }),
    ).toBe('user@test.com');
  });
});

describe('getSamlGroups', () => {
  it('returns array from profile.groups', () => {
    expect(
      getSamlGroups({
        groups: ['admin', 'user'],
        nameID: 'x',
        nameIDFormat: '',
      } as any),
    ).toEqual(['admin', 'user']);
  });

  it('returns array from profile.Groups (capitalized)', () => {
    expect(
      getSamlGroups({
        Groups: ['editors'],
        nameID: 'x',
        nameIDFormat: '',
      } as any),
    ).toEqual(['editors']);
  });

  it('wraps single string in array', () => {
    expect(
      getSamlGroups({
        groups: 'single-group',
        nameID: 'x',
        nameIDFormat: '',
      } as any),
    ).toEqual(['single-group']);
  });

  it('returns empty array when no groups', () => {
    expect(getSamlGroups({ nameID: 'x', nameIDFormat: '' })).toEqual([]);
  });

  it('reads Microsoft groups claim', () => {
    const profile = {
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/groups': [
        'g1',
        'g2',
      ],
      nameID: 'x',
      nameIDFormat: '',
    };
    expect(getSamlGroups(profile as any)).toEqual(['g1', 'g2']);
  });
});

describe('buildServiceProviderUrls', () => {
  const originalEnv = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.formaos.com';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalEnv;
  });

  it('builds URLs with org ID', () => {
    const urls = buildServiceProviderUrls('org-123');
    expect(urls.appBase).toBe('https://app.formaos.com');
    expect(urls.loginUrl).toBe(
      'https://app.formaos.com/api/sso/saml/login/org-123',
    );
    expect(urls.acsUrl).toBe(
      'https://app.formaos.com/api/sso/saml/acs/org-123',
    );
    expect(urls.metadataUrl).toBe(
      'https://app.formaos.com/api/sso/saml/metadata/org-123',
    );
    expect(urls.sloUrl).toBe(
      'https://app.formaos.com/api/sso/saml/logout/org-123',
    );
  });

  it('strips trailing slash from base URL', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.formaos.com/';
    const urls = buildServiceProviderUrls('test');
    expect(urls.appBase).toBe('https://app.formaos.com');
  });

  it('defaults to localhost when env not set', () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    const urls = buildServiceProviderUrls('org-1');
    expect(urls.appBase).toBe('http://localhost:3000');
  });
});
