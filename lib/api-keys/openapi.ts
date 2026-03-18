import { API_KEY_SCOPES } from './scopes';

export type OpenApiRouteDefinition = {
  path: string;
  method: 'get' | 'post' | 'patch' | 'delete';
  operationId: string;
  summary: string;
  scopes?: string[];
};

export const V1_OPENAPI_ROUTES: OpenApiRouteDefinition[] = [
  { path: '/api/v1/api-keys', method: 'get', operationId: 'listApiKeys', summary: 'List API keys', scopes: ['webhooks:manage'] },
  { path: '/api/v1/api-keys', method: 'post', operationId: 'createApiKey', summary: 'Create API key', scopes: ['webhooks:manage'] },
  { path: '/api/v1/api-keys/{keyId}', method: 'patch', operationId: 'updateApiKey', summary: 'Update API key', scopes: ['webhooks:manage'] },
  { path: '/api/v1/api-keys/{keyId}', method: 'delete', operationId: 'revokeApiKey', summary: 'Revoke API key', scopes: ['webhooks:manage'] },
  { path: '/api/v1/organizations', method: 'get', operationId: 'getOrganization', summary: 'Get current organization', scopes: ['organizations:read'] },
  { path: '/api/v1/members', method: 'get', operationId: 'listMembers', summary: 'List organization members', scopes: ['members:read'] },
  { path: '/api/v1/members', method: 'post', operationId: 'inviteMember', summary: 'Invite member', scopes: ['members:write'] },
  { path: '/api/v1/members/{memberId}', method: 'get', operationId: 'getMember', summary: 'Get member or invitation', scopes: ['members:read'] },
  { path: '/api/v1/members/{memberId}', method: 'patch', operationId: 'updateMember', summary: 'Update member role', scopes: ['members:write'] },
  { path: '/api/v1/members/{memberId}', method: 'delete', operationId: 'removeMember', summary: 'Remove member or revoke invitation', scopes: ['members:write'] },
  { path: '/api/v1/frameworks', method: 'get', operationId: 'listFrameworks', summary: 'List installed frameworks', scopes: ['frameworks:read'] },
  { path: '/api/v1/controls', method: 'get', operationId: 'listControls', summary: 'List controls', scopes: ['controls:read'] },
  { path: '/api/v1/controls/{controlId}', method: 'get', operationId: 'getControl', summary: 'Get control detail', scopes: ['controls:read'] },
  { path: '/api/v1/certificates', method: 'get', operationId: 'listCertificates', summary: 'List certificates', scopes: ['certificates:read'] },
  { path: '/api/v1/reports', method: 'get', operationId: 'listReports', summary: 'List reports', scopes: ['reports:read'] },
  { path: '/api/v1/reports', method: 'post', operationId: 'generateReport', summary: 'Generate report', scopes: ['reports:write'] },
  { path: '/api/v1/reports/{reportId}', method: 'get', operationId: 'getReport', summary: 'Get report job or redirect to download', scopes: ['reports:read'] },
  { path: '/api/v1/notifications', method: 'get', operationId: 'listNotifications', summary: 'List notifications', scopes: ['notifications:read'] },
  { path: '/api/v1/notifications', method: 'patch', operationId: 'markNotificationsRead', summary: 'Mark notifications read', scopes: ['notifications:write'] },
  { path: '/api/v1/search', method: 'get', operationId: 'search', summary: 'Unified organization search', scopes: ['search:read'] },
  { path: '/api/v1/webhooks/deliveries', method: 'get', operationId: 'listWebhookDeliveries', summary: 'List webhook deliveries', scopes: ['webhooks:manage'] },
  { path: '/api/v1/webhooks/test', method: 'post', operationId: 'sendWebhookTest', summary: 'Send test webhook', scopes: ['webhooks:manage'] },
  { path: '/api/v1/integrations', method: 'get', operationId: 'listIntegrations', summary: 'List available and connected integrations', scopes: ['integrations:read'] },
  { path: '/api/v1/integrations/{integrationId}', method: 'post', operationId: 'connectOrTestIntegration', summary: 'Connect or test an integration', scopes: ['integrations:write'] },
  { path: '/api/v1/integrations/{integrationId}', method: 'delete', operationId: 'disconnectIntegration', summary: 'Disconnect an integration', scopes: ['integrations:write'] },
  { path: '/api/v1/integrations/{integrationId}/events', method: 'get', operationId: 'listIntegrationEvents', summary: 'List integration events', scopes: ['integrations:read'] },
];

export function generateOpenApiSpec(baseUrl: string) {
  const paths = V1_OPENAPI_ROUTES.reduce<Record<string, Record<string, unknown>>>(
    (acc, route) => {
      if (!acc[route.path]) acc[route.path] = {};
      acc[route.path][route.method] = {
        operationId: route.operationId,
        summary: route.summary,
        security: [{ bearerAuth: [] }],
        'x-formaos-scopes': route.scopes ?? [],
        responses: {
          200: { description: 'Success' },
          400: { description: 'Bad request' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden' },
          429: { description: 'Rate limited' },
        },
      };
      return acc;
    },
    {},
  );

  return {
    openapi: '3.1.0',
    info: {
      title: 'FormaOS API',
      version: '1.0.0',
      description: 'Customer-facing API for compliance data, webhooks, and integrations.',
    },
    servers: [{ url: baseUrl.replace(/\/+$/, '') }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'API key or Supabase session token',
        },
      },
      schemas: {
        ApiKeyScope: {
          type: 'string',
          enum: API_KEY_SCOPES,
        },
      },
    },
    paths,
  };
}
