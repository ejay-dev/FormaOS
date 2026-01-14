/**
 * =========================================================
 * Workflow Automation Engine
 * =========================================================
 * Rule-based automation for compliance workflows
 */

import { createClient } from '@/lib/supabase/server';
import { sendNotification, logActivity } from '@/lib/realtime';

export type TriggerType =
  | 'member_added'
  | 'task_created'
  | 'task_completed'
  | 'certificate_expiring'
  | 'certificate_expired'
  | 'task_overdue'
  | 'schedule';

export type ActionType =
  | 'send_notification'
  | 'assign_task'
  | 'send_email'
  | 'update_status'
  | 'create_task'
  | 'escalate';

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  trigger: TriggerType;
  conditions?: Record<string, any>;
  actions: Array<{
    type: ActionType;
    config: Record<string, any>;
  }>;
  enabled: boolean;
  org_id: string;
}

export interface AutomationContext {
  orgId: string;
  userId?: string;
  userEmail?: string;
  resource?: any;
  metadata?: Record<string, any>;
}

/**
 * Workflow automation engine
 */
export class WorkflowEngine {
  private rules: Map<string, WorkflowRule> = new Map();

  /**
   * Load all active workflow rules for an organization
   */
  async loadRules(orgId: string) {
    const supabase = await createClient();

    const { data: rules } = await supabase
      .from('workflow_rules')
      .select('*')
      .eq('org_id', orgId)
      .eq('enabled', true);

    if (rules) {
      rules.forEach((rule) => {
        this.rules.set(rule.id, rule);
      });
    }
  }

  /**
   * Execute workflows for a trigger
   */
  async executeTrigger(
    trigger: TriggerType,
    context: AutomationContext,
  ): Promise<void> {
    const matchingRules = Array.from(this.rules.values()).filter(
      (rule) => rule.trigger === trigger && rule.org_id === context.orgId,
    );

    for (const rule of matchingRules) {
      // Check conditions
      if (
        rule.conditions &&
        !this.evaluateConditions(rule.conditions, context)
      ) {
        continue;
      }

      // Execute actions
      for (const action of rule.actions) {
        await this.executeAction(action, context);
      }

      // Log automation execution
      if (context.userId) {
        await logActivity(
          context.orgId,
          'system',
          'automation@formaos.com',
          'workflow_executed',
          'workflow',
          rule.id,
          {
            ruleName: rule.name,
            trigger,
            actionsCount: rule.actions.length,
          },
        );
      }
    }
  }

  /**
   * Evaluate conditions
   */
  private evaluateConditions(
    conditions: Record<string, any>,
    context: AutomationContext,
  ): boolean {
    // Simple condition evaluation (can be extended)
    return true; // For now, always true
  }

  /**
   * Execute a single action
   */
  private async executeAction(
    action: { type: ActionType; config: Record<string, any> },
    context: AutomationContext,
  ): Promise<void> {
    const supabase = await createClient();

    switch (action.type) {
      case 'send_notification':
        if (context.userId) {
          await sendNotification(
            action.config.userId || context.userId,
            action.config.title,
            action.config.message,
            action.config.type || 'info',
            action.config.actionUrl,
          );
        }
        break;

      case 'assign_task':
        await supabase.from('tasks').insert({
          org_id: context.orgId,
          title: action.config.title,
          description: action.config.description,
          assigned_to: action.config.assignedTo,
          due_date: action.config.dueDate,
          priority: action.config.priority || 'medium',
          status: 'pending',
          created_at: new Date().toISOString(),
        });
        break;

      case 'send_email':
        // Integration with email service (SendGrid, Resend, etc.)
        console.log('Send email:', action.config);
        break;

      case 'update_status':
        if (context.resource?.id && action.config.table) {
          await supabase
            .from(action.config.table)
            .update({ status: action.config.status })
            .eq('id', context.resource.id);
        }
        break;

      case 'create_task':
        await supabase.from('tasks').insert({
          org_id: context.orgId,
          title: action.config.title,
          description: action.config.description,
          assigned_to: action.config.assignedTo || context.userId,
          due_date: action.config.dueDate,
          priority: action.config.priority || 'medium',
          status: 'pending',
        });
        break;

      case 'escalate':
        // Escalate to admin/owner
        const { data: admins } = await supabase
          .from('org_members')
          .select('user_id')
          .eq('org_id', context.orgId)
          .in('role', ['owner', 'admin']);

        for (const admin of admins || []) {
          await sendNotification(
            admin.user_id,
            action.config.title || 'Escalation Required',
            action.config.message,
            'warning',
            action.config.actionUrl,
          );
        }
        break;
    }
  }
}

