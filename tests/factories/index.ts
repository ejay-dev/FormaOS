type Role = 'owner' | 'admin' | 'member' | 'viewer';
type Plan = 'free' | 'starter' | 'pro' | 'enterprise';
type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';
type EvidenceStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
type WebhookDeliveryStatus = 'pending' | 'success' | 'failed' | 'retrying';

type Override<T> = Partial<T>;

let sequence = 0;

function nextId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${sequence}`;
}

function iso(offsetMs = 0): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

export interface MockOrg {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  industry: string;
  frameworks: string[];
  trialActive: boolean;
  trialEndsAt: string | null;
  dataResidencyRegion: 'au' | 'us' | 'eu';
  createdAt: string;
}

export interface MockUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  mfaEnabled: boolean;
  session:
    | {
        id: string;
        expiresAt: string;
      }
    | null;
  organizationId?: string;
}

export interface MockMembership {
  id: string;
  organization_id: string;
  user_id: string;
  role: Role;
  status: 'active' | 'invited' | 'suspended';
  permissions: string[];
  joined_at: string;
}

export interface MockSubscription {
  id: string;
  organization_id: string;
  customer_id: string;
  subscription_id: string;
  plan_key: Exclude<Plan, 'free'> | 'basic';
  status: 'trialing' | 'active' | 'past_due' | 'canceled';
  entitlements: string[];
  trial_started_at: string | null;
  trial_expires_at: string | null;
}

export interface MockEvidence {
  id: string;
  organization_id: string;
  control_id: string;
  title: string;
  status: EvidenceStatus;
  verified: boolean;
  file_name: string;
  created_at: string;
}

export interface MockTask {
  id: string;
  organization_id: string;
  title: string;
  status: TaskStatus;
  assigned_to: string | null;
  due_date: string;
  evidence: MockEvidence[];
  created_at: string;
}

export interface MockWorkflow {
  id: string;
  org_id: string;
  name: string;
  description: string;
  trigger:
    | 'member_added'
    | 'task_created'
    | 'task_completed'
    | 'certificate_expiring'
    | 'certificate_expired'
    | 'task_overdue'
    | 'schedule';
  conditions?: Record<string, unknown>;
  actions: Array<{
    type:
      | 'send_notification'
      | 'assign_task'
      | 'send_email'
      | 'update_status'
      | 'create_task'
      | 'escalate';
    config: Record<string, unknown>;
  }>;
  enabled: boolean;
}

export interface MockWebhook {
  id: string;
  organization_id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  enabled: boolean;
  retry_count: number;
  headers: Record<string, string>;
  deliveries: Array<{
    id: string;
    status: WebhookDeliveryStatus;
    attempts: number;
  }>;
}

export interface MockAuditEntry {
  id: string;
  organization_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface MockFramework {
  id: string;
  key: string;
  name: string;
  version: string;
  controls: Array<{
    id: string;
    code: string;
    title: string;
  }>;
  mappings: Array<{
    sourceControlId: string;
    targetFramework: string;
    targetControlCode: string;
  }>;
}

export function createMockOrg(overrides: Override<MockOrg> = {}): MockOrg {
  const trialActive = overrides.trialActive ?? false;
  return {
    id: nextId('org'),
    name: 'Acme Health',
    slug: `acme-health-${sequence + 1}`,
    plan: 'starter',
    industry: 'healthcare',
    frameworks: ['soc2'],
    trialActive,
    trialEndsAt: trialActive ? iso(7 * 24 * 60 * 60 * 1000) : null,
    dataResidencyRegion: 'au',
    createdAt: iso(),
    ...overrides,
  };
}

export function createMockUser(overrides: Override<MockUser> = {}): MockUser {
  return {
    id: nextId('user'),
    email: `user-${sequence + 1}@example.com`,
    fullName: 'Test User',
    role: 'member',
    mfaEnabled: false,
    session: {
      id: nextId('session'),
      expiresAt: iso(60 * 60 * 1000),
    },
    ...overrides,
  };
}

export function createMockMembership(
  overrides: Override<MockMembership> = {},
): MockMembership {
  const org = createMockOrg();
  const user = createMockUser();
  return {
    id: nextId('membership'),
    organization_id: org.id,
    user_id: user.id,
    role: 'member',
    status: 'active',
    permissions: ['tasks:read'],
    joined_at: iso(),
    ...overrides,
  };
}

export function createMockSubscription(
  overrides: Override<MockSubscription> = {},
): MockSubscription {
  const org = createMockOrg();
  return {
    id: nextId('sub-row'),
    organization_id: org.id,
    customer_id: nextId('cus'),
    subscription_id: nextId('sub'),
    plan_key: 'basic',
    status: 'trialing',
    entitlements: ['dashboard', 'tasks'],
    trial_started_at: iso(-24 * 60 * 60 * 1000),
    trial_expires_at: iso(13 * 24 * 60 * 60 * 1000),
    ...overrides,
  };
}

export function createMockEvidence(
  overrides: Override<MockEvidence> = {},
): MockEvidence {
  const org = createMockOrg();
  return {
    id: nextId('evidence'),
    organization_id: org.id,
    control_id: nextId('control'),
    title: 'Security policy evidence',
    status: 'submitted',
    verified: false,
    file_name: 'security-policy.pdf',
    created_at: iso(),
    ...overrides,
  };
}

export function createMockTask(overrides: Override<MockTask> = {}): MockTask {
  const org = createMockOrg();
  const evidence = createMockEvidence({ organization_id: org.id });
  return {
    id: nextId('task'),
    organization_id: org.id,
    title: 'Review access controls',
    status: 'pending',
    assigned_to: null,
    due_date: iso(3 * 24 * 60 * 60 * 1000),
    evidence: [evidence],
    created_at: iso(),
    ...overrides,
  };
}

export function createMockWorkflow(
  overrides: Override<MockWorkflow> = {},
): MockWorkflow {
  const org = createMockOrg();
  return {
    id: nextId('workflow'),
    org_id: org.id,
    name: 'Default workflow',
    description: 'Automates compliance follow-up',
    trigger: 'task_created',
    conditions: {},
    actions: [
      {
        type: 'send_notification',
        config: {
          title: 'Task created',
          message: 'A compliance task was created.',
        },
      },
    ],
    enabled: true,
    ...overrides,
  };
}

export function createMockWebhook(
  overrides: Override<MockWebhook> = {},
): MockWebhook {
  const org = createMockOrg();
  return {
    id: nextId('webhook'),
    organization_id: org.id,
    name: 'Primary webhook',
    url: 'https://example.com/webhooks',
    events: ['task.created'],
    secret: 'webhook-secret',
    enabled: true,
    retry_count: 3,
    headers: {},
    deliveries: [
      {
        id: nextId('delivery'),
        status: 'success',
        attempts: 1,
      },
    ],
    ...overrides,
  };
}

export function createMockAuditEntry(
  overrides: Override<MockAuditEntry> = {},
): MockAuditEntry {
  const org = createMockOrg();
  const user = createMockUser();
  return {
    id: nextId('audit'),
    organization_id: org.id,
    user_id: user.id,
    action: 'create',
    entity_type: 'task',
    entity_id: nextId('entity'),
    entity_name: 'Review access controls',
    details: { source: 'test' },
    created_at: iso(),
    ...overrides,
  };
}

export function createMockFramework(
  overrides: Override<MockFramework> = {},
): MockFramework {
  const controlA = nextId('control');
  const controlB = nextId('control');
  return {
    id: nextId('framework'),
    key: 'soc2',
    name: 'SOC 2',
    version: '2026.1',
    controls: [
      { id: controlA, code: 'CC1.1', title: 'Governance' },
      { id: controlB, code: 'CC6.1', title: 'Logical access' },
    ],
    mappings: [
      {
        sourceControlId: controlA,
        targetFramework: 'iso27001',
        targetControlCode: 'A.5.1',
      },
      {
        sourceControlId: controlB,
        targetFramework: 'hipaa',
        targetControlCode: '164.312(a)(1)',
      },
    ],
    ...overrides,
  };
}

