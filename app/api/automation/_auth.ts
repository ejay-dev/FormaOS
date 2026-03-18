import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface AutomationApiContext {
  userId: string;
  userEmail?: string;
  orgId: string;
  role: string;
}

export async function getAutomationApiContext(): Promise<AutomationApiContext | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single();

  if (!membership) {
    return null;
  }

  return {
    userId: user.id,
    userEmail: user.email,
    orgId: membership.organization_id as string,
    role: membership.role as string,
  };
}

export function automationUnauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function automationForbidden() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export function canManageAutomation(role: string): boolean {
  return ['owner', 'admin', 'compliance_officer'].includes(role);
}
