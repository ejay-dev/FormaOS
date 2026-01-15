/**
 * Node-Wire Compliance Graph Integrity Utilities
 * Ensures FormaOS maintains its compliance graph architecture throughout auth/onboarding
 */

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface GraphNode {
  id: string;
  type:
    | 'organization'
    | 'role'
    | 'policy'
    | 'task'
    | 'evidence'
    | 'audit'
    | 'entity';
  organizationId: string;
  createdAt: string;
  createdBy?: string | null;
}

export interface GraphWire {
  fromNodeId: string;
  toNodeId: string;
  wireType:
    | 'organization_user'
    | 'user_role'
    | 'policy_task'
    | 'task_evidence'
    | 'evidence_audit';
  organizationId: string;
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
    const admin = createSupabaseAdminClient();
    const now = new Date().toISOString();

    console.log(
      `[compliance-graph] 🚀 Initializing graph for org: ${organizationId}`,
    );

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
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single();

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
      console.error(
        '[compliance-graph] Failed to create initial policies:',
        policyError,
      );
    }

    const policyNodes: GraphNode[] = (defaultPolicies || []).map(
      (policy: any) => ({
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

    console.log(
      `[compliance-graph] ✅ Graph initialized: ${allNodes.length} nodes, ${wires.length} wires`,
    );

    return {
      success: true,
      nodes: allNodes,
      wires,
    };
  } catch (error) {
    console.error('[compliance-graph] Graph initialization failed:', error);
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
      .single();

    if (!org) {
      issues.push('Organization node missing');
    } else {
      nodeCount.organization = 1;
    }

    // Check role nodes (via org_members)
    const { data: members } = await supabase
      .from('org_members')
      .select('id, role')
      .eq('organization_id', organizationId);

    nodeCount.role = members?.length || 0;
    if (nodeCount.role === 0) {
      issues.push('No role nodes found - organization has no members');
    }

    // Count organization_user wires
    wireCount.organization_user = nodeCount.role;

    // Check policy nodes
    const { data: policies } = await supabase
      .from('org_policies')
      .select('id')
      .eq('organization_id', organizationId);

    nodeCount.policy = policies?.length || 0;

    // Check task nodes
    const { data: tasks } = await supabase
      .from('org_tasks')
      .select('id, policy_id')
      .eq('organization_id', organizationId);

    nodeCount.task = tasks?.length || 0;

    // Count policy_task wires
    const tasksWithPolicy = tasks?.filter((t: any) => t.policy_id) || [];
    wireCount.policy_task = tasksWithPolicy.length;

    // Check evidence nodes
    const { data: evidence } = await supabase
      .from('org_evidence')
      .select('id, task_id')
      .eq('organization_id', organizationId);

    nodeCount.evidence = evidence?.length || 0;

    // Count task_evidence wires
    const evidenceWithTask = evidence?.filter((e: any) => e.task_id) || [];
    wireCount.task_evidence = evidenceWithTask.length;

    // Check audit nodes
    const { data: audits } = await supabase
      .from('org_audit_events')
      .select('id')
      .eq('organization_id', organizationId);

    nodeCount.audit = audits?.length || 0;

    // Check entity nodes
    const { data: entities } = await supabase
      .from('org_entities')
      .select('id')
      .eq('organization_id', organizationId);

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
    console.error('[compliance-graph] Validation failed:', error);
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
    const admin = createSupabaseAdminClient();
    const repairsApplied: string[] = [];

    // 1. Fix orphaned tasks (tasks without policy references)
    const { data: orphanedTasks } = await admin
      .from('org_tasks')
      .select('id, title')
      .eq('organization_id', organizationId)
      .is('policy_id', null);

    if (orphanedTasks && orphanedTasks.length > 0) {
      // Link to first available policy or create a default one
      const { data: firstPolicy } = await admin
        .from('org_policies')
        .select('id')
        .eq('organization_id', organizationId)
        .limit(1)
        .single();

      if (firstPolicy) {
        await admin
          .from('org_tasks')
          .update({ policy_id: firstPolicy.id })
          .eq('organization_id', organizationId)
          .is('policy_id', null);

        repairsApplied.push(`Fixed ${orphanedTasks.length} orphaned tasks`);
      }
    }

    // 2. Fix missing role assignments
    const { data: membersWithoutRole } = await admin
      .from('org_members')
      .select('id, user_id')
      .eq('organization_id', organizationId)
      .is('role', null);

    if (membersWithoutRole && membersWithoutRole.length > 0) {
      await admin
        .from('org_members')
        .update({ role: 'member' })
        .eq('organization_id', organizationId)
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

    return {
      success: true,
      repairsApplied,
    };
  } catch (error) {
    console.error('[compliance-graph] Repair failed:', error);
    return {
      success: false,
      repairsApplied: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
