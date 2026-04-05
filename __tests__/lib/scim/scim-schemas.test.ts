import {
  SCIM_SCHEMA_USER,
  SCIM_SCHEMA_GROUP,
  SCIM_SCHEMA_LIST,
  SCIM_SCHEMA_ERROR,
  SCIM_SCHEMA_PATCH,
  SCIM_SCHEMA_BULK,
  SCIM_SCHEMA_BULK_RESPONSE,
  SCIM_ENTERPRISE_USER_EXTENSION,
  SCIM_SERVICE_PROVIDER_CONFIG_SCHEMA,
  SCIM_RESOURCE_TYPE_SCHEMA,
  SCIM_SCHEMA_SCHEMA,
  USER_SCHEMA_DEFINITION,
  ENTERPRISE_USER_EXTENSION_SCHEMA_DEFINITION,
  GROUP_SCHEMA_DEFINITION,
  getServiceProviderConfig,
  getResourceTypes,
  getSchemasResponse,
} from '@/lib/scim/scim-schemas';

const BASE_URL = 'https://app.formaos.com.au';

describe('SCIM Schema Constants', () => {
  it('defines all required schema URNs', () => {
    expect(SCIM_SCHEMA_USER).toContain(
      'urn:ietf:params:scim:schemas:core:2.0:User',
    );
    expect(SCIM_SCHEMA_GROUP).toContain(
      'urn:ietf:params:scim:schemas:core:2.0:Group',
    );
    expect(SCIM_SCHEMA_LIST).toContain('ListResponse');
    expect(SCIM_SCHEMA_ERROR).toContain('Error');
    expect(SCIM_SCHEMA_PATCH).toContain('PatchOp');
    expect(SCIM_SCHEMA_BULK).toContain('BulkRequest');
    expect(SCIM_SCHEMA_BULK_RESPONSE).toContain('BulkResponse');
    expect(SCIM_ENTERPRISE_USER_EXTENSION).toContain('enterprise');
    expect(SCIM_SERVICE_PROVIDER_CONFIG_SCHEMA).toContain(
      'ServiceProviderConfig',
    );
    expect(SCIM_RESOURCE_TYPE_SCHEMA).toContain('ResourceType');
    expect(SCIM_SCHEMA_SCHEMA).toContain('Schema');
  });
});

describe('Schema Definitions', () => {
  it('USER_SCHEMA_DEFINITION has correct structure', () => {
    expect(USER_SCHEMA_DEFINITION.id).toBe(SCIM_SCHEMA_USER);
    expect(USER_SCHEMA_DEFINITION.name).toBe('User');
    expect(USER_SCHEMA_DEFINITION.schemas).toContain(SCIM_SCHEMA_SCHEMA);
    expect(USER_SCHEMA_DEFINITION.attributes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'userName', required: true }),
        expect.objectContaining({ name: 'active', type: 'boolean' }),
        expect.objectContaining({ name: 'emails', multiValued: true }),
      ]),
    );
  });

  it('GROUP_SCHEMA_DEFINITION has correct structure', () => {
    expect(GROUP_SCHEMA_DEFINITION.id).toBe(SCIM_SCHEMA_GROUP);
    expect(GROUP_SCHEMA_DEFINITION.name).toBe('Group');
    expect(GROUP_SCHEMA_DEFINITION.attributes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'displayName', required: true }),
        expect.objectContaining({ name: 'members', multiValued: true }),
      ]),
    );
  });

  it('ENTERPRISE_USER_EXTENSION has department and manager attributes', () => {
    expect(ENTERPRISE_USER_EXTENSION_SCHEMA_DEFINITION.id).toBe(
      SCIM_ENTERPRISE_USER_EXTENSION,
    );
    const attrNames =
      ENTERPRISE_USER_EXTENSION_SCHEMA_DEFINITION.attributes.map((a) => a.name);
    expect(attrNames).toContain('department');
    expect(attrNames).toContain('manager');
  });
});

describe('getServiceProviderConfig', () => {
  it('returns valid service provider config', () => {
    const config = getServiceProviderConfig(BASE_URL);
    expect(config.schemas).toContain(SCIM_SERVICE_PROVIDER_CONFIG_SCHEMA);
    expect(config.patch.supported).toBe(true);
    expect(config.bulk.supported).toBe(true);
    expect(config.bulk.maxOperations).toBe(100);
    expect(config.filter.supported).toBe(true);
    expect(config.sort.supported).toBe(true);
    expect(config.changePassword.supported).toBe(false);
    expect(config.etag.supported).toBe(true);
  });

  it('includes auth scheme with correct base URL', () => {
    const config = getServiceProviderConfig(BASE_URL);
    const scheme = config.authenticationSchemes[0];
    expect(scheme.type).toBe('oauthbearertoken');
    expect(scheme.documentationUri).toContain(BASE_URL);
  });

  it('sets meta location with baseUrl', () => {
    const config = getServiceProviderConfig(BASE_URL);
    expect(config.meta.location).toBe(
      `${BASE_URL}/api/scim/v2/ServiceProviderConfig`,
    );
  });
});

describe('getResourceTypes', () => {
  it('returns User and Group resource types', () => {
    const result = getResourceTypes(BASE_URL);
    expect(result.schemas).toContain(SCIM_SCHEMA_LIST);
    expect(result.totalResults).toBe(2);
    expect(result.Resources).toHaveLength(2);

    const user = result.Resources.find((r: { id: string }) => r.id === 'User');
    expect(user).toBeDefined();
    expect(user.schema).toBe(SCIM_SCHEMA_USER);
    expect(user.endpoint).toBe('/Users');

    const group = result.Resources.find(
      (r: { id: string }) => r.id === 'Group',
    );
    expect(group).toBeDefined();
    expect(group.schema).toBe(SCIM_SCHEMA_GROUP);
    expect(group.endpoint).toBe('/Groups');
  });

  it('User resource type includes enterprise extension', () => {
    const result = getResourceTypes(BASE_URL);
    const user = result.Resources.find((r: { id: string }) => r.id === 'User');
    expect(user.schemaExtensions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          schema: SCIM_ENTERPRISE_USER_EXTENSION,
          required: false,
        }),
      ]),
    );
  });
});

describe('getSchemasResponse', () => {
  it('returns all 3 schema definitions', () => {
    const result = getSchemasResponse(BASE_URL);
    expect(result.schemas).toContain(SCIM_SCHEMA_LIST);
    expect(result.totalResults).toBe(3);
    expect(result.Resources).toHaveLength(3);
  });

  it('includes meta with location for each schema', () => {
    const result = getSchemasResponse(BASE_URL);
    for (const resource of result.Resources) {
      expect(resource.meta).toBeDefined();
      expect(resource.meta.resourceType).toBe('Schema');
      expect(resource.meta.location).toContain(BASE_URL);
      expect(resource.meta.location).toContain('/api/scim/v2/Schemas/');
    }
  });
});