/**
 * Pre-defined workflow templates
 */
export const WORKFLOW_TEMPLATES: Omit<WorkflowRule, 'id' | 'org_id'>[] = [
  {
    name: 'Welcome New Member',
    description: 'Automatically assign onboarding tasks to new team members',
    trigger: 'member_added',
    enabled: true,
    actions: [
      {
        type: 'send_notification',
        config: {
          title: 'Welcome to the team!',
          message:
            'Check out your dashboard to get started with compliance training.',
          type: 'success',
        },
      },
      {
        type: 'create_task',
        config: {
          title: 'Complete Onboarding Training',
          description:
            'Review company compliance policies and complete training modules.',
          priority: 'high',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      },
    ],
  },
  {
    name: 'Certificate Expiring Soon',
    description: 'Notify member 30 days before certificate expiration',
    trigger: 'certificate_expiring',
    enabled: true,
    actions: [
      {
        type: 'send_notification',
        config: {
          title: 'Certificate Expiring Soon',
          message: 'Your certificate will expire in 30 days. Please renew it.',
          type: 'warning',
        },
      },
      {
        type: 'create_task',
        config: {
          title: 'Renew Certificate',
          description:
            'Certificate expiring soon. Please complete renewal process.',
          priority: 'high',
        },
      },
    ],
  },
  {
    name: 'Overdue Task Escalation',
    description: 'Escalate tasks that are overdue by 3 days to admins',
    trigger: 'task_overdue',
    conditions: {
      daysOverdue: 3,
    },
    enabled: true,
    actions: [
      {
        type: 'escalate',
        config: {
          title: 'Overdue Task Requires Attention',
          message: 'A task assigned to a team member is 3+ days overdue.',
        },
      },
    ],
  },
  {
    name: 'Task Completion Celebration',
    description: 'Send congratulations when member completes a task',
    trigger: 'task_completed',
    enabled: true,
    actions: [
      {
        type: 'send_notification',
        config: {
          title: 'Task Completed! 🎉',
          message: 'Great job completing your task. Keep up the good work!',
          type: 'success',
        },
      },
    ],
  },
];

/**
 * Check for certificate expirations and trigger workflows
 */
export async function checkCertificateExpirations(
  orgId: string,
): Promise<void> {
  const supabase = await createClient();
  const engine = new WorkflowEngine();
  await engine.loadRules(orgId);

  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const { data: expiringCerts } = await supabase
    .from('certificates')
    .select('*, org_members!inner(user_id, email)')
    .eq('org_id', orgId)
    .lte('expiry_date', thirtyDaysFromNow.toISOString())
    .gte('expiry_date', new Date().toISOString());

  for (const cert of expiringCerts || []) {
    await engine.executeTrigger('certificate_expiring', {
      orgId,
      userId: cert.org_members.user_id,
      userEmail: cert.org_members.email,
      resource: cert,
    });
  }
}

/**
 * Check for overdue tasks and trigger workflows
 */
export async function checkOverdueTasks(orgId: string): Promise<void> {
  const supabase = await createClient();
  const engine = new WorkflowEngine();
  await engine.loadRules(orgId);

  const { data: overdueTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('org_id', orgId)
    .eq('status', 'pending')
    .lt('due_date', new Date().toISOString());

  for (const task of overdueTasks || []) {
    await engine.executeTrigger('task_overdue', {
      orgId,
      userId: task.assigned_to,
      resource: task,
    });
  }
}

/**
 * Global workflow engine instance
 */
export const workflowEngine = new WorkflowEngine();
