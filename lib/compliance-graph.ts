/**
 * Node-Wire Compliance Graph Integrity Utilities
 * Ensures FormaOS maintains its compliance graph architecture throughout auth/onboarding
 */

import { createSupabaseOrgClient } from '@/lib/supabase/org-scoped';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { graphLogger } from '@/lib/observability/structured-logger';
import { consoleShim } from '@/lib/monitoring/console-shim';

export type GraphNodeType =
  | 'organization'
  | 'role'
  | 'policy'
  | 'task'
  | 'evidence'
  | 'audit'
  | 'entity';

export type GraphWireType =
  | 'organization_user'
  | 'user_role'
  | 'policy_task'
  | 'task_evidence'
  | 'evidence_audit';

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  organizationId: string;
  createdAt: string;
  createdBy?: string | null;
}

export interface GraphWire {
  fromNodeId: string;
  toNodeId: string;
  wireType: GraphWireType;
  organizationId: string;
}

/**
 * A persisted node row as returned by getComplianceGraph (shape mirrors
 * public.graph_nodes).
 */
export interface PersistedGraphNode {
  id: string;
  organizationId: string;
  nodeType: GraphNodeType;
  sourceId: string;
  label: string | null;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
  refreshedAt: string;
}

/**
 * A persisted wire row as returned by getComplianceGraph (shape mirrors
 * public.graph_wires).
 */
export interface PersistedGraphWire {
  id: string;
  organizationId: string;
  fromNodeId: string;
  toNodeId: string;
  wireType: GraphWireType;
  metadata: Record<string, unknown>;
  createdAt: string;
  refreshedAt: string;
}

interface DerivedNode {
  nodeType: GraphNodeType;
  sourceId: string;
  label: string | null;
  createdBy: string | null;
}

interface DerivedWire {
  wireType: GraphWireType;
  fromType: GraphNodeType;
  fromSourceId: string;
  toType: GraphNodeType;
  toSourceId: string;
}

const nodeKey = (nodeType: GraphNodeType, sourceId: string): string =>
  `${nodeType}:${sourceId}`;

/**
 * Derive the node-wire graph for an organization from the live tenant
 * tables, then UPSERT it into public.graph_nodes / public.graph_wires.
 *
 * WRITES go through the service-role admin client (createSupabaseOrgClient
 * wraps createSupabaseAdminClient and stamps organization_id), which
 * bypasses RLS — the append-only RESTRICTIVE policies only gate
 * `authenticated` session callers, so persistence is service-role-only by
 * design. Idempotent on the UNIQUE(organization_id, node_type, source_id)
 * and UNIQUE(organization_id, wire_type, from_node_id, to_node_id)
 * constraints; every run bumps refreshed_at.
 *
 * Node source_id is the source row's primary key. The organization node's
 * source_id is the organization_id itself.
 */
