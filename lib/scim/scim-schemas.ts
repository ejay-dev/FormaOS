export const SCIM_SCHEMA_USER = 'urn:ietf:params:scim:schemas:core:2.0:User';
export const SCIM_SCHEMA_GROUP = 'urn:ietf:params:scim:schemas:core:2.0:Group';
export const SCIM_SCHEMA_LIST =
  'urn:ietf:params:scim:api:messages:2.0:ListResponse';
export const SCIM_SCHEMA_ERROR =
  'urn:ietf:params:scim:api:messages:2.0:Error';
export const SCIM_SCHEMA_PATCH =
  'urn:ietf:params:scim:api:messages:2.0:PatchOp';
export const SCIM_SCHEMA_BULK =
  'urn:ietf:params:scim:api:messages:2.0:BulkRequest';
export const SCIM_SCHEMA_BULK_RESPONSE =
  'urn:ietf:params:scim:api:messages:2.0:BulkResponse';
export const SCIM_ENTERPRISE_USER_EXTENSION =
  'urn:ietf:params:scim:schemas:extension:enterprise:2.0:User';
export const SCIM_SERVICE_PROVIDER_CONFIG_SCHEMA =
  'urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig';
export const SCIM_RESOURCE_TYPE_SCHEMA =
  'urn:ietf:params:scim:schemas:core:2.0:ResourceType';
export const SCIM_SCHEMA_SCHEMA =
  'urn:ietf:params:scim:schemas:core:2.0:Schema';

export const USER_SCHEMA_DEFINITION = {
  schemas: [SCIM_SCHEMA_SCHEMA],
  id: SCIM_SCHEMA_USER,
  name: 'User',
  description: 'FormaOS SCIM user resource',
  attributes: [
    { name: 'userName', type: 'string', required: true, mutability: 'readWrite' },
    { name: 'displayName', type: 'string', required: false, mutability: 'readWrite' },
    {
      name: 'name',
      type: 'complex',
      multiValued: false,
      subAttributes: [
        { name: 'formatted', type: 'string' },
        { name: 'givenName', type: 'string' },
        { name: 'familyName', type: 'string' },
      ],
    },
    {
      name: 'emails',
      type: 'complex',
      multiValued: true,
      subAttributes: [
        { name: 'value', type: 'string' },
        { name: 'type', type: 'string' },
        { name: 'primary', type: 'boolean' },
      ],
    },
    { name: 'active', type: 'boolean', required: false, mutability: 'readWrite' },
  ],
};

export const ENTERPRISE_USER_EXTENSION_SCHEMA_DEFINITION = {
  schemas: [SCIM_SCHEMA_SCHEMA],
  id: SCIM_ENTERPRISE_USER_EXTENSION,
  name: 'EnterpriseUser',
  description: 'Enterprise user extension',
  attributes: [
    { name: 'department', type: 'string', mutability: 'readWrite' },
    { name: 'organization', type: 'string', mutability: 'readOnly' },
    { name: 'manager', type: 'complex', mutability: 'readWrite' },
  ],
};

export const GROUP_SCHEMA_DEFINITION = {
  schemas: [SCIM_SCHEMA_SCHEMA],
  id: SCIM_SCHEMA_GROUP,
  name: 'Group',
  description: 'FormaOS SCIM group resource',
  attributes: [
    { name: 'displayName', type: 'string', required: true, mutability: 'readWrite' },
    {
      name: 'members',
      type: 'complex',
      multiValued: true,
      subAttributes: [
        { name: 'value', type: 'string' },
        { name: '$ref', type: 'reference' },
        { name: 'display', type: 'string' },
        { name: 'type', type: 'string' },
      ],
    },
  ],
};

export function getServiceProviderConfig(baseUrl: string) {
  return {
    schemas: [SCIM_SERVICE_PROVIDER_CONFIG_SCHEMA],
    documentationUri: 'https://formaos.com.au/security-review',
    patch: { supported: true },
    bulk: { supported: true, maxOperations: 100, maxPayloadSize: 1024 * 1024 },
    filter: { supported: true, maxResults: 100 },
    changePassword: { supported: false },
    sort: { supported: true },
    etag: { supported: true },
    authenticationSchemes: [
      {
        type: 'oauthbearertoken',
        name: 'Bearer token',
        description: 'Organization-scoped SCIM bearer token',
        primary: true,
        documentationUri: `${baseUrl}/app/settings/security`,
      },
    ],
    meta: {
      resourceType: 'ServiceProviderConfig',
      location: `${baseUrl}/api/scim/v2/ServiceProviderConfig`,
    },
  };
}

export function getResourceTypes(baseUrl: string) {
  return {
    schemas: [SCIM_SCHEMA_LIST],
    totalResults: 2,
    itemsPerPage: 2,
    startIndex: 1,
    Resources: [
      {
        schemas: [SCIM_RESOURCE_TYPE_SCHEMA],
        id: 'User',
        name: 'User',
        endpoint: '/Users',
        schema: SCIM_SCHEMA_USER,
        schemaExtensions: [
          {
            schema: SCIM_ENTERPRISE_USER_EXTENSION,
            required: false,
          },
        ],
        meta: {
          resourceType: 'ResourceType',
          location: `${baseUrl}/api/scim/v2/ResourceTypes/User`,
        },
      },
      {
        schemas: [SCIM_RESOURCE_TYPE_SCHEMA],
        id: 'Group',
        name: 'Group',
        endpoint: '/Groups',
        schema: SCIM_SCHEMA_GROUP,
        meta: {
          resourceType: 'ResourceType',
          location: `${baseUrl}/api/scim/v2/ResourceTypes/Group`,
        },
      },
    ],
  };
}

export function getSchemasResponse(baseUrl: string) {
  return {
    schemas: [SCIM_SCHEMA_LIST],
    totalResults: 3,
    itemsPerPage: 3,
    startIndex: 1,
    Resources: [
      USER_SCHEMA_DEFINITION,
      ENTERPRISE_USER_EXTENSION_SCHEMA_DEFINITION,
      GROUP_SCHEMA_DEFINITION,
    ].map((resource) => ({
      ...resource,
      meta: {
        resourceType: 'Schema',
        location: `${baseUrl}/api/scim/v2/Schemas/${encodeURIComponent(resource.id)}`,
      },
    })),
  };
}
