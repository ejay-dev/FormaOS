import { createSupabaseServerClient } from '@/lib/supabase/server';

// ------------------------------------------------------------------
// Dashboard Builder Engine
// ------------------------------------------------------------------

export interface WidgetPlacement {
  widgetKey: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config?: Record<string, unknown>;
}

export interface DashboardLayout {
  id: string;
  name: string;
  isDefault: boolean;
  widgets: WidgetPlacement[];
}

const DEFAULT_LAYOUT: WidgetPlacement[] = [
  { widgetKey: 'compliance_score', x: 0, y: 0, w: 2, h: 2 },
  { widgetKey: 'framework_progress', x: 2, y: 0, w: 3, h: 2 },
  { widgetKey: 'task_summary', x: 5, y: 0, w: 2, h: 2 },
  { widgetKey: 'overdue_tasks', x: 0, y: 2, w: 3, h: 2 },
  { widgetKey: 'recent_activity', x: 3, y: 2, w: 3, h: 3 },
  { widgetKey: 'evidence_freshness', x: 6, y: 2, w: 2, h: 2 },
];

export async function getUserDashboard(
  orgId: string,
  userId: string,
): Promise<DashboardLayout> {
  const db = await createSupabaseServerClient();

  const { data } = await db
    .from('dashboard_layouts')
    .select('*')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .eq('is_default', true)
    .single();

  if (data) {
    return {
      id: data.id,
      name: data.name,
      isDefault: data.is_default,
      widgets: data.widgets as WidgetPlacement[],
    };
  }

  // Return default layout
  return {
    id: '',
    name: 'Default Dashboard',
    isDefault: true,
    widgets: DEFAULT_LAYOUT,
  };
}

export async function saveUserDashboard(
  orgId: string,
  userId: string,
  layout: { name: string; widgets: WidgetPlacement[] },
) {
  const db = await createSupabaseServerClient();

  // Check for existing default layout
  const { data: existing } = await db
    .from('dashboard_layouts')
    .select('id')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .eq('is_default', true)
    .single();

  if (existing) {
    await db
      .from('dashboard_layouts')
      .update({
        name: layout.name,
        widgets: layout.widgets,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await db.from('dashboard_layouts').insert({
      org_id: orgId,
      user_id: userId,
      name: layout.name,
      is_default: true,
      widgets: layout.widgets,
    });
  }
}

export async function getAvailableWidgets(plan: string) {
  const db = await createSupabaseServerClient();

  const planHierarchy: Record<string, string[]> = {
    starter: ['starter'],
    pro: ['starter', 'pro'],
    enterprise: ['starter', 'pro', 'enterprise'],
  };

  const allowedPlans = planHierarchy[plan] || planHierarchy.starter;

  const { data } = await db
    .from('dashboard_widget_registry')
    .select('*')
    .in('required_plan', allowedPlans)
    .order('category');

  return data || [];
}