export async function rebuildOrgGraph(
  organizationId: string,
  userId?: string,
): Promise<{
  success: boolean;
  error?: string;
  nodeCount: number;
  wireCount: number;
}> {
  try {
    const admin = createSupabaseOrgClient(organizationId);
    const now = new Date().toISOString();

    // --- Derive nodes/wires from the live tenant tables ---------------
    const [members, policies, tasks, evidence, audits, entities] =
      await Promise.all([
        admin.from('org_members').select('id, user_id, role'),
        admin.from('org_policies').select('id, title'),
        admin.from('org_tasks').select('id, title, policy_id'),
        admin.from('org_evidence').select('id, title, task_id'),
        admin.from('org_audit_events').select('id'),
        admin.from('org_entities').select('id, name'),
      ]);

    // Coerce to arrays defensively: a misconfigured caller or a driver
    // that returns a single object (rather than a list) shouldn't crash
    // the rebuild — it should just contribute no rows.
    const asRows = <T>(data: unknown): T[] => (Array.isArray(data) ? (data as T[]) : []);

    const memberRows = asRows<{
      id: string;
      user_id: string;
      role: string | null;
    }>(members.data);
    const policyRows = asRows<{
      id: string;
      title: string | null;
    }>(policies.data);
    const taskRows = asRows<{
      id: string;
      title: string | null;
      policy_id: string | null;
    }>(tasks.data);
    const evidenceRows = asRows<{
      id: string;
      title: string | null;
      task_id: string | null;
    }>(evidence.data);
    const auditRows = asRows<{ id: string }>(audits.data);
    const entityRows = asRows<{
      id: string;
      name: string | null;
    }>(entities.data);

    const derivedNodes: DerivedNode[] = [];
    const derivedWires: DerivedWire[] = [];

    // Organization node — source_id == organization_id.
    derivedNodes.push({
      nodeType: 'organization',
      sourceId: organizationId,
      label: null,
      createdBy: userId ?? null,
    });

    for (const m of memberRows) {
      // Role node (one per membership) + organization_user / user_role wires.
      derivedNodes.push({
        nodeType: 'role',
        sourceId: m.id,
        label: m.role,
        createdBy: m.user_id,
      });
      derivedWires.push({
        wireType: 'user_role',
        fromType: 'organization',
        fromSourceId: organizationId,
        toType: 'role',
        toSourceId: m.id,
      });
    }

    for (const p of policyRows) {
      derivedNodes.push({
        nodeType: 'policy',
        sourceId: p.id,
        label: p.title,
        createdBy: null,
      });
    }

    for (const t of taskRows) {
      derivedNodes.push({
        nodeType: 'task',
        sourceId: t.id,
        label: t.title,
        createdBy: null,
      });
      if (t.policy_id) {
        derivedWires.push({
          wireType: 'policy_task',
          fromType: 'policy',
          fromSourceId: t.policy_id,
          toType: 'task',
          toSourceId: t.id,
        });
      }
    }

    for (const e of evidenceRows) {
      derivedNodes.push({
        nodeType: 'evidence',
        sourceId: e.id,
        label: e.title,
        createdBy: null,
      });
      if (e.task_id) {
        derivedWires.push({
          wireType: 'task_evidence',
          fromType: 'task',
          fromSourceId: e.task_id,
          toType: 'evidence',
          toSourceId: e.id,
        });
      }
    }

    for (const a of auditRows) {
      derivedNodes.push({
        nodeType: 'audit',
        sourceId: a.id,
        label: null,
        createdBy: null,
      });
    }

    for (const en of entityRows) {
      derivedNodes.push({
        nodeType: 'entity',
        sourceId: en.id,
        label: en.name,
        createdBy: userId ?? null,
      });
    }

    // --- Persist nodes (idempotent on UNIQUE org/type/source) ---------
    const nodePayload = derivedNodes.map((n) => ({
      node_type: n.nodeType,
      source_id: n.sourceId,
      label: n.label,
      created_by: n.createdBy,
      refreshed_at: now,
    }));

    const { data: upsertedNodes, error: nodeError } = await admin
      .from('graph_nodes')
      .upsert(nodePayload, {
        onConflict: 'organization_id,node_type,source_id',
      })
      .select('id, node_type, source_id');

    if (nodeError) {
      throw new Error(`graph_nodes upsert failed: ${nodeError.message}`);
    }

    // Resolve persisted node ids by (node_type, source_id) so wires can
    // reference the canonical row ids. Fall back to a fresh read when the
    // upsert didn't return rows (defensive — some drivers omit the
    // representation on conflict).
    const idByKey = new Map<string, string>();
    let resolvedNodes = (upsertedNodes ?? []) as Array<{
      id: string;
      node_type: GraphNodeType;
      source_id: string;
    }>;
    if (resolvedNodes.length === 0 && derivedNodes.length > 0) {
      const { data: readBack } = await admin
        .from('graph_nodes')
        .select('id, node_type, source_id');
      resolvedNodes = (readBack ?? []) as Array<{
        id: string;
        node_type: GraphNodeType;
        source_id: string;
      }>;
    }
    for (const n of resolvedNodes) {
      idByKey.set(nodeKey(n.node_type, n.source_id), n.id);
    }

    // --- Persist wires (idempotent on UNIQUE org/type/from/to) --------
    const wirePayload = derivedWires
      .map((w) => {
        const fromId = idByKey.get(nodeKey(w.fromType, w.fromSourceId));
        const toId = idByKey.get(nodeKey(w.toType, w.toSourceId));
        if (!fromId || !toId) return null;
        return {
          wire_type: w.wireType,
          from_node_id: fromId,
          to_node_id: toId,
          refreshed_at: now,
        };
      })
      .filter((w): w is NonNullable<typeof w> => w !== null);

    let persistedWireCount = 0;
    if (wirePayload.length > 0) {
      const { error: wireError } = await admin
        .from('graph_wires')
        .upsert(wirePayload, {
          onConflict: 'organization_id,wire_type,from_node_id,to_node_id',
        });
      if (wireError) {
        throw new Error(`graph_wires upsert failed: ${wireError.message}`);
      }
      persistedWireCount = wirePayload.length;
    }

    graphLogger.info('graph_rebuilt', {
      organizationId,
      nodeCount: derivedNodes.length,
      wireCount: persistedWireCount,
    });

    return {
      success: true,
      nodeCount: derivedNodes.length,
      wireCount: persistedWireCount,
    };
  } catch (error) {
    consoleShim.error('[compliance-graph] Graph rebuild failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      nodeCount: 0,
      wireCount: 0,
    };
  }
}

