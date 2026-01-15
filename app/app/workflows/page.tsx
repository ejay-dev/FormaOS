import { createSupabaseServerClient } from '@/lib/supabase/server';
import { WorkflowManagementClient } from './WorkflowManagementClient';
import { Shield } from 'lucide-react';

export default async function WorkflowsPage() {
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

  // Fetch existing workflows
  const { data: workflows } = await supabase
    .from('org_workflows')
    .select('*')
    .eq('organization_id', membership.organization_id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-white/10 pb-8">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">
            <Shield className="h-3 w-3" />
            <span>Automation</span>
          </div>
          <h1 className="text-4xl font-black text-slate-100 tracking-tight">
            Workflow Automation
          </h1>
          <p className="text-slate-400 mt-2 font-medium tracking-tight">
            Configure automated workflows for tasks, reminders, and
            notifications
          </p>
        </div>
      </div>

      {/* Client component for workflow management */}
      <WorkflowManagementClient
        initialWorkflows={workflows || []}
        organizationId={membership.organization_id}
      />
    </div>
  );
}