/**
 * Read the persisted compliance graph for an organization. READS go
 * through the member-facing session client — the org-membership SELECT
 * RLS policy gates which rows are visible, so this never exposes
 * cross-tenant data and requires no service-role key.
 */
export async function getComplianceGraph(organizationId: string): Promise<{
  nodes: PersistedGraphNode[];
  wires: PersistedGraphWire[];
}> {
  const supabase = await createSupabaseServerClient();

  const [{ data: nodeRows }, { data: wireRows }] = await Promise.all([
    supabase
      .from('graph_nodes')
      .select(
        'id, organization_id, node_type, source_id, label, metadata, created_by, created_at, refreshed_at',
      )
      .eq('organization_id', organizationId),
    supabase
      .from('graph_wires')
      .select(
        'id, organization_id, from_node_id, to_node_id, wire_type, metadata, created_at, refreshed_at',
      )
      .eq('organization_id', organizationId),
  ]);

  const nodes: PersistedGraphNode[] = (
    (nodeRows ?? []) as Array<Record<string, unknown>>
  ).map((r) => ({
    id: r.id as string,
    organizationId: r.organization_id as string,
    nodeType: r.node_type as GraphNodeType,
    sourceId: r.source_id as string,
    label: (r.label as string | null) ?? null,
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    createdBy: (r.created_by as string | null) ?? null,
    createdAt: r.created_at as string,
    refreshedAt: r.refreshed_at as string,
  }));

  const wires: PersistedGraphWire[] = (
    (wireRows ?? []) as Array<Record<string, unknown>>
  ).map((r) => ({
    id: r.id as string,
    organizationId: r.organization_id as string,
    fromNodeId: r.from_node_id as string,
    toNodeId: r.to_node_id as string,
    wireType: r.wire_type as GraphWireType,
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    createdAt: r.created_at as string,
    refreshedAt: r.refreshed_at as string,
  }));

  return { nodes, wires };
}

/**
 * Initialize core compliance graph nodes for a new organization
 * This ensures the basic node-wire structure exists from onboarding
 */
export async function initializeComplianceGraph(
  organizationId: string,
  userId: string,
): Promise<{
  success: boolean;
  error?: string;
  nodes?: GraphNode[];
  wires?: GraphWire[];
}> {
  try {
    const admin = createSupabaseOrgClient(organizationId);
    const now = new Date().toISOString();

    graphLogger.info('graph_initializing', { organizationId });

    // 1. ORGANIZATION NODE (already exists)
    const organizationNode: GraphNode = {
      id: organizationId,
      type: 'organization',
      organizationId,
      createdAt: now,
    };

    // 2. ROLE NODE - Create via org membership
    const { data: membershipData } = await admin
      .from('org_members')
      .select('id, role')
      .eq('user_id', userId)
      .maybeSingle();

    if (!membershipData) {
      throw new Error(
        'User membership not found - organization setup incomplete',
      );
    }

    const roleNode: GraphNode = {
      id: membershipData.id,
      type: 'role',
      organizationId,
      createdAt: now,
      createdBy: userId,
    };

    // 3. INITIAL POLICY NODES - Create basic policy framework
    const { data: defaultPolicies, error: policyError } = await admin
      .from('org_policies')
      .insert([
        {
          organization_id: organizationId,
          title: 'Information Security Policy',
          content:
            '## Initial Security Framework\n\nThis policy establishes the foundation for information security within the organization.',
          status: 'draft',
          created_by: userId,
          framework_tags: ['ISO27001', 'SOC2'],
        },
        {
          organization_id: organizationId,
          title: 'Data Privacy Framework',
          content:
            '## Data Protection Guidelines\n\nThis framework defines how personal data is collected, processed, and protected.',
          status: 'draft',
          created_by: userId,
          framework_tags: ['GDPR', 'CCPA'],
        },
      ])
      .select('id, created_at');

    if (policyError || !defaultPolicies) {
      consoleShim.error(
        '[compliance-graph] Failed to create initial policies:',
        policyError,
      );
    }

    const policyNodes: GraphNode[] = (defaultPolicies || []).map(
      (policy: { id: string; created_at: string }) => ({
        id: policy.id,
        type: 'policy' as const,
        organizationId,
        createdAt: policy.created_at,
        createdBy: userId,
      }),
    );

    // 4. INITIAL ENTITY NODE - Create organization structure
    const { data: defaultEntity, error: entityError } = await admin
      .from('org_entities')
      .insert({
        organization_id: organizationId,
        name: 'Primary Site',
        type: 'site',
        status: 'active',
        created_by: userId,
      })
      .select('id, created_at')
      .single();

    let entityNode: GraphNode | null = null;
    if (defaultEntity && !entityError) {
      entityNode = {
        id: defaultEntity.id,
        type: 'entity',
        organizationId,
        createdAt: defaultEntity.created_at,
        createdBy: userId,
      };
    }

    // 5. CREATE GRAPH WIRES
    const wires: GraphWire[] = [
      // Organization → User wire (via org_members)
      {
        fromNodeId: organizationId,
        toNodeId: userId,
        wireType: 'organization_user',
        organizationId,
      },
      // User → Role wire (via org_members.role)
      {
        fromNodeId: userId,
        toNodeId: membershipData.id,
        wireType: 'user_role',
        organizationId,
      },
    ];

    // 6. LOG AUDIT EVENTS for graph initialization
    const auditEvents = [
      {
        organization_id: organizationId,
        actor_user_id: userId,
        entity_type: 'organization',
        entity_id: organizationId,
        action_type: 'COMPLIANCE_GRAPH_INITIALIZED',
        before_state: null,
        after_state: {
          nodeCount: 2 + policyNodes.length + (entityNode ? 1 : 0),
          wireCount: wires.length,
        },
        metadata: { initializationTimestamp: now },
      },
    ];

    await admin.from('org_audit_events').insert(auditEvents);

    const allNodes = [organizationNode, roleNode, ...policyNodes];
    if (entityNode) allNodes.push(entityNode);

    // Persist the derived graph. rebuildOrgGraph re-reads the seeded
    // tenant tables and UPSERTs into graph_nodes/graph_wires via the
    // service-role admin client. Non-fatal: seeding succeeded even if
    // persistence hits a transient error, and the validate/repair path
    // (or the next login) will rebuild.
    const persisted = await rebuildOrgGraph(organizationId, userId);
    if (!persisted.success) {
      graphLogger.warn('graph_persist_warning', {
        organizationId,
        error: persisted.error,
      });
    }

    graphLogger.info('graph_initialized', {
      nodeCount: allNodes.length,
      wireCount: wires.length,
      persistedNodeCount: persisted.nodeCount,
      persistedWireCount: persisted.wireCount,
    });

    return {
      success: true,
      nodes: allNodes,
      wires,
    };
  } catch (error) {
    consoleShim.error('[compliance-graph] Graph initialization failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validate compliance graph integrity for an organization
 * Ensures all required nodes and wires exist and are properly connected
 */
export async function validateComplianceGraph(organizationId: string): Promise<{
  isValid: boolean;
  issues: string[];
  nodeCount: Record<string, number>;
  wireCount: Record<string, number>;
}> {
  try {
    const supabase = await createSupabaseServerClient();
    const issues: string[] = [];
    const nodeCount = {
      organization: 0,
      role: 0,
      policy: 0,
      task: 0,
      evidence: 0,
      audit: 0,
      entity: 0,
    };
    const wireCount = {
      organization_user: 0,
      user_role: 0,
      policy_task: 0,
      task_evidence: 0,
      evidence_audit: 0,
    };

    // Check organization node
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', organizationId)
      .maybeSingle();

    if (!org) {
      issues.push('Organization node missing');
    } else {
      nodeCount.organization = 1;
    }

    // Check role nodes (via org_members)
    const { data: members } = await supabase
      .from('org_members')
      .select('id, role');

    nodeCount.role = members?.length || 0;
    if (nodeCount.role === 0) {
      issues.push('No role nodes found - organization has no members');
    }

    // Count organization_user wires
    wireCount.organization_user = nodeCount.role;

    // Check policy nodes
    const { data: policies } = await supabase
      .from('org_policies')
      .select('id');

    nodeCount.policy = policies?.length || 0;

    // Check task nodes
    const { data: tasks } = await supabase
      .from('org_tasks')
      .select('id, policy_id');

    nodeCount.task = tasks?.length || 0;

    // Count policy_task wires
    const tasksWithPolicy =
      tasks?.filter((t: { policy_id: string | null }) => t.policy_id) || [];
    wireCount.policy_task = tasksWithPolicy.length;

    // Check evidence nodes
    const { data: evidence } = await supabase
      .from('org_evidence')
      .select('id, task_id');

    nodeCount.evidence = evidence?.length || 0;

    // Count task_evidence wires
    const evidenceWithTask =
      evidence?.filter((e: { task_id: string | null }) => e.task_id) || [];
    wireCount.task_evidence = evidenceWithTask.length;

    // Check audit nodes
    const { data: audits } = await supabase
      .from('org_audit_events')
      .select('id');

    nodeCount.audit = audits?.length || 0;

    // Check entity nodes
    const { data: entities } = await supabase
      .from('org_entities')
      .select('id');

    nodeCount.entity = entities?.length || 0;

    // Validate minimum requirements
    if (nodeCount.role === 0) {
      issues.push('Missing user role assignments');
    }

    const isValid = issues.length === 0;

    return {
      isValid,
      issues,
      nodeCount,
      wireCount,
    };
  } catch (error) {
    consoleShim.error('[compliance-graph] Validation failed:', error);
    return {
      isValid: false,
      issues: [
        'Graph validation error: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
      ],
      nodeCount: {
        organization: 0,
        role: 0,
        policy: 0,
        task: 0,
        evidence: 0,
        audit: 0,
        entity: 0,
      },
      wireCount: {
        organization_user: 0,
        user_role: 0,
        policy_task: 0,
        task_evidence: 0,
        evidence_audit: 0,
      },
    };
  }
}

/**
 * Repair broken wires in the compliance graph
 * Fixes common issues like orphaned tasks or missing role assignments
 */
export async function repairComplianceGraph(
  organizationId: string,
  userId: string,
): Promise<{
  success: boolean;
  repairsApplied: string[];
  error?: string;
}> {
  try {
    const admin = createSupabaseOrgClient(organizationId);
    const repairsApplied: string[] = [];

    // 1. Fix orphaned tasks (tasks without policy references)
    const { data: orphanedTasks } = await admin
      .from('org_tasks')
      .select('id, title')
      .is('policy_id', null);

    if (orphanedTasks && orphanedTasks.length > 0) {
      // Link to first available policy or create a default one
      const { data: firstPolicy } = await admin
        .from('org_policies')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (firstPolicy) {
        await admin
          .from('org_tasks')
          .update({ policy_id: firstPolicy.id })
          .is('policy_id', null);

        repairsApplied.push(`Fixed ${orphanedTasks.length} orphaned tasks`);
      }
    }

    // 2. Fix missing role assignments
    const { data: membersWithoutRole } = await admin
      .from('org_members')
      .select('id, user_id')
      .is('role', null);

    if (membersWithoutRole && membersWithoutRole.length > 0) {
      await admin
        .from('org_members')
        .update({ role: 'member' })
        .is('role', null);

      repairsApplied.push(
        `Fixed ${membersWithoutRole.length} missing role assignments`,
      );
    }

    // 3. Audit the repair
    if (repairsApplied.length > 0) {
      await admin.from('org_audit_events').insert({
        organization_id: organizationId,
        actor_user_id: userId,
        entity_type: 'organization',
        entity_id: organizationId,
        action_type: 'COMPLIANCE_GRAPH_REPAIRED',
        before_state: null,
        after_state: { repairsApplied },
        metadata: { repairTimestamp: new Date().toISOString() },
      });
    }

    // Re-derive and persist the graph so the repaired wires (newly-linked
    // tasks, role assignments) are reflected in graph_nodes/graph_wires.
    await rebuildOrgGraph(organizationId, userId);

    return {
      success: true,
      repairsApplied,
    };
  } catch (error) {
    consoleShim.error('[compliance-graph] Repair failed:', error);
    return {
      success: false,
      repairsApplied: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
